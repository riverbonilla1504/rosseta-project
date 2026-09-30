# Constitución de Rosetta — BORRADOR

> **Estado:** borrador v0.1 (2026-09-29). En la fase de preparación se usa como entrada de `/speckit-constitution` para generar `.specify/memory/constitution.md`, que pasa a ser la versión vinculante. Desde ese momento este archivo se mantiene idéntico a la constitución generada (misma versión) o se reemplaza por un enlace.
>
> La constitución está **por encima** de todo lo demás. `/speckit-analyze` trata cualquier conflicto con ella como CRITICAL. Cambiarla exige un ADR y aumentar su versión.

## Principios fundamentales

### I. La especificación es la fuente de verdad (NO NEGOCIABLE)
- `docs/` y `specs/` son autoritativos; el código es su expresión.
- Los cambios de comportamiento entran por `docs/` → `specs/` → Jira → código, en ese orden ([04-sincronizacion.md](04-sincronizacion.md)).
- Está prohibido cambiar comportamiento directamente en el código o en Jira.
- Toda pieza de código que implementa comportamiento rastrea a una historia `ROS-…` y a un `FR-###`.

### II. Pruebas primero (NO NEGOCIABLE)
- Ningún código de producción se escribe antes de su prueba, y la prueba debe verse **fallar** primero.
- Cada criterio de aceptación y cada `FR-###` tiene al menos una prueba automatizada con marcador de trazabilidad.
- Las pruebas de integración usan **PostgreSQL real**, no mocks de base de datos.
- Se prohíbe desactivar o debilitar pruebas para que el CI pase.

### III. El motor nunca inventa (NO NEGOCIABLE)
- Sin evidencia suficiente, el resultado es **"Desconocida"**; nunca una suposición presentada como hecho.
- Toda afirmación por encima de "Hipótesis" tiene al menos una **cita verificable**.
- **"Confirmada" solo existe tras una acción humana registrada** (autor y fecha). Ningún proceso automático, ni un LLM, puede producir "Confirmada".
- Un LLM, si se usa, **solo redacta** texto a partir de la evidencia; no calcula puntajes, no decide niveles, no crea evidencia.
- El nombre de la columna aporta como máximo **0,40** al puntaje.

### IV. Auditabilidad y determinismo
- El cálculo de puntaje y nivel es **determinista y reproducible**: la misma evidencia produce el mismo resultado.
- Toda acción humana (confirmar, editar, rechazar) queda registrada de forma inmutable con autor, fecha, estado anterior y posterior.
- Debe existir un **modo sin LLM** que produzca toda la salida con reglas deterministas.

### V. Seguridad y aislamiento de datos
- Los datos analizados de un cliente (esquemas, muestras) son sensibles: aislados por proyecto y usuario, cifrados en tránsito y en reposo.
- Nunca se escriben secretos en el repositorio. Nunca se registran tokens ni datos personales en logs.
- Rosetta accede a las bases de origen **en solo lectura** (ver [DP-005](../07-registro/02-decisiones-pendientes.md) sobre la publicación de comentarios).
- Nunca se usan datos reales de clientes en pruebas ni semillas.

### VI. Simplicidad
- Se usa el stack definido: **Django + Django REST Framework + PostgreSQL** (backend), **Next.js + TypeScript** (frontend), **Celery + Redis** (trabajo asíncrono). Añadir un servicio o framework exige un ADR.
- Como máximo **dos proyectos desplegables** (`backend/`, `frontend/`) más el worker del backend.
- Se usan las capacidades del framework directamente (ORM de Django, serializadores de DRF, App Router de Next.js) en lugar de envolverlas en abstracciones propias.
- Nada de funcionalidad especulativa: todo rastrea a una historia con criterios de aceptación.

### VII. Consistencia de interfaz
- Toda la UI usa los tokens y componentes del sistema de diseño **Nocturne** ([05-diseno](../05-diseno/)); no hay colores ni tamaños sueltos.
- Los cinco niveles de confianza se muestran siempre con el mismo componente y la misma semántica en todas las pantallas.
- Un mismo esquema se nombra igual en todas las pantallas (una única fuente de identificadores).
- Accesibilidad mínima WCAG 2.1 AA: contraste, navegación por teclado, estados no dependientes solo del color.

## Restricciones adicionales

- **Stack:** Python 3.12, Django 5.2 LTS, DRF, PostgreSQL 16, Celery 5 + Redis 7, Node.js 22 LTS, Next.js 15 (App Router), React 19, TypeScript 5 estricto.
- **Idioma:** identificadores de código en inglés; textos de producto en español.
- **Dependencias:** cada dependencia nueva se justifica en `plan.md` o en un ADR.

## Flujo de desarrollo y gates de calidad

1. Ninguna implementación sin `spec.md`, `plan.md` y `tasks.md`, y sin `/speckit-analyze` libre de CRITICAL.
2. Ningún PR sin: clave Jira, referencia a spec, commit de prueba roja previo, CI verde, cobertura que no baja.
3. Ninguna tarea en *Listo* sin `/speckit-converge` = Converged y acta de verificación independiente.
4. Cobertura mínima: backend 85 % (motor de evidencia 95 %), frontend 80 %.

## Gobernanza

- Esta constitución prevalece sobre cualquier otra práctica o documento.
- Enmiendas: ADR con justificación, revisión y aprobación del responsable del proyecto, evaluación de impacto sobre specs activas, y aumento de versión (MAYOR: se elimina/redefine un principio; MENOR: se agrega un principio o sección; PARCHE: redacción).
- Toda revisión de PR verifica el cumplimiento; la complejidad adicional se justifica en la sección "Complexity Tracking" de `plan.md`.

**Versión:** 0.1.0-borrador | **Ratificada:** `[PENDIENTE]` | **Última enmienda:** 2026-09-29
