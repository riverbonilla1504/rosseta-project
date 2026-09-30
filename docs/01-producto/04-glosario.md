# Glosario

Lenguaje común del dominio. Todo documento, spec, texto de UI y nombre en el código usa estos términos con este significado. En la columna "Código" está el identificador que se usa en el software.

## Dominio de Rosetta

| Término | Definición | Código |
|---|---|---|
| **Proyecto** | Un espacio de trabajo que corresponde a **una base de datos** que se quiere descifrar | `Project` |
| **Esquema** | El conjunto de tablas y columnas de la base de origen | — |
| **Tabla** | Tabla de la base de origen (p. ej. `MOV0010`) | `SchemaTable` |
| **Columna** | Columna de una tabla de origen (p. ej. `MOV0010.CTANRO`) | `SchemaColumn` |
| **Fuente (de evidencia)** | Un origen de información cargado en el proyecto: DDL, muestra de datos, convenciones de nombres… | `Source` |
| **Evidencia** | Una afirmación puntual que una fuente aporta sobre una columna, con su peso y su cita | `Evidence` |
| **Cita verificable** | Referencia precisa al dato original que sostiene una evidencia (archivo, línea, tabla, valor) | `Evidence.citation` |
| **Peso** | Cuánto aporta un tipo de evidencia al puntaje (el nombre de columna: máx. 0,40) | `weight` |
| **Puntaje** | Valor entre 0 y 1 que resume la evidencia sobre una columna | `score` |
| **Desglose del puntaje** | Aporte de cada fuente al puntaje | `score_breakdown` |
| **Nivel de confianza** | Clasificación de una interpretación en 5 niveles (ver abajo) | `ConfidenceLevel` |
| **Interpretación** | Lo que Rosetta afirma sobre una columna: nombre de negocio, descripción, nivel, puntaje | `Interpretation` |
| **Nombre de negocio** | Nombre legible de la columna (p. ej. `CTANRO` → "Número de cuenta") | `business_name` |
| **Perfil (de datos)** | Estadísticas de los valores de una columna: nulos, cardinalidad, distribución, rango, patrones | `ColumnProfile` |
| **Contención** | Proporción de valores distintos de una columna que existen en otra columna candidata (p. ej. `PAPEL` en `PAP0001.PAPCOD`: 0,94). Es la base de la inferencia de relaciones | `containment` |
| **Huérfanos** | Valores de una columna que **no** existen en la columna referenciada (p. ej. 812.400 en `CTANRO`) | `orphans` |
| **Relación inferida** | Llave foránea deducida por evidencia aunque no esté declarada | `Relationship` (kind `inferred_fk`) |
| **Catálogo embebido** | Tabla de códigos dentro de la misma base (p. ej. `MON0001` para monedas) | — |
| **Valores fuera de catálogo** | Valores de una columna que no aparecen en su catálogo esperado | `out_of_catalog` |
| **Convención de nombres** | Regla que asocia partes de un nombre a un significado (`FE`→fecha, `IMPTE`→importe) | `NamingRule` |
| **Conflicto** | Dos evidencias que afirman cosas incompatibles sobre la misma columna | `Conflict` |
| **Confirmar** | Acción humana que valida una interpretación → nivel "Confirmada" | `ReviewAction` (`confirm`) |
| **Rechazar** | Acción humana que invalida una interpretación, con motivo | `ReviewAction` (`reject`) |
| **Editar** | Acción humana que corrige el nombre o la descripción | `ReviewAction` (`edit`) |
| **Propagación** | Efecto de una confirmación sobre otras columnas: se extiende a todas las tablas donde la misma columna aparece con el mismo tipo | `propagation` |
| **Desbloquea** | Número de columnas que una confirmación resolvería por propagación ("380 columnas que desbloquea") | `unlock_count` |
| **Cola (priorizada por impacto)** | Lista de columnas pendientes de revisar ordenadas por impacto | `queue` |
| **Impacto** | Valor que ordena la cola: combina columnas que desbloquea, uso y conflictos | `impact` |
| **Hallazgo** | Problema de calidad detectado (conflicto abierto, columna desconocida, huérfanos…) con severidad y esfuerzo | `Finding` (Fase 2) |
| **Cobertura** | Distribución de las columnas del esquema por nivel de confianza | `coverage` |
| **Abstención** | Regla por la cual el motor declara "Desconocida" en lugar de adivinar | — |
| **Modo sin LLM** | Modo en que toda la redacción se genera con reglas deterministas | `llm_mode = off` |
| **Umbral de confirmada** (`umbralConfirmada`) | Puntaje a partir del cual una interpretación automática se clasifica "Alta · sin validar" (por defecto 0,85) | `high_threshold` |
| **Rastro de evidencia** | Vista de todas las evidencias y citas que sostienen una columna | — |
| **Ficha de evidencia** | Pantalla de detalle de una columna en Revisión | — |
| **PII** | Información personal identificable (p. ej. `USRALT` marcado como PII) | `is_pii` |

