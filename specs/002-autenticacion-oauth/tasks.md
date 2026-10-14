---

description: "Lista de tareas de la feature 002-autenticacion-oauth"
---

# Tasks: Inicio de sesión con Google y Microsoft

**Input**: documentos de diseño en `specs/002-autenticacion-oauth/` — [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Historias Jira**: ROS-89 · ROS-90 · ROS-91 · ROS-92 · ROS-93 · **Subtareas**: ROS-180…ROS-190 (56 h)

**Prerrequisitos**: `spec.md` y `plan.md` (hechos); `/speckit-analyze` sin hallazgos CRITICAL antes de implementar. Los ítems de [checklists/acceso.md](checklists/acceso.md) siguen sin marcar: `/speckit-implement` los lee como compuerta y los pedirá.

**Pruebas**: **obligatorias** (Constitución II; la plantilla de Spec Kit las marca opcionales, la nuestra no).

## Formato: `[ID] [P?] [Story?] [ROS-n] Descripción con ruta`

- **[P]**: se puede hacer en paralelo (archivos distintos, sin dependencia de tareas incompletas).
- **[US1…US6]**: historia de usuario de la spec; solo en las fases de historia.
- **[ROS-n]**: la **subtarea de Jira** que implementa la tarea ([04-sincronizacion.md §6](../../docs/00-metodologia/04-sincronizacion.md)). Las actividades de cada subtarea en [03-tareas-mvp.md](../../docs/02-requisitos/03-tareas-mvp.md) son el mínimo; aquí se detallan, nunca se recortan.
- **⛔ BLOQUEADA**: no se empieza hasta que se cierre la decisión indicada.

## Reglas que aplican a TODAS las tareas de prueba

1. **Prueba roja primero.** Se ejecuta y se **ve fallar**; se commitea como `test(<ámbito>): ROS-n <descripción> (roja)` **antes** del commit con el código. Una prueba que nunca falló no cuenta como evidencia.
2. **Marcadores de trazabilidad.** Python: `@pytest.mark.story("ROS-n")` y `@pytest.mark.fr("002:FR-###")`. TypeScript: el título empieza por `[ROS-n][002:FR-###]`. La historia es la del FR en la spec (por ejemplo FR-029 → ROS-93).
3. **Datos sintéticos** (`@example.test`, claves RSA generadas en la prueba); nunca datos ni cuentas reales (RNF-38).
4. **PostgreSQL real** en las pruebas de integración; sin red hacia el tenant real (el cliente JWKS se sustituye).
5. **Ámbitos de commit:** `accounts` (backend y lógica de acceso del frontend), `ui` (pantallas), `infra` (dependencias, CI, tenant).
6. **Nada de valores `[PENDIENTE]` inventados:** DP-022 (14/30 días), DP-024 (opción A) y DP-025 (textos propuestos) se usan con su valor por defecto y se marcan `// PROVISIONAL (DP-0xx)`.

## Convenciones de ruta

Aplicación web, estructura de [plan.md](plan.md): `backend/` (Django) y `frontend/` (Next.js). Pruebas del backend en `backend/tests/`, del frontend en `frontend/tests/unit/` y `frontend/tests/e2e/`.

---

## Fase 1: Preparación

**Propósito**: dependencias, entorno, tenant y esqueleto de E2E. Nada de lógica de la feature.

- [X] T001 [ROS-182] **Propagar a Jira** lo que cambiaron CD-006 y CD-007 (requiere el OK de la persona; sin él Jira contradice `docs/`): título de ROS-90 ("Google y Microsoft"); actividades de ROS-181 (`/login?returnTo=`), ROS-182 (logout `/login` y `/auth/error`, Microsoft solo personal), ROS-184 (ruta `/auth/denied`), ROS-186 (sin paso de DDL) y ROS-188 (`/login?returnTo=`); actualizar el bloque "Fuente de verdad" y comentar `Sincronizado por CD-006/CD-007`. **Debe terminar antes de empezar la Fase 2.**
  - *Hecho 2026-10-13 con el OK de la persona, ampliado a CD-008 (ROS-183 y ROS-185): ROS-90 (título y texto), ROS-181…186 y ROS-188 actualizadas desde `docs/03-tareas-mvp.md`, bloque "Fuente de verdad" y comentario `Sincronizado por CD-00N — commit <sha>` en cada una.*
- [ ] T002 [P] [ROS-182] **Tenant de desarrollo** (acción manual en el panel o con el MCP de Auth0 solo contra desarrollo): añadir `/auth/error` a las URLs de cierre de sesión permitidas y verificar C1…C8, C10, C11 y C14 de [quickstart.md §3](quickstart.md); crear `specs/002-autenticacion-oauth/evidence/tenant-config-dev.md` con la tabla de C1…C16 en el formato de [quickstart.md §3](quickstart.md) (Resultado ✅/❌/N/A, Fecha y Revisó) y el resultado de cada fila. Confirmar además que la Acción post-login `rosetta-claims-post-login` cumple [auth-flow.md §7](contracts/auth-flow.md) (deniega `email_not_verified` y `email_missing`; claims `https://rosetta/email`, `/name`, `/picture` y `/email_verified`, este último porque el backend lo exige como defensa en profundidad, FR-004) y corregirla si no. La Acción vive solo en el tenant (no está versionada en el repositorio; ver [DP-026](../../docs/07-registro/02-decisiones-pendientes.md#dp-026)). **Comprobar con una cuenta personal real de Microsoft y otra de Google** que el access token trae `https://rosetta/email_verified = true`; si Microsoft no lo entrega, parar y registrarlo, porque bloquearía FR-004 en T016 y en la Acción.
  - *2026-10-13: la hace la persona (el MCP de Auth0 no conectó y la prueba con cuentas reales no la puede hacer un agente). Plantilla creada en `evidence/tenant-config-dev.md`, filas pendientes.*
- [ ] T003 [P] [ROS-182] Actualizar `.env.example` (comentadas y solo para pruebas: `AUTH0_ISSUER`, `AUTH0_JWKS_URL`) y `frontend/.env.example` (`E2E_ALLOW_INSECURE_IDP`), sin valores ni secretos, con la referencia a [auth-flow.md §8](contracts/auth-flow.md).
- [ ] T004 [P] [ROS-181] Añadir `pyjwt[crypto]` a `backend/pyproject.toml` y regenerar `backend/uv.lock` (`uv sync`); comprobar que `uv run pytest` sigue verde.
- [ ] T005 [P] [ROS-183] Subir `react` y `react-dom` en `frontend/package.json` a la versión **≥ 19.1.2** (hoy `19.1.0`, incompatible con el SDK, [research V4](research.md)); `pnpm install` y comprobar `pnpm test`, `pnpm typecheck` y `pnpm build`.
- [ ] T006 [ROS-183] Añadir `@auth0/nextjs-auth0` **4.31** a `frontend/package.json` y `pnpm-lock.yaml` (tras T005; mismo archivo).
- [ ] T007 [ROS-184] Añadir las dependencias de desarrollo `@playwright/test`, `@axe-core/playwright` y `oauth2-mock-server` (9.x) a `frontend/package.json`; crear `frontend/playwright.config.ts` que levanta el proveedor simulado, el backend (con `AUTH0_ISSUER` y `AUTH0_JWKS_URL` hacia el mock) y el frontend (con `E2E_ALLOW_INSECURE_IDP=1`); crear `frontend/tests/e2e/`; subir `engines.node` a `>=22.12` (lo exige `oauth2-mock-server`) (tras T006; mismo archivo).
- [ ] T008 [P] [ROS-184] Añadir el objetivo `e2e` a `Makefile` (`cd frontend && pnpm exec playwright test`), como lista `08-infraestructura §3`.
- [ ] T009 [P] [ROS-184] Añadir el job `e2e` a `.github/workflows/ci.yml` (servicios `postgres:16` y `redis:7`, instalar navegadores de Playwright, `make e2e`); debe fallar el PR si falla un flujo o hay una violación seria de accesibilidad.

---

## Fase 2: Base (bloquea todas las historias)

**Propósito**: modelo de usuario, validación de la credencial, alta de la cuenta, SDK de Auth0, middleware, proxy BFF y el proveedor simulado.

**⚠️ CRÍTICO**: ninguna historia empieza hasta cerrar esta fase.

### Backend: modelo, errores y validación de la credencial

- [ ] T010 [P] [ROS-180] **Prueba roja** `backend/tests/accounts/test_user_model.py` (crear también `backend/tests/accounts/__init__.py`): crear un usuario identificado por `auth0_sub`; `auth0_sub` único y `lower(email)` único (`Ana@x.test` choca con `ana@x.test`); contraseña siempre inutilizable; no existe el campo `last_login`; restricciones del [data-model.md](data-model.md) citadas literalmente: `auth0_sub` texto ≤ 255 no nulo, `email` texto ≤ 254 no nulo, `full_name` texto ≤ 200 no nulo, `avatar_url` texto ≤ 500 nulo, `is_active` por defecto `true`, `is_staff` por defecto `false`, `onboarding_completed_at` y `last_login_at` nulos, `id` UUID. Marcadores: ROS-89 · FR-005, FR-006, FR-008.
- [ ] T011 [P] [ROS-180] Crear la fábrica `backend/tests/factories/accounts.py` (`UserFactory` con `factory_boy`: `auth0_sub`, `email` y `full_name` sintéticos con dominio `example.test`).
- [ ] T012 [ROS-180] Crear la app `backend/apps/accounts/` (`__init__.py`, `apps.py`, `models.py`): `User` sobre `AbstractBaseUser` con `USERNAME_FIELD = "auth0_sub"`, `last_login = None`, manager sin `create_superuser`, campos y restricciones de [data-model.md](data-model.md), `UniqueConstraint(Lower("email"))` y `Meta.db_table = "accounts_user"`; registrar `apps.accounts` y `AUTH_USER_MODEL = "accounts.User"` en `backend/config/settings/base.py` (**sin** `django.contrib.auth`, `admin`, `sessions` ni `messages`, [research R-04](research.md#r-04--modelo-de-usuario)); generar `migrations/0001_initial.py` **antes** de cualquier otra migración. Listo cuando T010 pasa, `migrate` corre limpio en una base nueva y `makemigrations --check` no detecta cambios. Si la creación de un usuario falla sin `django.contrib.auth`, instalar solo esa app y anotarlo en `research.md`.
- [ ] T013 [P] [ROS-181] **Prueba roja** ampliar `backend/tests/test_exceptions.py`: una excepción con código propio (por ejemplo 403 `account_disabled`) conserva ese código y no lo reemplaza por `forbidden`; sin código propio, 401 sigue siendo `session_expired` y 403 `forbidden`. Marcadores: ROS-89 · FR-013.
- [ ] T014 [ROS-181] Implementar en `backend/apps/core/exceptions.py` que el código propio de la excepción tenga prioridad sobre el mapeo por estado HTTP ([hallazgo del esqueleto, plan.md](plan.md)); crear `backend/apps/accounts/exceptions.py` con `AccountDisabled`, `AccountExistsOtherProvider`, `EmailMissing` y `EmailNotVerified` (403, códigos `account_disabled`, `account_exists_other_provider`, `email_missing`, `email_not_verified`; `// PROVISIONAL (DP-025)`). Los mensajes en español van en `backend/apps/accounts/messages.py` (regla B8 de `03-backend`), con las propuestas de DP-025 marcadas como provisionales.
- [ ] T015 [P] [ROS-185] **Prueba roja** `backend/tests/accounts/test_services.py` para `get_or_create_from_claims()`: (a) alta con onboarding pendiente y contraseña inutilizable; (b) reconocimiento del mismo `sub` sin duplicar; (c) actualiza nombre y avatar solo si cambiaron; (d) **acceso simultáneo** de la misma identidad produce una sola fila (recuperación tras `IntegrityError`); (e) `sub` nuevo con un correo ya existente (otra capitalización incluida) → `AccountExistsOtherProvider` y no crea nada; (f) `sub` conocido cuyo correo nuevo choca con otro usuario → deja entrar, **conserva el correo anterior** y emite el evento de seguridad `email_conflict` sin datos personales; (g) cuenta desactivada → `AccountDisabled` en cada llamada (sin caché); (h) alta sin claim de correo → `EmailMissing`; (i) `last_login_at` se actualiza como máximo una vez por hora; (j) nombre truncado a 200 y `avatar_url` > 500 caracteres o no `http(s)` → `None`; (k) claim `https://rosetta/email_verified` ausente o distinto de `true` → `EmailNotVerified`, sin crear ni actualizar nada (FR-004); (l) alta **sin claim de nombre** mientras DP-023 siga abierta → falla cerrado con 403 genérico `forbidden`, sin crear nada y sin error 500 (comportamiento mínimo y seguro, no una decisión; T037 lo sustituye); (m) cada rechazo de (e), (g), (h) y (k) emite un evento de seguridad por `rosetta.security` con solo `event`, `reason`, `user_id` (si existe) y `path`, sin correo ni nombre (FR-033). Marcadores: ROS-90/91 · FR-005, FR-006, FR-007, FR-008, FR-004, FR-009, FR-010, FR-011, FR-017; ROS-93 · FR-033.
- [ ] T016 [ROS-185] Implementar `backend/apps/accounts/services.py`: `get_or_create_from_claims(claims)` según [research R-03](research.md#r-03--qué-hace-la-autenticación-con-el-usuario) (transacción, `select`/`create` por `auth0_sub`, recuperación ante `IntegrityError`, orden de comprobaciones (empezando por `email_verified`, FR-004), evento de seguridad por el registrador `rosetta.security` con campos cerrados `event`, `reason`, `user_id`, `path`). Si falta el claim del nombre, falla cerrado con `PermissionDenied` (403 `forbidden`) y no crea nada, hasta que se decida DP-023 (T037). Docstring con las reglas que implementa (`Implementa FR-005 (ROS-90)…`).
- [ ] T017 [P] [ROS-181] **Prueba roja** `backend/tests/security/test_jwks_refresh_limit.py`: `kid` conocido no toca la red; `kid` aleatorios repetidos generan **como máximo una** recarga forzada del JWKS por 60 s; tras ese plazo se permite otra; una clave rotada se obtiene con una sola recarga. Marcadores: ROS-93 · FR-029.
- [ ] T018 [ROS-181] Implementar `backend/apps/accounts/jwks.py` (cliente JWKS por proceso con caché de 1 h y límite de una recarga forzada por 60 s; `kid` obligatorio y acotado).
- [ ] T019 [P] [ROS-181] **Prueba roja** `backend/tests/security/test_auth_tokens.py` con claves RSA generadas en la prueba y una vista protegida definida en el propio módulo de pruebas (con `authentication_classes` y `permission_classes` explícitos): token válido; ausente; vencido; `aud` incorrecto; `iss` incorrecto; firma alterada; `alg: none`; `alg: HS256` firmado con la clave pública (confusión de algoritmo); `kid` desconocido; sin `kid`; sin `sub` o sin `exp`; token válido **sin** el claim `https://rosetta/email_verified` o con él distinto de `true` → 403 `email_not_verified`. Todos los rechazos: 401 `session_expired`, cabecera `WWW-Authenticate: Bearer`, formato de error estándar y **ningún dato interno**. Cuenta desactivada con credencial válida → 403 `account_disabled` en la petición siguiente. Marcadores: ROS-93 · FR-029, FR-004 (criterio SC-004); ROS-89 · FR-011, FR-013.
- [ ] T020 [ROS-181] Implementar `backend/apps/accounts/authentication.py` (`Auth0JWTAuthentication`: `jwt.decode` con `algorithms=["RS256"]`, `audience`, `issuer`, claims obligatorios y `leeway` de 10 s; usa T018 y T016) y, en `backend/config/settings/base.py`, `DEFAULT_AUTHENTICATION_CLASSES` y los ajustes `AUTH0_DOMAIN`, `AUTH0_AUDIENCE`, `AUTH0_ISSUER`, `AUTH0_JWKS_URL` (por defecto derivados del dominio) y el prefijo de claims `https://rosetta/`; corregir el comentario obsoleto de ADR-0006. **No** cambiar todavía el permiso por defecto (eso es T046 en US2).

### Frontend: SDK, middleware, proxy y proveedor simulado

- [ ] T021 [P] [ROS-183] **Prueba roja** `frontend/tests/unit/auth0-config.test.ts`: `session.rolling` activo, `inactivityDuration` = 1 209 600 s y `absoluteDuration` = 2 592 000 s (`// PROVISIONAL (DP-022)`); `scope` = `openid profile email offline_access` y `audience` = `AUTH0_AUDIENCE`; cookie `sameSite: "lax"` y `secure` activo salvo desarrollo local; `transactionCookie.maxAge` = 600; `allowInsecureRequests` solo con `E2E_ALLOW_INSECURE_IDP=1` y **nunca** con `NODE_ENV=production`. Marcadores: ROS-92 · FR-024; ROS-93 · FR-027, FR-030.
- [ ] T022 [ROS-183] Implementar `frontend/src/lib/auth0.ts` (`Auth0Client` con lo anterior, `signInReturnToPath: "/"`, rutas del SDK sin personalizar). El hook `onCallback` llega en T081.
- [ ] T023 [P] [ROS-181] **Prueba roja** `frontend/tests/unit/safe-return-to.test.ts`: solo se aceptan rutas internas; se descartan URLs externas, `//otro.example`, `javascript:`, barras invertidas, `..` y codificaciones que escapen; vacío o inválido → destino por defecto. Marcadores: ROS-93 · FR-015.
- [ ] T024 [ROS-181] Implementar `frontend/src/features/auth/safeReturnTo.ts`.
- [ ] T025 [P] [ROS-183] **Prueba roja** `frontend/tests/unit/middleware.test.ts`: el middleware delega primero en el del SDK (monta `/auth/*`); la respuesta del SDK conserva sus cabeceras y recibe la CSP; el nonce es distinto en cada petición; `script-src 'self' 'nonce-…' 'strict-dynamic'` sin `unsafe-inline`; `'unsafe-eval'` solo en desarrollo; el resto de directivas de [07-seguridad §5](../../docs/03-arquitectura/07-seguridad-y-autenticacion.md); `matcher` excluye estáticos. Marcadores: ROS-93 · FR-034.
- [ ] T026 [ROS-183] Implementar `frontend/src/middleware.ts` (monta `/auth/login`, `/auth/logout`, `/auth/callback` con el middleware del SDK; sin reglas de acceso todavía).
- [ ] T027 [ROS-190] Añadir a `frontend/src/middleware.ts` la generación del nonce y la cabecera `Content-Security-Policy` (misma tarea de archivo que T026; tras T026).
- [ ] T028 [P] [ROS-183] **Prueba roja** reescribir `frontend/tests/unit/next-config.test.ts`: **no** existen `rewrites` de `/api` ni `/auth` (D6); `poweredByHeader` falso; `headers()` incluye `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` y `Strict-Transport-Security` **solo** en producción. Marcadores: ROS-93 · FR-034.
- [ ] T029 [ROS-183] Implementar en `frontend/next.config.ts`: eliminar `backendRewrites` y los `rewrites` (ROS-183 pide quitar el de `/auth`; el de `/api` saltaría el proxy) y añadir `headers()`.
- [ ] T030 [P] [ROS-188] **Prueba roja** `frontend/tests/unit/api-proxy.test.ts` con todo lo de [bff-proxy.md](contracts/bff-proxy.md): añade `Authorization: Bearer` y no lo devuelve; descarta `cookie` y `authorization` entrantes y `set-cookie` saliente; lista cerrada de cabeceras en ambos sentidos; orden de comprobaciones método → ruta → origen → sesión; rechaza `..`, segmentos vacíos y barras codificadas (400); mutación con `Origin` ajeno o sin `Origin` ni `Sec-Fetch-Site: same-origin` → 403 `forbidden_origin` **sin** pedir credencial; `/api/health` y `/api/schema/` pasan sin credencial; sin sesión → 401 `session_expired`; el servicio de identidad no responde → 503 `identity_unavailable` sin tocar la sesión; backend caído → 502 `backend_unavailable`; cuerpo en *streaming*; `Cache-Control: no-store` por defecto. Marcadores: ROS-92 · FR-022, FR-026, FR-030; ROS-93 · FR-031; ROS-89 · FR-012, FR-013.
- [ ] T031 [ROS-188] Implementar `frontend/src/app/api/[...path]/route.ts` (runtime Node, siempre dinámico; `GET`, `POST`, `PATCH`, `PUT`, `DELETE`; usa `auth0.getAccessToken()` de T022). Registro por petición solo con método, ruta sin cadena de consulta, estado, duración y `request_id`.
- [ ] T032 [ROS-184] **Prueba de humo del proveedor simulado** (riesgos R-A y R-B de [research.md](research.md)): crear `frontend/tests/e2e/support/mock-idp.ts` (arranque y control de `oauth2-mock-server`: claims con espacio de nombres, TTL del access token configurable, simulación de cancelación y de denegación mediante sus enganches de redirección, fin de sesión que **valida `returnTo` contra la lista blanca `/login` y `/auth/error`** como lo haría el tenant) y `frontend/tests/e2e/smoke-idp.spec.ts`: ida y vuelta completa del SDK contra el mock (inicio, *callback*, cookie `__session`, cierre de sesión) con `allowInsecureRequests`. **Anotar en `research.md` (sección Riesgos) qué se observó**: si el SDK acepta `domain` con `http://localhost:…` (si no, usar TLS autofirmado con `NODE_EXTRA_CA_CERTS`) y cómo llegan los errores a `onCallback`; ajustar la correspondencia de [auth-flow.md §5](contracts/auth-flow.md) si difiere. Depende de T006, T007, T022 y T026.

**Punto de control**: la base está lista. El E2E contra el proveedor simulado funciona; modelo, servicio de alta y validación de credenciales probados.

---

## Fase 3: Historia 1 — Iniciar sesión con Google o Microsoft (Prioridad: P1) 🎯 MVP

**Meta**: una persona entra con Google o Microsoft, se crea su cuenta la primera vez y se la reconoce después, con nombre, correo y avatar del proveedor. (ROS-90, ROS-89)

**Prueba independiente**: con el proveedor simulado, entrar por cada botón, salir y volver a entrar, y comprobar una sola cuenta con los datos del proveedor ([quickstart V1 a V3](quickstart.md)).

### Pruebas (rojas primero)

- [ ] T033 [P] [US1] [ROS-185] **Prueba roja** `backend/tests/api/test_me.py`: `GET /api/me` devuelve exactamente `id`, `email`, `full_name`, `avatar_url` (nulo si no hay) y `onboarding_completed` según [accounts-api.yaml](contracts/accounts-api.yaml); el primer acceso crea la cuenta con `onboarding_completed = false`; el segundo devuelve el mismo `id`; nombre y avatar actualizados se reflejan; sin credencial → 401; **dos personas, A y B: cada una ve solo su cuenta** (nunca la del otro). Marcadores: ROS-90 · FR-005, FR-007; ROS-89 · FR-016.
- [ ] T034 [P] [US1] [ROS-184] **Prueba roja** `frontend/tests/unit/login-page.test.tsx`: exactamente dos acciones ("Continuar con Google", "Continuar con Microsoft"); sin campo de contraseña ni de registro por correo; nota de privacidad presente; cada acción apunta a `/auth/login?connection=<conexión>&returnTo=<ruta>`; un `returnTo` externo se descarta (usa `safeReturnTo`); al pulsar una acción se escribe la cookie `rosetta_login_provider` con `google` o `microsoft` ([auth-flow.md §4](contracts/auth-flow.md)); sin sesión no redirige. Marcadores: ROS-90 · FR-001, FR-002, FR-003; ROS-93 · FR-015; ROS-90 · FR-040.
- [ ] T035 [P] [US1] [ROS-186] **Prueba roja** `frontend/tests/unit/landing.test.tsx` (reemplaza a `frontend/tests/unit/home.test.tsx`, que prueba la página provisional): `/` con onboarding pendiente → `/onboarding`; completado → `/projects`; respuesta 403 `account_*` del backend → `/auth/denied?code=<código>`; 401 → `/login?returnTo=/`. Marcadores: ROS-89 · FR-014; ROS-91 · FR-018; ROS-90 · FR-009, FR-011.
- [ ] T036 [P] [US1] [ROS-184] **Prueba roja E2E** `frontend/tests/e2e/login.spec.ts` (con el proveedor simulado y el backend reales): Google y Microsoft crean la cuenta en el primer acceso; el reingreso conserva el mismo `id` (SC-002); dos accesos **simultáneos** de la misma identidad desde dos contextos producen una sola cuenta (FR-005); cambio de nombre, avatar o correo sin choque mantiene la cuenta (FR-006, FR-007); dos identidades con **correos distintos** son dos cuentas independientes. Marcadores: ROS-90 · FR-001, FR-005, FR-006, FR-007; ROS-91 · FR-005.
- [ ] T037 [US1] [ROS-185] ⛔ **BLOQUEADA por [DP-023](../../docs/07-registro/02-decisiones-pendientes.md#dp-023)** (proveedor sin nombre; no tiene valor por defecto): cuando se decida, escribir la prueba roja y el comportamiento en `backend/tests/accounts/test_services.py` y `backend/apps/accounts/services.py`, y actualizar `data-model.md` y `contracts/auth-flow.md §6`. No se implementa ninguna alternativa por iniciativa propia.

### Implementación

- [ ] T038 [US1] [ROS-185] Implementar `backend/apps/accounts/serializers.py` (`MeSerializer`), `views.py` (`MeView`, con `permission_classes` explícito `IsAuthenticated`), `urls.py` y registrar `api/me` en `backend/config/urls.py`; documentar con `drf-spectacular`, incluida una extensión de autenticación (`OpenApiAuthenticationExtension`) para `Auth0JWTAuthentication` que declare el esquema `bearerAuth`, de forma que el esquema generado coincida con [accounts-api.yaml](contracts/accounts-api.yaml). T033 pasa.
- [ ] T039 [P] [US1] [ROS-184] Crear `frontend/src/features/auth/copy.ts` con los textos de acceso: los ya definidos en [04-contenido §5](../../docs/05-diseno/04-contenido-y-redaccion.md) y las **propuestas de [DP-025](../../docs/07-registro/02-decisiones-pendientes.md#dp-025)** (frase de valor, nota de privacidad, bienvenida), cada una marcada `// PROVISIONAL (DP-025)`; textos en español con tuteo neutro (DP-009), nunca dispersos en JSX.
- [ ] T040 [US1] [ROS-184] Implementar `frontend/src/features/auth/LoginButtons.tsx` (componente de cliente; conexiones `google-oauth2` y la conexión social de Microsoft; `returnTo` interno; al pulsar, escribe la cookie `rosetta_login_provider` del [auth-flow.md §4](contracts/auth-flow.md)) y `frontend/src/app/(public)/login/page.tsx` con Nocturne: solo `var(--token)`, sin colores ni tamaños literales; usar los componentes de `frontend/src/design-system/components/` si la feature 001 ya los entregó; foco visible y navegación por teclado (FR-040). T034 pasa.
- [ ] T041 [US1] [ROS-186] Implementar `frontend/src/features/auth/currentUser.ts` (componente de servidor: consulta `/api/me` con la credencial del SDK y traduce 401 y 403 `account_*`) y reemplazar la página provisional `frontend/src/app/page.tsx` por el resolutor de destino (onboarding pendiente → `/onboarding`, si no `/projects`); eliminar `frontend/src/app/page.module.css` y `frontend/tests/unit/home.test.tsx` si quedan sin uso. T035 pasa.
- [ ] T042 [US1] [ROS-184] Poner en verde `frontend/tests/e2e/login.spec.ts` (T036) y ejecutar a mano **V1 y V2 de [quickstart.md](quickstart.md)** con cuentas personales de prueba reales en el tenant de desarrollo; registrar el resultado en `specs/002-autenticacion-oauth/evidence/quickstart-run.md`.

**Punto de control**: US1 es funcional e independiente.

---

## Fase 4: Historia 2 — Acceso solo para personas autenticadas (Prioridad: P1)

**Meta**: ninguna pantalla ni operación funciona sin identidad válida, salvo la pantalla de acceso, la de error y las comprobaciones públicas. (ROS-89)

**Prueba independiente**: sin sesión, abrir cada pantalla privada y cada operación y comprobar la redirección o el 401 ([quickstart V5, S2 a S4](quickstart.md)).

> FR-011 y FR-013 ya están cubiertos por T015, T019 y T033; no se duplican aquí.

### Pruebas (rojas primero)

- [ ] T043 [P] [US2] [ROS-181] **Prueba roja** `backend/tests/security/test_route_inventory.py`: recorre el `URLconf`; **toda** ruta que no esté en la lista `PUBLIC_ROUTES` (`/api/health`, `/api/schema/` y, solo con `DEBUG`, `/api/docs/`) rechaza la petición anónima con 401 y formato estándar; incluye una vista de prueba **sin** permisos explícitos, que debe quedar protegida por defecto (roja mientras el permiso por defecto sea `AllowAny`). La lista `PUBLIC_ROUTES` queda definida y mantenida en ese archivo (SC-003). Marcadores: ROS-89 · FR-012.
- [ ] T044 [P] [US2] [ROS-181] **Prueba roja** `frontend/tests/unit/middleware-guard.test.ts`: sin sesión a una ruta privada → 302 a `/login?returnTo=<ruta pedida>`; con sesión a `/login` → `/`; `/login`, `/auth/*`, `/api/*` y estáticos pasan (las rutas `/api/*` aplican la regla del proxy, no redirigen); `returnTo` inseguro se descarta. Marcadores: ROS-89 · FR-012, FR-014; ROS-93 · FR-015.
- [ ] T045 [P] [US2] [ROS-181] **Prueba roja E2E** `frontend/tests/e2e/protected-routes.spec.ts`: enlace directo a una pantalla privada sin sesión → `/login?returnTo=…` y, tras entrar, regreso a esa pantalla (FR-014); `returnTo` externo ignorado → destino por defecto (FR-015); `GET /api/me` sin sesión → 401 (S2); `POST /api/me/onboarding/complete` con `Origin` ajeno → 403 (S4); `/api/health` sin sesión → responde (S3). Marcadores: ROS-89 · FR-012, FR-014; ROS-93 · FR-015, FR-031.

### Implementación

- [ ] T046 [US2] [ROS-181] En `backend/config/settings/base.py` fijar `DEFAULT_PERMISSION_CLASSES = ["rest_framework.permissions.IsAuthenticated"]` (denegar por defecto) y en `backend/config/urls.py` declarar `/api/schema/` público de forma **explícita** (`AllowAny`, sin autenticación); `HealthView` ya es público. T043 pasa.
- [ ] T047 [US2] [ROS-181] Añadir las reglas de acceso a `frontend/src/middleware.ts` (después de T027): redirección a `/login?returnTo=` sin sesión, `/login` → `/` con sesión, lista de rutas públicas (D1). T044 pasa.
- [ ] T048 [US2] [ROS-181] Poner en verde `frontend/tests/e2e/protected-routes.spec.ts` (T045).

**Punto de control**: US1 y US2 funcionan juntas y por separado.

---

## Fase 5: Historia 3 — Alta clara y primer proyecto (Prioridad: P1)

**Meta**: la persona nueva queda dada de alta y es guiada a crear su primer proyecto en un solo paso; no vuelve a ver el onboarding. (ROS-91)

**Prueba independiente**: con una persona nueva, completar acceso → onboarding → primer proyecto → lista de proyectos, y comprobar que no reaparece, también desde otro navegador ([quickstart V4](quickstart.md)).

> **Dependencia de la feature 003**: el paso del onboarding usa el formulario de creación de proyectos (ROS-173 y ROS-174, [DP-019](../../docs/07-registro/02-decisiones-pendientes.md#dp-019) para los dialectos). **No se duplica ese formulario.** Si al llegar a T055 no existe, se detiene la tarea y se registra en el resumen de la sesión.

### Pruebas (rojas primero)

- [ ] T049 [P] [US3] [ROS-185] **Prueba roja** `backend/tests/api/test_onboarding.py`: `POST /api/me/onboarding/complete` → 200 con `onboarding_completed = true`; **idempotente** (la segunda llamada no cambia `onboarding_completed_at`); `GET /api/me` lo refleja; 401 sin credencial; 403 `account_disabled` con cuenta desactivada; nunca vuelve a pendiente. Marcadores: ROS-91 · FR-017, FR-021.
- [ ] T050 [P] [US3] [ROS-186] **Prueba roja** `frontend/tests/unit/app-layout-guard.test.tsx`: onboarding pendiente → cualquier ruta privada redirige a `/onboarding`; completado y ruta `/onboarding` → `/projects`; el estado se consulta a la cuenta (`/api/me`), no al dispositivo. Marcadores: ROS-91 · FR-018, FR-021.
- [ ] T051 [P] [US3] [ROS-186] **Prueba roja** `frontend/tests/unit/onboarding.test.tsx`: bienvenida con el nombre; **un solo paso** y ningún paso de carga de DDL (FR-020); al crear el proyecto con éxito llama a `POST /api/me/onboarding/complete` y navega a `/projects`; si la creación falla no se completa; el formulario de proyecto se simula (`features/projects`, feature 003). Marcadores: ROS-91 · FR-017, FR-019, FR-020.
- [ ] T052 [P] [US3] [ROS-186] **Prueba roja E2E** `frontend/tests/e2e/onboarding.spec.ts`: primer acceso → onboarding con el nombre; abrir una ruta privada por enlace directo → onboarding; crear el proyecto (con `/api/projects` interceptado en el navegador **hasta que exista la feature 003**) → `/projects` y `/onboarding` ya no se muestra; abandonar a medias y volver a entrar desde otro contexto retoma el onboarding; completado desde otro navegador no lo vuelve a mostrar. Marcadores: ROS-91 · FR-017, FR-018, FR-019, FR-021 (criterio SC-001, solo en parte: el proyecto se simula hasta la feature 003).

### Implementación

- [ ] T053 [US3] [ROS-185] Implementar en `backend/apps/accounts/services.py` `complete_onboarding(user)` (escribe `onboarding_completed_at` solo si es nulo) y en `views.py`/`urls.py` `POST /api/me/onboarding/complete` (sin cuerpo; devuelve `Me`); coincidir con [accounts-api.yaml](contracts/accounts-api.yaml). T049 pasa.
- [ ] T054 [US3] [ROS-186] Crear `frontend/src/app/(app)/layout.tsx` (componente de servidor: guarda de onboarding con `currentUser.ts`) y `frontend/src/features/auth/LogoutLink.tsx` (enlace a **`/auth/logout?returnTo=/login`**, visible en toda pantalla privada; sin `returnTo` el SDK usa la raíz, que no está en la lista blanca de cierre de sesión, y el tenant rechazaría el cierre). Es un *layout* **compartido con las features 001 y 003**: si ya existe, se integra sin sobrescribir. T050 pasa.
- [ ] T055 [US3] [ROS-186] Crear `frontend/src/app/(app)/onboarding/page.tsx` y `frontend/src/features/onboarding/OnboardingFlow.tsx`: bienvenida con el nombre (texto provisional de DP-025 en `copy.ts`), un solo paso con el formulario de creación de proyecto de la feature 003 (nombre y dialecto) y llamada a `complete`. T051 pasa. **Depende de ROS-173/174.**
- [ ] T056 [US3] [ROS-186] Poner en verde `frontend/tests/e2e/onboarding.spec.ts` (T052) y ejecutar a mano **V4 de [quickstart.md](quickstart.md)**; registrar en `evidence/quickstart-run.md`.

**Punto de control**: US1, US2 y US3 funcionan de forma independiente.

---

## Fase 6: Historia 4 — Sesión que se mantiene y se cierra a tiempo (Prioridad: P1)

**Meta**: la sesión se renueva sola mientras la persona trabaja, caduca en los plazos definidos y se cierra al salir. (ROS-92)

**Prueba independiente**: simular el paso del tiempo (credencial vencida, sesión vencida) y cerrar sesión desde dos pestañas ([quickstart V6 a V8](quickstart.md)).

### Pruebas (rojas primero)

- [ ] T057 [P] [US4] [ROS-188] **Prueba roja** `frontend/tests/unit/api-client.test.ts`: ante 401 `session_expired` muestra exactamente "Tu sesión terminó. Vuelve a iniciar sesión para continuar." (mediante el parámetro `notice=session_expired` de `/login`) y navega a `/login?returnTo=<ruta actual>`; 503 `identity_unavailable` **no** cierra la sesión y permite reintentar; una operación interrumpida no se aplica a medias. Marcadores: ROS-92 · FR-026.
- [ ] T058 [P] [US4] [ROS-187] **Prueba roja E2E** `frontend/tests/e2e/session.spec.ts`: con el mock emitiendo access tokens de vida corta, una sesión de trabajo continua cruza **al menos tres** vencimientos sin pantalla de acceso (SC-006, FR-022, FR-023); borrar `__session` → mensaje de sesión vencida y, tras entrar, regreso a la pantalla anterior (FR-026); cerrar sesión → `/login`, con la petición de cierre llevando `returnTo=/login` y aceptada por la lista blanca del proveedor simulado; abrir una ruta privada → `/login`, `GET /api/me` → 401 (E2E-08, FR-025); la sesión del proveedor simulado **sigue abierta** tras el cierre (FR-025: no cierra la de Google ni la de Microsoft); cerrar sesión en una pestaña hace que la otra, en su siguiente acción, vaya al acceso. Marcadores: ROS-92 · FR-022, FR-023, FR-025, FR-026.
- [ ] T059 [P] [US4] [ROS-187] **Verificación del tenant** (manual, evidencia en `evidence/tenant-config-dev.md`): C5 (rotación y detección de reutilización del refresh token, 30 días máximo y 14 de inactividad) y C6 (access token de 900 s). La reutilización de un refresh token la hace cumplir el proveedor y no se automatiza; se deja constancia de la configuración. Marcadores de la evidencia: FR-023, FR-024.

### Implementación

- [ ] T060 [US4] [ROS-188] Implementar `frontend/src/lib/api/client.ts` (`apiFetch` mínimo: 401 → `/login?returnTo=<ruta actual>&notice=session_expired`; 503 → error recuperable). T057 pasa.
- [ ] T061 [US4] [ROS-187] Mostrar el aviso de sesión vencida en `frontend/src/app/(public)/login/page.tsx` cuando `notice=session_expired`, con el texto de `copy.ts` ya definido en `04-contenido §5` (el parámetro `notice` está en [auth-flow.md §1](contracts/auth-flow.md)). Tras T040.
- [ ] T062 [US4] [ROS-187] Poner en verde `frontend/tests/e2e/session.spec.ts` (T058) y ejecutar a mano **V6 a V8 de [quickstart.md](quickstart.md)**; registrar en `evidence/quickstart-run.md`.

**Punto de control**: las historias 1 a 4 funcionan de forma independiente.

---

## Fase 7: Historia 5 — El flujo de acceso resiste ataques comunes (Prioridad: P1)

**Meta**: comprobar que el flujo resiste los ataques comunes y que ningún secreto ni dato personal se filtra. (ROS-93)

**Prueba independiente**: ejecutar los casos maliciosos y recorrer un acceso completo inspeccionando navegador y registros ([quickstart §5](quickstart.md)).

### Pruebas (rojas primero)

- [ ] T063 [P] [US5] [ROS-190] **Prueba roja** `backend/tests/security/test_logging_redaction.py`: `RedactFilter` enmascara patrones de JWT y de correo en el mensaje, en los argumentos y en el texto de excepciones; un flujo autenticado completo con captura de registros no contiene ningún JWT ni correo (SC-008); los eventos de seguridad solo llevan `event`, `reason`, `user_id`, `path`. Marcadores: ROS-93 · FR-033.
- [ ] T064 [P] [US5] [ROS-190] **Prueba roja** `backend/tests/security/test_security_headers.py`: las respuestas JSON llevan `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` y la política de referencia; con la configuración de producción, HSTS ≥ 31 536 000 s. Marcadores: ROS-93 · FR-034.
- [ ] T065 [P] [US5] [ROS-189] **Prueba roja** ampliar `backend/tests/test_settings.py`: en producción `AUTH0_ISSUER` y `AUTH0_JWKS_URL` deben ser `https` (si no, la configuración falla al cargar); las sobreescrituras de prueba no se aceptan en producción; `DEBUG` sigue en `False`. Marcadores: ROS-93 · FR-029, FR-032.
- [ ] T066 [P] [US5] [ROS-189] **Prueba roja E2E** `frontend/tests/e2e/security.spec.ts`: la URL de `/auth/login` contiene `code_challenge`, `code_challenge_method=S256`, `state` y `audience`, y los scopes son exactamente `openid profile email offline_access` (S1, C10); una respuesta del proveedor con `state` que no corresponde se rechaza y no crea sesión; **ninguna** credencial de acceso ni de renovación aparece en el almacenamiento, en las respuestas ni en las direcciones del navegador (SC-005, S8); cabeceras de `/login` con CSP con nonce, `X-Frame-Options`, `nosniff` y `Referrer-Policy` (S5); un destino de cierre de sesión fuera de la lista blanca se rechaza. Marcadores: ROS-93 · FR-027, FR-028, FR-030, FR-034, FR-003 (criterios SC-004 y SC-005).
- [ ] T067 [P] [US5] [ROS-190] **Prueba roja** `frontend/tests/unit/proxy-logging.test.ts`: el proxy no registra cadena de consulta, cuerpos, cabeceras, cookies, credenciales, correos ni nombres (solo método, ruta, estado, duración y `request_id`). Marcadores: ROS-93 · FR-033.
- [ ] T068 [P] [US5] [ROS-189] **Prueba roja** `backend/tests/security/test_tenant_config_evidence.py`: lee `specs/002-autenticacion-oauth/evidence/tenant-config-dev.md` y falla si no existe, si falta alguna de las filas C1…C16, si alguna fila no tiene Resultado (✅, ❌ o N/A), Fecha (AAAA-MM-DD) y Revisó, o si alguna es ❌ (formato de [quickstart.md §3](quickstart.md)). **No sustituye** la revisión humana ni la verificación independiente: comprueba que la lista existe, está completa y sin fallos. Es roja hasta T074 (se espera en el historial del PR). Se ejecuta en el host o en CI: dentro del contenedor no encuentra `specs/`, que el compose no monta. Marcadores: ROS-93 · FR-035 (criterio SC-010).

### Implementación

- [ ] T069 [US5] [ROS-190] Implementar `backend/apps/accounts/logging.py` (`RedactFilter`) y registrarlo en todos los *handlers* de `LOGGING` de `backend/config/settings/base.py`, junto con el registrador `rosetta.security`. T063 pasa.
- [ ] T070 [US5] [ROS-190] Implementar `backend/apps/core/middleware.py` (CSP para respuestas JSON) y registrarlo en `MIDDLEWARE` de `backend/config/settings/base.py`. T064 pasa.
- [ ] T071 [US5] [ROS-189] En `backend/config/settings/base.py` y `prod.py`: aceptar `AUTH0_ISSUER` y `AUTH0_JWKS_URL` solo fuera de producción y exigir `https` en producción. T065 pasa.
- [ ] T072 [US5] [ROS-190] Ajustar `frontend/next.config.ts`, `frontend/src/middleware.ts` y el proxy si T066 o T067 siguen en rojo; poner en verde `frontend/tests/e2e/security.spec.ts`.
- [ ] T073 [US5] [ROS-190] Añadir al job `frontend` de `.github/workflows/ci.yml`, tras `pnpm build`, la comprobación de que ningún secreto llega al cliente: `grep -rE "AUTH0_(CLIENT_)?SECRET" frontend/.next/static` no encuentra nada; ejecutar `gitleaks detect --source . --no-banner` y verificar que `frontend/.env.local` y los archivos `.auth0-mcp-*` siguen ignorados por git (S10).
- [ ] T074 [US5] [ROS-189] **Lista de comprobación del tenant (FR-035)**: completar C1…C16 de [quickstart.md §3](quickstart.md) en `evidence/tenant-config-dev.md`; crear `evidence/tenant-config-prod.md` con las filas que dependen de producción (C9, C12, C13) marcadas pendientes (las completa T089) hasta que exista el tenant de producción ([DP-015](../../docs/07-registro/02-decisiones-pendientes.md#dp-015)); **anexar la lista al acta de verificación** de la feature. La prueba T068 pasa cuando `tenant-config-dev.md` está completo y sin fallos. Revisar el "checklist de seguridad" de ROS-190. Registrar el estado de las protecciones contra abuso (C15, CHK004).

**Punto de control**: las historias 1 a 5 funcionan y la configuración del tenant está verificada.

---

## Fase 8: Historia 6 — Fallos de acceso explicados (Prioridad: P2)

**Meta**: cuando el acceso falla, la persona sabe qué pasó y qué hacer; nunca ve una pantalla en blanco ni queda en un bucle. (ROS-90, mínimo exigido de ROS-100)

**Prueba independiente**: provocar cada fallo con el proveedor simulado y comprobar mensaje, salida y ausencia de bucle ([quickstart V9](quickstart.md)).

### Pruebas (rojas primero)

- [ ] T075 [P] [US6] [ROS-184] **Prueba roja** `frontend/tests/unit/auth-error-page.test.tsx`: un mensaje por código (`oauth_denied` con `{proveedor}`, `oauth_failed`, `email_not_verified`, `email_missing`, `account_exists_other_provider`, `account_disabled`) más el error genérico; un código desconocido se trata como `oauth_failed`; `{proveedor}` se completa con la cookie `rosetta_login_provider` y, sin ella o con un valor fuera de la lista cerrada, con la forma genérica (FR-036, DP-025); "Volver a intentar" lleva a `/login` conservando `returnTo` **solo** si es interno; lee la cookie `rosetta_auth_error` y la borra; siempre hay una salida. Marcadores: ROS-90 · FR-036, FR-037, FR-038, FR-039.
- [ ] T076 [P] [US6] [ROS-184] **Prueba roja** `frontend/tests/unit/auth-denied-route.test.ts`: acepta solo la lista cerrada de códigos de [auth-flow.md §5](contracts/auth-flow.md) (otro valor → `oauth_failed`); la cookie `rosetta_auth_error` es `HttpOnly`, `SameSite=Lax`, `Max-Age=60` y `Secure` en producción; responde 302 a `/auth/logout?returnTo=/auth/error`. Marcadores: ROS-90 · FR-009, FR-011, FR-039.
- [ ] T077 [P] [US6] [ROS-184] **Prueba roja** `frontend/tests/unit/auth0-oncallback.test.ts`: cancelación del usuario → `oauth_denied`; denegación de la Acción → `email_not_verified` o `email_missing`; cualquier otro error → `oauth_failed`; el éxito redirige a un `returnTo` seguro; un `returnTo` interno se conserva hacia `/auth/error`. Ajustar a lo observado en T032. Marcadores: ROS-90 · FR-036, FR-037; ROS-93 · FR-004.
- [ ] T078 [P] [US6] [ROS-184] **Prueba roja** `frontend/tests/unit/api-client-denied.test.ts`: ante 403 `account_disabled`, `account_exists_other_provider`, `email_missing` o `email_not_verified`, el cliente navega a `/auth/denied?code=<código>` y no reintenta en bucle. Marcadores: ROS-90 · FR-009, FR-011, FR-039.
- [ ] T079 [P] [US6] [ROS-184] **Prueba roja E2E** `frontend/tests/e2e/auth-errors.spec.ts`: cancelar el consentimiento; proveedor sin respuesta (mock detenido); correo ya registrado con otro proveedor (segunda identidad con el mismo correo → `/auth/denied` → cierre de sesión → `/auth/error`); correo no verificado; cuenta desactivada; error inesperado (mensaje genérico). En todos: mensaje con salida y **ningún bucle** (la cadena de redirecciones no supera 6 saltos, SC-007, aclarado el 2026-10-14) ni pantalla en blanco (SC-007). Marcadores: ROS-90 · FR-036, FR-037, FR-038, FR-039.

### Implementación

- [ ] T080 [US6] [ROS-184] Crear `frontend/src/features/auth/errorCodes.ts` (lista cerrada y correspondencia código → mensaje) y completar `frontend/src/features/auth/copy.ts` con los mensajes (los de `04-contenido §5` y las propuestas provisionales de DP-025).
- [ ] T081 [US6] [ROS-184] Añadir el hook `onCallback` a `frontend/src/lib/auth0.ts` (correspondencia de errores a códigos y redirección segura). T077 pasa.
- [ ] T082 [US6] [ROS-184] Implementar `frontend/src/app/(public)/auth/error/page.tsx` y `frontend/src/features/auth/AuthError.tsx`. T075 pasa.
- [ ] T083 [US6] [ROS-184] Implementar `frontend/src/app/auth/denied/route.ts`. T076 pasa.
- [ ] T084 [US6] [ROS-184] Ampliar `frontend/src/lib/api/client.ts` para navegar a `/auth/denied` ante 403 `account_*`. T078 pasa. Poner en verde `frontend/tests/e2e/auth-errors.spec.ts` (T079).
- [ ] T085 [US6] [ROS-184] ⛔ **BLOQUEADA por [DP-025](../../docs/07-registro/02-decisiones-pendientes.md#dp-025)**: cuando se aprueben los textos y los códigos, sustituir en `copy.ts` y `errorCodes.ts` los valores provisionales, actualizar `docs/05-diseno/04-contenido-y-redaccion.md` y `docs/03-arquitectura/05-api.md` por CD, y corregir las pruebas T034 y T075 a T079.

**Punto de control**: las seis historias son funcionales.

---

## Fase 9: Cierre y transversales

- [ ] T086 [P] [ROS-184] **E2E de accesibilidad** `frontend/tests/e2e/a11y.spec.ts`: axe sobre `/login`, `/auth/error` (con cada código) y `/onboarding` sin violaciones serias o críticas; recorrido completo solo con teclado con el orden del foco igual al orden visual; foco visible; los estados no dependen solo del color; los mensajes de error están en una región anunciada (`role="alert"` o `aria-live`) y al llegar a `/auth/error` el foco está en el mensaje (SC-009, RNF-24, RNF-27, FR-040). Marcadores: ROS-90 · FR-040; ROS-91 · FR-040.
- [ ] T087 [ROS-186] ⛔ **BLOQUEADA por la feature 003 (ROS-173/174)**: quitar la interceptación de `/api/projects` de `frontend/tests/e2e/onboarding.spec.ts` y completar el **E2E-01** real (cierra SC-001) (acceso → onboarding → proyecto creado).
- [ ] T088 [ROS-187] ⛔ **Condicional a [DP-022](../../docs/07-registro/02-decisiones-pendientes.md#dp-022) y [DP-024](../../docs/07-registro/02-decisiones-pendientes.md#dp-024)**: si cambian los plazos de sesión, actualizar `frontend/src/lib/auth0.ts`, su prueba T021, el tenant (C5) y `docs/` por CD; si DP-024 elige la opción B, reabrir [research R-04](research.md#r-04--modelo-de-usuario) (`django.contrib.auth`, `admin`, `sessions`, `messages`).
- [ ] T089 [ROS-182] ⛔ **BLOQUEADA por [DP-015](../../docs/07-registro/02-decisiones-pendientes.md#dp-015) y por la existencia del tenant de producción**: registrar aplicaciones propias en Google Cloud Console y en Microsoft Entra ID (audiencia de Microsoft limitada a **cuentas personales**) para staging y producción y cargar sus credenciales en las conexiones del tenant correspondiente (solo en el panel, nunca en el repositorio); completar C9, C12 y C13 en `specs/002-autenticacion-oauth/evidence/tenant-config-prod.md` según [quickstart.md §2, paso 7](quickstart.md). Es la actividad "registrar apps propias … para producción" de ROS-182, que ninguna otra tarea cubría.
- [ ] T090 [ROS-189] Ejecutar la suite completa y los umbrales con la salida real de cada comando: `make lint`, `cd backend && uv run pytest --cov` (≥ 85 %), `cd backend && uv run python manage.py makemigrations --check --dry-run`, `cd frontend && pnpm test:coverage` (≥ 80 %), `pnpm build`, `make e2e`. Pegar la salida en `evidence/quickstart-run.md`.
- [ ] T091 [ROS-189] Ejecutar los escenarios **V1 a V10** y las comprobaciones **S1 a S11** de [quickstart.md](quickstart.md) y registrar el resultado (con capturas donde aplique) en `specs/002-autenticacion-oauth/evidence/quickstart-run.md`.
- [ ] T092 [ROS-189] Comprobar la **trazabilidad**: cada FR-001…FR-040 tiene al menos una prueba con su marcador `002:FR-###` (o una evidencia manual enlazada, solo para la parte de reutilización del refresh token de FR-023); guardar la tabla FR → prueba en `specs/002-autenticacion-oauth/evidence/fr-coverage.md`. Todo FR sin prueba es un hallazgo, no se cierra la feature.
- [ ] T093 [ROS-189] Proponer el **CD de cierre**: actualizar la matriz de trazabilidad (`docs/06-calidad/03-matriz-de-trazabilidad.md`: columnas FR y Pruebas, estado 🟦/🟩), el registro de sincronización y los textos definitivos de DP-025; propagar a Jira los comentarios de cierre con la evidencia. Requiere el OK de la persona.
- [ ] T094 [ROS-189] Ejecutar `/speckit-converge` hasta **Converged** (cada ciclo `implement → converge`); la verificación independiente (`/verificar` o un chat nuevo con el prompt de [07-delegacion-a-ia.md §3.2](../../docs/00-metodologia/07-delegacion-a-ia.md)) la hace **otro** agente y deja el acta en el PR con la lista de configuración anexa.

---

## Dependencias y orden de ejecución

### Dependencias entre fases

- **Fase 1 (Preparación)**: sin dependencias. T001 debe terminar antes de la Fase 2; T002 a T009 se pueden hacer en paralelo, salvo T005 → T006 → T007 (mismo `package.json`).
- **Fase 2 (Base)**: depende de la Fase 1 y **bloquea todas las historias**. Orden interno: `T010/T011 → T012 → (T013 → T014) y ((T014 y T015) → T016) y (T017 → T018) → T019 → T020` en el backend; `T021 → T022`, `T023 → T024`, `T025 → T026 → T027`, `T028 → T029`, `T030 → T031` en el frontend; **T032 es el último** (depende de T006, T007, T022, T026).
- **Fases de historia (3 a 8)**: dependen de la Fase 2.
  - **US1** no depende de otras historias (MVP).
  - **US2** se apoya en el middleware y en el permiso por defecto, sin depender de US1 para sus pruebas.
  - **US3** usa `/api/me` y `currentUser.ts` de US1 (T041); el *layout* de `(app)` lo crea T054; depende además de la **feature 003** (formulario de proyecto).
  - **US4** usa la pantalla de acceso de US1 (T061) y el proxy de la Fase 2.
  - **US5** es transversal: verifica lo construido en US1 a US4; T063 a T068 se pueden empezar tras la Fase 2.
  - **US6** usa `lib/auth0.ts` (T081), `client.ts` de US4 (T084) y el proveedor simulado.
- **Fase 9 (Cierre)**: depende de las historias que se vayan a entregar.

### Dentro de cada historia

- Pruebas rojas **antes** del código y vistas fallar (commit `test(...) (roja)`); modelos → servicios → vistas/pantallas → integración.
- Una tarea que modifica el mismo archivo que otra **no** es `[P]` con ella.

### Oportunidades de paralelismo

- Fase 1: T002, T003, T004, T005, T008 y T009 a la vez.
- Fase 2: las pruebas rojas T010, T011, T013, T015, T017, T019, T021, T023, T025, T028 y T030 son archivos distintos y se pueden escribir en paralelo; backend y frontend avanzan sin tocarse.
- Cada historia: todas sus pruebas `[P]` a la vez (por ejemplo US1: T033, T034, T035 y T036).
- Con dos personas: una toma el backend (T010 a T020, T033, T038, T049, T053, T063 a T065, T068 a T071) y otra el frontend (T021 a T032, T034 a T036, T040 a T042…).

### Ejemplo de paralelismo (US1)

```text
# Pruebas rojas de US1, todas a la vez:
T033 backend/tests/api/test_me.py
T034 frontend/tests/unit/login-page.test.tsx
T035 frontend/tests/unit/landing.test.tsx
T036 frontend/tests/e2e/login.spec.ts
```

---

## Estrategia de implementación

### MVP primero (la historia 1)

1. Fase 1 y Fase 2 completas, con el **punto de control** de T032.
2. Fase 3 (US1): una persona entra con Google o Microsoft y queda con una cuenta.
3. **Parar y validar** US1 con V1 a V3 de [quickstart.md](quickstart.md).
4. Seguir con US2 y US4 (seguridad básica y sesión), US3 (cuando la feature 003 entregue el formulario), US5 y US6.

### Entrega incremental

Cada historia suma valor sin romper las anteriores: US1 (entrar) → US2 (proteger) → US4 (sesión) → US3 (onboarding) → US5 (verificar la seguridad) → US6 (fallos).

### Capacidad

Las subtareas suman 56 h y el Sprint 1 está sobrecargado ([EC-009](../../docs/07-registro/01-errores-conocidos.md#ec-009), aceptado): dentro del sprint, 002 se prioriza junto a 003. Los puntos que dependen de otras features o de decisiones están marcados ⛔.

---

## Mapa tarea → subtarea Jira

| Subtarea | Tareas |
|---|---|
| ROS-180 | T010 a T012 |
| ROS-181 | T004, T013, T014, T017 a T020, T023, T024, T043 a T048 |
| ROS-182 | T001 a T003, T089 |
| ROS-183 | T005, T006, T021, T022, T025, T026, T028, T029 |
| ROS-184 | T007 a T009, T032, T034, T036, T039, T040, T042, T075 a T086 |
| ROS-185 | T015, T016, T033, T037, T038, T049, T053 |
| ROS-186 | T035, T041, T050 a T052, T054 a T056, T087 |
| ROS-187 | T058, T059, T061, T062, T088 |
| ROS-188 | T030, T031, T057, T060 |
| ROS-189 | T065, T066, T068, T071, T074, T090 a T094 (cierre y verificación: ninguna subtarea de Jira es propia del cierre, se asocian a la de verificación) |
| ROS-190 | T027, T063, T064, T067, T069, T070, T072, T073 |

## Notas

- `[P]` = archivos distintos y sin dependencias. `[Story]` enlaza cada tarea con su historia para la trazabilidad.
- Cada historia debe poder completarse y probarse por sí sola.
- Commit por tarea o grupo lógico, **sin** `Co-Authored-By` ni atribución a IA; la persona del repositorio es la única autora.
- Los tres puntos que hay que decidir antes de cerrar la feature: **DP-023** (T037), **DP-025** (T085) y la feature **003** (T055, T087).
- **Cierre de la feature:** `converge` no llega a "Converged" con tareas ⛔ pendientes. DP-023 (T037) y DP-025 (T085) deben decidirse durante el Sprint; T088 (condicional a DP-022 y DP-024) y T089 (DP-015) se proponen como subtareas de seguimiento por CD si siguen bloqueadas al cierre, y mientras tanto ROS-182 no puede pasar a *Listo* sin T089.
- Evitar: tareas vagas, conflictos de archivo y dependencias entre historias que rompan su independencia.
