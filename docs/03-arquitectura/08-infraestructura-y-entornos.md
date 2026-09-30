# Infraestructura y entornos

> Cómo se ejecuta Rosetta en cada entorno y cómo se integra y despliega. El proveedor de hosting está pendiente ([DP-015](../07-registro/02-decisiones-pendientes.md)); todo lo de aquí es independiente del proveedor.

## 1. Estructura del repositorio (monorepo)

```text
DB_MVP/                       # raíz del repositorio git
├── docs/                     # ← fuente de verdad (esta carpeta)
├── specs/                    # Spec Kit: 001-…, 002-…
├── .specify/                 # Spec Kit: memoria (constitución), plantillas, scripts
├── .claude/                  # comandos /speckit-* para Claude Code
├── backend/                  # Django (ver 03-backend.md)
├── frontend/                 # Next.js (ver 04-frontend.md)
├── tools/                    # scripts del proyecto (sync_audit.py, trazabilidad)
├── docker-compose.yml        # entorno de desarrollo
├── .github/workflows/        # CI
├── .pre-commit-config.yaml
├── .env.example
├── CLAUDE.md · AGENTS.md     # punteros mínimos a docs/ (ver 07-delegacion-a-ia.md)
└── README.md
```

Justificación: [ADR-0002](adr/ADR-0002-monorepo-y-monolito-modular.md).

## 2. Entornos

| Entorno | Propósito | Datos | Despliegue |
|---|---|---|---|
| **local** | Desarrollo | Semillas sintéticas (`make seed`) | `docker compose up` |
| **ci** | Pruebas automáticas | Base efímera por ejecución | GitHub Actions |
| **staging** | QA y demo | Sintéticos + esquemas de prueba | Automático al fusionar en `main` `[PENDIENTE]` |
| **prod** | Uso real | Datos de clientes | Manual con etiqueta `vX.Y.Z` `[PENDIENTE]` |

Nunca se copian datos de prod a otros entornos (Constitución V).

## 3. Desarrollo local (docker-compose)

| Servicio | Imagen | Puerto | Notas |
|---|---|---|---|
| `db` | `postgres:16` | 5432 | Volumen `pgdata` |
| `redis` | `redis:7` | 6379 | |
| `backend` | build `backend/` | 8000 | `runserver` con recarga |
| `worker` | build `backend/` | — | `celery -A config worker -l info` |
| `frontend` | build `frontend/` o `pnpm dev` en el host | 3000 | Reescribe `/api` y `/auth` a `backend:8000` |

Comandos estándar (Makefile o `justfile`, se crea en la preparación):

```bash
make up          # docker compose up -d
make migrate     # python manage.py migrate
make seed        # carga el proyecto de ejemplo MOV0010 (sintético)
make test        # pytest + vitest
make e2e         # playwright
make lint        # ruff, mypy, eslint, tsc
make api-types   # regenera frontend/src/lib/api/schema.d.ts
```

OAuth en local: redirect URIs `http://localhost:3000/auth/google/callback` y `…/microsoft/callback` registradas en las apps de desarrollo (ROS-182). Procedimiento paso a paso en el `quickstart.md` de la feature 002.

## 4. Variables de entorno

| Variable | Servicio | Ejemplo (no real) | Secreto |
|---|---|---|---|
| `DJANGO_SETTINGS_MODULE` | backend, worker | `config.settings.dev` | No |
| `DJANGO_SECRET_KEY` | backend, worker | — | **Sí** |
| `DATABASE_URL` | backend, worker | `postgres://rosetta:***@db:5432/rosetta` | **Sí** |
| `REDIS_URL` | backend, worker | `redis://redis:6379/0` | Según entorno |
| `ALLOWED_HOSTS` | backend | `localhost,backend` | No |
| `CSRF_TRUSTED_ORIGINS` | backend | `http://localhost:3000` | No |
| `FRONTEND_URL` | backend | `http://localhost:3000` | No |
| `JWT_SIGNING_KEY` | backend | — | **Sí** |
| `JWT_PREVIOUS_SIGNING_KEY` | backend | vacío salvo en rotación | **Sí** |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | backend | — | **Sí** |
| `MICROSOFT_CLIENT_ID` / `MICROSOFT_CLIENT_SECRET` / `MICROSOFT_TENANT` | backend | `common` | **Sí** (secret) |
| `STORAGE_BACKEND` | backend, worker | `local` \| `s3` | No |
| `AWS_*` / `S3_ENDPOINT_URL` / `S3_BUCKET` | backend, worker | — | **Sí** |
| `SENTRY_DSN` | backend, frontend | — | Sí |
| `BACKEND_INTERNAL_URL` | frontend | `http://backend:8000` | No |
| `MAX_DDL_UPLOAD_MB` / `MAX_SAMPLE_UPLOAD_MB` | backend | `20` / `200` (provisional) | No |

