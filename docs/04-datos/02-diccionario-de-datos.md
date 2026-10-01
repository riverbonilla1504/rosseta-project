# Diccionario de datos

> Cada tabla y columna de la base de datos de Rosetta (MVP). Convenciones comunes a todas las tablas salvo indicación:
> - `id` UUID v4, clave primaria, generado por la aplicación.
> - `created_at`, `updated_at` `timestamptz` no nulos (UTC).
> - Enums guardados como `varchar` con `CHECK` (Django `TextChoices`).
> - Nombres de tabla `<app>_<modelo>`.
>
> Cambiar este archivo = CD ([04-sincronizacion.md](../00-metodologia/04-sincronizacion.md)) y, en código, una migración.

---

## accounts_user
Usuario de Rosetta. Modelo propio (`AUTH_USER_MODEL = "accounts.User"`) basado en `AbstractBaseUser`, creado **antes de la primera migración**. La identidad, las sesiones y los proveedores viven en **Auth0** ([ADR-0007](../03-arquitectura/adr/ADR-0007-autenticacion-auth0.md)).

| Columna | Tipo | Nulo | Descripción |
|---|---|---|---|
| id | uuid | No | PK |
| auth0_sub | varchar(255) | No | Claim `sub` del access token (`google-oauth2\|1234…`, `windowslive\|…`). Único |
| email | varchar(254) | No | Correo verificado (claim de la Action post-login). Único sin distinguir mayúsculas (`lower(email)`) |
| full_name | varchar(200) | No | Nombre del proveedor; editable en Fase 2 (ROS-99) |
| avatar_url | varchar(500) | Sí | URL de avatar del proveedor |
| is_active | boolean | No | `false` = desactivado (no se borran usuarios con acciones auditadas) |
| is_staff | boolean | No | Acceso al admin de Django (soporte interno) |
| onboarding_completed_at | timestamptz | Sí | `null` = onboarding pendiente (ROS-91, 185) |
| last_login_at | timestamptz | Sí | Último request autenticado del día (se actualiza como máximo una vez por hora) |
| created_at, updated_at | timestamptz | No | |

