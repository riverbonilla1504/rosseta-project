# Constitución de Rosetta

> **La constitución vinculante vive en [`.specify/memory/constitution.md`](../../.specify/memory/constitution.md).** Este archivo es solo un puntero: no duplica su contenido para que no puedan divergir.
>
> - **Versión vigente:** 1.0.0 — ratificada el 2026-09-30 con `/speckit-constitution` a partir del borrador v0.1.0 (CD-000).
> - **Enmiendas:** ADR + aprobación del responsable + aumento de versión (ver sección *Governance* de la constitución).
> - `/speckit-analyze` trata cualquier conflicto con la constitución como **CRITICAL**.

## Resumen de principios

| # | Principio | Idea central |
|---|---|---|
| I | La especificación es la fuente de verdad (NO NEGOCIABLE) | docs → specs → Jira → código; nunca al revés |
| II | Pruebas primero (NO NEGOCIABLE) | Prueba roja antes del código; PostgreSQL real; marcadores de trazabilidad |
| III | El motor nunca inventa (NO NEGOCIABLE) | Sin evidencia → Desconocida; "Confirmada" solo humana; nombre ≤ 0,40; IA externa solo redacta o aporta evidencia acotada con ADR |
| IV | Auditabilidad y determinismo | Misma evidencia → mismo resultado; acciones humanas inmutables; modo sin LLM |
| V | Seguridad y aislamiento de datos | Aislamiento, cifrado, sin secretos ni PII en logs, solo lectura, sin datos reales en pruebas, nada de datos de clientes a terceros sin ADR |
| VI | Simplicidad | Django + DRF + PostgreSQL, Next.js, Celery + Redis; servicios nuevos solo con ADR |
| VII | Consistencia de interfaz | Solo tokens Nocturne, un único componente de nivel, nombres únicos, WCAG 2.1 AA |

## Historial

| Versión | Fecha | Cambio |
|---|---|---|
| 0.1.0-borrador | 2026-09-29 | Borrador inicial en `docs/` |
| 1.0.0 | 2026-09-30 | Ratificación con Spec Kit; III y V amplían reglas sobre servicios de IA externos |
