---

description: "Lista de tareas de la feature 003-proyectos-y-nucleo-de-datos"
---

# Tasks: Proyectos y núcleo de datos

**Input**: documentos de diseño en `specs/003-proyectos-y-nucleo-de-datos/`: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Historias Jira**: ROS-78 · ROS-81 · ROS-84 · **Subtareas**: ROS-172…ROS-179 (61 h)

**Prerrequisitos**: `/speckit-analyze` sin hallazgos CRITICAL; **CD-013** (desviaciones D1–D6 del plan) hecho el 2026-10-14 (T001) y presente en esta rama por cherry-pick; los ítems de [checklists/proyectos-y-datos.md](checklists/proyectos-y-datos.md) siguen sin marcar: `/speckit-implement` los lee como compuerta.

**Pruebas**: **obligatorias** (Constitución II).

## Formato: `[ID] [P?] [Story?] [ROS-n] Descripción con ruta`

- **[P]**: se puede hacer en paralelo (archivos distintos, sin dependencia de tareas incompletas).
- **[US1…US5]**: historia de usuario de la spec; solo en las fases de historia.
- **[ROS-n]**: la subtarea de Jira que implementa la tarea ([04-sincronizacion §6](../../docs/00-metodologia/04-sincronizacion.md)). Las actividades de [03-tareas-mvp](../../docs/02-requisitos/03-tareas-mvp.md) son el mínimo.
- **⛔ BLOQUEADA**: no se empieza hasta que se cierre la decisión indicada.

## Reglas que aplican a TODAS las tareas de prueba

1. **Prueba roja primero**: se ejecuta, se ve fallar y se commitea como `test(<ámbito>): ROS-n … (roja)` antes del código.
2. **Marcadores**: Python `@pytest.mark.story("ROS-n")` y `@pytest.mark.fr("003:FR-###")`; TypeScript, título que empieza por `[ROS-n][003:FR-###]`. La historia es la del FR en la spec (ROS-78 para FR-001…FR-013 y FR-029; ROS-84 para FR-014…FR-020; ROS-81 para FR-021…FR-028).
3. **Datos sintéticos** (`@example.test`, instantánea `CORE_DEMO`); nunca datos reales.
4. **PostgreSQL real** en integración.
5. **Ámbitos de commit**: `projects`, `catalog` (incluye sources, evidence y review), `security`, `ui`, `infra`.
6. **Textos**: los de `docs/` tal cual; el resto en `features/projects/copy.ts` marcado `// PROVISIONAL (DP-028)` hasta que se apruebe (T002). Nada de `[PENDIENTE]` inventado.

---

## Fase 1: Preparación

**Propósito**: alinear `docs/`, registrar los textos que faltan y añadir lo mínimo de infraestructura.

