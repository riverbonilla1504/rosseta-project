# Modelo frente al diccionario de datos (T063, ROS-175)

**Fecha:** 2026-10-19 · **Rama:** `003-proyectos-y-nucleo-de-datos` · **FR:** FR-026 · **Fuente:** [02-diccionario-de-datos.md](../../../docs/04-datos/02-diccionario-de-datos.md)

## Cómo se obtuvo

Comparación automática, columna a columna, entre las tablas del diccionario que crea esta feature y el esquema **real** de PostgreSQL tras `migrate` (base de desarrollo, `makemigrations --check` sin cambios pendientes): tipo, longitud o precisión y nulabilidad, leídos de `information_schema.columns`. Se aplica la convención del encabezado del diccionario ("`created_at`, `updated_at` `timestamptz` no nulos en todas las tablas salvo indicación"); una tabla que nombra solo una de las dos se toma como la indicación. El guion de la comparación es de un solo uso y no se versiona.

Las restricciones (`CHECK` de enums y reglas, únicos, única parcial), los índices, las claves foráneas con su `ON DELETE` y el *trigger* de inmutabilidad se comprueban con pruebas sobre la base real en `backend/tests/core_data/` (`test_catalog_models.py`, `test_sources_models.py`, `test_evidence_review_models.py`, `test_migrations.py`) y `backend/tests/projects/test_models.py`.

## Resultado

**148 columnas comparadas, 147 coinciden, 1 diferencia.**

| Diferencia | Diccionario | Base de datos | Propuesta |
|---|---|---|---|
| `catalog_column_interpretation.created_at` | La tabla lista solo `updated_at` (indicación de la convención) | `created_at timestamptz not null` (hereda de `TimeStampedModel`, T012) | **EC-027 (propuesto):** decidir por CD si el diccionario añade `created_at` a la interpretación (recomendado: no cuesta nada y sigue la convención común) o si el modelo lo quita con una migración. No se cambia aquí (07-delegacion, regla 12). |

## Detalle por tabla

### `projects_project`

| Columna | Diccionario | Base de datos | Coincide |
|---|---|---|---|
| `id` | uuid, no nulo | uuid, no nulo | ✅ |
| `owner_id` | uuid, no nulo | uuid, no nulo | ✅ |
| `organization_id` | uuid, nulo | uuid, nulo | ✅ |
| `name` | varchar(120), no nulo | varchar(120), no nulo | ✅ |
| `description` | text, no nulo | text, no nulo | ✅ |
| `source_dialect` | varchar(20), no nulo | varchar(20), no nulo | ✅ |
| `archived_at` | timestamptz, nulo | timestamptz, nulo | ✅ |
| `last_activity_at` | timestamptz, no nulo | timestamptz, no nulo | ✅ |
| `created_at` | timestamptz, no nulo | timestamptz, no nulo | ✅ |
| `updated_at` | timestamptz, no nulo | timestamptz, no nulo | ✅ |

### `sources_source`

| Columna | Diccionario | Base de datos | Coincide |
|---|---|---|---|
| `id` | uuid, no nulo | uuid, no nulo | ✅ |
| `project_id` | uuid, no nulo | uuid, no nulo | ✅ |
| `kind` | varchar(20), no nulo | varchar(20), no nulo | ✅ |
| `status` | varchar(12), no nulo | varchar(12), no nulo | ✅ |
| `original_filename` | varchar(255), no nulo | varchar(255), no nulo | ✅ |
| `storage_path` | varchar(500), nulo | varchar(500), nulo | ✅ |
| `size_bytes` | bigint, no nulo | bigint, no nulo | ✅ |
| `sha256` | char(64), no nulo | char(64), no nulo | ✅ |
| `dialect` | varchar(20), nulo | varchar(20), nulo | ✅ |
| `target_table_id` | uuid, nulo | uuid, nulo | ✅ |
| `encoding` | varchar(20), nulo | varchar(20), nulo | ✅ |
| `delimiter` | varchar(4), nulo | varchar(4), nulo | ✅ |
| `stats` | jsonb, no nulo | jsonb, no nulo | ✅ |
| `error_message` | text, nulo | text, nulo | ✅ |
| `evidence_count` | integer, no nulo | integer, no nulo | ✅ |
| `uploaded_by_id` | uuid, no nulo | uuid, no nulo | ✅ |
| `processed_at` | timestamptz, nulo | timestamptz, nulo | ✅ |
| `created_at` | timestamptz, no nulo | timestamptz, no nulo | ✅ |
| `updated_at` | timestamptz, no nulo | timestamptz, no nulo | ✅ |

### `sources_naming_rule`

