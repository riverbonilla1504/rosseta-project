# Changelog de la documentación

> Historial de cambios de `docs/`. Formato inspirado en *Keep a Changelog*; versión semántica de la documentación:
> - **MAYOR**: cambia el alcance o un principio (épica nueva/eliminada, cambio de stack, enmienda de constitución).
> - **MENOR**: cambia comportamiento documentado (regla, historia, contrato, modelo) — normalmente un CD.
> - **PARCHE**: erratas y redacción sin cambio de significado.
>
> Cada entrada referencia su `CD-NNN` cuando aplica.

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
