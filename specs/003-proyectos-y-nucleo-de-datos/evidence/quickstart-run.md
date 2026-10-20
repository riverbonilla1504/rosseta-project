# Ejecución del quickstart de la feature 003 (T065, ROS-178)

**Fecha:** 2026-10-19 · **Rama:** `003-proyectos-y-nucleo-de-datos` · **Entorno:** Windows 11, Docker (`db`, `redis`), proveedor de identidad **simulado** de las E2E (`.claude/launch.json`: `mock-idp` :4010, `backend-mock` :8001, `frontend-mock` :3100), datos sintéticos.

## 1. Suites completas (salida real)

| Comando | Resultado |
|---|---|
| `cd backend && python -m uv run ruff check .` | **1 error**, anterior a esta sesión: `I001` en `tests/security/test_logging_redaction.py:69` (ya fallaba en `ca95c45`; no se arregla de paso, se propone en el CD de cierre) |
| `cd backend && python -m uv run ruff format --check .` | 111 files already formatted |
| `cd backend && python -m uv run mypy .` | Success: no issues found in 111 source files |
| `cd backend && python -m uv run pytest --cov` | 309 passed; cobertura total **97,33 %** (mínimo 85 %) |
| `cd backend && python -m uv run python manage.py spectacular --fail-on-warn --validate` | sin avisos ni errores (EC-025 resuelto en T062) |
| `cd backend && python -m uv run python manage.py makemigrations --check --dry-run` | No changes detected |
| `cd frontend && pnpm lint` | sin errores |
| `cd frontend && pnpm typecheck` | sin errores |
| `cd frontend && pnpm test:coverage` | 25 archivos, 219 passed; líneas **89,88 %** (mínimo 80 %) |
| `cd frontend && E2E_UV="python -m uv run" pnpm exec playwright test` | **51 passed, 3 failed** (6,3 min): `security.spec.ts:49` (FR-030, una credencial aparece en almacenamiento/respuestas/direcciones), `smoke-idp.spec.ts:13` y `:45` (FR-027/FR-028, `waitForURL` 60 s). Son E2E de la 002; **sin investigar** (se cortó la sesión). Todas las E2E de la 003 y del onboarding pasan |

## 2. Migraciones desde cero y siembra (SC-007)

No se ejecutó `migrate projects zero` sobre la base de desarrollo: borraría los proyectos de la persona. Lo cubren pruebas sobre una base nueva:

- `backend/tests/core_data/test_migrations.py`: `migrate` desde cero sin errores y sin migraciones pendientes.
- `backend/tests/projects/test_seed.py`: la siembra crea `CORE_DEMO` con `MOV0010` (11 columnas y niveles de 03-datos-de-referencia §2), reejecutarla no duplica, dos ejecuciones dan el mismo catálogo y un fallo a mitad no deja nada.
- `frontend/tests/e2e/project-reopen.spec.ts` ejecuta `seed_reference_project --owner-sub …` contra la base de desarrollo.

## 3. Escenarios Q1–Q12

| # | Escenario | Resultado | Cómo |
|---|---|---|---|
| Q1 | Cuenta nueva: acceso → onboarding → crear "CORE_PRD" con "SQL Server" | ✅ (simulado) | `e2e/onboarding.spec.ts` (E2E-01) y a mano en el navegador del entorno simulado ("CORE_VISUAL", V4 de la 002) |
| Q2 | En `/projects`, crear "Ventas" con "Oracle" | ✅ | `e2e/projects-navigation.spec.ts` |
| Q3 | "core_prd" con otro activo "CORE_PRD" | ✅ | `api/test_projects_create.py`, `unit/project-form.test.tsx`; al renombrar, `unit/archive-controls.test.tsx` |
| Q4 | Nombre vacío, solo espacios, 121 caracteres, sin dialecto; doble clic | ✅ | `unit/project-form.test.tsx`, `projects/test_services.py`, `api/test_projects_create.py` (dos peticiones simultáneas) |
| Q5 | Abrir `CORE_DEMO`, cerrar sesión y reabrir en otro navegador | ✅ | `e2e/project-reopen.spec.ts`, `api/test_project_state.py` |
| Q6 | Cambiar de `CORE_DEMO` a "Ventas" con la red lenta | ✅ | `e2e/projects-navigation.spec.ts` (SC-004) |
| Q7 | Archivar "Ventas" estando dentro | ✅ | `e2e/projects-archive.spec.ts` |
| Q8 | Abrir "Ventas" archivado; intentar renombrarlo | ✅ | `e2e/projects-archive.spec.ts` (sin controles; `PATCH` → 409) |
| Q9 | Otro "Ventas" activo y desarchivar el antiguo | ✅ | `e2e/projects-archive.spec.ts` |
| Q10 | Cuenta B en `/p/<id de A>` y `/state` | ✅ | `e2e/cross-access.spec.ts`, `security/test_cross_access.py`, `security/test_ownership.py` (evento `access_denied` sin datos personales) |
| Q11 | Registros y direcciones de Q1–Q10 sin datos sensibles | ✅ | `security/test_no_sensitive_data.py` (SC-005) |
| Q12 | Teclado y axe en `/projects`, formulario y selector | ✅ | `e2e/projects-a11y.spec.ts` (SC-008) |

**Pendiente de la persona:** repetir Q1, Q5 y Q10 con el tenant de desarrollo de Auth0 y proveedores reales (el quickstart pide el entorno de la 002); aquí se usó el proveedor simulado.
