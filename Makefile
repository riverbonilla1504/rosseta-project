# Comandos estándar — docs/03-arquitectura/08-infraestructura-y-entornos.md §3
# En Windows: usar desde Git Bash (make vía choco/scoop) o copiar el comando equivalente.
.PHONY: up down services migrate test lint api-types dev-backend dev-frontend

services:      ## Solo PostgreSQL (puerto 5433) y Redis
	docker compose up -d db redis

up:            ## Todo en contenedores
	docker compose --profile app up -d --build

down:
	docker compose --profile app down

migrate:
	cd backend && uv run python manage.py migrate

dev-backend:
	cd backend && uv run python manage.py runserver 8000

dev-frontend:
	cd frontend && pnpm dev

test:
	cd backend && uv run pytest --cov
	cd frontend && pnpm test:coverage

lint:
	cd backend && uv run ruff check . && uv run ruff format --check . && uv run mypy .
	cd frontend && pnpm lint && pnpm format:check && pnpm typecheck

api-types:     ## Se habilita en la feature 003 (openapi-typescript)
	@echo "Pendiente: feature 003 añade openapi-typescript"
