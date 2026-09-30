# Motor de evidencia

> Diseño técnico del núcleo del producto (épica E02). Las **reglas** que debe cumplir están en [04-reglas-de-negocio.md](../02-requisitos/04-reglas-de-negocio.md) (RN-01…RN-23); este documento explica **cómo** se cumplen.
>
> ⚠️ **Estado:** la estructura (entradas, salidas, pasos, invariantes) está **decidida**. Los **valores numéricos** marcados como *provisional* son una propuesta de partida que la tarea **ROS-132** debe calibrar con ejemplos resueltos a mano y ratificar mediante un CD ([DP-003](../07-registro/02-decisiones-pendientes.md)). Ningún agente puede cambiar estos valores en el código sin ese CD.

## 1. Qué hace

Para cada columna de un proyecto, el motor:

1. reúne la **evidencia** de todas las fuentes (nombre, DDL, perfil de datos, contención con catálogos, acciones humanas),
2. elige la **interpretación** más respaldada (nombre de negocio, tipo semántico, referencia),
3. calcula un **puntaje** 0–1 y su **desglose** por fuente,
4. detecta **conflictos** entre fuentes,
5. asigna uno de los **cinco niveles**,
6. redacta una **descripción** con plantillas deterministas,
7. calcula el **impacto** (cuántas columnas desbloquearía confirmarla) para ordenar la cola.

Y ante una confirmación humana calcula los **destinos de propagación**.

## 2. Principios de implementación

| Principio | Cómo se garantiza |
|---|---|
| **Puro** | Paquete `backend/evidence_engine/` sin Django ni I/O. Entradas y salidas son `dataclasses` inmutables (`frozen=True`) |
| **Determinista** (RN-08, RNF-21) | Evidencia ordenada por `(kind, source_id, id)` antes de combinar; aritmética con `Decimal` y redondeo `ROUND_HALF_EVEN` a 3 decimales; desempates lexicográficos; sin `random`, sin reloj, sin iteración sobre `set` |
| **Versionado** | `ENGINE_VERSION` (semver) en `config.py`; se guarda en cada interpretación. Cambiar pesos/umbrales/fórmula sube la versión |
| **Explicable** (RN-11) | Todo resultado incluye el desglose: aporte de cada evidencia y "qué falta para el siguiente nivel" |
| **Nunca inventa** (RN-06, Constitución III) | Sin evidencia útil → `UNKNOWN` y sin nombre de negocio |
| **Nunca confirma** (RN-02) | El motor no tiene ninguna ruta de código que devuelva `CONFIRMED`: ese nivel lo pone `review.services` a partir de una acción humana. Hay una prueba de propiedad que lo verifica |

## 3. Modelo de evidencia (ROS-23, ROS-130)

```python
@dataclass(frozen=True)
class EvidenceItem:
    id: str                    # UUID de la fila Evidence
    kind: EvidenceKind         # ver tabla
    independence_class: str    # NAME | DDL | PROFILE | CONTAINMENT | HUMAN
    field: ClaimField          # BUSINESS_NAME | SEMANTIC_TYPE | REFERENCES | NO_INFORMATION
    value: str | None          # valor afirmado (p. ej. "Número de cuenta", "DATE_YYYYMMDD", "CTA0001.CTANRO")
    weight: Decimal            # peso del tipo de evidencia (tabla §4)
    strength: Decimal          # 0–1: qué tan fuerte es esta evidencia concreta (p. ej. contención 0,998)
    polarity: int = +1         # +1 apoya, -1 niega (rechazo humano)
    citation: Citation         # fuente + localizador + extracto (RN-10)
```

