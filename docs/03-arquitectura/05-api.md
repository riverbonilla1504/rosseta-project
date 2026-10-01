# Contrato de la API (MVP)

> Contrato REST del MVP. **Fuente de verdad del contrato** hasta que exista el OpenAPI generado; desde entonces, el OpenAPI (`/api/schema/`) debe coincidir con este documento y CI compara ambos (RNF-34). Cada feature detalla su parte en `specs/NNN-*/contracts/`; si una spec necesita cambiar un endpoint, primero se cambia aquí (CD).

## 1. Convenciones generales

| Tema | Regla |
|---|---|
| Base | `/api/` (datos) y `/auth/` (sesión). El navegador llama al origen de Next.js, que reenvía al backend |
| Formato | JSON UTF-8; `snake_case` en campos; fechas ISO 8601 UTC (`2026-09-29T14:03:00Z`); números decimales como número (`0.91`) |
| Identificadores | UUID v4 en todas las rutas (RNF-04). Nunca IDs secuenciales |
| Autenticación | Django recibe `Authorization: Bearer <access token de Auth0>` desde el proxy BFF de Next.js. El navegador usa la cookie de sesión del SDK; las mutaciones solo se aceptan desde el mismo origen |
| Paginación | `?page=1&page_size=50` (máx. 200). Respuesta `{count, next, previous, results}` |
| Errores | `{ "error": { "code", "message", "details" } }` — ver [03-backend.md §6](03-backend.md) |
| Niveles | `CONFIRMED`, `HIGH_UNVALIDATED`, `INFERRED`, `HYPOTHESIS`, `UNKNOWN` |
| Aislamiento | Todo recurso de otro usuario responde **404** (no 403) |
| Versionado | Sin prefijo de versión en el MVP. Cambios incompatibles = CD + ADR |

## 2. Resumen de endpoints

| Método | Ruta | Descripción | Historia / tarea |
|---|---|---|---|
| GET | `/auth/login?connection=google-oauth2\|<microsoft>&returnTo=` | **SDK de Auth0 (Next.js).** Inicia el login con PKCE + `state` | ROS-90 / 183, 189 |
| GET | `/auth/callback` | **SDK de Auth0.** Recibe el código, crea la sesión cifrada, redirige | ROS-90 / 183 |
| GET | `/auth/logout` | **SDK de Auth0.** Cierra la sesión de Rosetta y la de Auth0 | ROS-92 / 187 |
| GET | `/auth/profile` | **SDK de Auth0.** Perfil de la sesión (para la UI) | ROS-89 / 183 |
| GET | `/api/me` | Usuario actual y estado de onboarding | ROS-89, 91 / 185 |
| POST | `/api/me/onboarding/complete` | Marca el onboarding como completado | ROS-91 / 185 |
| GET | `/api/projects` | Lista proyectos del usuario (`?archived=false`) | ROS-78 / 173 |
| POST | `/api/projects` | Crea proyecto | ROS-78 / 173 |
| GET | `/api/projects/{id}` | Detalle | ROS-78 / 173 |
| PATCH | `/api/projects/{id}` | Renombra, cambia descripción o archiva (`archived: true`) | ROS-78 / 173 |
| GET | `/api/projects/{id}/state` | Estado completo resumido al abrir | ROS-81 / 177 |
| GET | `/api/projects/{id}/sources` | Fuentes con estado y cobertura | ROS-22 / 128 |
| POST | `/api/projects/{id}/sources/schema` | Sube DDL (multipart) | ROS-16 / 121 |
| POST | `/api/projects/{id}/sources/sample` | Sube muestra CSV de una tabla (multipart) | ROS-17 / 124 |
| GET | `/api/sources/{id}` | Estado de procesamiento de una fuente | ROS-17 / 124 |
| DELETE | `/api/sources/{id}` | Elimina la fuente y su evidencia; recalcula | ROS-22 / 128 |
| GET | `/api/projects/{id}/naming-rules` | Reglas del proyecto + globales | ROS-21 / 127 |
| POST | `/api/projects/{id}/naming-rules` | Crea regla del proyecto | ROS-21 / 127 |
| PATCH | `/api/naming-rules/{id}` | Edita regla (solo del proyecto) | ROS-21 / 127 |
| DELETE | `/api/naming-rules/{id}` | Elimina regla (solo del proyecto) | ROS-21 / 127 |
| GET | `/api/projects/{id}/tables` | Tablas del catálogo con resumen de niveles | ROS-50 / 162 |
| GET | `/api/tables/{id}` | Detalle de tabla | ROS-50 / 162 |
| GET | `/api/tables/{id}/columns` | Columnas con significado, tipo, nivel, puntaje | ROS-50 / 162 |
| GET | `/api/columns/{id}` | Ficha completa para Revisión (evidencia, citas, perfil, conflictos, previsualización) | ROS-42 / 152 |
| GET | `/api/columns/{id}/score` | Puntaje y desglose por fuente; qué falta para subir de nivel | ROS-25 / 134 |
| GET | `/api/evidence/{id}/citation` | Resuelve una cita y devuelve su contexto | ROS-33 / 142 |
| GET | `/api/columns/{id}/propagation-preview` | Columnas que se confirmarían, sin escribir | ROS-44 / 155 |
| POST | `/api/columns/{id}/confirm` | Confirma (opcionalmente con significado editado) y propaga | ROS-46, 29 / 141, 158 |
| POST | `/api/columns/{id}/reject` | Rechaza con motivo obligatorio | ROS-46 / 158 |
| PATCH | `/api/columns/{id}` | Edita nombre de negocio / descripción sin confirmar | ROS-46 / 158 |
| GET | `/api/projects/{id}/queue` | Cola por impacto (`?level=&table=`) | ROS-36 / 145 |
| GET | `/api/projects/{id}/queue/next` | Siguiente ítem (`?after=<column_id>&direction=next\|prev`) | ROS-47 / 145 |
| GET | `/api/projects/{id}/conflicts` | Conflictos (`?status=OPEN`) | ROS-28 / 139 |
| POST | `/api/conflicts/{id}/resolve` | Marca conflicto como resuelto con nota | ROS-28 / 139 |
| GET | `/api/projects/{id}/coverage` | Distribución por nivel, global y por tabla | ROS-37 / 146 |
| GET | `/api/projects/{id}/findings/summary` | Hallazgos abiertos del MVP (conflictos + desconocidas) | ROS-40 / 150 |
| GET | `/api/schema/` | OpenAPI 3 | RNF-34 |
| GET | `/api/health` | Salud (sin autenticación): BD y Redis accesibles | Operación |

