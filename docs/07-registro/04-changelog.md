# Changelog de la documentación

> Historial de cambios de `docs/`. Formato inspirado en *Keep a Changelog*; versión semántica de la documentación:
> - **MAYOR**: cambia el alcance o un principio (épica nueva/eliminada, cambio de stack, enmienda de constitución).
> - **MENOR**: cambia comportamiento documentado (regla, historia, contrato, modelo) — normalmente un CD.
> - **PARCHE**: erratas y redacción sin cambio de significado.
>
> Cada entrada referencia su `CD-NNN` cuando aplica.

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