| `kind` | Clase de independencia | Produce | Fuente | Fase |
|---|---|---|---|---|
| `NAME_CONVENTION` | NAME | `BUSINESS_NAME`, a veces `SEMANTIC_TYPE` (p. ej. prefijo `FE` → fecha) | Reglas de nomenclatura (ROS-21) | MVP |
| `DDL_TYPE` | DDL | `SEMANTIC_TYPE` compatible con el tipo declarado | DDL (ROS-16) | MVP |
| `DDL_CONSTRAINT` | DDL | PK, NOT NULL, UNIQUE → `SEMANTIC_TYPE=IDENTIFIER` | DDL | MVP |
| `DDL_DECLARED_FK` | DDL | `REFERENCES` | DDL | MVP |
| `PROFILE_PATTERN` | PROFILE | `SEMANTIC_TYPE` (fecha AAAAMMDD, importe, código, booleano, enum) | Muestra (ROS-17) | MVP |
| `PROFILE_EMPTY` | PROFILE | `NO_INFORMATION` (100 % NULL o constante sin catálogo) | Muestra | MVP |
| `CONTAINMENT` | CONTAINMENT | `REFERENCES` (valores contenidos en la columna de otra tabla) | Muestras de ambas tablas | MVP `[NECESITA ACLARACIÓN]` [DP-001](../07-registro/02-decisiones-pendientes.md) |
| `HUMAN_REJECTION` | HUMAN | niega un valor (`polarity=-1`) | Acción *Rechazar* | MVP |
| `HUMAN_EDIT` | HUMAN | `BUSINESS_NAME` con peso máximo | Acción *Editar* | Fase 2 como evidencia (ROS-49); en el MVP la edición solo cambia el texto |
| `QUERY_LOG`, `VIEW_DEFINITION`, `APP_LABEL`, `CODE_MAPPING`, `DOCUMENTATION` | propias | varios | ROS-18, 19, 20 | Fase 2–3 |

## 4. Pesos (RN-09)

| Tipo | Peso | Estado |
|---|---|---|
| `NAME_CONVENTION` | **0,40** (máximo) | **Decidido** (prototipo, Constitución III) |
| `CONTAINMENT` | **0,90** | **Decidido** (prototipo) |
| `PROFILE_PATTERN` | 0,70 | *Provisional* |
| `DDL_DECLARED_FK` | 0,95 | *Provisional* |
| `DDL_TYPE` | 0,30 | *Provisional* |
| `DDL_CONSTRAINT` | 0,30 | *Provisional* |
| `HUMAN_REJECTION` | 1,00 (niega) | *Provisional* |
| `HUMAN_EDIT` | 1,00 | Fase 2 |

Una regla de nomenclatura puede declarar un peso **menor** a 0,40, nunca mayor (validación en modelo y en motor).

## 5. Algoritmo de puntuación (ROS-25, ROS-132, ROS-133) — *provisional*

**Paso 1 · Candidatos.** Para cada campo (`BUSINESS_NAME`, `SEMANTIC_TYPE`, `REFERENCES`) se agrupan las evidencias por valor.

**Paso 2 · Apoyo por valor** (combinación *noisy-OR*, independiente del orden):

```text
apoyo(campo, valor) = 1 − Π (1 − wᵢ · sᵢ)      para toda evidencia i con polaridad +1 que afirma ese valor
si existe un rechazo humano de ese valor → apoyo = 0
```

**Paso 3 · Interpretación elegida.** Por campo se elige el valor de mayor apoyo; empate → orden lexicográfico del valor.

**Paso 4 · Puntaje de la columna.**

```text
puntaje = 1 − Π (1 − wᵢ · sᵢ)     para toda evidencia i coherente con la interpretación elegida
```

Propiedades deseadas (cada una tiene prueba con `hypothesis`):
- `0 ≤ puntaje ≤ 1`.
- Añadir evidencia coherente **nunca baja** el puntaje (monotonía).
- **Solo el nombre** produce como máximo 0,40 → nunca alcanza `INFERRED` ni `HIGH_UNVALIDATED` por sí solo.
- El orden de la evidencia no cambia el resultado.

**Paso 5 · Desglose.** Para cada evidencia coherente: `aporte_i = puntaje_con_todas − puntaje_sin_i` (aporte marginal), más la lista de evidencias no coherentes (en conflicto o descartadas).

> **Calibración obligatoria en ROS-132:** con la fórmula y pesos finales, los casos de referencia de [03-datos-de-referencia.md](../04-datos/03-datos-de-referencia.md) deben reproducir **el nivel** del prototipo (obligatorio) y el **puntaje con tolerancia ±0,03** (deseable). Si no se puede, se documenta la diferencia en el CD.

## 6. Niveles (ROS-26, ROS-135, ROS-137) — umbrales *provisionales* salvo 0,85

Se evalúa en este orden; gana la primera regla que se cumple:

| # | Condición | Nivel |
|---|---|---|
| 1 | Existe confirmación humana vigente (la pone `review`, no el motor) | `CONFIRMED` |
| 2 | No hay evidencia con polaridad +1 de ninguna clase distinta de NAME, **o** hay `PROFILE_EMPTY` y ninguna otra evidencia salvo NAME, **o** `puntaje < 0,20` | `UNKNOWN` (sin nombre de negocio; confianza "–") |
| 3 | `puntaje ≥ 0,85` **y** sin conflicto abierto **y** ≥ 2 clases de independencia coherentes | `HIGH_UNVALIDATED` |
| 4 | ≥ 2 clases de independencia coherentes **y** `puntaje ≥ 0,60` | `INFERRED` |
| 5 | En otro caso | `HYPOTHESIS` |

- **0,85** = `umbral_alta` (decidido, RN-03). **0,60** (Inferida) y **0,20** (abstención) son *provisionales* ([DP-003](../07-registro/02-decisiones-pendientes.md)).
- Un conflicto abierto impide la regla 3 → como máximo `INFERRED` (RN-07; *provisional* si limita a Inferida o Hipótesis).
- **Caso RESERV3:** 100 % NULL en la muestra (`PROFILE_EMPTY`), sin referencias → regla 2 → `UNKNOWN`. Prueba explícita (ROS-137).
- **Caso USRALT:** el nombre sugiere "usuario", el perfil muestra código de 8 caracteres, pero ninguna fuente distingue "alta" de "última modificación" → dos valores de `BUSINESS_NAME` con apoyo parecido → se elige el genérico "Usuario (sin precisar)" y el nivel queda en `HYPOTHESIS`. `[NECESITA ACLARACIÓN]` cómo se decide el nombre genérico en el MVP (propuesta: si los dos mejores valores difieren en < 0,10 de apoyo, se usa el prefijo común o "Sin precisar" y se crea un conflicto de baja severidad).

**Qué falta para subir de nivel** (RN-11): el motor devuelve la regla que no se cumplió, p. ej. `"Falta una segunda fuente independiente (hoy: solo NAME)"` o `"Puntaje 0,71 < 0,85"`.

## 7. Conflictos (ROS-28, ROS-138)

Un **conflicto** existe cuando, para un mismo campo, hay al menos dos valores distintos y **cada uno** tiene `apoyo ≥ 0,30` (*provisional*). Se registra un `Conflict` con las evidencias implicadas.

- Estado `OPEN` hasta que un humano lo marca resuelto (`POST /api/conflicts/{id}/resolve`) o la evidencia cambia y deja de cumplirse (se cierra automáticamente con nota "resuelto por recálculo").
- Un rechazo humano de uno de los valores lo resuelve automáticamente.
- Ejemplo del prototipo: `PAPEL` — contención 0,94 con `PAP0001.PAPCOD` pero "dos valores fuera del catálogo" y sin etiqueta que lo nombre → queda `INFERRED` (0,71). *No es un conflicto*, es falta de confirmación.

## 8. Propagación (ROS-29, ROS-44, ROS-140, ROS-141)

**Destinos** de la propagación de una confirmación sobre la columna `c` (RN-12):

```text
destinos(c) = { d ∈ columnas del mismo proyecto |
                d ≠ c,
                normalizar(d.name) = normalizar(c.name),
                d.data_type_normalizado = c.data_type_normalizado,
                d.level ≠ CONFIRMED,
                d no tiene conflicto abierto }
```

- `normalizar` = mayúsculas y sin espacios. `data_type_normalizado` incluye longitud/precisión (`decimal(9,0)` ≠ `decimal(10,0)`). *Provisional* ([DP-003](../07-registro/02-decisiones-pendientes.md)).
- Las columnas con conflicto abierto **no** se propagan; la previsualización las lista como "excluidas por conflicto".
- La propagación es de **un solo salto** (no en cadena): confirmar `CTANRO` confirma todas las `CTANRO` del mismo tipo; no confirma las columnas que referencian a esas. El "grafo de dependencias" de ROS-140 se usa para el **impacto** y para recalcular vecinos, no para confirmar en cadena. `[NECESITA ACLARACIÓN]` si el producto quiere propagación en cadena.
- Los destinos quedan `CONFIRMED` con `origin=PROPAGATION` y `confirmed_by_action` = la acción origen. Reversibles.
- `unlocked_count = |destinos(c)|` (lo que muestra el prototipo: "los contadores suben con el número real de columnas que desbloquea").