## 3. Detalle de los endpoints críticos

### 3.1 `POST /api/projects/{id}/sources/schema`

Multipart: `file` (`.sql`, `.ddl`, `.txt`; máx. `[PENDIENTE]` 20 MB — [DP-013](../07-registro/02-decisiones-pendientes.md)), `dialect` (`tsql` \| `oracle` \| `postgres` \| `mysql` \| `auto`, por defecto `auto`).

`202 Accepted`
```json
{
  "id": "5d0c…",
  "kind": "SCHEMA_DDL",
  "status": "PENDING",
  "original_filename": "core_prd.sql",
  "created_at": "2026-10-05T10:00:00Z"
}
```
Al terminar (`GET /api/sources/{id}` → `READY`), `stats` contiene `{ "tables": 918, "columns": 18442, "warnings": ["Línea 3120: tipo desconocido 'MONEY2', se guardó como texto"] }`.
Reimportar un archivo con el mismo `sha256` devuelve `200` con la fuente existente (RNF-19). Un DDL distinto del mismo proyecto hace *upsert* de tablas/columnas por nombre.

### 3.2 `POST /api/projects/{id}/sources/sample`

Multipart: `file` (`.csv`), `table_id` (UUID de una tabla ya importada), `delimiter` (opcional, autodetección), `encoding` (opcional, autodetección). Las columnas del CSV se asocian por **nombre de cabecera** (sin distinguir mayúsculas); las no encontradas se reportan en `warnings`. `202` como 3.1.

### 3.3 `GET /api/columns/{id}` — ficha de revisión

```json
{
  "id": "c1a…",
  "identifier": "MOV0010.CTANRO",
  "table": { "id": "t9…", "name": "MOV0010", "business_name": "Movimientos de cuenta" },
  "name": "CTANRO",
  "data_type": "decimal(9,0)",
  "nullable": false,
  "is_primary_key": false,
  "is_pii": false,
  "interpretation": {
    "business_name": "Número de cuenta",
    "description": "Cuenta afectada. Contención 0,998 con CTA0001.CTANRO; 812.400 huérfanos, todos anteriores a 2011.",
    "level": "HIGH_UNVALIDATED",
    "score": 0.90,
    "origin": "ENGINE",
    "confirmed_by": null,
    "confirmed_at": null,
    "engine_version": "1.0.0"
  },
  "evidence": [
    {
      "id": "e1…",
      "kind": "CONTAINMENT",
      "weight": 0.90,
      "strength": 0.998,
      "claim": { "field": "references", "value": "CTA0001.CTANRO" },
      "citation": {
        "source_id": "s2…",
        "source_kind": "DATA_SAMPLE",
        "locator": { "file": "mov0010_muestra.csv", "column": "CTANRO" },
        "excerpt": "99,8 % de 1.000.000 valores presentes en CTA0001.CTANRO"
      }
    },
    {
      "id": "e2…",
      "kind": "NAME_CONVENTION",
      "weight": 0.40,
      "strength": 1.0,
      "claim": { "field": "business_name", "value": "Número de cuenta" },
      "citation": {
        "source_id": null,
        "source_kind": "NAMING_RULES",
        "locator": { "rule_id": "r7…", "pattern": "CTA + NRO" },
        "excerpt": "CTA → cuenta · NRO → número"
      }
    }
  ],
  "profile": {
    "row_count": 1000000,
    "null_ratio": 0.0,
    "distinct_count": 48211,
    "min": "1000001",
    "max": "99875512",
    "top_values": [{ "value": "1204552", "count": 812 }],
    "detected_pattern": "CODE",
    "out_of_catalog_count": 812400,
    "source_id": "s2…"
  },
  "conflicts": [],
  "propagation_preview": { "count": 210, "sample": ["CTA0001.CTANRO", "MOV0020.CTANRO"] },
  "queue_position": 2,
  "impact": 210
}
```

