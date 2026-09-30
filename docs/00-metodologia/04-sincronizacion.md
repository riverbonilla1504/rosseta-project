# Sincronización: docs ↔ specs ↔ Jira ↔ código

> **Objetivo:** que en todo momento `docs/`, `specs/`, Jira y el código digan **lo mismo**. Si se cambia algo, se cambia en todos lados, en un orden fijo y dejando rastro.
>
> Este es el documento más importante de la metodología. Cualquier persona o agente que cambie algo del proyecto **debe** seguirlo.

---

## 1. Principio rector: los cambios solo bajan

```text
                 ┌──────────────────────────────┐
   1. MANDA      │  Constitución                │  .specify/memory/constitution.md
                 └──────────────┬───────────────┘
                                ▼
                 ┌──────────────────────────────┐
   2.            │  docs/  (fuente de verdad)   │  producto, requisitos, arquitectura, datos, diseño
                 └──────────────┬───────────────┘
                                ▼
                 ┌──────────────────────────────┐
   3.            │  specs/NNN-*/                │  spec.md → plan.md → tasks.md
                 └──────────────┬───────────────┘
                                ▼
                 ┌──────────────────────────────┐
   4.            │  Jira (proyecto ROS)         │  espejo de ejecución: qué se hace, quién, estado
                 └──────────────┬───────────────┘
                                ▼
                 ┌──────────────────────────────┐
   5. OBEDECE    │  Código + pruebas            │  backend/, frontend/
                 └──────────────────────────────┘
```

**Reglas absolutas:**

1. **El código se hace por Jira, y Jira se hace por la documentación.** Nunca al revés.
2. **Nadie cambia comportamiento editando primero el código.** Si el código necesita hacer algo distinto de lo documentado, se detiene el trabajo y se abre un **cambio de documentación** (`CD-NNN`).
3. **Nadie cambia alcance editando primero Jira.** Crear, borrar o reescribir una historia o épica en Jira sin que exista en `docs/` es drift.
4. **Cuando algo se cambia arriba, se propaga hacia abajo en la misma unidad de trabajo** (ver §4) y se anota en el [registro de sincronización](../07-registro/03-registro-de-sincronizacion.md).
5. **Si dos niveles se contradicen, gana el de arriba** y el de abajo se corrige. La contradicción se registra como error conocido si no se puede corregir en el momento.

### ¿Y si el código descubre algo?

Es normal que al implementar se descubra que la spec es incompleta o imposible. La información **sube**, pero la decisión **baja**:

```text
Código descubre un problema
   → se DETIENE la implementación de esa parte
   → se registra (EC-NNN si es un error, DP-NNN si es una decisión abierta)
   → se abre un CD-NNN que cambia docs/
   → se propaga: spec → Jira → código
```

Nunca "se arregla en el código y luego se documenta". Eso es exactamente el spec drift.

---

## 2. Qué es dueño de qué

No todo dato vive en `docs/`. Cada sistema es **dueño** de cierto tipo de información; solo el dueño se edita, los demás lo reflejan.