| Columna | Diccionario | Base de datos | Coincide |
|---|---|---|---|
| `id` | uuid, no nulo | uuid, no nulo | ✅ |
| `project_id` | uuid, nulo | uuid, nulo | ✅ |
| `pattern` | varchar(60), no nulo | varchar(60), no nulo | ✅ |
| `match_type` | varchar(10), no nulo | varchar(10), no nulo | ✅ |
| `meaning` | varchar(120), no nulo | varchar(120), no nulo | ✅ |
| `semantic_type` | varchar(30), nulo | varchar(30), nulo | ✅ |
| `weight` | numeric(3,2), no nulo | numeric(3,2), no nulo | ✅ |
| `is_active` | boolean, no nulo | boolean, no nulo | ✅ |
| `created_by_id` | uuid, nulo | uuid, nulo | ✅ |
| `created_at` | timestamptz, no nulo | timestamptz, no nulo | ✅ |
| `updated_at` | timestamptz, no nulo | timestamptz, no nulo | ✅ |

### `catalog_table`

| Columna | Diccionario | Base de datos | Coincide |
|---|---|---|---|
| `id` | uuid, no nulo | uuid, no nulo | ✅ |
| `project_id` | uuid, no nulo | uuid, no nulo | ✅ |
| `schema_name` | varchar(128), no nulo | varchar(128), no nulo | ✅ |
| `name` | varchar(128), no nulo | varchar(128), no nulo | ✅ |
| `business_name` | varchar(200), nulo | varchar(200), nulo | ✅ |
| `row_count` | bigint, nulo | bigint, nulo | ✅ |
| `column_count` | integer, no nulo | integer, no nulo | ✅ |
| `has_declared_fks` | boolean, no nulo | boolean, no nulo | ✅ |
| `first_source_id` | uuid, nulo | uuid, nulo | ✅ |
| `created_at` | timestamptz, no nulo | timestamptz, no nulo | ✅ |
| `updated_at` | timestamptz, no nulo | timestamptz, no nulo | ✅ |

### `catalog_column`

| Columna | Diccionario | Base de datos | Coincide |
|---|---|---|---|
| `id` | uuid, no nulo | uuid, no nulo | ✅ |
| `project_id` | uuid, no nulo | uuid, no nulo | ✅ |
| `table_id` | uuid, no nulo | uuid, no nulo | ✅ |
| `name` | varchar(128), no nulo | varchar(128), no nulo | ✅ |
| `name_normalized` | varchar(128), no nulo | varchar(128), no nulo | ✅ |
| `ordinal` | integer, no nulo | integer, no nulo | ✅ |
| `data_type` | varchar(60), no nulo | varchar(60), no nulo | ✅ |
| `data_type_normalized` | varchar(60), no nulo | varchar(60), no nulo | ✅ |
| `type_length` | integer, nulo | integer, nulo | ✅ |
| `type_precision` | integer, nulo | integer, nulo | ✅ |
| `type_scale` | integer, nulo | integer, nulo | ✅ |
| `is_nullable` | boolean, no nulo | boolean, no nulo | ✅ |
| `is_primary_key` | boolean, no nulo | boolean, no nulo | ✅ |
| `is_unique` | boolean, no nulo | boolean, no nulo | ✅ |
| `declared_fk_target` | varchar(260), nulo | varchar(260), nulo | ✅ |
| `default_expression` | varchar(200), nulo | varchar(200), nulo | ✅ |
| `is_pii` | boolean, no nulo | boolean, no nulo | ✅ |
| `created_at` | timestamptz, no nulo | timestamptz, no nulo | ✅ |
| `updated_at` | timestamptz, no nulo | timestamptz, no nulo | ✅ |

### `catalog_column_interpretation`

| Columna | Diccionario | Base de datos | Coincide |
|---|---|---|---|
| `id` | uuid, no nulo | uuid, no nulo | ✅ |
| `column_id` | uuid, no nulo | uuid, no nulo | ✅ |
| `project_id` | uuid, no nulo | uuid, no nulo | ✅ |
| `business_name` | varchar(200), nulo | varchar(200), nulo | ✅ |
| `description` | text, no nulo | text, no nulo | ✅ |
| `semantic_type` | varchar(30), nulo | varchar(30), nulo | ✅ |
| `references_column_id` | uuid, nulo | uuid, nulo | ✅ |
| `level` | varchar(20), no nulo | varchar(20), no nulo | ✅ |
| `score` | numeric(4,3), nulo | numeric(4,3), nulo | ✅ |
| `score_breakdown` | jsonb, no nulo | jsonb, no nulo | ✅ |
| `origin` | varchar(12), no nulo | varchar(12), no nulo | ✅ |
| `confirmed_by_action_id` | uuid, nulo | uuid, nulo | ✅ |
| `confirmed_by_id` | uuid, nulo | uuid, nulo | ✅ |
| `confirmed_at` | timestamptz, nulo | timestamptz, nulo | ✅ |
| `has_open_conflict` | boolean, no nulo | boolean, no nulo | ✅ |
| `impact` | integer, no nulo | integer, no nulo | ✅ |
| `engine_version` | varchar(20), no nulo | varchar(20), no nulo | ✅ |
| `computed_at` | timestamptz, no nulo | timestamptz, no nulo | ✅ |
| `updated_at` | timestamptz, no nulo | timestamptz, no nulo | ✅ |
| `created_at` | — (no está en el diccionario) | timestamptz | ❌ |

### `catalog_column_profile`

