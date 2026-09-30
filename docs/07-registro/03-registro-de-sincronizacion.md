# Registro de sincronización

> Bitácora de cada cambio que se propagó entre niveles (docs → specs → Jira → código) y de cada auditoría de sincronización. Procedimiento: [04-sincronizacion.md](../00-metodologia/04-sincronizacion.md).
> **El último `CD-NNN` de esta tabla determina el siguiente número.** Un CD está *Cerrado* solo cuando los cinco niveles dicen lo mismo.

## Cambios de documentación (CD)

| CD | Fecha | Título | Docs (commit) | Specs | Jira | PRs de código | Estado |
|---|---|---|---|---|---|---|---|
| CD-000 | 2026-09-29 | Creación inicial de `docs/` v1.0.0 a partir del prototipo, Notion y Jira | — (sin git: [EC-010](01-errores-conocidos.md#ec-010)) | — | Ya existían ROS-1…190 (creadas antes de la metodología) | — | Cerrado |
| CD-001 | *planificado* | Fase 0.5: bloque "Fuente de verdad" en ROS-1…190, prioridad nativa, horas en estimación, reformular actividad de ROS-135, crear tareas de preparación | — | — | ROS-1…190 + tareas nuevas | — | Planificado |

## Auditorías de sincronización

| Fecha | Alcance | Auditor | Diferencias encontradas | EC/CD abiertos | Resultado |
|---|---|---|---|---|---|
| 2026-09-29 | docs ↔ Jira ↔ Notion (creación) | Claude (agente) | Prioridad nativa vacía; horas fuera del campo; sin bloque de fuente; ROS-89 en E11 en Notion | EC-004, EC-005, EC-016, EC-017 | Con diferencias conocidas |

## Formato de una línea

```text
| CD-NNN | AAAA-MM-DD | Título corto | <hash commit docs> | specs/NNN-…/spec.md (FR-…) | ROS-n, ROS-m | #PR1, #PR2 | Abierto/Cerrado |
```