Sin contraseña (`set_unusable_password`): el único método es Auth0 con Google o Microsoft ([DP-014](../07-registro/02-decisiones-pendientes.md#dp-014)). El admin de Django se protege aparte (usuario staff con contraseña fuerte, solo en red interna) `[PENDIENTE]` definir en 002.

---

## projects_project
| Columna | Tipo | Nulo | Descripción |
|---|---|---|---|
| id | uuid | No | PK |
| owner_id | uuid FK → accounts_user | No | Propietario (`PROTECT`) |
| organization_id | uuid | Sí | Reservado para multi-tenant (ADR-0004). Siempre `null` en el MVP |
| name | varchar(120) | No | Nombre visible (p. ej. `CORE_PRD`) |
| description | text | No | Puede ser vacío |
| source_dialect | varchar(20) | Sí | `tsql` \| `oracle` \| `postgres` \| `mysql`; se rellena con el primer DDL |
| archived_at | timestamptz | Sí | `null` = activo |
| created_at, updated_at | timestamptz | No | |

---

## sources_source
Archivo cargado como fuente de evidencia.

| Columna | Tipo | Nulo | Descripción |
|---|---|---|---|
| id | uuid | No | PK |
| project_id | uuid FK | No | `CASCADE` |
| kind | varchar(20) | No | `SCHEMA_DDL` \| `DATA_SAMPLE` (MVP). Fase 2+: `QUERY_LOG`, `DOCUMENTATION`, `CODE`… |
| status | varchar(12) | No | `PENDING` \| `PROCESSING` \| `READY` \| `FAILED` |
| original_filename | varchar(255) | No | Solo metadato |
| storage_path | varchar(500) | Sí | Ruta en el almacenamiento (nombre aleatorio). `null` si ya se purgó según retención |
| size_bytes | bigint | No | |
| sha256 | char(64) | No | Idempotencia: único por `(project_id, kind, sha256)` |
| dialect | varchar(20) | Sí | Solo DDL |
| target_table_id | uuid FK → catalog_table | Sí | Solo `DATA_SAMPLE`: tabla a la que pertenece la muestra |
| encoding, delimiter | varchar(20), varchar(4) | Sí | Solo CSV; detectados o indicados |
| stats | jsonb | No | Resumen: `{tables, columns, rows, warnings[]}` |
| error_message | text | Sí | Mensaje legible para el usuario si `FAILED` |
| evidence_count | integer | No | Cache del número de evidencias generadas (panel de fuentes) |
| uploaded_by_id | uuid FK → accounts_user | No | |
| processed_at | timestamptz | Sí | |
| created_at, updated_at | timestamptz | No | |

## sources_naming_rule
Convención de nombres (ROS-21, ROS-126).

| Columna | Tipo | Nulo | Descripción |
|---|---|---|---|
| id | uuid | No | PK |
| project_id | uuid FK | Sí | `null` = regla **global** (semilla del sistema, solo lectura para usuarios) |
| pattern | varchar(60) | No | Fragmento del nombre, p. ej. `IMPTE`, `FE`, `NRO` |
| match_type | varchar(10) | No | `PREFIX` \| `SUFFIX` \| `TOKEN` \| `EXACT` \| `REGEX` |
| meaning | varchar(120) | No | Significado: "importe", "fecha", "número" |
| semantic_type | varchar(30) | Sí | Tipo semántico sugerido: `DATE`, `AMOUNT`, `CODE`, `IDENTIFIER`, `FLAG`, `TEXT`, `TIMESTAMP`, `USER` |
| weight | numeric(3,2) | No | ≤ 0,40 (CHECK). Por defecto 0,40 |
| is_active | boolean | No | |
| created_by_id | uuid FK | Sí | `null` en reglas globales |
| created_at, updated_at | timestamptz | No | |

Único `(coalesce(project_id, 'global'), pattern, match_type)`.

---

## catalog_table
Tabla del esquema del cliente.

| Columna | Tipo | Nulo | Descripción |
|---|---|---|---|
| id | uuid | No | PK |
| project_id | uuid FK | No | `CASCADE` |
| schema_name | varchar(128) | No | Esquema de origen (`dbo`, …); `''` si no hay |
| name | varchar(128) | No | Nombre exacto del origen (`MOV0010`) |
| business_name | varchar(200) | Sí | "Movimientos de cuenta" (inferido o editado) |
| row_count | bigint | Sí | Filas reportadas por la muestra o metadata (`412.043.221`) |
| column_count | integer | No | Cache |
| has_declared_fks | boolean | No | Si el DDL declaró alguna FK |
| first_source_id | uuid FK → sources_source | Sí | DDL que la creó |
| created_at, updated_at | timestamptz | No | |

## catalog_column
Hechos estructurales de una columna del cliente (del DDL).

| Columna | Tipo | Nulo | Descripción |
|---|---|---|---|
| id | uuid | No | PK |
| project_id | uuid FK | No | Desnormalizado para consultas por proyecto (propagación, cola) |
| table_id | uuid FK | No | `CASCADE` |
| name | varchar(128) | No | `CTANRO` |
| name_normalized | varchar(128) | No | Mayúsculas, sin espacios (RN-12) |
| ordinal | integer | No | Posición en la tabla |
| data_type | varchar(60) | No | Tal como el DDL: `decimal(9,0)` |
| data_type_normalized | varchar(60) | No | Forma canónica para comparar (incluye longitud/precisión) |
| type_length, type_precision, type_scale | integer | Sí | Descompuestos |
| is_nullable | boolean | No | |
| is_primary_key | boolean | No | |
| is_unique | boolean | No | |
| declared_fk_target | varchar(260) | Sí | `TABLA.COLUMNA` si el DDL declara FK |
| default_expression | varchar(200) | Sí | |
| is_pii | boolean | No | Marcada como dato personal (RN-26) — manual o por regla |
| created_at, updated_at | timestamptz | No | |

## catalog_column_interpretation
Conclusión vigente sobre la columna (1:1 con `catalog_column`).

| Columna | Tipo | Nulo | Descripción |
|---|---|---|---|
| id | uuid | No | PK |
| column_id | uuid FK (único) | No | `CASCADE` |
| project_id | uuid FK | No | Desnormalizado (cobertura, cola) |
| business_name | varchar(200) | Sí | `null` si `UNKNOWN` (RN-06) |
| description | text | No | Generada por plantilla o editada |
| semantic_type | varchar(30) | Sí | Tipo semántico elegido |
| references_column_id | uuid FK → catalog_column | Sí | Referencia elegida (contención o FK declarada) |
| level | varchar(20) | No | `CONFIRMED` \| `HIGH_UNVALIDATED` \| `INFERRED` \| `HYPOTHESIS` \| `UNKNOWN` |
| score | numeric(4,3) | Sí | 0–1; `null` si `UNKNOWN` sin evidencia |
| score_breakdown | jsonb | No | `[{evidence_id, kind, weight, strength, contribution}]` + `missing_for_next_level` |
| origin | varchar(12) | No | `ENGINE` \| `HUMAN` \| `PROPAGATION` \| `HUMAN_EDIT` |
| confirmed_by_action_id | uuid FK → review_review_action | Sí | Acción que la confirmó (directa o por propagación) |
| confirmed_by_id | uuid FK → accounts_user | Sí | Quién confirmó |
| confirmed_at | timestamptz | Sí | |
| has_open_conflict | boolean | No | Cache para la cola |
| impact | integer | No | Columnas que desbloquearía (§9 del motor) |
| engine_version | varchar(20) | No | Versión del motor que calculó |
| computed_at | timestamptz | No | Último recálculo |
| updated_at | timestamptz | No | |

CHECK: `level = 'CONFIRMED'` ⇔ `confirmed_by_action_id IS NOT NULL` (garantía en BD de RN-02).

## catalog_column_profile
Perfil de una columna calculado desde una muestra (ROS-123).

| Columna | Tipo | Nulo | Descripción |
|---|---|---|---|
| id | uuid | No | PK |
| column_id | uuid FK | No | `CASCADE` |
| source_id | uuid FK → sources_source | No | Muestra de origen (`CASCADE`: al borrar la fuente se borra el perfil) |
| row_count | bigint | No | Filas de la muestra |
| null_count | bigint | No | |
| null_ratio | numeric(6,5) | No | |
| distinct_count | bigint | No | |
| min_value, max_value | varchar(200) | Sí | Como texto |
| top_values | jsonb | No | `[{value, count, ratio}]` hasta 20. En Fase 2 se enmascaran si `is_pii` |
| histogram | jsonb | Sí | Para numéricos/fechas |
| detected_pattern | varchar(30) | Sí | `DATE_YYYYMMDD`, `AMOUNT`, `CODE`, `ENUM`, `FLAG`, `CONSTANT`, `EMPTY`, `FREE_TEXT` |
| out_of_catalog_count | bigint | Sí | Valores no contenidos en la columna referenciada (si hay referencia candidata) |
| stats | jsonb | No | Otros: mediana, % ceros, longitud media, distribución detectada |
| computed_at | timestamptz | No | |

Único `(column_id, source_id)`. La ficha muestra el perfil más reciente.

---

## evidence_evidence
Evidencia normalizada (ROS-23, ROS-130). **Contrato versionado** (`format_version`).

| Columna | Tipo | Nulo | Descripción |
|---|---|---|---|
| id | uuid | No | PK |
| project_id | uuid FK | No | |
| column_id | uuid FK | No | Objetivo (MVP: siempre una columna) |
| source_id | uuid FK → sources_source | Sí | `CASCADE`. `null` para reglas de nombres y acciones humanas |
| naming_rule_id | uuid FK → sources_naming_rule | Sí | Solo `NAME_CONVENTION` (`CASCADE`) |
| review_action_id | uuid FK → review_review_action | Sí | Solo `HUMAN_*` |
| kind | varchar(30) | No | Ver tabla de `kind` en [06-motor-de-evidencia.md §3](../03-arquitectura/06-motor-de-evidencia.md) |
| independence_class | varchar(15) | No | `NAME` \| `DDL` \| `PROFILE` \| `CONTAINMENT` \| `HUMAN` |
| claim_field | varchar(20) | No | `BUSINESS_NAME` \| `SEMANTIC_TYPE` \| `REFERENCES` \| `NO_INFORMATION` |
| claim_value | varchar(260) | Sí | Valor afirmado |
| polarity | smallint | No | `+1` apoya, `-1` niega |
| weight | numeric(3,2) | No | Peso del tipo (RN-09) |
| strength | numeric(4,3) | No | Fuerza concreta 0–1 |
| citation | jsonb | No | `{source_kind, locator:{file,line,column,rule_id…}, excerpt}` — obligatorio (RN-10) |
| format_version | smallint | No | Versión del contrato de evidencia (inicia en 1) |
| created_at | timestamptz | No | Inmutable: la evidencia no se edita; se borra y se regenera |

## evidence_conflict
| Columna | Tipo | Nulo | Descripción |
|---|---|---|---|
| id | uuid | No | PK |
| project_id | uuid FK | No | |
| column_id | uuid FK | No | `CASCADE` |
| claim_field | varchar(20) | No | Campo en disputa |
| values | jsonb | No | `[{value, support, evidence_ids[]}]` |
| status | varchar(10) | No | `OPEN` \| `RESOLVED` |
| resolution | varchar(20) | Sí | `HUMAN` \| `RECOMPUTE` \| `REJECTION` |
| resolution_note | text | Sí | |
| resolved_by_id | uuid FK | Sí | |
| detected_at | timestamptz | No | |
| resolved_at | timestamptz | Sí | |

Tabla intermedia `evidence_conflict_evidences (conflict_id, evidence_id)`.

---

## review_review_action
Registro **inmutable** de acciones humanas (RN-14, RNF-22). Sin `updated_at`. El modelo sobreescribe `save()`/`delete()` para impedir modificaciones y la API no expone edición ni borrado; además un *trigger* `BEFORE UPDATE OR DELETE` lanza error.

| Columna | Tipo | Nulo | Descripción |
|---|---|---|---|
| id | uuid | No | PK |
| project_id | uuid FK | No | `CASCADE` (al borrar el proyecto) |
| column_id | uuid FK | No | `CASCADE` |
| actor_id | uuid FK → accounts_user | No | `PROTECT` |
| action | varchar(12) | No | `CONFIRM` \| `EDIT` \| `REJECT` \| `REVERT` |
| reason | text | Sí | Obligatorio si `REJECT` (CHECK) |
| before | jsonb | No | `{level, business_name, description, score}` |
| after | jsonb | No | Ídem |
| propagated_count | integer | No | Columnas confirmadas por propagación (solo `CONFIRM`) |
| reverted_count | integer | No | Columnas revertidas (solo `REJECT`/`REVERT`) |
| engine_version | varchar(20) | No | |
| created_at | timestamptz | No | |

---

## Enumeraciones (resumen)

| Enum | Valores |
|---|---|
| Nivel | `CONFIRMED`, `HIGH_UNVALIDATED`, `INFERRED`, `HYPOTHESIS`, `UNKNOWN` |
| Origen de interpretación | `ENGINE`, `HUMAN`, `PROPAGATION`, `HUMAN_EDIT` |
| Tipo de fuente | `SCHEMA_DDL`, `DATA_SAMPLE` (MVP) |
| Estado de fuente | `PENDING`, `PROCESSING`, `READY`, `FAILED` |
| Tipo de evidencia | `NAME_CONVENTION`, `DDL_TYPE`, `DDL_CONSTRAINT`, `DDL_DECLARED_FK`, `PROFILE_PATTERN`, `PROFILE_EMPTY`, `CONTAINMENT`, `HUMAN_REJECTION`, `HUMAN_EDIT` |
| Acción de revisión | `CONFIRM`, `EDIT`, `REJECT`, `REVERT` |
| Tipo semántico | `DATE`, `TIMESTAMP`, `AMOUNT`, `CODE`, `IDENTIFIER`, `FLAG`, `ENUM`, `TEXT`, `USER`, `CONSTANT` |

Etiquetas en español de cada enum: [05-diseno/04-contenido-y-redaccion.md](../05-diseno/04-contenido-y-redaccion.md).