### 3.4 `POST /api/columns/{id}/confirm`

Body (opcional, si se confirma con significado editado):
```json
{ "business_name": "Número de cuenta", "description": "Cuenta afectada por el movimiento." }
```
`200`
```json
{
  "column": { "id": "c1a…", "level": "CONFIRMED", "origin": "HUMAN" },
  "action_id": "a55…",
  "unlocked_count": 210,
  "unlocked_sample": ["CTA0001.CTANRO", "MOV0020.CTANRO"]
}
```
- `unlocked_count` debe ser **igual** al `count` de `propagation-preview` inmediatamente anterior (RN-13). Si la evidencia cambió entre ambas llamadas, el valor real manda y la UI muestra el real.
- `409` si la columna ya está `CONFIRMED`.

### 3.5 `POST /api/columns/{id}/reject`

```json
{ "reason": "USRALT no es el usuario de alta: el log muestra actualizaciones." }
```
`reason` obligatorio (mín. 5 caracteres). Efecto: el nivel baja según [06-motor-de-evidencia.md §6](06-motor-de-evidencia.md); si la columna estaba `CONFIRMED`, se revierten las propagaciones que salieron de esa confirmación. `200` con `{ column, action_id, reverted_count }`.

### 3.6 `GET /api/projects/{id}/queue`

```json
{
  "count": 14322,
  "next": "/api/projects/p1…/queue?page=2",
  "previous": null,
  "results": [
    { "column_id": "c0…", "identifier": "MOV0010.PGCOD", "data_type": "smallint", "nullable": false,
      "business_name_hint": "codigo entidad", "level": "HIGH_UNVALIDATED", "impact": 380, "has_open_conflict": false },
    { "column_id": "c1a…", "identifier": "MOV0010.CTANRO", "data_type": "decimal(9,0)", "nullable": false,
      "business_name_hint": "numero cuenta", "level": "HIGH_UNVALIDATED", "impact": 210, "has_open_conflict": false }
  ]
}
```
Excluye `CONFIRMED`. Orden: `impact` desc, luego `has_open_conflict` desc, luego `identifier` asc (desempate determinista).

### 3.7 `GET /api/projects/{id}/coverage`

```json
{
  "total_columns": 18442,
  "by_level": {
    "CONFIRMED": 4120, "HIGH_UNVALIDATED": 0, "INFERRED": 7980, "HYPOTHESIS": 2913, "UNKNOWN": 3429
  },
  "human_validations": 34,
  "columns_documented_by_validations": 3810,
  "by_table": [{ "table_id": "t9…", "name": "MOV0010", "total": 11, "by_level": { "CONFIRMED": 3, "HIGH_UNVALIDATED": 5, "INFERRED": 1, "HYPOTHESIS": 1, "UNKNOWN": 1 } }],
  "computed_at": "2026-10-05T10:14:00Z"
}
```
Invariante probado: `sum(by_level) == total_columns` (tarea ROS-146). Los números del ejemplo son los del prototipo; ver la inconsistencia de la barra en [EC-012](../07-registro/01-errores-conocidos.md).

### 3.8 Autenticación de la API

Toda ruta `/api/*` (salvo `/api/health` y `/api/schema/`) exige `Authorization: Bearer <access token>` emitido por el tenant de Auth0 para la audiencia `AUTH0_AUDIENCE`. Django valida firma RS256 (JWKS), `iss` = `https://<AUTH0_DOMAIN>/`, `aud`, `exp`. El primer request válido de un `sub` nuevo crea el usuario local (onboarding pendiente). Token ausente o inválido → `401 session_expired`.

## 4. Códigos de error de dominio

| `code` | HTTP | Significado |
|---|---|---|
| `not_found` | 404 | Recurso inexistente o ajeno |
| `validation_error` | 400 | Entrada inválida |
| `file_too_large` | 413 | Archivo supera el límite |
| `unsupported_file` | 400 | Extensión o formato no admitido |
| `unprocessable_ddl` | 422 | No se encontró ningún `CREATE TABLE` |
| `table_not_in_project` | 400 | `table_id` no pertenece al proyecto |
| `already_confirmed` | 409 | La columna ya está confirmada |
| `reason_required` | 400 | Rechazo sin motivo |
| `source_processing` | 409 | Operación no permitida mientras la fuente se procesa |
| `global_rule_readonly` | 403 | Intento de editar una regla global |
| `oauth_denied` | — | (redirección a `/auth/error?code=oauth_denied`) el usuario canceló |
| `oauth_failed` | — | (redirección) proveedor caído o respuesta inválida |
| `session_expired` | 401 | Sin token, token inválido o vencido y no renovable |
| `account_exists_other_provider` | — | (redirección) el correo ya existe con otro proveedor; vinculación en ROS-98 |
