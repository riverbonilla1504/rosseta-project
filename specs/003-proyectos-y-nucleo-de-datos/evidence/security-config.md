# Configuración de seguridad de la feature 003 (T044, ROS-179)

**Fecha:** 2026-10-19 · **Rama:** `003-proyectos-y-nucleo-de-datos` · **FR:** FR-016, FR-017, FR-019, FR-020 · **SC:** SC-001, SC-005

Este documento recoge lo que la feature 003 configura y comprueba para el aislamiento y la protección de los datos de proyectos. Lo que depende del proveedor de hosting (cifrado en reposo, llaves, revisión del entorno desplegado, SC-009) queda en T045, **bloqueada por [DP-015](../../../docs/07-registro/02-decisiones-pendientes.md#dp-015)**.

## 1. Transporte seguro (FR-020, RNF-01)

| Ajuste (`backend/config/settings/prod.py`) | Valor | Prueba |
|---|---|---|
| `SECURE_SSL_REDIRECT` | `True` | `tests/test_settings.py::test_prod_forces_https_and_permanent_hsts` |
| `SECURE_HSTS_SECONDS` | `31_536_000` (un año) | ídem |
| `SECURE_HSTS_INCLUDE_SUBDOMAINS` | `True` | ídem |
| `SECURE_PROXY_SSL_HEADER` | `("HTTP_X_FORWARDED_PROTO", "https")` | `tests/test_settings.py` (feature 002) |
| `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE` | `True` | ídem |

Coincide con [07-seguridad §5](../../../docs/03-arquitectura/07-seguridad-y-autenticacion.md) (`max-age=31536000; includeSubDomains`). Los valores ya estaban en `prod.py` desde la inicialización del proyecto: la prueba de T040 pasó a la primera y T043 no necesitó cambios. `HSTS preload` no se activa: `docs/` no lo pide.

En local (`config.settings.dev`) no se exige HTTPS (spec, *Assumptions*).

## 2. Identificadores en las direcciones (FR-016, FR-019)

- Todo recurso se identifica con un UUID v4 generado por la aplicación (`apps.core.models.UUIDModel`, RNF-04); ninguna ruta lleva nombres de proyectos, tablas, columnas ni datos personales.
- Los parámetros de ruta son siempre identificadores (`<str:project_id>`): `tests/security/test_no_sensitive_data.py::test_route_parameters_are_resource_ids`.
- Un recorrido completo pide solo rutas cuyos parámetros son UUID v4 y que no contienen ningún texto del proyecto: `test_every_route_identifies_resources_only_by_uuid`.
- En el frontend, las direcciones del proyecto son `/p/{uuid}` y sus pestañas (`review`, `catalog`, `sources`).

## 3. Registros sin datos sensibles (FR-017, FR-019)

- Los accesos denegados por pertenencia se registran por `rosetta.security` con los campos cerrados `event`, `reason`, `user_id`, `path` y `resource_id` (`apps.core.ownership.get_owned_or_404`; `tests/security/test_ownership.py`).
- Todo manejador de registros pasa por `accounts.logging.RedactFilter`, que enmascara JWT y correos (feature 002, `tests/security/test_logging_redaction.py`).
- Un recorrido completo (crear, listar, detalle, estado, renombrar, archivar, listar archivados y dos accesos denegados) no deja en los registros correos, nombres, credenciales ni nombres del proyecto, sus tablas, columnas o fuentes: `tests/security/test_no_sensitive_data.py::test_a_full_journey_leaves_no_sensitive_data_in_the_logs` (SC-005).

## 4. Aislamiento (FR-014, FR-015, FR-018)

- `for_user` en los QuerySets de los diez modelos de cliente (`tests/core_data/test_for_user.py`).
- Recurso ajeno, inexistente o con identificador inválido → el mismo `404 not_found` (`tests/security/test_ownership.py`).
- Suite de acceso cruzado generada desde el esquema OpenAPI con el registro `tests/security/cross_access_cases.py`: una operación con parámetro de ruta sin caso, o un caso sin operación, hace fallar la suite (`tests/security/test_cross_access.py`, SC-001).
- En la interfaz, el 404 de la API lleva a la misma pantalla de "no encontrado" (`frontend/src/app/(app)/p/not-found.tsx`; E2E-09 en `frontend/tests/e2e/cross-access.spec.ts`).

## 5. Propuesta para `docs/` (por CD, no aplicada)

- [07-seguridad §5](../../../docs/03-arquitectura/07-seguridad-y-autenticacion.md) no nombra `SECURE_SSL_REDIRECT`, aunque RNF-01 pide "HTTPS obligatorio". Se propone añadir la fila "`SECURE_SSL_REDIRECT` · activo en prod" en el CD de cierre de la feature (T066).

## 6. Pendiente (T045, ⛔ DP-015)

Cifrado en reposo del proveedor (base de datos y almacenamiento de objetos), gestión y rotación de llaves y la revisión de configuración del entorno desplegado (SC-009).
