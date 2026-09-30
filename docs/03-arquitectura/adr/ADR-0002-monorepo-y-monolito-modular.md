# ADR-0002 · Monorepo y monolito modular

- **Estado:** Propuesto
- **Fecha:** 2026-09-29
- **Relacionado:** Constitución VI, [01-vision-general.md](../01-vision-general.md), [08-infraestructura-y-entornos.md](../08-infraestructura-y-entornos.md)

## Contexto
Spec Kit trabaja sobre un repositorio con `specs/` y `.specify/` en la raíz. La trazabilidad docs → spec → código es más simple si todo vive junto. El equipo es pequeño.

## Decisión
- Un **único repositorio** con `docs/`, `specs/`, `backend/`, `frontend/`, `tools/`.
- El backend es un **monolito modular**: un proyecto Django con apps por dominio (`accounts`, `projects`, `catalog`, `sources`, `evidence`, `review`, `insights`, `core`) y un paquete Python puro `evidence_engine`.
- Máximo dos desplegables (`backend`, `frontend`) más el worker (mismo código que `backend`).

## Alternativas
| Opción | Por qué no |
|---|---|
| Repos separados backend/frontend/docs | Rompe la trazabilidad de Spec Kit; un cambio de contrato exige PRs coordinados |
| Microservicios (motor aparte) | Complejidad operativa sin necesidad; el motor es una librería, no un servicio |

## Consecuencias
- (+) Un PR puede cambiar spec, backend, frontend y pruebas de una historia de forma atómica.
- (+) CI único con verificación de trazabilidad.
- (−) CI debe filtrar por rutas para no correr todo en cada cambio (optimización posterior).
