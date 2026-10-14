# Ejecución del quickstart y de la suite · feature 002

**Formato**: escenarios de [quickstart.md §4 y §5](../quickstart.md). Los automáticos se ejecutan con el proveedor simulado; los manuales (V1, V2 y los que lo indiquen) los hace **la persona** con sus cuentas personales de prueba en el tenant de desarrollo. Nunca se pegan aquí tokens, correos reales ni secretos.

## Automáticos (E2E con el proveedor simulado)

| Fecha | Comando | Resultado |
|---|---|---|
| 2026-10-14 | `E2E_UV="python -m uv run" pnpm exec playwright test` (desde `frontend/`) | 8 passed (27.2 s): `smoke-idp.spec.ts` (2) y `login.spec.ts` (6) |
| 2026-10-14 | ídem, tras US2 y US4 | 17 passed (59.9 s): además `protected-routes.spec.ts` (5) y `session.spec.ts` (4). La prueba de renovación se vio fallar con la renovación rechazada (mutación temporal: `Expected: 200, Received: 401`) |

## Suite completa y umbrales (T090, 2026-10-14)

Sin `make` en Windows: se ejecutan los comandos equivalentes de `Makefile` (`lint`, `test`, `e2e`).

| Comando | Resultado |
|---|---|
| `cd backend && uv run ruff check . && uv run ruff format --check .` | All checks passed; 57 files already formatted |
| `cd backend && uv run mypy .` | Success: no issues found in 57 source files |
| `cd backend && uv run python manage.py makemigrations --check --dry-run` | No changes detected |
| `cd backend && uv run pytest --cov` | 97 passed, 16 failed (los 16 de `test_tenant_config_evidence.py`, roja a propósito hasta T074); cobertura 95,91 % (umbral 85 %) |
| `cd frontend && pnpm lint && pnpm format:check && pnpm typecheck` | Sin errores |
| `cd frontend && pnpm test:coverage` | 157 passed; líneas 86,23 % (umbral 80 %) |
| `cd frontend && pnpm build` | Compilado; avisos solo de `@auth0/nextjs-auth0` (`dpopUtils.js`, importación dinámica interna del SDK) |
| `cd frontend && pnpm exec playwright test` | 37 passed (1,5 min) |

## Manuales con proveedores reales

| # | Escenario | Resultado | Fecha | Revisó | Notas |
|---|---|---|---|---|---|
| V1 | Primer acceso con Google (cuenta personal de prueba) | pendiente | | | T042 |
| V2 | Acceso con Microsoft personal (otro correo) | pendiente | | | T042. Si Microsoft no entrega `email_verified`, la Acción v2 deniega el acceso (CHK040) |
| V6 | Renovación silenciosa (más de 15 min de trabajo) | pendiente | | | T062 |
| V7 | Sesión vencida: aviso y regreso | pendiente | | | T062 |
| V8 | Cierre de sesión | pendiente | | | T062 |
