# Implementation Plan: Proyectos y núcleo de datos

**Historias Jira**: ROS-78 · ROS-81 · ROS-84 · Subtareas ROS-172…ROS-179 (61 h) · Épicas E11, E12, E13

**Branch**: `003-proyectos-y-nucleo-de-datos` | **Date**: 2026-10-14 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/003-proyectos-y-nucleo-de-datos/spec.md`

## Summary

La feature crea tres cosas. Primero, los **proyectos**: modelo, API (crear, listar, detalle, renombrar, archivar y desarchivar) y pantallas (`/projects`, el formulario reutilizable que usa el onboarding de la 002, el selector de proyecto y la navegación `/p/{id}` con las cuatro pestañas de DP-017). Segundo, el **núcleo de datos** del MVP: los modelos y migraciones de `catalog`, `sources`, `evidence` y `review` tal como los define el [diccionario de datos](../../docs/04-datos/02-diccionario-de-datos.md), con la inmutabilidad de la evidencia y de las acciones humanas, y el endpoint de estado del proyecto. Tercero, el **aislamiento**: QuerySets `for_user` en todos los modelos de cliente (regla B4), 404 idéntico para lo ajeno, registro de accesos denegados sin datos personales y una suite de acceso cruzado generada desde el inventario de rutas que falla si aparece una operación sin cubrir.

La persistencia se comprueba con un proyecto de ejemplo sembrado desde una instantánea sintética (MOV0010, CTANRO, IMPTE…), porque la ingesta (004) y el motor (005) todavía no existen. Las decisiones están en [research.md](research.md); el modelo en [data-model.md](data-model.md); los contratos en [contracts/](contracts/); la validación de punta a punta en [quickstart.md](quickstart.md).

## Technical Context

**Language/Version**: Python 3.12 con Django 5.2 LTS y Django REST Framework (backend); TypeScript 5 estricto con Next.js 15.5 (App Router) y React 19.1 (frontend). Sin cambios de versión.

**Primary Dependencies**: ya presentes: DRF, drf-spectacular, django-environ, psycopg, PyJWT, `@auth0/nextjs-auth0`, Playwright, axe. **Nueva** (justificación en [research R-13](research.md#r-13--estado-del-servidor-en-el-cliente)): frontend `@tanstack/react-query` 5, ya prevista en [04-frontend §3](../../docs/03-arquitectura/04-frontend.md). Ninguna en el backend.

**Storage**: PostgreSQL 16. Tablas nuevas: `projects_project`, `catalog_table`, `catalog_column`, `catalog_column_interpretation`, `catalog_column_profile`, `sources_source`, `sources_naming_rule`, `evidence_evidence`, `evidence_conflict` (+ tabla intermedia) y `review_review_action`, con un *trigger* que impide modificar o borrar acciones ([data-model.md](data-model.md)).

**Testing**: pytest + pytest-django con PostgreSQL real y factory-boy; suite de acceso cruzado generada desde el esquema OpenAPI; Vitest + Testing Library; Playwright + axe (E2E-01 y E2E-09 de [01-estrategia-de-pruebas](../../docs/06-calidad/01-estrategia-de-pruebas.md)). Marcadores obligatorios (`@pytest.mark.story` / `@pytest.mark.fr` con `003:FR-###`; `[ROS-n][003:FR-###]` en TypeScript).

**Target Platform**: navegadores de escritorio modernos (RNF-29); servidor Linux en contenedores.

**Project Type**: aplicación web (`backend/` + `frontend/`); sin proyectos desplegables nuevos.

