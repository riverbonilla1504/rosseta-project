# Research: Proyectos y núcleo de datos

**Feature**: [spec.md](spec.md) · **Plan**: [plan.md](plan.md) · **Fecha**: 2026-10-14

La arquitectura ya está decidida en [03-backend](../../docs/03-arquitectura/03-backend.md) (apps, capas, reglas B1–B8), [04-frontend](../../docs/03-arquitectura/04-frontend.md), [07-seguridad §4](../../docs/03-arquitectura/07-seguridad-y-autenticacion.md) y el [diccionario de datos](../../docs/04-datos/02-diccionario-de-datos.md). Este documento resuelve lo que esos documentos dejan abierto para la feature 003. No quedan `NEEDS CLARIFICATION` en el contexto técnico.

## Punto de partida verificado en el repositorio (rama 002)

| # | Qué hay | Consecuencia |
|---|---|---|
| E1 | Apps `core` y `accounts`; `core` **no** tiene todavía `UUIDModel` ni `TimeStampedModel` aunque 03-backend §3 los lista | Se crean en esta feature (R-02) |
| E2 | `accounts.User` con UUID, `rosetta.security` como registrador de eventos con campos cerrados (002, R-11) | Los accesos denegados reutilizan ese registrador (R-03) |
| E3 | `tests/security/test_route_inventory.py` y `probe_urls.py` inventarían las rutas de la API (FR-012 de la 002, denegación por defecto) | La suite de acceso cruzado se apoya en el mismo inventario (R-04) |
| E4 | Frontend: `apiFetch` (401 → `/login`, 403 de cuenta → `/auth/denied`), `(app)/layout.tsx` con la guarda de onboarding y `LogoutLink`; **sin** TanStack Query | Se añade TanStack Query (R-13) |
| E5 | [EC-025](../../docs/07-registro/01-errores-conocidos.md#ec-025): `HealthView` hace fallar la generación del esquema OpenAPI | La prueba de contrato y el inventario usan el esquema con `HealthView` excluido o anotado; se resuelve en la tarea del contrato y no se arregla de paso fuera de ella |

## R-01 · Alcance del núcleo de datos

- **Decisión:** se crean **todas** las tablas del diccionario de datos del MVP (proyectos, catálogo, fuentes, reglas de nombres, evidencia, conflictos, acciones de revisión) con sus restricciones, índices y QuerySets `for_user`. **No** se crean services de ingesta, motor ni revisión: solo los de proyectos (R-05…R-08) y el selector de estado (R-09).
- **Rationale:** ROS-175 pide el esquema completo ("soporta las 5 pantallas sin cambios estructurales previsibles", FR-026) y ROS-176 las migraciones y "repositorios" (B5: Managers/QuerySets). Las features 004–006 añaden comportamiento, no tablas.
- **Alternativas:** crear solo `projects_project` y dejar el resto a cada feature: contradice ROS-175 y obligaría a revisar el aislamiento en cada una.

## R-02 · Modelos base

- **Decisión:** `core.models.UUIDModel` (id UUID v4 generado por la aplicación) y `TimeStampedModel` (`created_at`, `updated_at`), abstractos. `accounts.User` no se toca.
- **Rationale:** convención común del diccionario (UUID v4, timestamps UTC) y RNF-04.

## R-03 · Aislamiento y respuesta "no encontrado"

- **Decisión:** cada modelo de cliente expone `objects.for_user(user)` (filtra por `project__owner=user`, o `owner=user` en `Project`). Las vistas obtienen objetos solo con `core.ownership.get_owned_or_404(queryset_for_user, pk)`. Si no lo encuentra, hace **una** comprobación de existencia sin filtro: si el objeto existe (es ajeno) emite el evento `access_denied` por `rosetta.security` con solo `event`, `reason="not_owner"`, `user_id`, `path` y `resource_id`; en ambos casos lanza `NotFound` con el cuerpo único `{"error":{"code":"not_found","message":…}}`.
- **Rationale:** B4 y [07-seguridad §4](../../docs/03-arquitectura/07-seguridad-y-autenticacion.md) ("se registran los intentos denegados… sin PII"). La comprobación extra solo ocurre en la rama de fallo y no cambia la respuesta (FR-015). Un `pk` que no es un UUID válido también da `not_found` (no 400) para no distinguir formatos.
- **Alternativas:** 403 para lo ajeno (revela la existencia, prohibido por RNF-03); filtrar en la vista (prohibido por B4); no registrar (incumple 07-seguridad).

## R-04 · Suite de acceso cruzado completa

- **Decisión:** `tests/security/test_cross_access.py` genera la lista de operaciones desde el esquema OpenAPI (como pide 07-seguridad §4) y la compara con un registro explícito de casos (`CROSS_ACCESS_CASES`: método, ruta, cómo construir el recurso de A). Una operación con parámetro de ruta sin caso registrado **hace fallar la suite** (FR-018). Cada caso: B pide el recurso de A → 404 con el mismo cuerpo que un UUID inexistente, y el recurso de A queda intacto. Las rutas sin recurso (`/api/me`, `/api/projects` listado/creación) se comprueban por contenido: B nunca ve datos de A.
- **Rationale:** RNF-03 ("100 % en verde") y ROS-178 ("la suite… pasa al 100 %") necesitan una lista cerrada; generarla desde el esquema evita que una feature futura añada una ruta sin cubrir.

## R-05 · Unicidad del nombre

- **Decisión:** `UniqueConstraint(Lower("name"), "owner", condition=Q(archived_at__isnull=True), name="uniq_active_project_name_per_owner")`. El service recorta espacios, valida 1–120 caracteres y comprueba el choque antes de escribir para devolver `400 project_name_taken` con `details.name`; si dos peticiones compiten, el `IntegrityError` de la restricción se traduce al mismo error. La comparación es la de `lower()` de PostgreSQL: distingue acentos y espacios internos.
- **Rationale:** aclaración de FR-004. La restricción en la base es la garantía; la comprobación previa da el mensaje claro.
- **Envío doble (FR-003):** el formulario bloquea el envío mientras hay uno en curso y la restricción impide un segundo proyecto activo con el mismo nombre. No hace falta clave de idempotencia.

## R-06 · Dialecto

- **Decisión:** `source_dialect` con `TextChoices` `tsql | oracle | postgres` y `CHECK`. Obligatorio en `POST /api/projects`; **no** es campo de escritura en `PATCH` (un `dialect` en el `PATCH` se rechaza con 400). Etiquetas de la interfaz "SQL Server", "Oracle", "PostgreSQL" en `features/projects/copy.ts`, como fija [04-contenido §5](../../docs/05-diseno/04-contenido-y-redaccion.md).
- **Rationale:** DP-019 y FR-010.

## R-07 · Última actividad

- **Decisión:** campo `last_activity_at` en `projects_project` (desviación D1). Lo actualiza **explícitamente** el service `projects.services.touch_activity(project)` dentro de la misma transacción de cada cambio (crear, renombrar, archivar, desarchivar y, en features futuras, cargar fuentes y acciones de revisión). Abrir o leer no lo toca. La lista ordena por `last_activity_at desc, id`.
- **Rationale:** aclaración de FR-005. `updated_at` solo cambia con la fila del proyecto y no recoge la actividad del contenido; usar señales está prohibido (B7).
- **Alternativas:** calcularla al leer como el máximo de varias tablas (consulta cara y frágil); reutilizar `updated_at` (mezcla dos significados).

## R-08 · Archivar, desarchivar y solo lectura

- **Lista:** `GET /api/projects` usa la paginación estándar de 05-api §1 (`{count, next, previous, results}`).
- **Decisión:** `PATCH /api/projects/{id}` con `{"archived": true}` archiva (`archived_at = now`) y con `{"archived": false, "name"?}` desarchiva; si el nombre choca con un activo, `400 project_name_taken` y la interfaz pide uno nuevo y reenvía con `name`. Mientras está archivado, toda mutación del proyecto o de su contenido responde `409 project_archived`; la guarda `projects.services.ensure_project_writable(project)` la usan todos los services de escritura, también los de las features futuras. La lectura sigue permitida (FR-013).
- **Rationale:** aclaración de FR-013; una sola guarda evita olvidar el caso en 004–006.
- **Proyecto abierto que se archiva** (FR-010): la interfaz navega a `/projects` tras el 200.

## R-09 · Estado del proyecto al abrir

- **Decisión:** `GET /api/projects/{id}/state` devuelve en una sola respuesta: el proyecto, la cobertura por nivel con la forma de [05-api §3.7](../../docs/03-arquitectura/05-api.md) sin el desglose por tabla (`total_columns` y `by_level`, DP-020), la lista de fuentes con estado, el número de tablas y la **cabeza de la cola**: las primeras 50 filas de la cola de 05-api §3.6, con su orden (impacto desc, conflicto abierto desc, `TABLA.COLUMNA` asc). El catálogo completo no viaja en el estado: lo sirven los endpoints de catálogo paginados de su feature (ROS-162). Sin caché de servidor; el cliente guarda el estado por proyecto con TanStack Query (desviación D6).
- **Rationale:** ROS-177 ("incluir catálogo, niveles, cola y fuentes; paginar o diferir lo pesado") y FR-022. El orden total de §3.6 hace el resultado determinista y comparable en SC-002; reutilizarlo evita dos órdenes distintos para la misma cola. SC-002 compara además el catálogo guardado en la base, que el estado no transporta. Sin metas de tiempo (DP-018) no hay necesidad medida de caché de servidor, y una caché invalidada mal rompería RN-18.
- **Consultas:** número fijo (proyecto, agregado por nivel, fuentes, conteo de tablas, cabeza de la cola), comprobado con `django_assert_max_num_queries`.

## R-10 · Atomicidad

- **Decisión:** toda escritura de más de una fila va en un service con `@transaction.atomic` (B2). La prueba de FR-024 inyecta un fallo a mitad de un service de varias escrituras (desarchivar con renombre, y la siembra) y comprueba cero cambios. El caso de la confirmación con propagación se prueba en la feature 006 con el mismo patrón.

## R-11 · Inmutabilidad

- **Decisión:** `ReviewAction.save()` rechaza actualizar una fila existente y `delete()` lanza error; la migración crea el trigger `BEFORE UPDATE OR DELETE` del diccionario. Como en el MVP no se borran proyectos (spec, Fuera de alcance), el trigger bloquea toda modificación sin excepciones. **Consecuencia para features futuras:** el `CASCADE` de `review_review_action.column_id` haría fallar el borrado de una columna con acciones; si la reimportación de un DDL (004) llegara a borrar columnas, habrá que decidirlo por CD (se anota como riesgo, no se resuelve aquí). `Evidence.save()` rechaza actualizar una fila existente (se borra y se regenera, FR-025).
- **Conflicto aparente (checklist CHK024):** el diccionario define `CASCADE` desde fuentes a evidencia y perfiles. No choca con FR-025: la evidencia no se **edita**, se **borra** con su fuente. Las acciones de revisión no cuelgan de fuentes.

## R-12 · Proyecto de ejemplo sembrado

- **Decisión:** comando `seed_reference_project --owner-sub <auth0_sub>` que carga `tests/fixtures/core_demo_snapshot.json`: el proyecto `CORE_DEMO` (`tsql`), las tablas de [03-datos-de-referencia §2–3](../../docs/04-datos/03-datos-de-referencia.md) con `MOV0010` completa (11 columnas con sus niveles y nombres de negocio del prototipo), tablas extra que repiten `PGCOD`, `CTANRO` y `PETDOC` (proporciones reducidas, §5), una fuente DDL `READY`, unas reglas de nombres globales (§6) y las tres acciones `CONFIRM` (SUCCOD, MONCOD, FEALT). Las interpretaciones llevan `engine_version = "fixture"`. Es idempotente (reejecutar no duplica) y atómico.
- **Rationale:** FR-027 y SC-007; sin ingesta (004) ni motor (005) es la única forma de comprobar la persistencia con datos realistas. Los niveles **no** los calcula nada: son datos de prueba, marcados como tales, y el motor los recalculará cuando exista (Constitución III).
- **Alternativas:** esperar a la 004/005 (SC-002 no se podría verificar en esta feature); generar las interpretaciones al azar (no reproducible).

## R-13 · Estado del servidor en el cliente

- **Decisión:** `@tanstack/react-query` 5 (prevista en 04-frontend §3). Claves: `["projects", {archived}]` y `["project", projectId, ...]`. Cada componente del proyecto lee **solo** las claves de su `projectId` de la ruta, de modo que una respuesta tardía del proyecto anterior queda en su propia clave y nunca se pinta en el nuevo (FR-009). Al cambiar de proyecto se cancelan las consultas en curso del anterior (`cancelQueries`). Las mutaciones invalidan `["projects"]` y `["project", id]`.
- **Rationale:** "limpiar y recargar el estado al cambiar de proyecto" (ROS-174) sin estado global propio; las pestañas del navegador no comparten memoria, así que no se mezclan entre sí.
- **Alternativas:** `fetch` con `AbortController` a mano en cada pantalla (repetitivo y propenso a carreras).

## R-14 · Pestañas sin contenido todavía

- **Decisión:** se crean las cuatro rutas (`/p/{id}`, `review`, `catalog`, `sources`) con el layout del proyecto. Cada una muestra el estado "Todavía no hay evidencia. Sube el DDL de tu base para empezar." de [04-contenido §5](../../docs/05-diseno/04-contenido-y-redaccion.md) si el proyecto no tiene fuentes; con fuentes (solo el proyecto sembrado), un contenido mínimo cuyo texto depende de DP-028. Sus features las reemplazan.
- **Rationale:** FR-007 exige las cuatro pestañas; un enlace a una ruta inexistente sería un error de navegación.

## R-15 · Cifrado y ROS-179

- **Decisión:** en esta feature: HSTS y redirección a HTTPS en `prod.py` (`SECURE_HSTS_SECONDS = 31536000`, `SECURE_HSTS_INCLUDE_SUBDOMAINS`, `SECURE_SSL_REDIRECT`), prueba de configuración, comprobación de que ninguna ruta lleva datos sensibles y documento de configuración de seguridad. **Bloqueado por DP-015:** cifrado en reposo del proveedor, gestión y rotación de llaves y la revisión de configuración del entorno desplegado (SC-009).
- **Rationale:** RNF-01, RNF-02 y [07-seguridad §5](../../docs/03-arquitectura/07-seguridad-y-autenticacion.md); el resto depende del proveedor.

## R-16 · Textos

- **Decisión:** `features/projects/copy.ts` concentra los textos. Los que define `docs/` (dialectos, "aún no tienes proyectos", "Todavía no hay evidencia…", bienvenida de la 002) se usan tal cual; el resto se marca **PROVISIONAL (DP-028)** con la propuesta que se llevará a esa decisión, igual que se hizo con DP-025 en la 002.
- **Rationale:** regla 5 de [07-delegacion](../../docs/00-metodologia/07-delegacion-a-ia.md): ningún agente decide textos de la interfaz.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| El modelo del núcleo cambia cuando lleguen la ingesta o el motor (ROS-175, "tarea de mayor riesgo") | Se implementa exactamente el diccionario; cualquier cambio posterior es un CD con migración |
| Una feature futura añade una ruta sin comprobación de pertenencia | La suite de R-04 falla en CI |
| El trigger de inmutabilidad complica las pruebas que limpian la base | Las pruebas usan transacciones (pytest-django) y no borran acciones; la siembra no borra acciones existentes |
| EC-025 impide generar el esquema completo | Se resuelve en la tarea del contrato con una anotación de `HealthView`, registrada contra EC-025 |
