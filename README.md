# Rosetta

Descifra esquemas de bases de datos heredadas (`MOV0010.CTANRO`, `IMPTE`, `FEPRO`…) y los convierte en un
**catálogo de datos confiable y auditable**, con un motor de evidencia, niveles de confianza y validación humana.

- **Documentación (fuente de verdad):** [`docs/`](docs/README.md)
- **Constitución:** [`.specify/memory/constitution.md`](.specify/memory/constitution.md)
- **Specs (Spec Kit):** `specs/NNN-feature/` (se crean con `/speckit-specify`)
- **Jira:** proyecto `ROS` — https://fermentai.atlassian.net/browse/ROS-1

## Estructura

```text
docs/        documentación (fuente de verdad)
specs/       especificaciones por feature (Spec Kit)
.specify/    Spec Kit: constitución, plantillas, scripts
.claude/     skills /speckit-* para Claude Code
backend/     Django 5.2 + DRF + Celery (Python 3.12, uv)
frontend/    Next.js 15 + React 19 + TypeScript (pnpm)
```

## Desarrollo local

Requisitos: Docker Desktop, [uv](https://docs.astral.sh/uv/), Node.js 22 y pnpm.

```bash
cp .env.example .env                 # y rellena DJANGO_SECRET_KEY
docker compose up -d db redis        # PostgreSQL en el puerto 5433 y Redis en el 6379
cd backend && uv sync && uv run python manage.py runserver 8000
cd frontend && pnpm install && pnpm dev       # http://localhost:3000 (proxy /api → :8000)
```

O todo en contenedores: `docker compose --profile app up -d --build`.

Comprobación rápida: `curl http://localhost:3000/api/health` → `{"status":"ok",...}`.

### Calidad

```bash
cd backend  && uv run ruff check . && uv run mypy . && uv run pytest --cov
cd frontend && pnpm lint && pnpm typecheck && pnpm test:coverage
```

## Cómo se trabaja

1. Toda funcionalidad nace en `docs/` y en una historia de Jira (`ROS-n`).
2. `/speckit-specify` → `/speckit-clarify` → `/speckit-plan` → `/speckit-tasks` → `/speckit-analyze` → `/speckit-implement` → `/speckit-converge`.
3. Rama `NNN-slug`, commits y PR con la clave `ROS-n`, prueba roja primero, CI verde, verificación independiente.

Detalle: [`docs/00-metodologia/03-flujo-de-trabajo.md`](docs/00-metodologia/03-flujo-de-trabajo.md).
