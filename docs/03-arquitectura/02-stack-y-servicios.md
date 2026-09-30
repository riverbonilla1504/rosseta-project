# Stack y servicios

> Versiones y librerías **permitidas**. Añadir una dependencia no listada exige justificarla en el `plan.md` de la feature; añadir un **servicio** (algo que se despliega o se contrata) exige un ADR (Constitución VI).
> Las versiones se fijan exactamente en `pyproject.toml`/`uv.lock` y `package.json`/`pnpm-lock.yaml` durante la preparación.

## 1. Stack base (decidido)

| Capa | Tecnología | Versión | Motivo |
|---|---|---|---|
| Lenguaje backend | Python | 3.12 | Soporte de Django 5.2, tipado moderno |
| Framework backend | Django | 5.2 LTS | Decisión del proyecto; LTS hasta 2028 |
| API | Django REST Framework | 3.15+ | Serializadores, permisos, paginación |
| Contrato API | drf-spectacular | última | OpenAPI 3 generado desde el código |
| Base de datos | PostgreSQL | 16 | Decisión del proyecto; JSONB, índices parciales, transacciones sólidas |
| Framework frontend | Next.js (App Router) | 15 | Decisión del proyecto |
| UI | React | 19 | Requerido por Next 15 |
| Lenguaje frontend | TypeScript | 5.x, `strict: true` | Tipado del contrato |
| Runtime frontend | Node.js | 22 LTS | |
| Gestor Python | uv | última | Rápido, lockfile reproducible; lo usa Spec Kit |
| Gestor JS | pnpm | 9+ | Lockfile determinista |

## 2. Librerías del backend

| Propósito | Librería | Notas |
|---|---|---|
| Validación de tokens de Auth0 | `PyJWT[crypto]` (`PyJWKClient`) | Verifica RS256, `iss`, `aud`, `exp` del access token ([ADR-0007](adr/ADR-0007-autenticacion-auth0.md)) |
| Parseo de DDL | `sqlglot` | Soporta T-SQL, Oracle, PostgreSQL, MySQL. Elegido en ROS-120 (evaluación registrada en `research.md` de la feature 004) |
| Perfilado de CSV | `polars` (preferido) o `pandas` | Decisión final en `research.md` de 004; criterio: memoria con archivos de 100 MB |
| Detección de codificación | `charset-normalizer` | Ya es dependencia transitiva de `requests` |
| Tareas asíncronas | `celery[redis]` 5 | |
| Configuración | `django-environ` | Variables de entorno, `.env` solo en local |
| CORS / cabeceras | `django-cors-headers` (solo dev si hace falta), `SecurityMiddleware` de Django | En prod el proxy de Next elimina CORS |
| Almacenamiento | `django-storages[s3]` | Solo en prod/staging |
| Servidor WSGI | `gunicorn` | |
| Observabilidad | `sentry-sdk` | Opcional, recomendado (ver §4) |

## 3. Librerías del frontend

| Propósito | Librería | Notas |
|---|---|---|
| Autenticación | `@auth0/nextjs-auth0` v4 | Login, callback, logout, sesión cifrada y `getAccessToken()` para el proxy BFF |
| Datos del servidor / caché | `@tanstack/react-query` 5 | Implementa el "estado compartido" (RN-18) invalidando consultas tras mutaciones |
| Estado de UI local | `zustand` | Solo estado efímero de UI (ítem seleccionado en la cola, paneles abiertos). Nunca datos de dominio |
| Cliente API tipado | `openapi-typescript` + `openapi-fetch` | Tipos generados desde el OpenAPI del backend: el contrato se rompe en compilación, no en producción |
| Estilos | CSS Modules + variables CSS (tokens Nocturne) | Sin Tailwind ni librería de componentes externa (Constitución VII) |
| Tablas virtualizadas | `@tanstack/react-virtual` | RNF-15 |
| Gráficos | Ninguno en el MVP | La barra de cobertura es CSS puro |
| Formularios | Nativos + validación ligera | Añadir `react-hook-form`/`zod` solo si una spec lo justifica |

## 4. Servicios adicionales necesarios

Además de **Django + PostgreSQL + Next.js**, Rosetta necesita estos servicios. Cada uno tiene su ADR o su decisión pendiente.

