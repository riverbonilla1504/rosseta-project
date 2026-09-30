# ADR-0001 · Stack: Django + DRF + PostgreSQL + Next.js

- **Estado:** Aceptado
- **Fecha:** 2026-09-29
- **Decisores:** responsable del proyecto
- **Relacionado:** Constitución VI, [02-stack-y-servicios.md](../02-stack-y-servicios.md)

## Contexto
Rosetta necesita un backend con lógica de dominio intensa (motor de evidencia, parseo de SQL, perfilado de datos), persistencia relacional transaccional y una interfaz web muy interactiva (revisión con teclado, catálogos grandes).

## Decisión
- Backend: **Python 3.12 + Django 5.2 LTS + Django REST Framework**.
- Base de datos: **PostgreSQL 16**.
- Frontend: **Next.js 15 (App Router) + React 19 + TypeScript estricto**.

## Alternativas consideradas
| Opción | Por qué no |
|---|---|
| FastAPI + SQLAlchemy | Más piezas a ensamblar (auth, admin, migraciones); Django trae todo y es la elección del proyecto |
| Node/NestJS en el backend | El ecosistema de análisis de datos (sqlglot, polars/pandas) es de Python |
| SPA con Vite en vez de Next.js | Decisión del proyecto por Next.js; además su proxy simplifica las cookies de primer origen |

## Consecuencias
- (+) Admin de Django para soporte; ORM y migraciones maduras; librerías de datos en Python.
- (+) PostgreSQL permite JSONB (desglose de puntaje, citas), índices parciales y bloqueo de filas para la propagación.
- (−) Dos lenguajes: el contrato se mantiene con OpenAPI + tipos TypeScript generados.