- [X] T001 [ROS-172] Proponer **CD-013** con el OK de la persona: llevar las desviaciones D1–D6 de [plan.md](plan.md#desviaciones-respecto-a-docs-a-resolver-por-cd-013-antes-de-implementar) a `docs/04-datos/02-diccionario-de-datos.md` (`last_activity_at`, índice y única parcial), `docs/03-arquitectura/05-api.md` (§2 `PATCH` con `archived: false`, `?archived=true`, respuestas de `/api/projects` y `/state`; §4 `not_found`, `project_archived`, `project_name_taken`) y `docs/02-requisitos/03-tareas-mvp.md` (ROS-177, caché del cliente), y propagar a Jira con OK. **Las pruebas marcadas "tras CD-013" (T007, T018, T024, T029, T047, T054, T055) y sus implementaciones (T008, T019, T026, T027, T033, T052, T058, T059) esperan a que CD-013 esté fusionado.**
- [X] T002 [ROS-174] Proponer **DP-028** con el OK de la persona (CD aparte o dentro de CD-013): textos de las etiquetas y del botón del formulario, errores de validación y de nombre repetido, filtro de archivados, confirmación y aviso de archivar, aviso de solo lectura, desarchivar, página de "no encontrado", porcentaje sin columnas y contenido mínimo de las pestañas con fuentes (R-14); añadir "aún no tienes proyectos" a `04-contenido §5`.
  - *2026-10-14: CD-013 hecho (`b92ff99` en `docs/CD-013-proyectos-y-textos`, cherry-pick `2035983` en esta rama) y propagado a ROS-173, ROS-174 y ROS-177 con OK de la persona. DP-028 registrada con sus propuestas y **abierta**: los textos se implementan como `PROVISIONAL (DP-028)` y se cierran por CD antes del cierre de la feature.*
- [X] T003 [P] [ROS-174] Añadir `@tanstack/react-query` 5 a `frontend/package.json` con `pnpm add` (justificación en [research R-13](research.md#r-13--estado-del-servidor-en-el-cliente)); `pnpm-lock.yaml` actualizado.
- [X] T004 [P] [ROS-175] Crear las apps vacías `backend/apps/projects`, `catalog`, `sources`, `evidence` y `review` (`__init__.py`, `apps.py`) y registrarlas en `INSTALLED_APPS` de `backend/config/settings/base.py`.

---

## Fase 2: Fundamentos (bloquean todas las historias)

**Propósito**: modelos base, todo el núcleo de datos del diccionario, `for_user` y la respuesta "no encontrado".

- [X] T005 [P] [ROS-175] **Prueba roja** `backend/tests/core_data/test_base_models.py`: `UUIDModel` genera UUID v4 en la aplicación; `TimeStampedModel` rellena `created_at`/`updated_at` en UTC. Marcadores: ROS-81 · FR-026.
- [X] T006 [ROS-175] Implementar `backend/apps/core/models.py` (`UUIDModel`, `TimeStampedModel`, abstractos). T005 pasa.
- [X] T007 [P] [ROS-172] **Prueba roja** `backend/tests/projects/test_models.py` (tras CD-013): `name` varchar(120) no nulo; `description` no nulo, por defecto `""`; `source_dialect` con `CHECK` "`tsql` | `oracle` | `postgres`"; `organization_id` nulo; `owner` `PROTECT`; `archived_at` nulo = activo; `last_activity_at` no nulo; la restricción `UniqueConstraint(Lower("name"), "owner", condition=Q(archived_at__isnull=True))` rechaza "core_prd" frente a "CORE_PRD" activos y admite el mismo nombre si uno está archivado o es de otra persona; índice `(owner_id, last_activity_at desc)`. Marcadores: ROS-78 · FR-001, FR-004, FR-010.
- [X] T008 [ROS-172] Implementar `backend/apps/projects/models.py` (`Project`, `ProjectQuerySet.for_user`) y su migración inicial. T007 pasa.
- [X] T009 [P] [ROS-175] **Prueba roja** `backend/tests/core_data/test_catalog_models.py`: columnas y tipos de `catalog_table`, `catalog_column`, `catalog_column_interpretation` y `catalog_column_profile` según el diccionario; `CHECK` "`level = 'CONFIRMED'` ⇔ `confirmed_by_action_id IS NOT NULL`"; único `(column_id, source_id)` del perfil; único 1:1 interpretación–columna; cascadas desde proyecto y tabla. Marcadores: ROS-81 · FR-026.
- [X] T010 [P] [ROS-175] **Prueba roja** `backend/tests/core_data/test_sources_models.py`: `kind` "`SCHEMA_DDL` | `DATA_SAMPLE`", `status` "`PENDING` | `PROCESSING` | `READY` | `FAILED`"; `sources_naming_rule.weight` "≤ 0,40 (CHECK)"; único "`(coalesce(project_id, 'global'), pattern, match_type)`"; `project_id` nulo = regla global. Marcadores: ROS-81 · FR-026.
- [X] T011 [P] [ROS-175] **Prueba roja** `backend/tests/core_data/test_evidence_review_models.py`: `Evidence.save()` sobre una fila existente lanza error (FR-025) y la cita es obligatoria; `ReviewAction` no se actualiza ni se borra desde el modelo **ni con SQL directo** (trigger `BEFORE UPDATE OR DELETE`); `reason` obligatorio si `action = 'REJECT'` (CHECK); `actor` `PROTECT`; `evidence_conflict` y su tabla intermedia. Marcadores: ROS-81 · FR-023, FR-025, FR-026.
- [X] T012 [ROS-175] Implementar `backend/apps/catalog/models.py` y su migración exactamente como el diccionario (más el índice `(project_id, level, impact desc)` de [data-model.md](data-model.md)). T009 pasa.
- [X] T013 [P] [ROS-175] Implementar `backend/apps/sources/models.py` y su migración. T010 pasa.
- [X] T014 [ROS-175] Implementar `backend/apps/evidence/models.py` (`Evidence` sin actualización, `Conflict`) y `backend/apps/review/models.py` (`ReviewAction` inmutable) con sus migraciones, incluida `backend/apps/review/migrations/0002_immutable_trigger.py` con el trigger. T011 pasa.
- [X] T015 [P] [ROS-178] **Prueba roja** `backend/tests/core_data/test_for_user.py`: para **cada** modelo de cliente, `for_user(A)` nunca devuelve filas de B; `NamingRule.objects.for_user(A)` devuelve las del proyecto de A más las globales. Marcadores: ROS-84 · FR-014.
- [X] T016 [ROS-178] Implementar `for_user` en los QuerySets de `projects`, `catalog`, `sources`, `evidence` y `review`. T015 pasa.
- [X] T017 [P] [ROS-176] **Prueba roja** `backend/tests/core_data/test_migrations.py`: `migrate` desde cero sin errores y `makemigrations --check --dry-run` sin cambios pendientes. Cubre SC-007. Marcadores: ROS-81 · FR-028.
- [X] T018 [P] [ROS-178] **Prueba roja** `backend/tests/security/test_ownership.py` (tras CD-013) para `get_owned_or_404()`: recurso ajeno, inexistente e identificador que no es UUID → `404` con cuerpo **idéntico** `{"error":{"code":"not_found",…}}`; solo el ajeno emite `access_denied` por `rosetta.security` con exactamente `event`, `reason`, `user_id`, `path` y `resource_id`. Marcadores: ROS-84 · FR-015, FR-017.
- [X] T019 [ROS-178] Implementar `backend/apps/core/ownership.py` y los códigos `not_found`, `project_archived` y `project_name_taken` en `backend/apps/core/exceptions.py` (y sus mensajes en `messages.py`). T018 pasa.
- [X] T020 [P] [ROS-176] Factorías en `backend/tests/factories/` (`projects.py`, `catalog.py`, `sources.py`, `evidence.py`, `review.py`) con datos sintéticos.
- [X] T021 [P] [ROS-174] **Prueba roja** `frontend/tests/unit/query-provider.test.tsx`: el área privada ofrece un `QueryClient` único por pestaña y sin reintentos automáticos de mutaciones. Marcadores: ROS-78 · FR-009.
- [X] T022 [ROS-174] Implementar `frontend/src/lib/query-client.ts` y el `QueryClientProvider` en `frontend/src/app/(app)/layout.tsx`, y crear `frontend/src/features/projects/api.ts`, `queryKeys.ts` y `copy.ts` (etiquetas de dialecto de DP-019, "aún no tienes proyectos", "Todavía no hay evidencia…", el resto `PROVISIONAL (DP-028)`). T021 pasa.

**Checkpoint**: todo el núcleo de datos existe, aislado por propietario y con migraciones reproducibles.

---

## Fase 3: Historia 1 · Crear un proyecto (P1) 🎯 MVP

**Objetivo**: crear un proyecto con nombre y dialecto desde un formulario reutilizable.
**Prueba independiente**: crear un proyecto por la API y con el formulario; el mismo componente lo usa el onboarding de la 002 (T055 de la 002).

- [X] T023 [P] [US1] [ROS-173] **Prueba roja** `backend/tests/projects/test_services.py` (`create_project`): recorta el nombre; rechaza vacío, solo espacios y > 120; rechaza nombre repetido entre activos sin distinguir mayúsculas (los archivados no cuentan); dialecto obligatorio; `owner` = persona; `description = ""`; `last_activity_at = created_at`. Marcadores: ROS-78 · FR-001, FR-003, FR-004.
- [X] T024 [P] [US1] [ROS-173] **Prueba roja** `backend/tests/api/test_projects_create.py` (tras CD-013): `POST /api/projects` → `201` con `ProjectSummary` de [contracts/projects-api.yaml](contracts/projects-api.yaml); `400 validation_error` con `details` por campo; `400 project_name_taken`; campos desconocidos rechazados; dos peticiones simultáneas con el mismo nombre crean un solo proyecto (la otra recibe `project_name_taken`). Marcadores: ROS-78 · FR-001, FR-003, FR-004.
- [X] T025 [P] [US1] [ROS-174] **Prueba roja** `frontend/tests/unit/project-form.test.tsx` según [contracts/ui-project-form.md](contracts/ui-project-form.md): exactamente tres opciones "SQL Server", "Oracle" y "PostgreSQL" sin preselección; validación local con error junto al campo y anunciado; un solo envío en curso; errores del servidor por campo; error genérico conservando lo escrito; `onCreated` con el proyecto. Marcadores: ROS-78 · FR-001, FR-002, FR-003, FR-029.
- [X] T026 [US1] [ROS-173] Implementar `create_project()` y `touch_activity()` en `backend/apps/projects/services.py` (atómico; `IntegrityError` de la única parcial → `project_name_taken`). T023 pasa.
- [X] T027 [US1] [ROS-173] Implementar serializer, vista y rutas de `POST /api/projects` y `GET /api/projects/{project_id}` en `backend/apps/projects/serializers.py`, `views.py` y `urls.py`, e incluirlas en `backend/config/urls.py`; la vista de detalle usa `get_owned_or_404()`. T024 pasa.
- [X] T028 [US1] [ROS-174] Implementar `frontend/src/features/projects/ProjectForm.tsx` (y su `.module.css`, solo `var(--nx-*)`, sin `--nx-text-secondary` ni `--nx-text-muted` sobre `--nx-surface`, EC-024). T025 pasa.

**Checkpoint**: la 002 puede retomar T055, T051, T052, T056 y T087 con este formulario.

---

## Fase 4: Historia 2 · Ver mis proyectos y moverme entre ellos (P1)

**Objetivo**: lista, estado vacío, apertura del proyecto con su navegación y selector sin mezcla de datos.
**Prueba independiente**: dos proyectos sembrados con datos distintos; cambiar entre ellos sin que aparezca nada del anterior.

- [X] T029 [P] [US2] [ROS-173] **Prueba roja** `backend/tests/api/test_projects_list.py` (tras CD-013): `GET /api/projects` devuelve solo los activos propios, con la paginación de 05-api §1; `?archived=true` solo los archivados; `table_count`, `column_count` y `confirmed_ratio` (confirmadas directas + propagadas / columnas; `null` con 0 columnas, DP-020); orden `last_activity_at desc, id`; número de consultas constante con 1 y con 20 proyectos. Marcadores: ROS-78 · FR-005.
- [X] T030 [P] [US2] [ROS-174] **Prueba roja** `frontend/tests/unit/project-list.test.tsx`: estado vacío "aún no tienes proyectos" con la acción de crear; cada fila con nombre, dialecto, fecha, tablas, columnas y porcentaje; crear desde la lista navega a `/p/{id}`. Marcadores: ROS-78 · FR-005, FR-006, FR-001.
- [X] T031 [P] [US2] [ROS-174] **Prueba roja** `frontend/tests/unit/project-switcher.test.tsx`: lista los proyectos activos; al cambiar, cancela las consultas del anterior y una respuesta tardía del anterior nunca se pinta en el nuevo (respuesta simulada con retraso). Marcadores: ROS-78 · FR-009.
- [X] T032 [P] [US2] [ROS-174] **Prueba roja E2E** `frontend/tests/e2e/projects-navigation.spec.ts`: crear "Ventas" con "Oracle" desde `/projects` → `/p/{id}` con insignia `Ventas · oracle` y pestañas Panorama, Revisión, Catálogo y Fuentes (sin Hallazgos ni Generador); cambiar entre dos proyectos con la red ralentizada → cero datos del anterior (SC-004); dos pestañas con proyectos distintos no se mezclan. Marcadores: ROS-78 · FR-001, FR-007, FR-008, FR-009.
- [X] T033 [US2] [ROS-173] Implementar `GET /api/projects` en `backend/apps/projects/selectors.py` (agregados en una consulta) y `views.py`. T029 pasa.
- [X] T034 [US2] [ROS-174] Implementar `frontend/src/app/(app)/projects/page.tsx` y `frontend/src/features/projects/ProjectList.tsx` (con `ProjectForm`; `onCreated` → `/p/{id}`). T030 pasa.
- [X] T035 [US2] [ROS-174] Implementar `frontend/src/app/(app)/p/[projectId]/layout.tsx` con las pestañas de DP-017, `ProjectBadge.tsx` (valor interno del dialecto) y `ProjectSwitcher.tsx`. T031 pasa.
- [X] T036 [US2] [ROS-174] Crear las páginas `frontend/src/app/(app)/p/[projectId]/page.tsx`, `review/page.tsx`, `catalog/page.tsx` y `sources/page.tsx` con el estado de proyecto sin fuentes de 04-contenido §5 y el contenido mínimo provisional (R-14). T032 pasa.
  - *2026-10-19: la E2E de T032 fallaba por un defecto del proxy BFF de la 002 (EC-026: el cuerpo se reenviaba con `Transfer-Encoding: chunked` y Django lo recibía vacío, así que todo `POST` con JSON desde el navegador daba `400`). Arreglado en esta rama con el OK de la persona (reenviar `content-length`, prueba roja en `api-proxy.test.ts`); el registro de EC-026 y el contrato `bff-proxy.md` de la 002 van por CD. Las páginas de las pestañas muestran siempre el estado sin fuentes: la variante con fuentes llega con T048/T053.*

**Checkpoint**: crear, listar, abrir y cambiar de proyecto funcionan de punta a punta.

---

## Fase 5: Historia 3 · Aislamiento de los datos de cada persona (P1)

**Objetivo**: nadie ve ni toca lo ajeno; registros y direcciones sin datos sensibles; transporte seguro en producción.
**Prueba independiente**: la suite de acceso cruzado al 100 % y E2E-09.

- [X] T037 [P] [US3] [ROS-178] **Prueba roja** `backend/tests/security/test_cross_access.py` según [research R-04](research.md#r-04--suite-de-acceso-cruzado-completa): lista de operaciones generada desde el esquema OpenAPI y registro `CROSS_ACCESS_CASES`; una operación con parámetro de ruta sin caso hace **fallar** la suite; para cada caso, B recibe el mismo `404` que con un UUID inventado y el recurso de A no cambia; los listados de B no contienen nada de A. Cubre SC-001. Marcadores: ROS-84 · FR-014, FR-015, FR-018.
- [X] T038 [P] [US3] [ROS-179] **Prueba roja** `backend/tests/security/test_no_sensitive_data.py`: durante un recorrido completo (crear, listar, estado, renombrar, archivar, acceso denegado) los registros capturados no contienen correos, nombres, credenciales ni nombres de tablas o columnas del proyecto sembrado; todas las rutas con recurso usan solo UUID. Cubre SC-005. Marcadores: ROS-84 · FR-016, FR-019.
  - *2026-10-19: roja en `5070ec5`. El recorrido usa `GET …/state` y `PATCH`, así que pasa con T052 y T059 (historias 4 y 5), no con T041. En verde desde `76957ff` (T059).*
- [X] T039 [P] [US3] [ROS-178] **Prueba roja E2E** `frontend/tests/e2e/cross-access.spec.ts` (E2E-09): B abre `/p/<id de A>` y ve la misma pantalla de "no encontrado" que con un UUID inventado; ni la lista ni el selector de B muestran proyectos de A. Marcadores: ROS-84 · FR-014, FR-015.
- [X] T040 [P] [US3] [ROS-179] **Prueba roja** en `backend/tests/test_settings.py`: `prod.py` activa `SECURE_SSL_REDIRECT`, `SECURE_HSTS_SECONDS = 31536000` y `SECURE_HSTS_INCLUDE_SUBDOMAINS` (07-seguridad §5). Marcadores: ROS-84 · FR-020.
- [X] T041 [US3] [ROS-178] Usar `get_owned_or_404()` en todas las vistas de proyecto (parámetro de ruta como texto, validado en el helper, para que un no-UUID también dé `not_found`) y registrar sus casos en `CROSS_ACCESS_CASES`. T037 y T038 pasan.
- [X] T042 [US3] [ROS-178] Implementar `frontend/src/app/(app)/p/[projectId]/not-found.tsx` y llevar a ella el `404` de la API (texto provisional DP-028). T039 pasa.
  - *2026-10-19: la pantalla vive en `p/not-found.tsx` y no en `p/[projectId]/not-found.tsx`: Next.js atiende el `notFound()` del layout de un segmento con la pantalla del segmento padre (comprobado), y así la barra del proyecto no se pinta. El layout pide el proyecto en el servidor (`features/projects/server.ts`).*
- [X] T043 [US3] [ROS-179] Activar HSTS y la redirección a HTTPS en `backend/config/settings/prod.py`. T040 pasa.
  - *2026-10-19: `prod.py` ya tenía `SECURE_SSL_REDIRECT`, `SECURE_HSTS_SECONDS = 31_536_000` y `SECURE_HSTS_INCLUDE_SUBDOMAINS` desde la inicialización: la prueba de T040 pasó a la primera y no hubo cambios.*
- [X] T044 [US3] [ROS-179] Documentar la configuración de seguridad de esta feature (HSTS, rutas solo con UUID, registros sin datos sensibles) en `specs/003-proyectos-y-nucleo-de-datos/evidence/security-config.md`; lo que deba ir a `docs/` se propone por CD.
- [ ] T045 [US3] [ROS-179] ⛔ **BLOQUEADA por [DP-015](../../docs/07-registro/02-decisiones-pendientes.md#dp-015)**: cifrado en reposo del proveedor, gestión y rotación de llaves y revisión de configuración del entorno desplegado (SC-009), en `evidence/security-config.md`.

**Checkpoint**: SC-001 y SC-005 verificables.

---

## Fase 6: Historia 4 · El trabajo no se pierde (P2)

**Objetivo**: estado del proyecto idéntico al reabrir; siembra reproducible; escrituras de todo o nada.
**Prueba independiente**: sembrar `CORE_DEMO`, abrir, cerrar sesión, reabrir desde otro navegador y comparar.

- [X] T046 [P] [US4] [ROS-176] **Prueba roja** `backend/tests/projects/test_seed.py`: `seed_reference_project --owner-sub …` crea `CORE_DEMO` (`tsql`) con `MOV0010` y sus 11 columnas, nombres de negocio y niveles de [03-datos-de-referencia §2](../../docs/04-datos/03-datos-de-referencia.md), las tablas de §3, las tablas extra de §5, las reglas globales de §6 y tres `CONFIRM` (SUCCOD, MONCOD, FEALT); `engine_version = "fixture"`; reejecutarlo no duplica; un fallo inyectado a mitad deja cero filas. Cubre SC-006 y SC-007. Marcadores: ROS-81 · FR-027, FR-024.
- [X] T047 [P] [US4] [ROS-177] **Prueba roja** `backend/tests/api/test_project_state.py` (tras CD-013): forma de `ProjectState` del contrato; las cinco claves de nivel siempre presentes; `coverage` con `total_columns` y `by_level`; `queue_head` ≤ 50, sin `CONFIRMED`, con el orden de 05-api §3.6 (impacto desc, conflicto abierto desc, `TABLA.COLUMNA` asc); dos lecturas y una lectura con otra credencial de la misma persona devuelven el mismo documento, y una instantánea del catálogo guardado (tablas, columnas e interpretaciones con nivel) tomada antes y después coincide (SC-002); número de consultas constante. Marcadores: ROS-81 · FR-021, FR-022.
- [X] T048 [P] [US4] [ROS-177] **Prueba roja** `frontend/tests/unit/project-state.test.tsx`: el estado se guarda por proyecto (clave con `projectId`) y las pestañas muestran el estado sin fuentes solo cuando `sources` está vacío. Marcadores: ROS-81 · FR-022.
- [X] T049 [P] [US4] [ROS-177] **Prueba roja E2E** `frontend/tests/e2e/project-reopen.spec.ts`: con `CORE_DEMO` sembrado, abrir, cerrar sesión y reabrir en otro contexto del navegador → mismo estado (SC-002). Marcadores: ROS-81 · FR-021.
- [X] T050 [US4] [ROS-176] Crear `backend/tests/fixtures/core_demo_snapshot.json` (sintético, de 03-datos-de-referencia §2, §3, §5 y §6).
  - *2026-10-19: 45 tablas y 82 columnas: `MOV0010`, las seis de §3 (sus columnas, salvo las que nombra §3, son sintéticas: `PARCOD`, `PAPCOD`) y `EXT0001`…`EXT0038` con `PGCOD` (38), `CTANRO` (21) y `PETDOC` (6); `PETDOC` vive en `CLI0001`. Sin descripciones: las de §2 citan fuentes fuera del MVP (EC-003). La fuente DDL no tiene archivo (`size_bytes = 0`).*
- [X] T051 [US4] [ROS-176] Implementar `backend/apps/projects/management/commands/seed_reference_project.py` (atómico e idempotente). T046 pasa.
- [X] T052 [US4] [ROS-177] Implementar `get_project_state()` en `backend/apps/projects/selectors.py` y `GET /api/projects/{project_id}/state`. T047 pasa.
- [X] T053 [US4] [ROS-177] Implementar `useProjectState()` en `frontend/src/features/projects/api.ts` y usarlo en las páginas del proyecto. T048 y T049 pasan.

**Checkpoint**: SC-002, SC-006 y SC-007 verificables.

---

## Fase 7: Historia 5 · Renombrar y archivar proyectos (P3)

**Objetivo**: renombrar, archivar, ver archivados en solo lectura y desarchivar.
**Prueba independiente**: renombrar y archivar un proyecto; verlo con el filtro; desarchivarlo con y sin conflicto de nombre.

- [X] T054 [P] [US5] [ROS-173] **Prueba roja** `backend/tests/projects/test_lifecycle.py` (tras CD-013): renombrar con las reglas de FR-001/FR-003/FR-004; cambiar la descripción; `source_dialect` no modificable; archivar fija `archived_at` y actualiza `last_activity_at`; sobre un archivado toda mutación salvo desarchivar → `project_archived` (`ensure_project_writable()`); desarchivar con nombre libre lo reactiva; con nombre ocupado → `project_name_taken` sin cambios; desarchivar con renombre es de todo o nada (fallo inyectado). Marcadores: ROS-78 · FR-010, FR-011, FR-012, FR-013; ROS-81 · FR-024.
- [X] T055 [P] [US5] [ROS-173] **Prueba roja** `backend/tests/api/test_projects_update.py` (tras CD-013): `PATCH /api/projects/{project_id}` según el contrato (`name`, `description`, `archived`; `source_dialect` → `400`; `409 project_archived`; `400 project_name_taken` al desarchivar). Marcadores: ROS-78 · FR-010, FR-011, FR-012, FR-013.
- [X] T056 [P] [US5] [ROS-174] **Prueba roja** `frontend/tests/unit/archive-controls.test.tsx`: renombrar con las mismas validaciones que el formulario; archivar el proyecto abierto lleva a `/projects`; filtro de archivados; aviso de solo lectura sin controles de modificación; desarchivar pide un nombre nuevo si choca. Marcadores: ROS-78 · FR-010, FR-011, FR-012, FR-013.
- [X] T057 [P] [US5] [ROS-174] **Prueba roja E2E** `frontend/tests/e2e/projects-archive.spec.ts`: escenarios Q7, Q8 y Q9 de [quickstart.md](quickstart.md). Marcadores: ROS-78 · FR-012, FR-013.
- [X] T058 [US5] [ROS-173] Implementar `rename_project()`, `archive_project()`, `unarchive_project()` y `ensure_project_writable()` en `backend/apps/projects/services.py`. T054 pasa.
- [X] T059 [US5] [ROS-173] Implementar `PATCH /api/projects/{project_id}` en `serializers.py` y `views.py`. T055 pasa.
- [X] T060 [US5] [ROS-174] Implementar `frontend/src/features/projects/ArchiveControls.tsx`, el diálogo de renombrar, el filtro de archivados en `ProjectList.tsx` y el modo de solo lectura en `p/[projectId]/layout.tsx`. T056 y T057 pasan.
  - *2026-10-19: los controles van en la barra del proyecto (`ArchiveControls.tsx`); en un archivado la barra no muestra el selector (un archivado no aparece en él, FR-012) y el aviso va debajo. La interfaz no edita la descripción: 04-contenido §5 no tiene la etiqueta del campo (la API sí la admite, FR-011); se propone como DP nueva. El filtro de archivados vacío no muestra texto: §5 no lo define.*

**Checkpoint**: las cinco historias funcionan por separado.

---

## Fase 8: Cierre y aspectos transversales

- [X] T061 [P] [ROS-174] **Prueba E2E** `frontend/tests/e2e/projects-a11y.spec.ts`: `/projects`, formulario, selector, pestañas y "no encontrado" sin violaciones serias o críticas de axe y recorribles solo con teclado (SC-008). Marcadores: ROS-78 · FR-029.
- [X] T062 [P] [ROS-173] Ampliar `backend/tests/api/test_openapi_contract.py` para comparar el esquema generado con [contracts/projects-api.yaml](contracts/projects-api.yaml) (resolviendo `HealthView` contra [EC-025](../../docs/07-registro/01-errores-conocidos.md#ec-025) en esta tarea).
- [X] T063 [ROS-175] Comprobar que los modelos coinciden con el diccionario de datos columna a columna (FR-026) y registrar la comparación en `specs/003-proyectos-y-nucleo-de-datos/evidence/model-vs-dictionary.md`.
- [X] T064 [ROS-178] Trazabilidad: cada FR-001…FR-029 tiene al menos una prueba con su marcador `003:FR-###` (o evidencia manual enlazada); tabla en `evidence/fr-coverage.md`.
- [X] T065 [ROS-178] Ejecutar la suite completa con la salida real de cada comando: `ruff`, `mypy`, `pytest --cov` (≥ 85 %), `pnpm lint`, `pnpm typecheck`, `pnpm test:coverage` (≥ 80 %), `playwright test`; y los escenarios Q1–Q12 de [quickstart.md](quickstart.md) en `evidence/quickstart-run.md`.
  - *2026-10-20: suites repetidas con la salida real en `evidence/quickstart-run.md`. Backend 309 passed (97,33 %), mypy y formato limpios; ruff tiene 1 error anterior a la rama (I001 en `tests/security/test_logging_redaction.py`). Frontend: lint y tipos limpios, 219 unitarias (89,88 % de líneas). E2E: 51 passed y 3 failed, todos de la 002 y anteriores a esta rama (token en el payload RSC de `next dev`; `smoke-idp` depende de que `e2e-default` tenga el onboarding pendiente); diagnóstico en §4 de esa evidencia, propuestos como EC. Q1, Q5 y Q10 con el tenant real quedan **pendientes de la persona**.*
- [ ] T066 [ROS-178] Proponer el **CD de cierre** con el OK de la persona: matriz de trazabilidad (`docs/06-calidad/03-matriz-de-trazabilidad.md`), registro de sincronización y changelog.
- [ ] T067 [ROS-178] Ejecutar `/speckit-converge` hasta **Converged** y lanzar `/verificar 003-proyectos-y-nucleo-de-datos specs/003-proyectos-y-nucleo-de-datos` (CD-009).

---

## Dependencias y orden

- **Fase 1 → Fase 2 → historias.** T001 (CD-013) bloquea las tareas marcadas "tras CD-013"; T002 (DP-028) no bloquea: los textos se implementan como provisionales.
- **US1** solo depende de la Fase 2. **US2** usa el formulario de US1 (T028) en `/projects`. **US3** necesita las vistas de US1 y US2 para tener operaciones que proteger, pero sus pruebas se escriben en paralelo. **US4** depende de la Fase 2 (modelos) y del layout de US2 para la E2E. **US5** depende de US1 y US2.
- **Feature 002:** al cerrar US1 se pueden retomar T055, T051, T052 y T056 de la 002; al cerrar US2, T087 (E2E-01 real), que es la prueba de **SC-003** de esta feature.

### Paralelo dentro de cada historia

- US1: T023, T024 y T025 a la vez; luego T026 → T027, y T028 en paralelo con ellas.
- US2: T029–T032 a la vez; T033 en paralelo con T034–T036.
- US3: T037–T040 a la vez.
- US4: T046–T049 a la vez; T050 → T051; T052 en paralelo.
- US5: T054–T057 a la vez.

## Estrategia de implementación

### MVP primero

Fases 1 y 2, luego US1: con eso la 002 cierra su onboarding. Después US2 y US3 (P1), US4 (P2) y US5 (P3).

### Capacidad

61 h en el Sprint 1, ya sobrecargado ([EC-009](../../docs/07-registro/01-errores-conocidos.md#ec-009), aceptado). Lo que depende de decisiones está marcado ⛔ o "tras CD-013".

---

## Mapa tarea → subtarea Jira

| Subtarea | Tareas |
|---|---|
| ROS-172 | T001, T007, T008 |
| ROS-173 | T023, T024, T026, T027, T029, T033, T054, T055, T058, T059, T062 |
| ROS-174 | T002, T003, T021, T022, T025, T028, T030 a T032, T034 a T036, T056, T057, T060, T061 |
| ROS-175 | T004, T005, T006, T009 a T014, T063 |
| ROS-176 | T017, T020, T046, T050, T051 |
| ROS-177 | T047 a T049, T052, T053 |
| ROS-178 | T015, T016, T018, T019, T037, T039, T041, T042, T064 a T067 |
| ROS-179 | T038, T040, T043 a T045 |

## Notas

- La actividad de ROS-176 "transacciones para la confirmación con propagación" se cumple aquí con el patrón (services atómicos, T026, T051, T058) y se prueba sobre la confirmación en la feature de revisión (006), que es quien crea ese service.
- Commit por tarea o grupo lógico, **sin** `Co-Authored-By` ni atribución a IA.