`.env.example` versionado con las claves y **sin** valores.

## 5. Integración continua (GitHub Actions)

Un workflow `ci.yml` en cada PR y en `main`:

| Job | Pasos | Falla si |
|---|---|---|
| `backend` | `uv sync` → `ruff check` → `ruff format --check` → `mypy` → `pytest --cov` con servicio `postgres:16` y `redis:7` | lint, tipos, pruebas, cobertura < umbral (85 % / motor 95 %) o baja respecto a `main` |
| `frontend` | `pnpm i --frozen-lockfile` → `eslint` → `tsc --noEmit` → `vitest --coverage` → `next build` | ídem, cobertura < 80 % |
| `contract` | Genera OpenAPI → compara con el versionado → genera tipos TS → `git diff --exit-code` | El contrato cambió sin actualizar tipos/docs |
| `e2e` | Levanta stack con compose → `playwright test` (incluye axe) | Flujo crítico o violación de accesibilidad seria |
| `security` | `gitleaks`, `pip-audit`, `pnpm audit --prod` | Secreto filtrado o vulnerabilidad alta |
| `traceability` | `tools/check_traceability.py`: título del PR con `ROS-n`, rama válida, commits con clave, pruebas con marcador `story`/`fr` para los FR tocados | Falta trazabilidad (ver [05-trazabilidad-y-convenciones.md](../00-metodologia/05-trazabilidad-y-convenciones.md)) |

Protección de `main`: PR obligatorio, CI verde, 1 revisión aprobada, sin *force push*.

## 6. Despliegue (propuesta, sujeta a DP-015)

- Imágenes Docker de `backend` (gunicorn), `worker` (celery) y `frontend` (`next start` o *standalone*).
- Migraciones como paso previo al despliegue (`manage.py migrate --noinput`), nunca desde el arranque del contenedor web.
- PostgreSQL y Redis gestionados por el proveedor, con **cifrado en reposo** y backups diarios (retención 7 días en staging, 30 en prod — *provisional*).
- HTTPS terminado en el balanceador/proxy del proveedor; HSTS desde Django.
- Variables de entorno desde el gestor de secretos del proveedor.

## 7. Observabilidad

| Señal | Herramienta | Qué |
|---|---|---|
| Errores | Sentry (recomendado) | Excepciones de backend, worker y frontend, sin PII |
| Logs | stdout en JSON (`python-json-logger`) | `request_id`, `user_id`, `project_id`, ruta, duración, estado |
| Salud | `GET /api/health` (sin auth) | BD y Redis accesibles |
| Métricas de tareas | Logs de Celery + `Source.status` | Duración de parseo/perfilado |

## 8. Procedimientos operativos

- **Rotar `JWT_SIGNING_KEY`:** poner la clave actual en `JWT_PREVIOUS_SIGNING_KEY`, nueva clave en `JWT_SIGNING_KEY`, desplegar; tras 15 min vaciar `JWT_PREVIOUS_SIGNING_KEY` y volver a desplegar.
- **Rotar secretos OAuth:** crear nuevo secreto en la consola del proveedor, actualizar variable, desplegar, revocar el anterior.
- **Restaurar backup:** `[PENDIENTE]` se documenta al elegir proveedor.