| Columna | Diccionario | Base de datos | Coincide |
|---|---|---|---|
| `id` | uuid, no nulo | uuid, no nulo | ✅ |
| `column_id` | uuid, no nulo | uuid, no nulo | ✅ |
| `source_id` | uuid, no nulo | uuid, no nulo | ✅ |
| `row_count` | bigint, no nulo | bigint, no nulo | ✅ |
| `null_count` | bigint, no nulo | bigint, no nulo | ✅ |
| `null_ratio` | numeric(6,5), no nulo | numeric(6,5), no nulo | ✅ |
| `distinct_count` | bigint, no nulo | bigint, no nulo | ✅ |
| `min_value` | varchar(200), nulo | varchar(200), nulo | ✅ |
| `max_value` | varchar(200), nulo | varchar(200), nulo | ✅ |
| `top_values` | jsonb, no nulo | jsonb, no nulo | ✅ |
| `histogram` | jsonb, nulo | jsonb, nulo | ✅ |
| `detected_pattern` | varchar(30), nulo | varchar(30), nulo | ✅ |
| `out_of_catalog_count` | bigint, nulo | bigint, nulo | ✅ |
| `stats` | jsonb, no nulo | jsonb, no nulo | ✅ |
| `computed_at` | timestamptz, no nulo | timestamptz, no nulo | ✅ |
| `created_at` | timestamptz, no nulo (convención) | timestamptz, no nulo | ✅ |
| `updated_at` | timestamptz, no nulo (convención) | timestamptz, no nulo | ✅ |

### `evidence_evidence`

| Columna | Diccionario | Base de datos | Coincide |
|---|---|---|---|
| `id` | uuid, no nulo | uuid, no nulo | ✅ |
| `project_id` | uuid, no nulo | uuid, no nulo | ✅ |
| `column_id` | uuid, no nulo | uuid, no nulo | ✅ |
| `source_id` | uuid, nulo | uuid, nulo | ✅ |
| `naming_rule_id` | uuid, nulo | uuid, nulo | ✅ |
| `review_action_id` | uuid, nulo | uuid, nulo | ✅ |
| `kind` | varchar(30), no nulo | varchar(30), no nulo | ✅ |
| `independence_class` | varchar(15), no nulo | varchar(15), no nulo | ✅ |
| `claim_field` | varchar(20), no nulo | varchar(20), no nulo | ✅ |
| `claim_value` | varchar(260), nulo | varchar(260), nulo | ✅ |
| `polarity` | smallint, no nulo | smallint, no nulo | ✅ |
| `weight` | numeric(3,2), no nulo | numeric(3,2), no nulo | ✅ |
| `strength` | numeric(4,3), no nulo | numeric(4,3), no nulo | ✅ |
| `citation` | jsonb, no nulo | jsonb, no nulo | ✅ |
| `format_version` | smallint, no nulo | smallint, no nulo | ✅ |
| `created_at` | timestamptz, no nulo | timestamptz, no nulo | ✅ |

### `evidence_conflict`

| Columna | Diccionario | Base de datos | Coincide |
|---|---|---|---|
| `id` | uuid, no nulo | uuid, no nulo | ✅ |
| `project_id` | uuid, no nulo | uuid, no nulo | ✅ |
| `column_id` | uuid, no nulo | uuid, no nulo | ✅ |
| `claim_field` | varchar(20), no nulo | varchar(20), no nulo | ✅ |
| `values` | jsonb, no nulo | jsonb, no nulo | ✅ |
| `status` | varchar(10), no nulo | varchar(10), no nulo | ✅ |
| `resolution` | varchar(20), nulo | varchar(20), nulo | ✅ |
| `resolution_note` | text, nulo | text, nulo | ✅ |
| `resolved_by_id` | uuid, nulo | uuid, nulo | ✅ |
| `detected_at` | timestamptz, no nulo | timestamptz, no nulo | ✅ |
| `resolved_at` | timestamptz, nulo | timestamptz, nulo | ✅ |
| `created_at` | timestamptz, no nulo (convención) | timestamptz, no nulo | ✅ |
| `updated_at` | timestamptz, no nulo (convención) | timestamptz, no nulo | ✅ |

### `review_review_action`

| Columna | Diccionario | Base de datos | Coincide |
|---|---|---|---|
| `id` | uuid, no nulo | uuid, no nulo | ✅ |
| `project_id` | uuid, no nulo | uuid, no nulo | ✅ |
| `column_id` | uuid, no nulo | uuid, no nulo | ✅ |
| `actor_id` | uuid, no nulo | uuid, no nulo | ✅ |
| `action` | varchar(12), no nulo | varchar(12), no nulo | ✅ |
| `reason` | text, nulo | text, nulo | ✅ |
| `before` | jsonb, no nulo | jsonb, no nulo | ✅ |
| `after` | jsonb, no nulo | jsonb, no nulo | ✅ |
| `propagated_count` | integer, no nulo | integer, no nulo | ✅ |
| `reverted_count` | integer, no nulo | integer, no nulo | ✅ |
| `engine_version` | varchar(20), no nulo | varchar(20), no nulo | ✅ |
| `created_at` | timestamptz, no nulo | timestamptz, no nulo | ✅ |
