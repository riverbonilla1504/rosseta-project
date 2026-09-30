# Spec-Driven Development (SDD)

> Fuente: *Curso Spec-Driven Development — Clase 1: "Del Vibe Coding al Spec-Driven Development"* y el documento [`spec-driven.md`](https://github.com/github/spec-kit/blob/main/spec-driven.md) de GitHub Spec Kit.

## 1. Qué es SDD

**Spec-Driven Development es una metodología, no una herramienta.** Es una disciplina de ingeniería que prioriza la creación de **contratos técnicos formales y vivos** antes de generar código con IA.

Tres piezas distintas, que no se deben confundir:

| Pieza | Qué es | En Rosetta |
|---|---|---|
| **SDD** | La metodología de pensamiento y estructuración del software | Cómo trabajamos (esta carpeta) |
| **Spec Kit** | Un framework open-source para estandarizar especificaciones | `specify-cli`, carpetas `.specify/` y `specs/` |
| **Agentes de IA** (Claude Code, Copilot…) | Quienes ejecutan las instrucciones de la spec | Implementan tareas de Jira siguiendo la spec |

### Pilares metodológicos

1. Redactar especificaciones **a prueba de balas**, que resistan cambios y crecimiento.
2. Dominar **contratos técnicos claros** entre componentes del sistema.
3. **Orquestar flujos agénticos** para que la IA entregue exactamente el software esperado.

## 2. Por qué no "vibe coding"

**Vibe coding** es programar dejándose llevar por prompts sueltos e intuición del momento con asistencia de IA. Sirve para prototipos, pruebas de concepto y demos. **No sirve para productos reales.**

| Demo (vibe coding) | Producto (SDD) |
|---|---|
| Velocidad sorprendente | Bases documentadas y probadas |
| Sensación de control inicial | Contratos técnicos perdurables |
| Prototipos efímeros | Escalabilidad y arquitectura clara |
| Documentación inexistente | Mantenible por un equipo |

Problemas que aparecen al crecer sin especificación:

- **Deuda técnica invisible:** parches e inconsistencias acumulados en silencio.
- **Incertidumbre en producción:** nadie puede afirmar si la app es escalable o segura.
- **Falta de mantenibilidad:** si falla mañana, nadie sabe qué pasa en el repositorio.
- **Pérdida de decisiones:** tras 20–30 prompts, ¿quién tomó las decisiones de arquitectura, el desarrollador o la IA?

### Un prompt largo NO es una especificación

Los 5 vicios de un prompt descriptivo, que **prohibimos** en este proyecto:

| Vicio | Ejemplo | Cómo lo evitamos en Rosetta |
|---|---|---|
| 1. **Alcance desmedido** | Pedir autenticación social y pasarela de pagos como simples viñetas | Cada capacidad es una historia con su épica, fase y estimación (ver [02-requisitos](../02-requisitos/)) |
| 2. **Subjetividad** | "Interfaz moderna tipo Airbnb", "animaciones suaves" | Criterios de aceptación medibles y tokens de diseño concretos |
| 3. **Micromanagement** | Definir colores exactos antes que la base de datos | Primero datos y contratos; el estilo vive en su documento |
| 4. **Desconexión de negocio** | "Firebase o Postgres, la que sea" | El stack está decidido y justificado en ADRs |
| 5. **Delegación crítica** | "Piensa en inconsistencias y soluciónalas" | Las reglas de negocio y restricciones las define la spec, no la IA |

## 3. Saturación de contexto y efecto Jenga

- Tras 30–50 mensajes, la ventana de contexto de la IA acumula decisiones contradictorias; la IA olvida las "reglas de oro" y prioriza parches.
- **El historial de chat NO es un documento de ingeniería.** Un chat se contamina; una especificación guardada en el repositorio perdura.
- **Efecto Jenga:** al ajustar una funcionalidad, otra que funcionaba se cae. Con SDD las pruebas validan contra un contrato vivo y los cambios son controlados y previsibles.

**Regla del proyecto:** todo conocimiento que importe se escribe en `docs/` o en `specs/`. Nada importante vive solo en una conversación.

## 4. Fuente única de verdad

| Desarrollo tradicional / vibe coding | SDD |
|---|---|
| **Código → fuente de verdad** | **Especificación → fuente de verdad → código** |
| La verdad está oculta en el código | La especificación es el documento autoritativo vivo |
| Para entender el sistema hay que descifrar el repositorio | El código es un subproducto generado desde la spec |
| La documentación es opcional | La IA ejecuta cambios guiada por la especificación |

Spec Kit lo llama **la inversión de poder**: *las especificaciones no sirven al código; el código sirve a las especificaciones.*

## 5. Spec drift (desfase de especificación)

**Spec drift** es la divergencia que ocurre cuando el código cambia pero la especificación no se actualiza.

> Ejemplo de la clase: la spec dice "grilla de reservas 24 horas"; por prompt se le pide a la IA restringir a 7:00–22:00 y cambia el código. Ahora hay dos fuentes de verdad contradictorias. **Con dos fuentes de verdad, en realidad no tienes ninguna.**

Consecuencias:

- **Confusión en la IA:** al analizar el repositorio recibe instrucciones contradictorias entre spec y código.
- **Pérdida de mantenibilidad:** el equipo ya no puede explicar cómo funciona el software sin auditar línea por línea.

**La solución SDD:** los cambios se hacen **primero en la especificación** y el código se regenera o actualiza a partir de ella. En Rosetta esto se extiende a Jira: ver [04-sincronizacion.md](04-sincronizacion.md).

## 6. Anatomía mínima de una spec

Toda spec de Rosetta tiene, como mínimo, estas cuatro partes:

| Parte | Pregunta que responde | Ejemplo en Rosetta |
|---|---|---|
| **1. Intención (Intent)** | ¿Por qué importa? ¿Qué problema de negocio resuelve? | Un analista no puede confiar en un esquema sin documentación; necesita saber qué significa `IMPTE` con evidencia |
| **2. Comportamiento (Behavior)** | ¿Cómo interactúa el usuario y qué responde exactamente el sistema? | Al confirmar `PGCOD`, el sistema muestra "desbloquea 380 columnas" y la cola se reordena |
| **3. Restricciones (Constraints)** | Límites físicos, de seguridad y reglas inflexibles | El nombre de la columna pesa como máximo 0,40; "Confirmada" solo tras validación humana |
| **4. No-objetivos (Non-goals)** | Qué NO se construye en esta fase | No hay pasarela de pagos en el MVP; no se escribe en la base de origen |

Los **no-objetivos son vitales**: como la IA no es determinista, tiende a inventar funcionalidades no pedidas. Delimitar lo que NO se construye es tan crítico como definir lo que sí.

### Prompt vs. spec

| Dimensión | Prompt (vibe coding) | Spec (SDD) |
|---|---|---|
| Naturaleza | Historial de chat efímero e improvisado | Documento técnico vivo en el repositorio |
| Fuente de verdad | El código generado (frecuentemente desfasado) | La especificación técnica |
| Evolución | Saturación de contexto y parches | Evolución estructurada con contratos vivos |
| Propósito | Demos rápidas | Productos reales |

## 7. Principios de SDD según Spec Kit

1. **Las especificaciones son la lengua franca.** Mantener el software significa evolucionar especificaciones.
2. **Especificaciones ejecutables.** Deben ser precisas, completas y sin ambigüedad suficiente para generar sistemas que funcionen.
3. **Refinamiento continuo.** La validación de consistencia es continua, no un control único.
4. **Contexto basado en investigación.** Se investiga compatibilidad de librerías, rendimiento y seguridad antes de decidir.
5. **Retroalimentación bidireccional.** La realidad de producción (métricas, incidentes) alimenta la especificación — **pero siempre entrando por la spec**, nunca por el código directamente.
6. **Ramas para explorar.** Se pueden generar varias implementaciones desde la misma spec.

### Cómo las plantillas disciplinan a la IA

- Separan el **qué/por qué** (spec) del **cómo** (plan): la spec no menciona tecnología.
- Obligan a marcar la incertidumbre con `[NEEDS CLARIFICATION: pregunta concreta]` en vez de adivinar. En esta documentación usamos el equivalente en español: `[NECESITA ACLARACIÓN: …]` y `[PENDIENTE]`.
- Incluyen checklists que funcionan como "pruebas unitarias" de la spec.
- Imponen **gates** de la constitución (simplicidad, anti-abstracción, pruebas primero).
- Prohíben funcionalidades especulativas: todo rastrea a una historia con criterios de aceptación.

## 8. Las 8 preguntas del proyecto (aplicadas a Rosetta)

La clase propone definir las bases antes de escribir código. Respuestas de Rosetta (detalle en [01-producto/01-vision.md](../01-producto/01-vision.md)):

| # | Pregunta | Respuesta |
|---|---|---|
| 1 | Nombre provisional | **Rosetta** — motor de evidencia |
| 2 | ¿Qué problema concreto? | Bases de datos heredadas con columnas crípticas, sin llaves foráneas declaradas ni comentarios; nadie sabe con certeza qué significa cada columna |
| 3 | ¿Quién tiene el problema? | Analistas de datos, ingenieros de migración/modernización, responsables de gobierno de datos (típicamente en banca) |
| 4 | ¿Qué app construimos? | Una web que reconstruye el modelo semántico de un esquema con evidencia verificable y validación humana |
| 5 | Máximo 5 funcionalidades | Ingesta de fuentes · Motor de evidencia · Revisión humana · Catálogo · Panorama |
| 6 | Restricciones conocidas | Nunca inventar (declarar "Desconocida"); el nombre pesa ≤ 0,40; "Confirmada" solo por humano; toda afirmación con cita; modo sin LLM auditable |
| 7 | Qué NO construimos (MVP) | Pagos, grafo/ERD, servidor MCP, conectores directos, generador de datos, colaboración multiusuario (ver [03-alcance-y-no-objetivos](../01-producto/03-alcance-y-no-objetivos.md)) |
| 8 | Preguntas sin respuesta (gaps) | Ver [07-registro/02-decisiones-pendientes.md](../07-registro/02-decisiones-pendientes.md) |
