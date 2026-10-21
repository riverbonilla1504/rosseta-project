# Changelog de la documentación

> Historial de cambios de `docs/`. Formato inspirado en *Keep a Changelog*; versión semántica de la documentación:
> - **MAYOR**: cambia el alcance o un principio (épica nueva/eliminada, cambio de stack, enmienda de constitución).
> - **MENOR**: cambia comportamiento documentado (regla, historia, contrato, modelo) — normalmente un CD.
> - **PARCHE**: erratas y redacción sin cambio de significado.
>
> Cada entrada referencia su `CD-NNN` cuando aplica.

## [1.15.0] — 2026-10-20 · CD-016

### Añadido
- [EC-027](01-errores-conocidos.md#ec-027) (resuelto: `created_at` de `catalog_column_interpretation` en el [diccionario](../04-datos/02-diccionario-de-datos.md)), [EC-028](01-errores-conocidos.md#ec-028), [EC-029](01-errores-conocidos.md#ec-029) y [EC-030](01-errores-conocidos.md#ec-030).
- [DP-029](02-decisiones-pendientes.md#dp-029) (textos que faltan en proyectos, decidida: aprobados en [04-contenido §5](../05-diseno/04-contenido-y-redaccion.md)) y [DP-030](02-decisiones-pendientes.md#dp-030) (access token en el payload RSC de desarrollo, decidida: corregir).

### Cambiado
- [EC-025](01-errores-conocidos.md#ec-025) resuelto (T062 de la 003).
- [07-seguridad §5](../03-arquitectura/07-seguridad-y-autenticacion.md): `SECURE_SSL_REDIRECT` activo en producción.
- [04-frontend §1](../03-arquitectura/04-frontend.md): "no encontrado" vive en `p/not-found.tsx`.
- [Matriz de trazabilidad](../06-calidad/03-matriz-de-trazabilidad.md): 002 y 003 con spec, plan, tareas y análisis hechos; historias de la 003 en implementación.

## [1.14.0] — 2026-10-19 · CD-015

### Cambiado
- [DP-028](02-decisiones-pendientes.md#dp-028) decidida: los textos de la pantalla de proyectos y del formulario pasan a [04-contenido §5](../05-diseno/04-contenido-y-redaccion.md) tal como se propusieron.

## [1.13.0] — 2026-10-19 · CD-014

### Añadido
- [EC-026](01-errores-conocidos.md#ec-026): el proxy BFF reenvía el cuerpo de las mutaciones sin `content-length` y Django lo recibe vacío (ROS-188).

## [1.12.0] — 2026-10-14 · CD-013

### Cambiado
- **Proyectos** (spec 003, aclaraciones del 2026-10-14): `projects_project.last_activity_at` ordena la lista; el nombre es único entre los proyectos activos de la persona sin distinguir mayúsculas ([diccionario](../04-datos/02-diccionario-de-datos.md)); un proyecto archivado es de solo lectura y se puede desarchivar; al crear desde la lista se entra en el proyecto ([03-pantallas §7](../05-diseno/03-pantallas.md)).
- [05-api](../03-arquitectura/05-api.md): §2 y §3.10 con la lista paginada, `?archived=true`, `PATCH` para desarchivar, la forma del resumen de proyecto y la del estado al abrir; §4 con `project_name_taken` y `project_archived` y `not_found` precisado.
- [04-frontend §1](../03-arquitectura/04-frontend.md): `p/[projectId]/layout.tsx` y `not-found.tsx`.
- [03-tareas-mvp](../02-requisitos/03-tareas-mvp.md): ROS-173 (desarchivar), ROS-174 (filtro de archivados y solo lectura), ROS-177 (caché del estado en el cliente).

### Añadido
- [DP-028](02-decisiones-pendientes.md#dp-028): textos de la pantalla de proyectos y del formulario (propuestas); "Aún no tienes proyectos." en [04-contenido §5](../05-diseno/04-contenido-y-redaccion.md).

## [1.11.0] — 2026-10-14 · CD-012

### Cambiado
- **Decisiones del responsable del producto para el Sprint 1** ([02-decisiones-pendientes](02-decisiones-pendientes.md)):
  - [DP-023](02-decisiones-pendientes.md#dp-023): sin nombre del proveedor, el nombre visible es la parte local del correo ([diccionario](../04-datos/02-diccionario-de-datos.md), `full_name`).
  - [DP-025](02-decisiones-pendientes.md#dp-025): textos de acceso y onboarding aprobados en [04-contenido §5](../05-diseno/04-contenido-y-redaccion.md) (nota de privacidad de `/login` con "Google o Microsoft"; cuenta desactivada sin canal de contacto); los códigos `account_exists_other_provider`, `account_disabled`, `email_missing` y `email_not_verified` dejan de ser provisionales ([05-api](../03-arquitectura/05-api.md)); [03-pantallas §7](../05-diseno/03-pantallas.md) sin `[PENDIENTE]`.
  - [DP-022](02-decisiones-pendientes.md#dp-022): sesión de 14 días sin uso y 30 de máximo, confirmada ([07-seguridad §3](../03-arquitectura/07-seguridad-y-autenticacion.md), ROS-187).
  - [DP-024](02-decisiones-pendientes.md#dp-024): sin consola administrativa en el MVP; `is_staff` sin uso ([07-seguridad §4](../03-arquitectura/07-seguridad-y-autenticacion.md), diccionario).
  - [DP-019](02-decisiones-pendientes.md#dp-019): dialectos del MVP T-SQL, Oracle y PostgreSQL (MySQL fuera); dialecto obligatorio al crear el proyecto (`source_dialect` no nulo) y el DDL se interpreta con él (sin parámetro `dialect` ni `auto` en la subida); etiquetas "SQL Server", "Oracle", "PostgreSQL". Afecta [diccionario](../04-datos/02-diccionario-de-datos.md), [05-api](../03-arquitectura/05-api.md) (`POST /api/projects`, §3.1), [03-pantallas](../05-diseno/03-pantallas.md), [04-frontend](../03-arquitectura/04-frontend.md) y ROS-120, ROS-172, ROS-186.
  - [DP-017](02-decisiones-pendientes.md#dp-017): Hallazgos y Generador ocultos en el MVP; Fuentes 4.ª pestaña; Convenciones es sección de Fuentes, sin ruta propia ([04-frontend §1–2](../03-arquitectura/04-frontend.md), [03-pantallas](../05-diseno/03-pantallas.md)).
  - [DP-026](02-decisiones-pendientes.md#dp-026): la Acción post-login se versiona en `infra/auth0/actions/` y se despliega a mano ([08-infraestructura §1](../03-arquitectura/08-infraestructura-y-entornos.md), [07-seguridad §2](../03-arquitectura/07-seguridad-y-autenticacion.md), ROS-183).
  - [DP-027](02-decisiones-pendientes.md#dp-027): retención por defecto del plan de Auth0 y borrado manual en el panel ante una petición ([07-seguridad §7](../03-arquitectura/07-seguridad-y-autenticacion.md)).
- DP-015 y DP-013 revisadas: siguen abiertas (antes del Sprint 5 y en la feature 004).

### Corregido
- [EC-022](01-errores-conocidos.md#ec-022): estado vacío de ROS-174 en tuteo ("aún no tienes proyectos").

## [1.10.0] — 2026-10-14 · CD-011

### Añadido
- [DP-025](02-decisiones-pendientes.md#dp-025): propuesta del texto del control de cierre de sesión ("Cerrar sesión") y observación sobre la nota de privacidad de `/login` con la forma genérica de `{proveedor}`; fila `[PENDIENTE: DP-025]` en [04-contenido §5](../05-diseno/04-contenido-y-redaccion.md).
- [EC-024](01-errores-conocidos.md#ec-024): contraste insuficiente de `--nx-text-secondary` y `--nx-text-muted` sobre `--nx-surface` (medido con axe; mitigado en las pantallas de 002).
- [EC-025](01-errores-conocidos.md#ec-025): `HealthView` hace fallar la generación del esquema OpenAPI.

## [1.9.0] — 2026-10-14 · CD-010

### Cambiado
- **MCP de Auth0 permanente y acotado** ([07-seguridad §1 y §6](../03-arquitectura/07-seguridad-y-autenticacion.md)): deja de cerrarse al terminar cada uso. Usa una aplicación *Machine to Machine* propia con 7 permisos de la Management API y un lanzador local que pide un token nuevo en cada arranque; el secreto solo en variables de entorno del usuario. Sigue siendo solo para el tenant de desarrollo.

### Añadido
- [DP-027](02-decisiones-pendientes.md#dp-027): retención de nombre, correo y avatar en el servicio de identidad (CHK038 de la spec 002).

## [1.8.0] — 2026-10-13 · CD-009

### Cambiado
- **Verificador automático** (nivel 5): al llegar a "Converged", el implementador lanza `/verificar <rama> <carpeta>`, que crea un agente nuevo, de contexto limpio, con el prompt **fijo** de [07-delegacion §3.2](../00-metodologia/07-delegacion-a-ia.md) (ahora parametrizado solo por rama y carpeta). El acta se pega tal cual en el PR. La persona aprueba el PR y solo el verificador mueve la incidencia a *Listo*. Afecta [06-verificacion §2](../00-metodologia/06-verificacion.md) (nivel 5) y [07-delegacion §2, §2.1 y §3.2](../00-metodologia/07-delegacion-a-ia.md).

### Añadido
- Agente del repositorio `.claude/agents/verificador.md` (sin `Edit`, `Write`, `NotebookEdit`, `PowerShell` ni `Agent`; *hook* `.claude/hooks/verificador-solo-lectura.mjs` que solo deja pasar órdenes de lectura y de pruebas, lint y tipos) y skill `.claude/skills/verificar/`.

## [1.7.0] — 2026-10-13 · CD-008

### Cambiado
- **El correo verificado se exige en dos capas** (FR-004 de la spec 002): la Acción post-login deniega y añade el claim `https://rosetta/email_verified`; el backend lo exige verdadero y responde `403 email_not_verified`. Afecta [05-api](../03-arquitectura/05-api.md) (§3.8, §3.9 y la fila `email_not_verified`, que pasa de "solo redirección" a "403 y redirección"), [07-seguridad §2](../03-arquitectura/07-seguridad-y-autenticacion.md), [04-frontend §4](../03-arquitectura/04-frontend.md) y las actividades de ROS-183 y ROS-185.

### Añadido
- [DP-026](02-decisiones-pendientes.md#dp-026): ¿se versiona el código de la Acción post-login del tenant? (por defecto, solo en el tenant).
- Forma genérica de `{proveedor}` como propuesta en [DP-025](02-decisiones-pendientes.md#dp-025) y como fila `[PENDIENTE: DP-025]` en [04-contenido §5](../05-diseno/04-contenido-y-redaccion.md).

## [1.6.0] — 2026-10-01 · CD-007

### Cambiado
- **Redirección sin sesión:** a `/login?returnTo=` (pantalla de acceso de Rosetta), no a `/auth/login?returnTo=` (que abriría la pantalla alojada por Auth0). Afecta [04-frontend §4](../03-arquitectura/04-frontend.md), [07-seguridad §3](../03-arquitectura/07-seguridad-y-autenticacion.md) y las actividades de ROS-181 y ROS-188.
- **CSP** de [07-seguridad §5](../03-arquitectura/07-seguridad-y-autenticacion.md): con nonce por petición y `script-src` explícito en Next.js; `default-src 'none'` en las respuestas JSON de Django.
- **Contrato** ([05-api](../03-arquitectura/05-api.md)): nueva §3.9 (`/api/me` y `/api/me/onboarding/complete`, con `avatar_url`) y códigos de error `account_exists_other_provider` (ahora 403), `account_disabled`, `email_missing`, `email_not_verified`, `forbidden_origin`, `identity_unavailable` y `backend_unavailable` (los tres primeros nuevos, **provisionales hasta [DP-025](02-decisiones-pendientes.md#dp-025)**).
- **Lista blanca de cierre de sesión** con `/login` y `/auth/error`, sin comodines ([08-infraestructura §3](../03-arquitectura/08-infraestructura-y-entornos.md), ROS-182).
- [08-infraestructura §3](../03-arquitectura/08-infraestructura-y-entornos.md): el frontend ya no "reescribe `/api` y `/auth`" (texto de ADR-0006); sirve `/auth/*` con el SDK y `/api/*` con el proxy BFF.
- [03-backend §6](../03-arquitectura/03-backend.md): un código propio de la excepción tiene prioridad sobre el código por defecto de su estado HTTP.

### Añadido
- Ruta `/auth/denied` (cuenta rechazada por el backend: cierra la sesión y lleva a `/auth/error`) en [04-frontend](../03-arquitectura/04-frontend.md) y como actividad de ROS-184.
- Variables solo de pruebas `AUTH0_ISSUER`, `AUTH0_JWKS_URL` y `E2E_ALLOW_INSECURE_IDP` ([08-infraestructura §4](../03-arquitectura/08-infraestructura-y-entornos.md)).

## [1.5.0] — 2026-10-01 · CD-006

### Decidido
- [DP-014](02-decisiones-pendientes.md#dp-014) (actualización): Microsoft solo con cuentas personales en el MVP; las de trabajo o institucionales son SSO empresarial (ROS-102, Fase 3). Si el correo que informa el proveedor choca con otra cuenta, se conserva el anterior y se registra el evento sin datos personales.
- Onboarding de un solo paso en el MVP: crear el primer proyecto. El paso "subir el DDL" se añade con la feature 004.

### Cambiado
- ROS-90 pasa a titularse "Inicio de sesión con OAuth (Google y Microsoft)"; Apple ya estaba fuera del MVP.
- ROS-186: se retira la actividad "subir el DDL (o saltar)"; ROS-182: Microsoft solo con cuentas personales.
- [07-seguridad §2 y §3](../03-arquitectura/07-seguridad-y-autenticacion.md), [diccionario de datos](../04-datos/02-diccionario-de-datos.md), [03-pantallas §7](../05-diseno/03-pantallas.md), NO-14 y la matriz de trazabilidad.

### Añadido
- [DP-022](02-decisiones-pendientes.md#dp-022) (duración de la sesión), [DP-023](02-decisiones-pendientes.md#dp-023) (proveedor sin nombre), [DP-024](02-decisiones-pendientes.md#dp-024) (acceso de administración interna), [DP-025](02-decisiones-pendientes.md#dp-025) (textos de acceso y onboarding, con propuestas).
- [EC-022](01-errores-conocidos.md#ec-022) (voseo en ROS-174) y [EC-023](01-errores-conocidos.md#ec-023) (`check-prerequisites.sh` exige `plan.md`).
- Filas `[PENDIENTE: DP-025]` en [04-contenido §5](../05-diseno/04-contenido-y-redaccion.md).

## [1.4.0] — 2026-09-30 · CD-005

### Añadido
- Regla 13 (nunca coautoría de IA en commits/PRs) y 14 (sin commit/push/PR sin permiso) para agentes; configurado en `.claude/settings.json`.
- Protocolo de sesión: mensaje de arranque, lo que el agente muestra al empezar y resumen de cierre ([07-delegacion-a-ia.md §6](../00-metodologia/07-delegacion-a-ia.md)).

## [1.3.0] — 2026-09-30 · CD-004

### Cambiado
- Autenticación con **Auth0** ([ADR-0007](../03-arquitectura/adr/ADR-0007-autenticacion-auth0.md), reemplaza a ADR-0006): SDK de Next.js, proxy BFF, Django valida el access token. Actualizados seguridad, stack, visión general, backend, frontend, API, infraestructura, modelo y diccionario de datos, estrategia de pruebas, RNF-07/08.
- Tareas ROS-180…190 reescritas: 75 h → 56 h. Sprint 1: 155 h. MVP: 513 h.
- Se elimina la tabla `accounts_auth_session`; `accounts_user` gana `auth0_sub`.

## [1.2.0] — 2026-09-30 · CD-003

### Decidido
- DP-001 (contención en el MVP), DP-005 (nunca escribir en el origen), DP-009 (tuteo), DP-011 (no dividir Sprint 1), DP-014 (Google + Microsoft), DP-016 (ROS-94 → Fase 3), DP-020 (5 niveles en cobertura), DP-021 (Jev: piloto en Fase 2).

### Añadido
- Historias ROS-191 (vistas y procedimientos) y ROS-192 (etiquetas de aplicación), E01, Fase 2. Total: 106 historias.

### Cambiado
- ROS-94 pasa a Fase 3. Recuento por fase: 38 / 33 / 30 / 5.
- EC-003, EC-013 mitigados; EC-008, EC-012, EC-018 resueltos; EC-009 aceptado.

## [1.1.0] — 2026-09-30 · CD-002

### Añadido
- Evaluación de Jev (TypeSafe AI): [03-arquitectura/evaluaciones/2026-09-30-jev-typesafe-ai.md](../03-arquitectura/evaluaciones/2026-09-30-jev-typesafe-ai.md) y [DP-021](02-decisiones-pendientes.md#dp-021).
- EC-021 (puerto 5432 ocupado en la máquina de desarrollo).
- Estado de la Fase 0.5 en el roadmap.

### Cambiado
- Constitución ratificada v1.0.0 en `.specify/memory/constitution.md`; [08-constitucion.md](../00-metodologia/08-constitucion.md) pasa a ser un puntero. III y V añaden reglas para servicios de IA externos.
- PostgreSQL de desarrollo en el puerto 5433 del host.
- Nombre del estado final de Jira: *Listo* (antes se documentó como "Hecho").

### Resuelto
- EC-010: repositorio git creado y Spec Kit inicializado.

## [1.0.0] — 2026-09-29 · CD-000

### Añadido
- Estructura completa de `docs/` como fuente única de verdad.
- **Metodología:** SDD, Spec Kit, flujo de trabajo, sincronización docs ↔ specs ↔ Jira ↔ código, trazabilidad y convenciones, verificación, delegación a IA, borrador de constitución v0.1.0.
- **Producto:** visión, usuarios y roles, alcance y no-objetivos (NO-01…NO-20), glosario, roadmap y plan de 5 sprints.
- **Requisitos:** 15 épicas, 104 historias con criterios de aceptación, 71 tareas del MVP con actividades, reglas de negocio RN-01…RN-26, requisitos no funcionales RNF-01…RNF-38.
- **Arquitectura:** visión general (C4), stack y servicios adicionales, backend, frontend, contrato de API, motor de evidencia, seguridad y autenticación, infraestructura; ADR-0001…ADR-0006.
- **Datos:** modelo entidad-relación, diccionario de datos, datos de referencia del prototipo (MOV0010) y semillas.
- **Diseño:** sistema Nocturne (tokens aproximados), componentes, pantallas, contenido y redacción.
- **Calidad:** estrategia de pruebas, DoR/DoD, matriz de trazabilidad.
- **Registro:** errores conocidos EC-001…EC-020, decisiones pendientes DP-001…DP-020, registro de sincronización.
- **Plantillas:** cambio de documentación, error conocido, historia de usuario, ADR, pull request.

### Notas
- Notion queda congelado como archivo histórico desde esta versión.
- Los valores marcados *provisional* o `[PENDIENTE]` no deben tratarse como decididos.
