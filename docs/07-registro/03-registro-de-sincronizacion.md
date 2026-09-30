# Registro de sincronización

> Bitácora de cada cambio que se propagó entre niveles (docs → specs → Jira → código) y de cada auditoría de sincronización. Procedimiento: [04-sincronizacion.md](../00-metodologia/04-sincronizacion.md).
> **El último `CD-NNN` de esta tabla determina el siguiente número.** Un CD está *Cerrado* solo cuando los cinco niveles dicen lo mismo.

## Cambios de documentación (CD)

| CD | Fecha | Título | Docs (commit) | Specs | Jira | PRs de código | Estado |
|---|---|---|---|---|---|---|---|
| CD-000 | 2026-09-29 | Creación inicial de `docs/` v1.0.0 a partir del prototipo, Notion y Jira | — (sin git: [EC-010](01-errores-conocidos.md#ec-010)) | — | Ya existían ROS-1…190 (creadas antes de la metodología) | — | Cerrado |
| CD-002 | 2026-09-30 | Fase 0.5: Spec Kit v1.0.13, constitución 1.0.0 ratificada (III y V amplían reglas sobre IA externa), esqueletos backend/frontend, docker-compose, CI; EC-010 resuelto, EC-021, DP-021 (Jev) | rama `chore/fase-0-5-preparacion` | — | — | — | Abierto (falta PR) |
| CD-003 | 2026-09-30 | Decisiones del responsable: DP-001, 005, 009, 011, 014, 016, 020, 021. ROS-94 → Fase 3; 2 historias nuevas en E01 (vistas/procedimientos, etiquetas de aplicación) | rama `chore/fase-0-5-preparacion` | — | ROS-94 (etiqueta de fase), ROS-191, ROS-192 creadas | — | Abierto (falta PR) |
| CD-004 | 2026-09-30 | Autenticación con Auth0 (ADR-0007 reemplaza a ADR-0006); tareas ROS-180…190 reescritas (75 h → 56 h; Sprint 1 155 h; MVP 513 h) | rama `chore/fase-0-5-preparacion` | — (002 aún sin spec) | ROS-180…190 | — | Abierto (falta PR) |
| CD-001 | *planificado* | Fase 0.5: bloque "Fuente de verdad" en ROS-1…190, prioridad nativa, horas en estimación, reformular actividad de ROS-135, crear tareas de preparación | — | — | ROS-1…190 + tareas nuevas | — | Planificado |

## Auditorías de sincronización

| Fecha | Alcance | Auditor | Diferencias encontradas | EC/CD abiertos | Resultado |
|---|---|---|---|---|---|
| 2026-09-29 | docs ↔ Jira ↔ Notion (creación) | Claude (agente) | Prioridad nativa vacía; horas fuera del campo; sin bloque de fuente; ROS-89 en E11 en Notion | EC-004, EC-005, EC-016, EC-017 | Con diferencias conocidas |

## Formato de una línea

```text
| CD-NNN | AAAA-MM-DD | Título corto | <hash commit docs> | specs/NNN-…/spec.md (FR-…) | ROS-n, ROS-m | #PR1, #PR2 | Abierto/Cerrado |
```
