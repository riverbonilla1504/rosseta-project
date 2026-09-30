# Pantallas

> Las cinco pantallas del prototipo final (Claude Design, `Rosetta.dc.html`) más las pantallas que el MVP necesita y el prototipo no tiene (login, onboarding, proyectos, fuentes).
>
> **Fidelidad de la información:** Panorama y Catálogo se describen desde **capturas** del prototipo. Revisión, Hallazgos y Generador se describen desde **el resumen del propio prototipo** (no se pudieron capturar: [EC-002](../07-registro/01-errores-conocidos.md)); su distribución visual detallada queda a definir en ROS-151 revisando el prototipo en vivo.

## Estructura común

```text
┌───────────────────────────────────────────────────────────────────────────────┐
│ Rosetta MOTOR DE EVIDENCIA   Panorama Revisión Catálogo [Fuentes]             │
│                                      [CORE_PRD · sqlserver] (solo lectura) redacción… │
├───────────────────────────────────────────────────────────────────────────────┤
│  Título de pantalla (display)                         [acción sec.] [acción ⟶]│
│  Subtítulo con cifras del proyecto                                              │
│  ┌──────────── tarjeta ────────────┐ ┌──────── tarjeta ────────┐               │
└───────────────────────────────────────────────────────────────────────────────┘
```

- Fondo `--nx-bg`, contenido alineado a la izquierda con ancho máximo ~1280 px.
- Navegación superior con la pestaña activa en acento.
- Insignias a la derecha: proyecto · dialecto (mono), "solo lectura" (contorno), modo de redacción.

---

## 1. Panorama — `/p/{id}` (ROS-37…40)

**Objetivo:** en 5 segundos saber cuánto del esquema está entendido y qué revisar ahora.

| Zona | Contenido (prototipo) | Componente | Historia |
|---|---|---|---|
| Encabezado | "Modelo semántico reconstruido" · "918 tablas · 18.442 columnas · 4,1 TB. Ninguna clave foránea declarada, ningún comentario en el catálogo. Última corrida hace 14 minutos, incremental." · botones **Informe de hallazgos** (secundario) y **Continuar revisión** (primario con contorno) | — | ROS-37 |
| Cobertura del esquema | "de 18.442 columnas"; barra apilada; Confirmadas 4.120 "validadas por una persona", Inferidas 7.980 "≥2 fuentes de acuerdo", Hipótesis 2.913 "revisar antes de usar", Desconocidas 3.429 "sin evidencia: no se inventa" | `CoverageCard` | ROS-37 |
| Trabajo humano | "34 validaciones confirmadas"; texto de propagación "…documentaron 3.810 columnas"; "22 min al primer hallazgo", "1,8 h perfilado incremental" | `HumanWorkCard` | ROS-37 |
| Fuentes de evidencia recolectadas | 6 filas con barra y cantidad; nota "El nombre de la columna es la fuente de menor peso, deliberadamente: 0,40 contra 0,90 de una contención con catálogo." | `SourcesPanel` compacto | ROS-38 |
| Cola priorizada por impacto | Top 3 (PGCOD 380, CTANRO 210, PETDOC 60) con tipo, pista y "columnas que desbloquea"; enlace "Abrir revisión →" | `QueueList` compacta | ROS-39 |
| Hallazgos abiertos | Debajo del pliegue (no capturado) | `FindingsSummary` | ROS-40 |

**Decisiones para el MVP:**
- La cobertura muestra **los cinco niveles**, incluido "Alta · sin validar" (el prototipo muestra 4: [EC-012](../07-registro/01-errores-conocidos.md)). Etiqueta propuesta: "ALTA · SIN VALIDAR — puntaje alto, falta una persona".
- Las fuentes del MVP son DDL, perfil de datos, contención y nombre; las demás filas no se muestran (o aparecen como "no cargada" — [DP-001](../07-registro/02-decisiones-pendientes.md)).
- "22 min al primer hallazgo" y "1,8 h perfilado incremental": `[NECESITA ACLARACIÓN]` definición de estas métricas; **fuera del MVP** salvo que se defina ([DP-018](../07-registro/02-decisiones-pendientes.md)).
- **Estado vacío** (proyecto sin fuentes): "Todavía no hay evidencia. Sube el DDL de tu base para empezar." + botón a Fuentes.

## 2. Revisión — `/p/{id}/review` (ROS-42…48) · **pantalla central**

Del prototipo: *"ficha de evidencia con citas verificables, perfil, efecto de propagación y avisos de conflicto. Confirmar propaga: los contadores suben con el número real de columnas que desbloquea. Teclado: J/K, A, E, R."*

Distribución (ROS-153: "cola a un lado, ficha al centro"):

