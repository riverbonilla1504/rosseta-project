# Implementation Plan: Inicio de sesión con Google y Microsoft

**Historias Jira**: ROS-89 · ROS-90 · ROS-91 · ROS-92 · ROS-93 · Subtareas ROS-180…ROS-190 (56 h) · Épica E14

**Branch**: `002-autenticacion-oauth` | **Date**: 2026-10-01 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-autenticacion-oauth/spec.md`

## Summary

La autenticación se delega en **Auth0** ([ADR-0007](../../docs/03-arquitectura/adr/ADR-0007-autenticacion-auth0.md)). El SDK de Auth0 para Next.js hace el flujo OIDC con PKCE y `state` y guarda la sesión en una cookie cifrada `HttpOnly`. Un *route handler* del servidor de Next.js actúa de proxy (BFF): obtiene el access token, lo añade como `Bearer` y reenvía a Django, de modo que **el navegador nunca ve credenciales**. Django valida el token (RS256, JWKS en caché, emisor, audiencia, vigencia) con PyJWT y mantiene el usuario local `accounts.User`: lo crea en el primer acceso, lo reconoce en los siguientes y marca el onboarding. Las tres pantallas nuevas (acceso, error de acceso, onboarding de un solo paso) usan Nocturne.

Cubre los 40 FR y los 10 criterios de éxito de la spec. Las decisiones y lo que se verificó contra las fuentes están en [research.md](research.md); el esquema en [data-model.md](data-model.md); los contratos en [contracts/](contracts/); la validación de punta a punta en [quickstart.md](quickstart.md).

## Technical Context

**Language/Version**: Python 3.12 con Django 5.2 LTS y Django REST Framework (backend); TypeScript 5 estricto con Next.js 15.5 (App Router) y React 19 (frontend). Sin cambios de versión mayor.

**Primary Dependencies**: ya presentes: DRF, drf-spectacular, django-environ, psycopg, Celery/Redis (no se usan en esta feature), Next.js, React. **Nuevas** (justificación en [research R-14](research.md#r-14--dependencias-nuevas-y-subida-de-react)): backend `pyjwt[crypto]`; frontend `@auth0/nextjs-auth0` 4.31; React y React DOM ≥ 19.1.2 (parche exigido por el SDK; hoy 19.1.0); de desarrollo `@playwright/test`, `@axe-core/playwright` y `oauth2-mock-server`.

**Storage**: PostgreSQL 16. Una tabla nueva, `accounts_user` ([data-model.md](data-model.md)). La sesión no se guarda en Rosetta.

**Testing**: pytest + pytest-django con PostgreSQL real, factory-boy y claves RSA generadas en la prueba; Vitest + Testing Library; Playwright con `@axe-core/playwright` y un proveedor OIDC simulado. Marcadores de trazabilidad obligatorios (`@pytest.mark.story` y `@pytest.mark.fr`; `[ROS-n][002:FR-###]` en TypeScript).

**Target Platform**: navegadores de escritorio modernos y tablet (RNF-29); servidor Linux en contenedores (docker-compose en desarrollo).

**Project Type**: aplicación web (`backend/` + `frontend/`), sin proyectos nuevos desplegables.

**Performance Goals**: sin metas de tiempo definidas ([DP-018](../../docs/07-registro/02-decisiones-pendientes.md#dp-018)); la spec no inventa umbrales. Restricción técnica propia: la validación del token no añade llamadas de red por petición (JWKS en caché) y cada petición autenticada cuesta **una** consulta a la base de datos.

**Constraints**: el access token vive ≤ 15 min y solo en el servidor de Next.js (FR-023, FR-030); sesión de 14 días sin uso y 30 máximo (**provisional**, DP-022); ningún secreto en el repositorio (FR-032); ningún token ni dato personal en los registros (FR-033); cobertura mínima backend 85 % y frontend 80 % (Constitución, RNF-31).

**Scale/Scope**: 5 historias, 11 subtareas, 3 pantallas, 2 endpoints (`/api/me`, `/api/me/onboarding/complete`), 1 tabla, 1 proxy, 1 middleware. El plan gratuito de Auth0 cubre 25.000 usuarios activos al mes (ADR-0007).

## Constitution Check

*GATE: debe pasar antes de la investigación (Fase 0) y se reevalúa tras el diseño (Fase 1).*

| Principio | Antes de Fase 0 | Después del diseño | Evidencia |
|---|---|---|---|
| **I. La especificación es la fuente de verdad** | Pasa con observaciones | Pasa | Cada FR rastrea a una historia ROS. El plan se apartaba de `docs/` en 6 puntos (tabla *Desviaciones*); **CD-007 los alineó** y los documentos ya coinciden con el plan |
| **II. Pruebas primero** | Pasa | Pasa | Estrategia de pruebas abajo; commit de prueba roja por criterio; PostgreSQL real en integración; sin pruebas omitidas |
| **III. El motor nunca inventa** | No aplica | No aplica | Esta feature no toca el motor de evidencia |
| **IV. Auditabilidad y determinismo** | Pasa | Pasa | Eventos de seguridad con campos cerrados y sin datos personales ([research R-11](research.md#r-11--registros-sin-datos-sensibles)); el usuario conserva su identidad inmutable (`auth0_sub`) |
| **V. Seguridad y aislamiento** | Pasa | Pasa | Tokens solo en el servidor; cookie `HttpOnly`; lista blanca sin comodines; secretos solo en el entorno; registros redactados; sin datos reales en pruebas. Los esquemas y muestras de clientes no pasan por Auth0; nombre, correo y avatar sí, como acepta ADR-0007 |
| **VI. Simplicidad** | Pasa | Pasa | Sin servicios nuevos desplegables. Se usan DRF, el SDK y el middleware de Next tal cual; el filtro de registros y el middleware de cabeceras son de unas pocas líneas. Cinco dependencias nuevas, todas justificadas (R-14); no hay formateador JSON ni librería de CSP |
| **VII. Consistencia de interfaz** | Pasa | Pasa | Pantallas con tokens y componentes de Nocturne; WCAG 2.1 AA verificado con axe y recorrido por teclado (SC-009); textos centralizados en `features/auth/copy.ts` |
| **Restricciones** (versiones, idioma, dependencias) | Pasa con observación | Pasa con observación | Versiones dentro de lo fijado; React sube de parche. Identificadores en inglés, textos de producto en español |
| **Gates del flujo** (1 a 5) | Pendiente | Pendiente | Faltan `tasks.md` y `/speckit-analyze` sin hallazgos CRITICAL; los DP/EC abiertos están registrados |

**Veredicto:** el diseño cumple la constitución. La alineación con `docs/` (tabla siguiente) la resolvió CD-007.

## Desviaciones respecto a `docs/` (resueltas por CD-007)

La constitución no permite que un `plan.md` contradiga `docs/03-arquitectura/`. Estos seis puntos se apartaban de ella y estaban justificados; **CD-007** (2026-10-01) cambió los documentos y hoy coinciden con el plan. La tabla se conserva como registro de qué cambió y por qué. Siguen pendientes en Jira y en el tenant de desarrollo (ver el [registro de sincronización](../../docs/07-registro/03-registro-de-sincronizacion.md)).

| # | Qué cambia | Dónde decía otra cosa | Por qué | Documentos que tocó CD-007 |
|---|---|---|---|---|
| D1 | Sin sesión, la persona va a **`/login?returnTo=`**, no a `/auth/login?returnTo=` | [04-frontend §4](../../docs/03-arquitectura/04-frontend.md), [07-seguridad §3](../../docs/03-arquitectura/07-seguridad-y-autenticacion.md), actividad de ROS-188 | `/auth/login` sin `connection` abre la pantalla alojada por Auth0, no la de Rosetta: contradice FR-002 y FR-040 ([research R-06](research.md#r-06--dónde-se-protege-cada-ruta-y-a-dónde-se-redirige)) | 04-frontend, 07-seguridad, 03-tareas-mvp (ROS-188) |
| D2 | **CSP con nonce** en el middleware y `script-src` explícito | [07-seguridad §5](../../docs/03-arquitectura/07-seguridad-y-autenticacion.md): la CSP no tiene `script-src` | Con `default-src 'self'` Next.js no ejecutaría sus propios scripts en línea ([research R-10](research.md#r-10--cabeceras-de-seguridad)) | 07-seguridad §5 |
| D3 | `GET /api/me` incluye `avatar_url`; códigos nuevos: `account_disabled`, `email_missing` (403), `email_not_verified`, `forbidden_origin`, `identity_unavailable`, `backend_unavailable` (**provisionales hasta DP-025**) | [05-api §2 y §4](../../docs/03-arquitectura/05-api.md) no detallan la respuesta de `/api/me` ni estos códigos | Las specs no cambian el contrato sin tocar antes `05-api` (cabecera de ese documento) | 05-api |
| D4 | Lista blanca de cierre de sesión con **dos** destinos (`/login` y `/auth/error`) y ruta `/auth/denied` | [08-infraestructura §3](../../docs/03-arquitectura/08-infraestructura-y-entornos.md) menciona solo `/login` | Evita el bucle de FR-039 sin comodines ([research R-07](research.md#r-07--errores-de-acceso-y-cómo-llegan-a-la-pantalla-de-error)) | 08-infraestructura §3, 04-frontend (estructura) |
| D5 | Variables solo de pruebas: `AUTH0_ISSUER`, `AUTH0_JWKS_URL`, `E2E_ALLOW_INSECURE_IDP` | [08-infraestructura §4](../../docs/03-arquitectura/08-infraestructura-y-entornos.md) no las lista | E2E con proveedor simulado ([research R-13](research.md#r-13--proveedor-simulado-y-pruebas-e2e)); producción las rechaza | 08-infraestructura §4 |
| D6 | El frontend **no** reescribe `/api` ni `/auth` hacia el backend | [08-infraestructura §3](../../docs/03-arquitectura/08-infraestructura-y-entornos.md): "Reescribe `/api` y `/auth` a `backend:8000`" (texto de ADR-0006) | ADR-0007 y 04-frontend §4 ya lo dicen distinto; un rewrite saltaría el proxy | 08-infraestructura §3 |

## Decisiones pendientes que afectan al plan

| DP | Estado | Valor que usa el plan mientras tanto | Qué bloquea |
|---|---|---|---|
| [DP-022](../../docs/07-registro/02-decisiones-pendientes.md#dp-022) · duración de la sesión | Abierta | 14 días sin uso, 30 de máximo | Nada |
| [DP-023](../../docs/07-registro/02-decisiones-pendientes.md#dp-023) · proveedor sin nombre | Abierta, **sin valor por defecto** | Ninguno: no se decide | Solo el caso "nombre ausente" de ROS-185; se deja como tarea bloqueada y `/speckit-analyze` la señalará |
| [DP-024](../../docs/07-registro/02-decisiones-pendientes.md#dp-024) · administración interna | Abierta | Opción A: sin consola, sin `admin` ni `sessions` | Nada (si se elige B, se reabre R-04) |
| [DP-025](../../docs/07-registro/02-decisiones-pendientes.md#dp-025) · textos y códigos de error | Abierta | Textos ya definidos en `04-contenido`; códigos nuevos **provisionales** | Los textos definitivos de seis mensajes, antes de cerrar ROS-184 |
| [DP-015](../../docs/07-registro/02-decisiones-pendientes.md#dp-015) · hosting y región | Abierta | Tenant de desarrollo en EE. UU. | Solo la región del tenant de producción |
| [DP-019](../../docs/07-registro/02-decisiones-pendientes.md#dp-019) · dialectos SQL | Abierta | La lista la aporta la feature 003 | El selector de dialecto del onboarding |

## Hallazgos del esqueleto que este plan corrige

| Dónde | Hallazgo | Consecuencia |
|---|---|---|
| `backend/apps/core/exceptions.py` | El manejador de errores **reemplaza** el código de cualquier 401 o 403 por uno fijo (`session_expired`, `forbidden`) y descartaría `account_disabled` y `account_exists_other_provider` | Hay que hacer que un código propio de la excepción tenga prioridad; se actualiza `tests/test_exceptions.py` |
| `backend/config/settings/base.py` | Permiso por defecto `AllowAny`, autenticación vacía y un comentario de ADR-0006 | Pasan a `IsAuthenticated` y a `Auth0JWTAuthentication` (FR-012); `/api/schema/` se declara público de forma explícita |
| `frontend/next.config.ts` y `tests/unit/next-config.test.ts` | Tienen rewrites de `/api` y `/auth` (ADR-0006) | Se eliminan y la prueba se reescribe para exigir que **no** existan (D6) |
| `frontend/src/app/page.tsx` y `tests/unit/home.test.tsx` | Página provisional del esqueleto | `/` pasa a resolver el destino (onboarding o proyectos); la prueba se reescribe |
| `.github/workflows/ci.yml` y `Makefile` | No hay job ni objetivo E2E, que `08-infraestructura §5` sí prevé | Se añade el job `e2e` y el objetivo `make e2e` |

## Project Structure

### Documentation (this feature)

```text
specs/002-autenticacion-oauth/
├── spec.md              # Qué y por qué (hecho)
├── plan.md              # Este archivo
├── research.md          # Fase 0: decisiones y verificaciones
├── data-model.md        # Fase 1: accounts_user
├── quickstart.md        # Fase 1: tenant, lista de configuración y escenarios
├── contracts/
│   ├── accounts-api.yaml   # OpenAPI de /api/me y /api/me/onboarding/complete
│   ├── bff-proxy.md        # Contrato del proxy /api/*
│   └── auth-flow.md        # Rutas, sesión, códigos de error y claims
├── checklists/          # requirements.md (hecho) y acceso.md (hecho)
├── evidence/            # Evidencia de verificación: tenant-config-dev.md y -prod.md, quickstart-run.md, fr-coverage.md
└── tasks.md             # /speckit-tasks (NO lo crea este comando)
```

### Source Code (repository root)

Aplicación web con la estructura ya fijada por [03-backend.md](../../docs/03-arquitectura/03-backend.md) y [04-frontend.md](../../docs/03-arquitectura/04-frontend.md). Los archivos marcados con `+` son nuevos; los marcados con `~` se modifican.

```text
backend/
├── pyproject.toml                          ~  + pyjwt[crypto]
├── config/
│   ├── settings/base.py                    ~  AUTH_USER_MODEL, DRF (autenticación y permisos), AUTH0_*, LOGGING con RedactFilter
│   ├── settings/prod.py                    ~  emisor y JWKS solo con https
│   └── urls.py                             ~  /api/schema/ público explícito, /api/me
├── apps/
│   ├── accounts/                           +
│   │   ├── models.py · services.py         +  User y manager · get_or_create_from_claims, complete_onboarding
│   │   ├── authentication.py · jwks.py     +  Auth0JWTAuthentication · cliente JWKS con límite de recarga
│   │   ├── serializers.py · views.py       +
│   │   ├── urls.py · messages.py · exceptions.py   +
│   │   ├── logging.py                      +  RedactFilter
│   │   └── migrations/0001_initial.py      +
│   └── core/
│       ├── middleware.py                   +  CSP para respuestas JSON
│       └── exceptions.py                   ~  el código propio de la excepción tiene prioridad
└── tests/
    ├── factories/accounts.py               +
    ├── accounts/                           +  servicios: alta, reconocimiento, concurrencia, choque de correo, desactivada
    ├── api/test_me.py · test_onboarding.py +
    ├── security/                           +  test_auth_tokens · test_jwks_refresh_limit · test_logging_redaction · test_security_headers · test_tenant_config_evidence
    ├── test_exceptions.py · test_settings.py ~

frontend/
├── package.json                            ~  + SDK, react/react-dom ≥ 19.1.2, Playwright, axe, oauth2-mock-server
├── next.config.ts                          ~  sin rewrites; cabeceras estáticas (HSTS solo en producción)
├── playwright.config.ts                    +
├── src/
│   ├── middleware.ts                       +  SDK + reglas de acceso + CSP con nonce
│   ├── lib/auth0.ts                        +  Auth0Client
│   ├── lib/api/client.ts                   +  fetch mínimo: ante 401 lleva a /login?returnTo=
│   ├── app/
│   │   ├── page.tsx                        ~  resuelve el destino tras el acceso
│   │   ├── (public)/login/page.tsx         +
│   │   ├── (public)/auth/error/page.tsx    +
│   │   ├── auth/denied/route.ts            +
│   │   ├── api/[...path]/route.ts          +  proxy BFF
│   │   └── (app)/layout.tsx · onboarding/page.tsx   +  guarda de onboarding y cierre de sesión (compartido con 001 y 003)
│   └── features/
│       ├── auth/                           +  copy.ts · errorCodes.ts · safeReturnTo.ts · currentUser.ts · LoginButtons · AuthError · LogoutLink
│       └── onboarding/                     +  flujo de un paso; usa el formulario de proyecto de la feature 003
└── tests/
    ├── unit/                               ~  middleware, proxy, login, error, onboarding, safeReturnTo, auth0, next-config, home
    └── e2e/                                +  login · logout · onboarding · a11y · support/mock-idp

.github/workflows/ci.yml                    ~  + job e2e (servicios postgres y redis, Playwright)
Makefile                                    ~  + objetivo e2e
.env.example · frontend/.env.example        ~  variables nuevas (sin valores; las de prueba, comentadas)
```

**Structure Decision**: se mantiene la estructura de dos proyectos (`backend/`, `frontend/`) de la Constitución VI. El backend añade **una app** (`accounts`) y el frontend añade rutas, un middleware y el proxy; no se crea ningún proyecto ni servicio desplegable nuevo.

## Estrategia de pruebas

Escribir primero y ver fallar cada prueba (commit de prueba roja antes del código). Cada prueba lleva sus marcadores.

| Nivel | Qué cubre | Dónde | Requisitos |
|---|---|---|---|
| Backend, servicios (PostgreSQL real) | Alta única, reconocimiento, acceso simultáneo, choque de correo, cuenta desactivada, actualización de datos, `last_login_at` | `tests/accounts/` | FR-005…FR-011, FR-017, FR-021 |
| Backend, API | `/api/me`, onboarding idempotente, 401 y 403 en el formato de error, formato de los códigos propios | `tests/api/` | FR-012, FR-013, FR-016, FR-019 |
| Backend, seguridad | Credencial ausente, vencida, otra audiencia, otro emisor, firma alterada, `alg: none`, `kid` desconocido; límite de recarga del JWKS; registros sin JWT ni correos; cabeceras; producción rechaza emisor sin `https` | `tests/security/` | FR-029, FR-032…FR-034, SC-004, SC-008 |
| Frontend, unitarias | Middleware (reglas y CSP), proxy (todo lo de [bff-proxy.md](contracts/bff-proxy.md)), `returnTo` interno, configuración del SDK (14 y 30 días, `allowInsecureRequests` apagado en producción), pantallas | `tests/unit/` | FR-002, FR-014, FR-015, FR-018, FR-024…FR-031, FR-036…FR-040 |
| E2E con proveedor simulado | Acceso, onboarding, cierre de sesión, rutas protegidas, errores, PKCE y `state` en la URL, accesibilidad con axe y teclado | `tests/e2e/` | FR-001…FR-003, FR-014, FR-025, FR-027, FR-036…FR-040, SC-001, SC-006, SC-007, SC-009 (E2E-01 parcial y E2E-08) |
| Verificación de configuración | Lista C1…C16 anexa al acta; una prueba automática comprueba que existe, está completa y sin fallos (no sustituye la revisión humana) | `tests/security/` y [quickstart.md §3](quickstart.md) | FR-035, SC-010 |

**E2E-01 completo** depende de la feature 003 (creación de proyectos); hasta entonces el E2E intercepta `/api/projects` ([research R-13](research.md#r-13--proveedor-simulado-y-pruebas-e2e)).

## Orden de entrega sugerido (insumo para `/speckit-tasks`)

| Etapa | Subtareas | Notas |
|---|---|---|
| A. Base | ROS-180 (modelo) y ROS-182 (tenant, en paralelo) | `AUTH_USER_MODEL` antes de la primera migración |
| B. Backend | ROS-181 (validación y protección por defecto), ROS-185 (`/api/me`) | Incluye el cambio del manejador de errores |
| C. Frontend base | ROS-183 (SDK y middleware), ROS-188 (proxy) | Se quitan los rewrites |
| D. Pantallas | ROS-184 (acceso y error; **primera tarea: prueba de humo del proveedor simulado**, riesgos R-A y R-B), ROS-186 (onboarding) | ROS-186 depende de la creación de proyectos de la feature 003 |
| E. Cierre | ROS-187 (sesión y cierre), ROS-189 (verificación), ROS-190 (secretos, cookies, cabeceras) | La lista del quickstart se rellena aquí |

**Dependencias con otras features del Sprint 1:** el `layout` de `(app)` y la barra superior con el control de cierre de sesión se comparten con la feature 001 (Nocturne) y la 003; esta feature aporta un `layout` mínimo con la guarda y el enlace de cierre. Ver [spec.md, Assumptions](spec.md).

## Complexity Tracking

Sin violaciones de la constitución que justificar.
