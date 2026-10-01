# Rosetta Constitution

## Core Principles

### I. La especificación es la fuente de verdad (NO NEGOCIABLE)

- `docs/` y `specs/` son autoritativos; el código es su expresión.
- Los cambios de comportamiento entran en este orden: `docs/` → `specs/` → Jira → código
  (`docs/00-metodologia/04-sincronizacion.md`). Está prohibido cambiar comportamiento
  directamente en el código o en Jira.
- Todo código que implementa comportamiento rastrea a una historia `ROS-…` y a un `FR-###`.
- Si una spec contradice `docs/`, gana `docs/` y la spec se corrige antes de implementar.

**Razón:** evitar la deriva de especificación (*spec drift*) y permitir delegar trabajo a agentes
de IA con un contexto único y verificable.

### II. Pruebas primero (NO NEGOCIABLE)

- Ningún código de producción se escribe antes de su prueba, y la prueba DEBE verse fallar primero
  (commit de prueba roja visible en el PR).
- Cada criterio de aceptación y cada `FR-###` tiene al menos una prueba automatizada con marcador
  de trazabilidad (`@pytest.mark.story` / `@pytest.mark.fr`, o `[ROS-n][NNN:FR-###]` en TS).
- Las pruebas de integración usan PostgreSQL real; no se simula la base de datos.
- Está prohibido desactivar, omitir o debilitar pruebas para que el CI pase.

**Razón:** la prueba es la evidencia de que lo especificado se hizo.

### III. El motor nunca inventa (NO NEGOCIABLE)

- Sin evidencia suficiente, el resultado es "Desconocida"; nunca una suposición presentada como
  hecho.
- Toda afirmación por encima de "Hipótesis" tiene al menos una cita verificable.
- "Confirmada" solo existe tras una acción humana registrada (autor y fecha). Ningún proceso
  automático, LLM ni modelo externo puede producir "Confirmada".
- El nombre de la columna aporta como máximo 0,40 al puntaje.
- Un servicio de IA externo (LLM, o modelos de decisión tipada como Jev de TypeSafe AI) solo puede:
  (a) redactar texto a partir de evidencia ya calculada, o (b) aportar evidencia con peso acotado,
  citada, versionada y reproducible (respuesta almacenada). Nunca decide niveles ni puntajes por
  sí mismo. Introducirlo requiere un ADR.

**Razón:** el valor de Rosetta es ser auditable; inventar destruye la confianza en todo el catálogo.

### IV. Auditabilidad y determinismo

- El cálculo de puntaje y nivel es determinista y reproducible: la misma evidencia produce el mismo
  resultado y el mismo desglose; el motor lleva versión (`ENGINE_VERSION`).
- Toda acción humana (confirmar, editar, rechazar) queda registrada de forma inmutable con autor,
  fecha, estado anterior y posterior.
- DEBE existir un modo sin LLM que produzca toda la salida con reglas deterministas (en el MVP es
  el único modo).

**Razón:** una salida "aprobable por un banco" exige poder reconstruir cada afirmación.

### V. Seguridad y aislamiento de datos

- Los datos analizados de un cliente (esquemas, muestras) son sensibles: aislados por usuario y
  proyecto, cifrados en tránsito y en reposo.
- Nunca se escriben secretos en el repositorio. Nunca se registran tokens ni datos personales en
  los logs.
- Rosetta accede a las bases de origen en solo lectura.
- Nunca se usan datos reales de clientes en pruebas ni semillas.
- Ningún dato de cliente se envía a un servicio externo sin ADR, acuerdo de tratamiento de datos y
  opción de desactivarlo por proyecto.

**Razón:** los clientes objetivo (banca, sector regulado) no aceptan fugas ni accesos cruzados.

### VI. Simplicidad

- Stack: Django + Django REST Framework + PostgreSQL (backend), Next.js + TypeScript (frontend),
  Celery + Redis (trabajo asíncrono). Añadir un servicio o framework exige un ADR.
- Como máximo dos proyectos desplegables (`backend/`, `frontend/`) más el worker del backend.
- Se usan las capacidades del framework directamente (ORM de Django, serializadores de DRF,
  App Router de Next.js) en lugar de envolverlas en abstracciones propias.
- Nada de funcionalidad especulativa: todo rastrea a una historia con criterios de aceptación.

**Razón:** equipo pequeño; cada pieza extra es costo de operación y de contexto para los agentes.

### VII. Consistencia de interfaz

- Toda la UI usa los tokens y componentes del sistema de diseño Nocturne (`docs/05-diseno/`);
  no hay colores ni tamaños literales.
- Los cinco niveles de confianza se muestran siempre con el mismo componente y semántica.
- Un mismo esquema se nombra igual en todas las pantallas (única fuente de identificadores).
- Accesibilidad mínima WCAG 2.1 AA: contraste, navegación por teclado, estados no dependientes
  solo del color.

**Razón:** la confianza del usuario depende de que el mismo dato signifique lo mismo en todas partes.

## Restricciones adicionales

- **Versiones:** Python 3.12, Django 5.2 LTS, DRF, PostgreSQL 16, Celery 5 + Redis 7,
  Node.js 22 LTS, Next.js 15 (App Router), React 19, TypeScript 5 estricto.
- **Idioma:** identificadores de código en inglés; textos de producto y documentación en español.
- **Dependencias:** cada dependencia nueva se justifica en `plan.md` o en un ADR
  (`docs/03-arquitectura/adr/`).
- **Referencia de arquitectura:** `docs/03-arquitectura/`; los `plan.md` no pueden contradecirla.

## Flujo de desarrollo y gates de calidad

1. Ninguna implementación sin `spec.md`, `plan.md` y `tasks.md`, y sin `/speckit-analyze` libre de
   hallazgos CRITICAL.
2. Ningún PR sin: clave Jira en el título, referencia a la spec, commit de prueba roja previo,
   CI verde y cobertura que no baja.
3. Ninguna incidencia pasa a *Listo* en Jira sin `/speckit-converge` = Converged y acta de
   verificación independiente (`docs/00-metodologia/06-verificacion.md`).
4. Cobertura mínima: backend 85 % (motor de evidencia 95 %), frontend 80 %.
5. Los errores y decisiones abiertas se registran en `docs/07-registro/` (EC-NNN, DP-NNN); ningún
   agente decide valores marcados `[PENDIENTE]` o `[NECESITA ACLARACIÓN]`.

## Governance

- Esta constitución prevalece sobre cualquier otra práctica o documento del proyecto.
- Enmiendas: ADR con justificación, aprobación del responsable del proyecto, evaluación de impacto
  sobre specs activas y aumento de versión (MAYOR: se elimina o redefine un principio; MENOR: se
  agrega un principio o sección; PARCHE: redacción).
- `docs/00-metodologia/08-constitucion.md` es un puntero a este archivo; no duplica su contenido.
- Toda revisión de PR verifica el cumplimiento; la complejidad adicional se justifica en
  "Complexity Tracking" de `plan.md`.
- Guía operativa para agentes: `CLAUDE.md` / `AGENTS.md` → `docs/00-metodologia/07-delegacion-a-ia.md`.

**Version**: 1.0.0 | **Ratified**: 2026-09-30 | **Last Amended**: 2026-09-30
