# Registro de sincronización

> Bitácora de cada cambio que se propagó entre niveles (docs → specs → Jira → código) y de cada auditoría de sincronización. Procedimiento: [04-sincronizacion.md](../00-metodologia/04-sincronizacion.md).
> **El último `CD-NNN` de esta tabla determina el siguiente número.** Un CD está *Cerrado* solo cuando los cinco niveles dicen lo mismo.

## Cambios de documentación (CD)

| CD | Fecha | Título | Docs (commit) | Specs | Jira | PRs de código | Estado |
|---|---|---|---|---|---|---|---|
| CD-000 | 2026-09-29 | Creación inicial de `docs/` v1.0.0 a partir del prototipo, Notion y Jira | — (sin git: [EC-010](01-errores-conocidos.md#ec-010)) | — | Ya existían ROS-1…190 (creadas antes de la metodología) | — | Cerrado |
| CD-002 | 2026-09-30 | Fase 0.5: Spec Kit v1.0.13, constitución 1.0.0 ratificada (III y V amplían reglas sobre IA externa), esqueletos backend/frontend, docker-compose, CI; EC-010 resuelto, EC-021, DP-021 (Jev) | rama `chore/fase-0-5-preparacion` | — | — | — | Abierto (falta PR) |
| CD-003 | 2026-09-30 | Decisiones del responsable: DP-001, 005, 009, 011, 014, 016, 020, 021. ROS-94 → Fase 3; 2 historias nuevas en E01 (vistas/procedimientos, etiquetas de aplicación) | rama `chore/fase-0-5-preparacion` | — | ROS-94 (etiqueta de fase), ROS-191, ROS-192 creadas | — | Abierto (falta PR) |
| CD-004 | 2026-09-30 | Autenticación con Auth0 (ADR-0007 reemplaza a ADR-0006); tareas ROS-180…190 reescritas (75 h → 56 h; Sprint 1 155 h; MVP 513 h). Tenant de desarrollo configurado con el MCP (Rosetta API, Rosetta Web, Action post-login) | rama `chore/fase-0-5-preparacion` | — (002 aún sin spec) | ROS-180…190 | — | Abierto (falta PR) |
| CD-005 | 2026-09-30 | Reglas de agentes: nunca coautoría de IA en commits/PRs (`.claude/settings.json`), no commitear sin permiso, protocolo de sesión (07-delegacion §6) | rama `chore/fase-0-5-preparacion` | — | — | — | Abierto (falta PR) |
| CD-006 | 2026-10-01 | Aclaraciones de la spec 002: Microsoft solo con cuentas personales; el correo anterior se conserva si el nuevo choca con otra cuenta; onboarding sin paso de DDL hasta la 004; ROS-90 retitulada (sin Apple); DP-022…025, EC-022, EC-023 | rama `docs/CD-006-aclaraciones-spec-002` | `specs/002-autenticacion-oauth/spec.md` (FR-001, FR-007, FR-010, FR-019, FR-020; en la rama `002-autenticacion-oauth`) | ROS-90 (título), ROS-186 (actividades): **pendiente de actualizar** | — | Abierto (falta PR y Jira) |
| CD-007 | 2026-10-01 | Alinear `docs/` con el plan de la spec 002 (D1…D6): sin sesión se va a `/login?returnTo=`, CSP con nonce, contrato de `/api/me` y códigos de error nuevos (provisionales hasta DP-025), lista blanca de cierre de sesión con `/auth/error` y ruta `/auth/denied`, variables de solo pruebas, el frontend no reescribe `/api` ni `/auth` | rama `docs/CD-007-alinear-docs-con-plan-002` (apilada sobre CD-006) | `specs/002-autenticacion-oauth/plan.md` (tabla *Desviaciones*) | ROS-181, ROS-182, ROS-184, ROS-188 (actividades): **pendiente de actualizar**; lista de cierre de sesión del tenant de desarrollo: pendiente | — | Abierto (falta PR y Jira) |
| CD-008 | 2026-10-13 | Defensa en profundidad de FR-004 (spec 002): el backend exige el claim `email_verified` y responde 403 `email_not_verified`, y la Acción lo añade; texto genérico de `{proveedor}` en DP-025; DP-026 (versionar la Acción del tenant) | rama `docs/CD-008-email-verificado-y-dp-026` (apilada sobre CD-007) | `specs/002-autenticacion-oauth/spec.md` (FR-004) y `contracts/` | ROS-183 y ROS-185 (actividades): **pendiente de actualizar** | — | Abierto (falta PR y Jira) |
| CD-009 | 2026-10-13 | Verificador automático: `/verificar` lanza un agente nuevo de contexto limpio (`.claude/agents/verificador.md`, solo lectura más pruebas) con el prompt fijo de 07-delegacion §3.2, pasándole solo rama y carpeta; el acta se pega tal cual en el PR; la persona aprueba el PR y solo el verificador mueve a *Listo* | rama `docs/CD-009-verificador-automatico` (apilada sobre CD-008) | — (`specs/002-autenticacion-oauth/tasks.md` T094 ya cita `/verificar`) | — | — | Abierto (falta PR) |
| CD-010 | 2026-10-14 | MCP de Auth0 permanente con una aplicación M2M propia y permisos mínimos (deja de cerrarse al terminar); DP-027 (retención de datos personales en Auth0) | rama `docs/CD-010-mcp-permanente-y-dp-027` (apilada sobre CD-009) | `specs/002-autenticacion-oauth/spec.md` (Assumptions, aclaraciones del 2026-10-14) y `quickstart.md` | — | — | Abierto (falta PR) |
| CD-011 | 2026-10-14 | Hallazgos de la implementación de la spec 002: texto del control de cierre de sesión y nota de privacidad en DP-025; EC-024 (contraste de tokens secundarios) y EC-025 (`HealthView` en OpenAPI) | rama `docs/CD-011-textos-y-contraste` (apilada sobre CD-010) | `specs/002-autenticacion-oauth/tasks.md` (T098, T099) | — | — | Abierto (falta PR) |
| CD-012 | 2026-10-14 | Decisiones del Sprint 1: DP-017, DP-019, DP-022, DP-023, DP-024, DP-025, DP-026, DP-027 (DP-013 y DP-015 siguen abiertas); EC-022 resuelto en docs | rama `docs/CD-012-decisiones-sprint-1` (apilada sobre CD-011) | `specs/002-autenticacion-oauth/spec.md` (FR-019, FR-024, FR-036…FR-038, Edge Cases, Assumptions) y `tasks.md` (T037, T085, T088, T089); en la rama `002-autenticacion-oauth` | ROS-120, ROS-172, ROS-174, ROS-183, ROS-186, ROS-187 (actividades y comentario de CD-012): actualizadas el 2026-10-14 con OK de la persona | — | Abierto (falta PR) |
| CD-001 | *planificado* | Fase 0.5: bloque "Fuente de verdad" en ROS-1…190, prioridad nativa, horas en estimación, reformular actividad de ROS-135, crear tareas de preparación | — | — | ROS-1…190 + tareas nuevas | — | Planificado |

## Auditorías de sincronización

| Fecha | Alcance | Auditor | Diferencias encontradas | EC/CD abiertos | Resultado |
|---|---|---|---|---|---|
| 2026-09-29 | docs ↔ Jira ↔ Notion (creación) | Claude (agente) | Prioridad nativa vacía; horas fuera del campo; sin bloque de fuente; ROS-89 en E11 en Notion | EC-004, EC-005, EC-016, EC-017 | Con diferencias conocidas |

## Formato de una línea

```text
| CD-NNN | AAAA-MM-DD | Título corto | <hash commit docs> | specs/NNN-…/spec.md (FR-…) | ROS-n, ROS-m | #PR1, #PR2 | Abierto/Cerrado |
```