| Servicio | ¿Obligatorio? | Desde | Para qué | Opciones | Decisión |
|---|---|---|---|---|---|
| **Redis 7** | **Sí** | MVP (Sprint 1) | Broker de Celery y caché de métricas | Redis local (Docker) / gestionado en la nube | [ADR-0003](adr/ADR-0003-trabajo-asincrono-celery-redis.md) |
| **Celery worker** | **Sí** | MVP (Sprint 2) | Perfilado de muestras grandes y parseo de DDL sin bloquear la UI (RNF-12) | Proceso aparte con el mismo código del backend | [ADR-0003](adr/ADR-0003-trabajo-asincrono-celery-redis.md) |
| **Almacenamiento de objetos** | **Sí** (en prod) | MVP | Guardar DDL y CSV subidos | Disco local en dev; S3 / MinIO / equivalente en prod | [DP-015](../07-registro/02-decisiones-pendientes.md) (proveedor) |
| **Auth0** (proveedor de identidad) | **Sí** | MVP (Sprint 1) | Inicio de sesión con Google y Microsoft, sesión, rotación de tokens; en fases 2–3 MFA, SSO y organizaciones | Plan gratis (25.000 MAU, 1 conexión empresarial). MCP oficial para configurar el tenant de desarrollo | [ADR-0007](adr/ADR-0007-autenticacion-auth0.md) |
| **Apps OAuth de Google y Microsoft** | **Sí** (para producción) | Antes de staging | Credenciales propias que se cargan **en Auth0** (en local bastan las claves de desarrollo de Auth0) | Google Cloud Console, Microsoft Entra ID | [DP-014](../07-registro/02-decisiones-pendientes.md#dp-014) |
| **Hosting** (backend, frontend, BD) | **Sí** | Fin del MVP | Entorno de staging y producción | Por decidir | [DP-015](../07-registro/02-decisiones-pendientes.md) |
| **Sentry** (o equivalente) | Recomendado | MVP | Errores de backend y frontend con contexto | Sentry SaaS / self-hosted / GlitchTip | [DP-015](../07-registro/02-decisiones-pendientes.md) |
| **LLM local** (p. ej. Ollama) | No | Fase 2 | Redacción de descripciones ("redacción con LLM local" del prototipo) | Ollama + modelo abierto / ninguno | [DP-004](../07-registro/02-decisiones-pendientes.md) |
| **Correo transaccional** | No | Fase 2 | Verificación de correo, recuperación, invitaciones (ROS-95, 96, 109) | SES / Postmark / Resend / SMTP | Se decide al especificar ROS-95 |
| **Pasarela de pago** | No | Fase 3 | Cobros y suscripciones (ROS-112) | Stripe (sugerido por la historia) / Mercado Pago / otra | Se decide en E15 |
| **Jev (TypeSafe AI)** | No | Fase 2 (piloto, si se aprueba) | Evidencia opcional: emparejar documentación/etiquetas con columnas; verificar redacción del LLM | API en la nube (early access) | [DP-021](../07-registro/02-decisiones-pendientes.md#dp-021), [evaluación](evaluaciones/2026-09-30-jev-typesafe-ai.md) |
| **Proveedor de SSO empresarial** | No | Fase 3 | SAML/OIDC de clientes (ROS-102) | Conexiones empresariales de Auth0 (plan B2B) | Se decide en E14 Fase 3 |

> **Resumen para el MVP:** además de Django, PostgreSQL y Next.js, hay que levantar **Redis + un worker de Celery**, tener **almacenamiento de archivos** (disco en desarrollo, S3 compatible en producción), configurar **Auth0** (con Google y Microsoft), y elegir **hosting**. Se recomienda **Sentry**. Todo lo demás es de fases posteriores.

## 5. Herramientas de desarrollo y calidad

| Propósito | Backend | Frontend |
|---|---|---|
| Lint + formato | `ruff` (lint + format) | ESLint (config Next) + Prettier |
| Tipos | `mypy` con `django-stubs` y `djangorestframework-stubs` | `tsc --noEmit` |
| Pruebas unitarias/integración | `pytest`, `pytest-django`, `factory_boy`, `hypothesis` (propiedades del motor) | Vitest + Testing Library |
| Cobertura | `pytest-cov` | `@vitest/coverage-v8` |
| E2E | — | Playwright + `@axe-core/playwright` (accesibilidad) |
| Contrato | `drf-spectacular --validate` + diff del OpenAPI | Tipos generados compilan |
| Secretos | `gitleaks` en pre-commit y CI | — |
| Hooks | `pre-commit` | `lint-staged` vía pre-commit |
| Spec Kit | `specify-cli` (uv tool) | — |

Estrategia completa: [06-calidad/01-estrategia-de-pruebas.md](../06-calidad/01-estrategia-de-pruebas.md).

## 6. Dependencias prohibidas sin ADR

- Cualquier ORM o query builder distinto del ORM de Django.
- Librerías de componentes UI (MUI, Chakra, shadcn, Ant…) o Tailwind: la UI se construye con Nocturne.
- SDKs de LLM (OpenAI, Anthropic, Ollama…) antes de la Fase 2.
- Bases de datos adicionales (Mongo, Elastic…).
- Otros servicios de autenticación (Clerk, Firebase Auth…): Auth0 es el elegido ([ADR-0007](adr/ADR-0007-autenticacion-auth0.md)).