| Información | Dueño (se edita aquí) | Se refleja en |
|---|---|---|
| Visión, alcance, no-objetivos | `docs/01-producto` | specs, Jira (épicas) |
| Épicas y su descripción | `docs/02-requisitos/01-epicas.md` | Jira (Epic) |
| Historias: título, "Como/quiero/para", criterios de aceptación, prioridad, fase | `docs/02-requisitos/02-historias-de-usuario.md` | spec.md, Jira (Historia) |
| Reglas de negocio | `docs/02-requisitos/04-reglas-de-negocio.md` | spec.md (FR), pruebas |
| Requisitos no funcionales | `docs/02-requisitos/05-requisitos-no-funcionales.md` | spec.md, plan.md, pruebas |
| Arquitectura, stack, API, seguridad | `docs/03-arquitectura` + ADRs | plan.md, contracts/, código |
| Modelo y diccionario de datos | `docs/04-datos` | data-model.md, migraciones Django |
| Estilo, tokens, componentes, pantallas | `docs/05-diseno` | CSS/tokens del frontend, componentes |
| Estrategia de calidad, DoR/DoD | `docs/06-calidad` | CI, pruebas |
| Detalle de implementación de una feature (FR, plan, tareas T###) | `specs/NNN-*/` | Jira (subtareas), código |
| **Estado** de ejecución (Por hacer/En curso/…) | **Jira** | registro de sincronización (al cerrar) |
| **Asignación, comentarios, tiempo real invertido** | **Jira** | — |
| Nombres internos, refactorizaciones que no cambian comportamiento | **Código** | — (no requieren cambiar docs) |
| Errores conocidos | `docs/07-registro/01-errores-conocidos.md` | Jira (Error) |

> Si no sabes si un cambio "cambia comportamiento": **sí lo cambia** si modifica algo que un usuario, una API, un dato persistido o un criterio de aceptación puede observar.

---

## 3. Identificadores que unen todo

Cada pieza lleva un identificador que aparece en todos los niveles. El detalle está en [05-trazabilidad-y-convenciones.md](05-trazabilidad-y-convenciones.md). Resumen:

| Pieza | ID canónico | Ejemplo | Aparece en |
|---|---|---|---|
| Épica | `E01`…`E15` + clave Jira | E02 · ROS-2 | docs, Jira |
| Historia | **Clave Jira** | ROS-25 | docs, spec.md, commits, PR, pruebas |
| Tarea técnica | **Clave Jira** | ROS-133 | docs (MVP), tasks.md, commits, PR |
| Feature Spec Kit | `NNN-slug` | 005-motor-de-evidencia | specs/, ramas, PR |
| Requisito funcional | `FR-###` (por feature) | FR-004 | spec.md, pruebas |
| Tarea de Spec Kit | `T###` (por feature) + clave Jira | T012 [ROS-133] | tasks.md |
| Cambio de documentación | `CD-NNN` | CD-003 | docs, registro, PR |
| Error conocido | `EC-NNN` + clave Jira (Error) | EC-004 | registro, Jira |
| Decisión pendiente | `DP-NNN` | DP-001 | registro |
| Decisión de arquitectura | `ADR-NNNN` | ADR-0003 | docs/03-arquitectura/adr |

**Elementos nuevos:** un elemento que todavía no existe en Jira se escribe en `docs/` con la clave provisional `ROS-NUEVO-<slug>` (por ejemplo `ROS-NUEVO-exportar-yaml`). En el mismo CD se crea en Jira y la clave provisional se reemplaza por la real antes de fusionar el PR. **Ningún PR se fusiona con claves `ROS-NUEVO-` en `docs/`.**

---

## 4. Procedimiento de cambio (CD — Cambio de Documentación)

Todo cambio que afecte comportamiento, alcance, datos, arquitectura o estilo sigue estos pasos. Plantilla: [plantillas/cambio-de-documentacion.md](../plantillas/cambio-de-documentacion.md).

### Paso 1 — Registrar
- Asignar el siguiente `CD-NNN` (ver el último en el [registro](../07-registro/03-registro-de-sincronizacion.md)).
- Describir: qué cambia, por qué, quién lo pide, qué historias/épicas toca.

### Paso 2 — Analizar impacto
Usar la **matriz de impacto** (§5) para listar exactamente qué archivos de `docs/`, qué specs, qué incidencias de Jira y qué partes del código se ven afectados.

### Paso 3 — Cambiar `docs/`
- Rama: `docs/CD-NNN-slug`.
- Editar **todos** los documentos afectados (no solo uno: si cambia una regla de negocio, cambia la regla, la historia, la matriz de trazabilidad…).
- Agregar entrada en [04-changelog.md](../07-registro/04-changelog.md).
- PR con la plantilla; lo revisa alguien distinto a quien lo escribió.

### Paso 4 — Propagar a `specs/`
- Si la feature **no se ha implementado**: editar `spec.md` → `/speckit-clarify` → `/speckit-plan` → `/speckit-tasks` → `/speckit-analyze`.
- Si la feature **ya se implementó**: crear una nueva feature `NNN-cambio-slug` o reabrir la existente; nunca editar código sin spec actualizada.

### Paso 5 — Propagar a Jira
- **Actualizar** las incidencias afectadas (título, descripción, criterios, etiquetas, prioridad, fase) copiando **textualmente** desde `docs/`.
- **Crear** las nuevas (reemplazando `ROS-NUEVO-…` en docs).
- **Nunca borrar** incidencias: si algo sale del alcance, se cierra con resolución "Descartado" y comentario `Descartado por CD-NNN`.
- Actualizar el bloque **"Fuente de verdad"** de cada incidencia tocada (§7).
- Comentar en cada incidencia: `Sincronizado por CD-NNN — commit <sha> — <enlace al PR de docs>`.

### Paso 6 — Propagar al código
- Solo a través de tareas de Jira en *En curso*, siguiendo el [flujo de trabajo](03-flujo-de-trabajo.md).
- Las pruebas afectadas se actualizan **antes** que el código (deben fallar primero con el nuevo comportamiento).

### Paso 7 — Verificar
- `/speckit-analyze` sin CRITICAL, `/speckit-converge` = Converged, CI verde, [verificación independiente](06-verificacion.md).

### Paso 8 — Cerrar y registrar
- Añadir una línea al [registro de sincronización](../07-registro/03-registro-de-sincronizacion.md) con: CD, fecha, commit de docs, specs, claves Jira, PRs de código, estado.
- Un CD está **cerrado** solo cuando los cinco niveles dicen lo mismo.

### Cambios que NO necesitan CD
- Corrección de erratas o redacción que no cambia el significado → PR directo a docs con prefijo `docs:` y entrada en el changelog.
- Refactorización interna de código sin cambio observable → PR normal con clave Jira de una tarea técnica.
- Cambios de estado/asignación en Jira.

---

## 5. Matriz de impacto

Qué más hay que tocar cuando cambia algo:

| Si cambia… | docs/ | specs/ | Jira | Código y pruebas |
|---|---|---|---|---|
| **Visión o no-objetivos** | 01-producto/*; revisar épicas e historias afectadas | Sección "Fuera de alcance" de las specs afectadas | Épicas/historias descartadas o nuevas | Retirar/impedir funcionalidad fuera de alcance |
| **Una épica** | 01-epicas.md; 02-historias (las de la épica); 05-roadmap | Specs de la épica | Epic + sus historias | — (vía historias) |
| **Una historia** (texto o criterios) | 02-historias; 03-matriz-de-trazabilidad; 03-tareas-mvp si es MVP | spec.md (User Story + FR + Acceptance) → plan → tasks | Historia (+ subtareas) | Pruebas de aceptación primero, luego código |
| **Prioridad o fase** | 02-historias; 01-epicas; 05-roadmap | Reordenar features si aplica | Etiquetas `P*`/`Fase-*`, sprint | — |
| **Regla de negocio** (p. ej. un peso del motor) | 04-reglas-de-negocio; 03-arquitectura/06-motor; historias afectadas | FR de specs afectadas | Historias + subtareas afectadas | Pruebas unitarias del motor primero |
| **Requisito no funcional** | 05-requisitos-no-funcionales; 06-calidad si cambia umbral | plan.md (Constraints) | Historias de E13 | Pruebas de rendimiento/seguridad; CI |
| **Stack o servicio** | 03-arquitectura/02 + **nuevo ADR**; 08-infraestructura | plan.md de specs futuras | Tarea técnica | Dependencias, docker-compose, CI |
| **Contrato de API** | 03-arquitectura/05-api | contracts/ | Subtareas backend y frontend afectadas | Pruebas de contrato primero |
| **Modelo de datos** | 04-datos/01 y 02 | data-model.md | Subtareas de BD | Migración Django + pruebas |
| **Token o componente de diseño** | 05-diseno/01 o 02 | plan.md de features con UI | Subtareas frontend | `tokens.css`, componentes, pruebas visuales |
| **Pantalla** | 05-diseno/03 | spec.md (escenarios UI) | Historias de la pantalla | Pruebas E2E primero |
| **Texto/microcopy** | 05-diseno/04 | spec.md si es criterio | — o subtarea | Pruebas que verifiquen el texto |
| **Proceso (esta metodología)** | 00-metodologia/* | — | — | CI si cambia un gate |
| **Constitución** | 00-metodologia/08 + ADR | `/speckit-constitution` y re-análisis de specs activas | — | — |

---

## 6. Sincronización de tareas de Spec Kit con Jira

`/speckit-tasks` genera tareas `T###` más finas que las subtareas de Jira. Regla:

1. Cada `T###` se asocia a **una** subtarea Jira existente, escribiendo su clave: `- [ ] T012 [P] [US1] [ROS-133] Implementar cálculo de puntaje en backend/apps/evidence/services/scoring.py`.
2. Si una `T###` no encaja en ninguna subtarea existente (trabajo nuevo), se **crea** la subtarea en Jira bajo la historia correspondiente, en el mismo momento, antes de implementar.
3. Si una subtarea de Jira no queda cubierta por ninguna `T###`, `/speckit-analyze` o la revisión deben detectarlo: o falta una tarea o la subtarea sobra (y se cierra como "Descartado" con CD).
4. Las actividades de la descripción de la subtarea Jira son la **lista de verificación mínima**; `tasks.md` puede detallar más, nunca menos.
5. Las tareas añadidas por `/speckit-converge` (fase "Convergence") también se asocian a subtareas Jira existentes o nuevas.

---

## 7. Bloque "Fuente de verdad" en Jira

Toda incidencia de Jira termina su descripción con este bloque (se mantiene actualizado en cada sincronización):

```text
────────────────────────────────
Fuente de verdad
• Documento: docs/02-requisitos/02-historias-de-usuario.md#ros-25
• Spec: specs/005-motor-de-evidencia/spec.md (FR-001, FR-002)
• Última sincronización: CD-004 · 2026-10-02 · commit a1b2c3d
Esta incidencia es un espejo. No editar título, descripción ni criterios aquí:
cambiar primero docs/ siguiendo docs/00-metodologia/04-sincronizacion.md
────────────────────────────────
```

> `[PENDIENTE]` Las 190 incidencias actuales se crearon sin este bloque ([EC-004](../07-registro/01-errores-conocidos.md)). Se añade en la fase de preparación (CD-001).

---

## 8. Auditoría de sincronización (detección de drift)

Se hace **al final de cada sprint** y antes de cada entrega. Resultado: una entrada en el registro de sincronización y, si hay diferencias, errores conocidos y CDs.

| # | Verificación | Cómo | Esperado |
|---|---|---|---|
| 1 | Número de épicas, historias y subtareas | JQL `project = ROS AND issuetype = Epic` / `= 10050` (historias) / `= Subtask`, contra las tablas de docs | Coinciden (hoy: 15 / 104 / 71) |
| 2 | Títulos y criterios de historias | Comparar docs vs. Jira (script de auditoría, ver §9) | Idénticos |
| 3 | Etiquetas de prioridad/fase/sprint | Script de auditoría | Idénticas |
| 4 | Toda historia del sprint tiene spec | `specs/*/spec.md` lista la clave | Sí |
| 5 | Todo FR tiene prueba | Marcadores de pruebas (ver [06-calidad](../06-calidad/03-matriz-de-trazabilidad.md)) | Sí |
| 6 | Toda prueba referencia un FR/historia | Idem | Sí |
| 7 | Toda tarea `Listo` en Jira tiene evidencia | Comentario de cierre con enlace a PR/CI | Sí |
| 8 | `/speckit-converge` en cada feature del sprint | Ejecutarlo | "Converged" |
| 9 | Esquema de BD vs. diccionario de datos | `python manage.py inspectdb`/migraciones vs. [02-diccionario](../04-datos/02-diccionario-de-datos.md) | Coinciden |
| 10 | Contrato OpenAPI vs. [05-api](../03-arquitectura/05-api.md) | Esquema generado por `drf-spectacular` vs. doc | Coinciden |
| 11 | Tokens CSS vs. [01-sistema-de-diseno](../05-diseno/01-sistema-de-diseno-nocturne.md) | Comparar `tokens.css` | Coinciden |
| 12 | No hay claves `ROS-NUEVO-` ni `[PENDIENTE]` vencidos | `grep` | Ninguno sin DP asociado |

## 9. Automatización prevista

La sincronización es **manual y disciplinada** al inicio. Se automatiza progresivamente (cada automatización es una tarea técnica con su CD):

| Automatización | Qué hace | Estado |
|---|---|---|
| Script `tools/sync_audit.py` | Lee las tablas de `docs/02-requisitos/*.md`, consulta Jira por API y reporta diferencias | `[PENDIENTE]` fase de preparación |
| Check de CI "trazabilidad" | Falla el PR si el título/commits no tienen clave `ROS-…` o si toca `backend/`/`frontend/` sin referenciar una spec | `[PENDIENTE]` |
| Check de CI "drift de API" | Compara el OpenAPI generado con el contrato documentado | `[PENDIENTE]` |
| Check de CI "drift de datos" | `makemigrations --check` + comparación con el diccionario | `[PENDIENTE]` |
| Integración Jira ↔ GitHub | Enlaza commits/PR a incidencias por clave | `[PENDIENTE]` [DP-012](../07-registro/02-decisiones-pendientes.md) |

## 10. Notion

El backlog se construyó primero en Notion (página "Rosetta — Product Backlog", bases "Backlog priorizado" y "Tareas · Fase 1 (MVP)"). Desde el **2026-09-29**:

- **Notion queda congelado como archivo histórico.** No se edita.
- Todo su contenido está absorbido en `docs/` (historias, criterios, tareas, actividades, sprints, estimaciones).
- Si se decide mantenerlo como espejo, se agrega como un nivel más bajo que Jira en §1 y a la matriz §5 (ver [DP-010](../07-registro/02-decisiones-pendientes.md)).

## 11. Checklist rápido para cualquier cambio

```text
[ ] ¿Cambia algo observable? → Sí: abrir CD-NNN.
[ ] ¿Actualicé TODOS los docs que marca la matriz de impacto?
[ ] ¿Entrada en el changelog de docs?
[ ] ¿Specs afectadas actualizadas y /speckit-analyze sin CRITICAL?
[ ] ¿Jira actualizado (texto copiado de docs, bloque "Fuente de verdad", comentario con CD)?
[ ] ¿Pruebas cambiadas ANTES que el código?
[ ] ¿/speckit-converge = Converged y CI verde?
[ ] ¿Verificación independiente con evidencia?
[ ] ¿Línea en el registro de sincronización?
```