**Performance Goals**: sin metas de tiempo ([DP-018](../../docs/07-registro/02-decisiones-pendientes.md#dp-018)). Restricciones técnicas propias: la lista de proyectos y el estado se resuelven con un número fijo de consultas (sin N+1, comprobado con `django_assert_max_num_queries`); el estado no devuelve el catálogo completo, solo cifras y la cabeza de la cola (R-09).

**Constraints**: aislamiento por propietario en el QuerySet, nunca en la vista (B4); toda escritura de más de un modelo en un service atómico (B2); acciones y evidencia inmutables (Constitución IV); sin datos de clientes ni personales en registros ni en direcciones (FR-019); cobertura backend ≥ 85 % y frontend ≥ 80 %.

**Scale/Scope**: 3 historias, 8 subtareas, 29 FR, 9 SC; 10 tablas, 7 endpoints, 1 pantalla nueva (`/projects`) más la navegación del proyecto y el formulario compartido. El caso de ejemplo tiene ~30 tablas y ~300 columnas (la referencia de [03-datos-de-referencia §5](../../docs/04-datos/03-datos-de-referencia.md) en proporciones reducidas).

## Constitution Check

*GATE: debe pasar antes de la investigación (Fase 0) y se reevalúa tras el diseño (Fase 1).*

| Principio | Antes de Fase 0 | Después del diseño | Evidencia |
|---|---|---|---|
| **I. La especificación es la fuente de verdad** | Pasa con observaciones | Pasa con observaciones | Cada FR rastrea a ROS-78, 81 u 84. El diseño se aparta de `docs/` en 6 puntos (tabla *Desviaciones*): hay que alinearlos por **CD antes de implementar** (propuesta CD-013) |
| **II. Pruebas primero** | Pasa | Pasa | Estrategia abajo; PostgreSQL real; la suite de acceso cruzado falla con una ruta nueva sin caso (FR-018) |
| **III. El motor nunca inventa** | Pasa | Pasa | Esta feature no calcula niveles. La instantánea sembrada marca `engine_version = "fixture"` y solo sirve para pruebas y demostraciones; ningún proceso de esta feature produce `CONFIRMED` sin una `ReviewAction` (CHECK del diccionario) |
| **IV. Auditabilidad y determinismo** | Pasa | Pasa | `review_review_action` inmutable en el modelo y en la base (trigger); evidencia sin actualización; siembra determinista |
| **V. Seguridad y aislamiento** | Pasa | Pasa | QuerySets `for_user` en los 10 modelos; 404 idéntico; UUID v4; registro de denegaciones con campos cerrados; sin datos reales (instantánea sintética). Cifrado en reposo y HSTS de producción dependen de DP-015 (T de seguimiento, como T089 en la 002) |
| **VI. Simplicidad** | Pasa | Pasa | Sin servicios nuevos. Los "repositorios" de ROS-176 son Managers/QuerySets (B5). Sin caché de servidor (R-09). Una dependencia nueva, ya prevista en `docs/` |
| **VII. Consistencia de interfaz** | Pasa con observación | Pasa con observación | Nocturne y WCAG 2.1 AA; la insignia usa el valor interno del dialecto (DP-019). **Observación:** faltan textos de interfaz en `docs/` (propuesta DP-028); se implementan como provisionales marcados, igual que DP-025 en la 002 |
| **Restricciones** | Pasa | Pasa | Versiones fijadas; identificadores en inglés y textos en español |
| **Gates del flujo** (1 a 5) | Pendiente | Pendiente | Faltan `tasks.md` y `/speckit-analyze` sin CRITICAL, y el CD-013 de la tabla siguiente |

**Veredicto:** el diseño cumple la constitución, con dos condiciones antes de implementar: (1) CD-013 alinea `docs/` con las desviaciones D1–D6; (2) DP-028 registra los textos que faltan.

## Desviaciones respecto a `docs/` (a resolver por CD-013 antes de implementar)

La constitución no permite que un `plan.md` contradiga `docs/03-arquitectura/` ni `docs/04-datos/`. Estos puntos vienen de las aclaraciones de la spec (2026-10-14) o rellenan huecos del contrato; se proponen para un CD con el OK de la persona.

| # | Qué cambia | Qué dice hoy `docs/` | Por qué | Documentos que tocaría CD-013 |
|---|---|---|---|---|
| D1 | `projects_project.last_activity_at` (no nulo) e índice `(owner_id, last_activity_at desc)` | El diccionario no tiene "última actividad"; ROS-172 pide "índices por propietario y por fecha" | Aclaración de FR-005: la lista muestra y ordena por la última actividad del contenido, no solo por la fila del proyecto ([R-07](research.md#r-07--última-actividad)) | 04-datos/02 |
| D2 | Restricción única parcial `(owner_id, lower(name)) where archived_at is null` | No existe | Aclaración de FR-004 ([R-05](research.md#r-05--unicidad-del-nombre)) | 04-datos/02 |
| D3 | `PATCH /api/projects/{id}` acepta `archived: false` (desarchivar) y `name` en la misma petición; `GET /api/projects?archived=true` lista los archivados | 05-api: "archiva (`archived: true`)" y `?archived=false` | Aclaración de FR-013 ([R-08](research.md#r-08--archivar-desarchivar-y-solo-lectura)) | 03-arquitectura/05 §2 |
| D4 | Códigos de error nuevos: `project_name_taken` (400), `project_archived` (409) y `not_found` (404, cuerpo único para lo inexistente y lo ajeno) | 05-api §4 no los tiene | FR-003, FR-004, FR-013, FR-015 ([R-03](research.md#r-03--aislamiento-y-respuesta-no-encontrado), R-08) | 03-arquitectura/05 §4 |
| D5 | Forma de las respuestas de `/api/projects` y de `GET /api/projects/{id}/state` ([contracts/projects-api.yaml](contracts/projects-api.yaml)) | 05-api lista los endpoints sin detallar la respuesta | FR-005, FR-022; las specs no fijan contratos que `05-api` no recoja | 03-arquitectura/05 §2–3 |
| D6 | ROS-177 "caché ligera del estado por proyecto" = caché **del cliente** por proyecto (TanStack Query), sin caché de servidor | La actividad de ROS-177 no dice dónde | Sin metas de tiempo (DP-018) una caché de servidor es complejidad sin necesidad medida e invalida mal tras confirmar ([R-09](research.md#r-09--estado-del-proyecto-al-abrir)) | 02-requisitos/03-tareas-mvp (ROS-177) y Jira |

## Estrategia de pruebas

| Nivel | Qué cubre | Dónde |
|---|---|---|
| Modelo y base de datos | Restricciones (única parcial, CHECK de nivel/acción, CHECK de peso de reglas ≤ 0,40), trigger de inmutabilidad, cascadas y `PROTECT`, migraciones desde cero | `backend/tests/projects/`, `backend/tests/core_data/` |
| Services | Crear, renombrar, archivar, desarchivar, conflicto de nombre, `touch_activity`, guardas de solo lectura, atomicidad con fallo inyectado | `backend/tests/projects/test_services.py` |
| API | Contrato (esquema OpenAPI contra `contracts/projects-api.yaml`), validaciones, estado, número máximo de consultas | `backend/tests/api/` |
| Seguridad | Acceso cruzado de **cada** operación (generado desde el esquema, FR-018), 404 idéntico byte a byte, registro de denegaciones sin datos personales, UUID en rutas, nada sensible en registros | `backend/tests/security/` |
| Frontend unitario | Formulario compartido (validación, envío único, errores del servidor), lista, estado vacío, selector, descarte de datos tardíos al cambiar de proyecto | `frontend/tests/unit/` |
| E2E | E2E-01 (acceso → onboarding → proyecto; cierra T087 de la 002), crear desde `/projects`, cambiar de proyecto sin mezcla, archivar y desarchivar, E2E-09 (B no ve a A), axe y teclado | `frontend/tests/e2e/` |

Cada criterio de aceptación tiene su prueba roja antes de la implementación (commit `test(...)` previo).

## Project Structure

### Documentation (this feature)

```text
specs/003-proyectos-y-nucleo-de-datos/
├── plan.md              # este archivo
├── research.md          # Fase 0
├── data-model.md        # Fase 1
├── quickstart.md        # Fase 1
├── contracts/
│   ├── projects-api.yaml     # OpenAPI de /api/projects y /state
│   └── ui-project-form.md    # contrato del formulario compartido con la 002
├── checklists/
│   ├── requirements.md
│   └── proyectos-y-datos.md
└── tasks.md             # Fase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
backend/
├── apps/
│   ├── core/
│   │   ├── models.py            # NUEVO: UUIDModel, TimeStampedModel (abstractos)
│   │   ├── ownership.py         # NUEVO: get_owned_or_404() + registro de denegación
│   │   └── exceptions.py        # + códigos not_found, project_archived, project_name_taken
│   ├── projects/                # NUEVA: Project, services (create/rename/archive/unarchive/touch_activity), state selector, API
│   ├── catalog/                 # NUEVA: Table, Column, ColumnInterpretation, ColumnProfile (solo modelos y QuerySets)
│   ├── sources/                 # NUEVA: Source, NamingRule (solo modelos y QuerySets)
│   ├── evidence/                # NUEVA: Evidence, Conflict (solo modelos; evidencia sin actualización)
│   ├── review/                  # NUEVA: ReviewAction inmutable + trigger en la migración
│   └── accounts/                # sin cambios de modelo
├── apps/projects/management/commands/seed_reference_project.py
└── tests/
    ├── projects/ · core_data/ · api/ · security/
    ├── factories/               # + projects, catalog, sources, evidence, review
    └── fixtures/core_demo_snapshot.json   # instantánea sintética del caso de referencia

frontend/
├── src/
│   ├── app/(app)/
│   │   ├── layout.tsx                    # + QueryClientProvider (R-13)
│   │   ├── projects/page.tsx             # NUEVO: lista, estado vacío, crear, filtro archivados
│   │   └── p/[projectId]/
│   │       ├── layout.tsx                # NUEVO: pestañas (DP-017), insignia, selector, aviso de solo lectura
│   │       ├── page.tsx                  # Panorama (vacío hasta su feature)
│   │       ├── review/page.tsx · catalog/page.tsx · sources/page.tsx   # vacías hasta sus features (R-14)
│   ├── features/projects/
│   │   ├── ProjectForm.tsx               # formulario compartido (contracts/ui-project-form.md)
│   │   ├── ProjectList.tsx · ProjectSwitcher.tsx · ProjectBadge.tsx · ArchiveControls.tsx
│   │   ├── api.ts                        # llamadas a /api/projects con apiFetch
│   │   ├── queryKeys.ts                  # claves por proyecto
│   │   └── copy.ts                       # textos (provisionales hasta DP-028)
│   └── lib/query-client.ts               # NUEVO
└── tests/unit/ · tests/e2e/
```

**Structure Decision**: aplicación web existente. Las apps de Django siguen [03-backend §1 y §3](../../docs/03-arquitectura/03-backend.md); las rutas de Next.js siguen [04-frontend §1](../../docs/03-arquitectura/04-frontend.md) con `p/[projectId]/layout.tsx` para la navegación del proyecto y sin ruta propia para Convenciones (DP-017).

## Dependencias con otras features

- **002 (en curso):** esta feature desbloquea T055, T051, T052, T056 y T087 de la 002 (formulario de proyecto y E2E-01). El formulario se exporta como componente y el onboarding solo añade la bienvenida y la llamada a `complete` ([contracts/ui-project-form.md](contracts/ui-project-form.md)).
- **004–008:** usan los modelos y la guarda `ensure_project_writable()` de esta feature; cada operación nueva entra en la suite de acceso cruzado o hace fallar la verificación (FR-018).
- **DP-015:** HSTS y cifrado en reposo del entorno desplegado y la rotación de llaves dependen del proveedor; la parte de ROS-179 que se puede hacer ahora (HSTS en `prod.py`, documentación, nada sensible en URLs ni registros) entra en esta feature y el resto queda como tarea bloqueada.
- **DP-028 (propuesta):** textos de la pantalla de proyectos y del formulario.

## Complexity Tracking

Sin violaciones de la constitución que justificar.