```text
┌────────── COLA (por impacto) ─────────┐ ┌──────────────── FICHA ─────────────────────────┐
│ ▸ MOV0010.PGCOD   smallint     380    │ │ MOV0010.CTANRO  decimal(9,0) NOT NULL          │
│   MOV0010.CTANRO  decimal(9,0) 210    │ │ [Alta · sin validar]  0,90                     │
│   …PETDOC         smallint      60    │ │ Número de cuenta                               │
│                                       │ │ Cuenta afectada. Contención 0,998 con …        │
│ filtros: nivel · tabla                │ │ ⚠ aviso de conflicto (si hay)                  │
│                                       │ │ EVIDENCIAS  (citas verificables)               │
│                                       │ │ PERFIL      (distribución, nulos, fuera de cat.)│
│                                       │ │ PROPAGACIÓN "Confirmar desbloqueará 210 col."  │
│                                       │ │ [Confirmar A] [Editar E] [Rechazar R]          │
└───────────────────────────────────────┘ └────────────────────────────────────────────────┘
```

- Tras **Confirmar**: toast con el número real, el chip pasa a "Confirmada", el contador de Panorama sube, la fila del Catálogo cambia, y se avanza al siguiente ítem.
- **Rechazar** exige motivo (diálogo). **Editar** abre edición en línea del nombre y la descripción; "Guardar y confirmar" o "Guardar".
- Estados: cargando, cola vacía ("No quedan columnas por revisar." + enlace al Catálogo), error.
- URL `?column=<uuid>` para enlazar directamente una ficha.

## 3. Catálogo — `/p/{id}/catalog` y `/p/{id}/catalog/{tableId}` (ROS-50…55)

**Lista de tablas:** nombre (mono), nombre de negocio, filas, nº de columnas y mini-distribución de niveles. Virtualizada.

**Tabla (captura de `MOV0010`):**

| Zona | Contenido |
|---|---|
| Encabezado | `MOV0010` (mono grande) · "Movimientos de cuenta · 412.043.221 filas · 11 columnas · sin claves foráneas declaradas" · botones **Exportar YAML** y **Publicar comentarios al catálogo** |
| Tabla | Columnas: COLUMNA · TIPO · NOMBRE DE NEGOCIO · DESCRIPCIÓN · NIVEL · CONF. (datos exactos en [03-datos-de-referencia.md §2](../04-datos/03-datos-de-referencia.md)) |
| Fila seleccionada | Resaltada con `--nx-surface-raised` (FEPRO en la captura) |
| Paneles inferiores | "RASTRO DE EVIDENCIA · MOV0010.FEPRO" (izquierda) y "PERFIL" (derecha) de la columna seleccionada; relación inferida al hacer clic |

**Decisiones para el MVP:**
- Los botones **Exportar YAML** y **Publicar comentarios al catálogo no se incluyen** (exportación es Fase 2 y publicar escribe en el origen): [EC-013](../07-registro/01-errores-conocidos.md), [DP-005](../07-registro/02-decisiones-pendientes.md), [DP-006](../07-registro/02-decisiones-pendientes.md).
- "Relación inferida al hacer clic" es ROS-53 (Fase 2); en el MVP el rastro muestra la **referencia elegida** si existe (contención/FK declarada).
- Clic en una fila → selecciona y abre rastro + perfil; doble clic o botón "Revisar" → Revisión con esa columna.

## 4. Hallazgos — Fase 2 (ROS-58…62)

Del prototipo: *"informe por severidad con esfuerzo estimado"*. No entra al MVP; en el MVP solo existe el resumen del Panorama (ROS-40).

## 5. Generador — Fase 2 (ROS-63…68)

Del prototipo: *"los tres modos, con registro de ejecución, muestra generada coherente con el catálogo y garantías por modo"*. Los tres modos no están documentados: [DP-007](../07-registro/02-decisiones-pendientes.md).

## 6. Panel de ajustes del prototipo ("tweaks")

| Control | Valor | En Rosetta |
|---|---|---|
| `modoSinLlm` | on/off | MVP: siempre "reglas" (no hay LLM). Toggle real en Fase 2 (ROS-31) |
| `umbralConfirmada` | 0.85 | MVP: fijo 0,85. Configurable en Fase 2 (ROS-32). Nombre engañoso: [EC-011](../07-registro/01-errores-conocidos.md) |

---

## 7. Pantallas del MVP que no están en el prototipo

Deben diseñarse con Nocturne en la feature correspondiente (la spec incluye un boceto):

| Pantalla | Ruta | Contenido mínimo | Feature |
|---|---|---|---|
| Login | `/login` | Marca, frase de valor, "Continuar con Google", "Continuar con Microsoft", nota de privacidad (qué datos se piden) | 002 |
| Error de acceso | `/auth/error` | Mensaje según código (`oauth_denied`, `oauth_failed`, `account_exists_other_provider`) + "Volver a intentar" | 002 |
| Onboarding | `/onboarding` | Bienvenida con el nombre; 1) crear primer proyecto (nombre, dialecto) 2) subir DDL; se puede saltar | 002, 003 |
| Proyectos | `/projects` | Lista (nombre, fecha, nº tablas/columnas, % confirmado), crear, renombrar, archivar, filtro archivados | 003 |
| Fuentes | `/p/{id}/sources` | `FileDrop` para DDL y para muestras (elegir tabla), lista de fuentes con estado y cobertura, eliminar; sección Convenciones | 004 |
| Convenciones | sección de Fuentes | Tabla de reglas (globales de solo lectura + del proyecto editables), aviso de conflictos entre reglas | 004 |