## Los 5 niveles de confianza

| Nivel (UI) | Código | Significado | Cómo se llega |
|---|---|---|---|
| **Confirmada** | `CONFIRMED` | Validada por una persona | **Solo** por acción humana |
| **Alta · sin validar** | `HIGH_UNVALIDATED` | Evidencia automática fuerte, aún no validada | Puntaje ≥ umbral (0,85) |
| **Inferida** | `INFERRED` | Deducida con ≥ 2 fuentes de acuerdo | Ver [RN-06](../02-requisitos/04-reglas-de-negocio.md) |
| **Hipótesis** | `HYPOTHESIS` | Conjetura débil: "revisar antes de usar"; el motor no la afirma | Evidencia insuficiente para Inferida |
| **Desconocida** | `UNKNOWN` | Sin evidencia: no se inventa | Sin evidencia útil |

## Metodología

| Término | Definición |
|---|---|
| **SDD** | Spec-Driven Development: la especificación es la fuente de verdad y el código su expresión |
| **Spec** | Documento técnico vivo con intención, comportamiento, restricciones y no-objetivos |
| **Spec drift** | Divergencia entre lo que dice la spec y lo que hace el código |
| **Vibe coding** | Programar con prompts sueltos e intuición, sin especificación |
| **Constitución** | Principios no negociables del proyecto (`.specify/memory/constitution.md`) |
| **Feature (Spec Kit)** | Unidad de trabajo `specs/NNN-slug/` que agrupa historias |
| **FR** | Requisito funcional dentro de una spec (`FR-001`) |
| **Converged** | Estado de `/speckit-converge` cuando el código cumple spec, plan y tareas |
| **CD** | Cambio de documentación (`CD-NNN`) |
| **EC** | Error conocido (`EC-NNN`) |
| **DP** | Decisión pendiente (`DP-NNN`) |
| **ADR** | Architecture Decision Record (`ADR-NNNN`) |
| **DoR / DoD** | Definición de Listo / Definición de Terminado |
| **RN / RNF** | Regla de negocio / Requisito no funcional |

## Abreviaturas del esquema de ejemplo

Usadas en el caso de referencia ([03-datos-de-referencia.md](../04-datos/03-datos-de-referencia.md)). **Son ejemplos del dominio bancario del prototipo, no reglas universales.**

| Abreviatura | Significado observado |
|---|---|
| `PG` | Entidad (código de entidad) |
| `SUC` | Sucursal |
| `MON` | Moneda |
| `PAP` | Papel / producto |
| `CTA` | Cuenta |
| `NRO` | Número |
| `FE` | Fecha |
| `PRO` | Proceso |
| `IMPTE` | Importe |
| `EST` / `REG` | Estado / registro |
| `USR` | Usuario |
| `ALT` | Alta |
| `COD` | Código |
| `PET` / `DOC` | Tipo / documento |
| `CLI` | Cliente |
| `PAR` | Parámetro |
