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
| V1 | Primer acceso con Google (cuenta personal de prueba) | ✅ | 2026-10-14 | River Florez | Ejecutado por la persona con su cuenta personal; resultado informado en el chat. |
| V2 | Acceso con Microsoft personal (otro correo) | ✅ | 2026-10-14 | River Florez | Ejecutado por la persona con su cuenta personal; resultado informado en el chat. |
| V6 | Renovación silenciosa (más de 15 min de trabajo) | ✅ | 2026-10-14 | River Florez | Ejecutado por la persona con su cuenta personal; resultado informado en el chat. |
| V7 | Sesión vencida: aviso y regreso | ✅ | 2026-10-14 | River Florez | Ejecutado por la persona con su cuenta personal; resultado informado en el chat. |
| V8 | Cierre de sesión | ✅ | 2026-10-14 | River Florez | Ejecutado por la persona con su cuenta personal; resultado informado en el chat. |
| V3 | Reingreso sin duplicar | ✅ | 2026-10-14 | River Florez | Ejecutado por la persona; resultado informado en el chat |
| V5 | Ruta privada sin sesión | ✅ | 2026-10-14 | River Florez | Ídem |
| V9 | Fallos de acceso (cancelar el consentimiento) | ✅ | 2026-10-14 | River Florez | Ídem |
| V4 | Onboarding de un paso | ✅ (proveedor simulado) | 2026-10-19 | Agente implementador (T056) | Con el proveedor simulado (`.claude/launch.json`, :3100) e identidad sintética: crear "CORE_VISUAL" con "SQL Server" deja en `/projects` y reabrir `/onboarding` devuelve a `/projects`. También `frontend/tests/e2e/onboarding.spec.ts`. **Falta que la persona lo repita con un proveedor real.** |
| V10 | Flujo con PKCE y `state` | ✅ | 2026-10-14 | River Florez | URL de /authorize con `code_challenge_method=S256`, `state`, `audience` (también `security.spec.ts`) |
| S7 | Cookie `__session` HttpOnly y SameSite=Lax | ✅ | 2026-10-14 | River Florez | Ídem |
| S8 | Ninguna credencial en el navegador | ✅ | 2026-10-14 | River Florez | Ídem (también `security.spec.ts`) |
| S1–S6, S9–S11 | Comprobaciones automáticas | ✅ | 2026-10-14 | River Florez | Cubiertas por las suites (`security.spec.ts`, `protected-routes.spec.ts`, `tests/security/`) y revisadas por la persona |
