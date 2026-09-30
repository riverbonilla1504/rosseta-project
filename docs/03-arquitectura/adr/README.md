# Registro de decisiones de arquitectura (ADR)

> Un **ADR** registra una decisión estructural: contexto, opciones, decisión y consecuencias. Se escribe un ADR cuando se añade un servicio, framework o dependencia estructural, se cambia un patrón transversal, o se enmienda la constitución (Constitución VI y Gobernanza).
> Plantilla: [../../plantillas/adr.md](../../plantillas/adr.md). Numeración `ADR-NNNN` correlativa; nunca se reutiliza un número.

## Estados

`Propuesto` → `Aceptado` → (`Reemplazado por ADR-NNNN` | `Obsoleto`). Un ADR aceptado **no se edita** salvo erratas; para cambiar la decisión se escribe uno nuevo que lo reemplaza y se actualiza el estado del anterior.

## Índice

| ADR | Título | Estado | Fecha |
|---|---|---|---|
| [ADR-0001](ADR-0001-stack-django-postgresql-nextjs.md) | Stack: Django + DRF + PostgreSQL + Next.js | Aceptado | 2026-09-29 |
| [ADR-0002](ADR-0002-monorepo-y-monolito-modular.md) | Monorepo y monolito modular | Propuesto | 2026-09-29 |
| [ADR-0003](ADR-0003-trabajo-asincrono-celery-redis.md) | Trabajo asíncrono con Celery + Redis | Propuesto | 2026-09-29 |
| [ADR-0004](ADR-0004-multitenancy-preparado.md) | Multi-tenant preparado pero no implementado en el MVP | Propuesto | 2026-09-29 |
| [ADR-0005](ADR-0005-motor-determinista-sin-llm.md) | Motor de evidencia determinista, puro y sin LLM en el MVP | Propuesto | 2026-09-29 |
| [ADR-0006](ADR-0006-autenticacion-oauth-jwt-cookies.md) | Autenticación: allauth (OAuth/OIDC + PKCE) + JWT en cookies httpOnly detrás del proxy de Next.js | Propuesto | 2026-09-29 |

> Los ADR *Propuestos* se aceptan (o se cambian) en la Fase 0.5 de preparación, junto con la ratificación de la constitución. ADR-0001 está aceptado porque el stack lo fijó el responsable del proyecto.