## 9. Impacto y cola (ROS-36, ROS-144)

```text
impacto(c) = |destinos(c)|            (columnas que desbloquea; lo que muestra el prototipo: PGCOD 380 · CTANRO 210 · PETDOC 60)
orden de la cola = impacto desc, tiene_conflicto_abierto desc, identificador asc
```

- La cola excluye `CONFIRMED`. Incluye `UNKNOWN` (son candidatas a investigar) `[NECESITA ACLARACIÓN]` si deben ir al final o excluirse.
- En Fase 2 el impacto suma **uso** (logs de consulta). La fórmula está en [DP-003](../07-registro/02-decisiones-pendientes.md).
- Tras confirmar/rechazar se recalcula el impacto **solo** de las columnas con el mismo nombre normalizado (las únicas cuyo conjunto de destinos cambia).

## 10. Descripciones deterministas (RN-22, modo reglas)

`describe.py` construye la descripción con **plantillas** según el tipo semántico y el perfil. Ejemplos (texto del prototipo como objetivo de estilo):

| Tipo semántico / caso | Plantilla | Resultado de ejemplo |
|---|---|---|
| Fecha entera | `Fecha codificada como entero {formato}. Rango {min}–{max}{, sin centinelas}.` | "Fecha codificada como entero AAAAMMDD. Rango 19980102–20260829, sin centinelas." |
| Importe | `Monto{ en la moneda de {col_moneda}}. {distribución}, mediana {mediana}, {pct_ceros} en cero.` | "Monto en la moneda de MONCOD. Log-normal, mediana 84.500, 0,3% en cero." |
| Enum sin catálogo | `{v1} = {etiqueta1} ({pct1}) · … Enum sin catálogo.` | "A = activo (96,1%) · E = eliminado lógico (3,8%) · P = pendiente (0,1%). Enum sin catálogo." |
| Referencia | `{nombre}. Contención {c} con {tabla.col}{; N huérfanos…}.` | "Cuenta afectada. Contención 0,998 con CTA0001.CTANRO; 812.400 huérfanos, todos anteriores a 2011." |
| Constante | `{nombre}. Valor constante {v} en el {pct} de las filas.` | "Código de entidad. Valor constante 1 en el 100% de las filas…" |
| Hipótesis | `Probablemente {…}. {por qué no se afirma}.` | "Probablemente el tipo de producto financiero…" |
| Desconocida | `Desconocido. {evidencia negativa}.` | "Desconocido. 100% NULL en 412M filas, sin referencias en consultas ni en el repositorio." |

- Las etiquetas de valores de un enum (activo, eliminado lógico…) **solo** se escriben si provienen de evidencia (regla de nomenclatura o fuente); si no, se muestran solo los valores y porcentajes.
- Los números se formatean en **es-CO** (coma decimal, punto de miles), igual que el prototipo.

## 11. Recalcular

| Evento | Qué se recalcula |
|---|---|
| Nueva fuente procesada | Columnas con evidencia nueva + vecinas por nombre |
| Fuente eliminada (RN-20) | Columnas que tenían evidencia de esa fuente |
| Regla de nomenclatura creada/editada/eliminada (RN-21) | Columnas cuyo nombre coincide con el patrón (antes o después del cambio) |
| Confirmar / rechazar | La columna, sus destinos, y el impacto de las columnas con el mismo nombre |
| Cambio de `ENGINE_VERSION` | Todo el proyecto (tarea `recompute_project`) |

Las columnas `CONFIRMED` conservan su nivel en cualquier recálculo; su puntaje y desglose sí se actualizan (informativos).

## 12. Pruebas obligatorias del motor

- Unitarias por módulo (`scoring`, `levels`, `conflicts`, `propagation`, `impact`, `describe`), cobertura ≥ 95 %.
- Propiedades (`hypothesis`): determinismo, monotonía, rango, "solo nombre ≤ 0,40", "el motor nunca devuelve CONFIRMED".
- Casos de referencia del prototipo (PGCOD, SUCCOD, MONCOD, PAPEL, CTANRO, FEPRO, IMPTE, ESTREG, USRALT, FEALT, RESERV3) como pruebas parametrizadas con su nivel esperado.
- Prueba de igualdad previsualización = confirmación (RN-13).
