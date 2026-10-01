# Delegación a agentes de IA

> Este documento es **obligatorio** para cualquier agente de IA (Claude Code u otro) que trabaje en Rosetta, y para quien le delegue trabajo. Está escrito para que se pueda pegar tal cual como contexto.

## 1. Reglas que todo agente debe cumplir

1. **Lee antes de actuar.** Antes de cualquier tarea, lee: [docs/README.md](../README.md), la constitución (`.specify/memory/constitution.md`), este documento, y la spec de la feature (`specs/NNN-*/`).
2. **La documentación manda.** Si el código, Jira o tu intuición contradicen `docs/`, gana `docs/`. Si crees que `docs/` está mal, **detente y repórtalo**; no lo "corrijas" en el código ([04-sincronizacion.md](04-sincronizacion.md)).
3. **Solo trabajas sobre una tarea de Jira asignada.** Toda tarea tiene clave `ROS-…`. Sin clave no hay trabajo.
4. **No amplíes el alcance.** Implementa exactamente los criterios de aceptación. Nada de funcionalidades "útiles" no pedidas. Respeta los no-objetivos.
5. **No adivines.** Si falta información, escribe `[NECESITA ACLARACIÓN: …]` en la spec o pregunta. Nunca inventes una regla de negocio, un umbral, un color o un texto de UI.
6. **Pruebas primero.** Escribe la prueba, ejecútala, **muéstrala fallando**, luego implementa.
7. **Evidencia, no afirmaciones.** Toda afirmación de éxito va acompañada de la salida real del comando ([06-verificacion.md](06-verificacion.md)).
8. **Reporta los fallos tal como son.** Pruebas que fallan, pasos omitidos, dudas: se dicen explícitamente.
9. **Trazabilidad en todo:** clave Jira en ramas, commits, PR y marcadores de pruebas ([05-trazabilidad-y-convenciones.md](05-trazabilidad-y-convenciones.md)).
10. **No toques lo que no te corresponde:** no cambies `docs/` fuera de un CD, no edites títulos/criterios en Jira, no borres incidencias, no cambies la constitución.
11. **Seguridad:** nunca escribas secretos en el repositorio; nunca uses datos reales de un cliente en pruebas o semillas (usa los datos de [03-datos-de-referencia.md](../04-datos/03-datos-de-referencia.md)).
12. **Registra errores.** Si encuentras un error o inconsistencia fuera de tu tarea, anótalo como propuesta de `EC-NNN` en tu reporte final; no lo arregles de paso.
13. **Nunca te pongas como coautor.** Ningún commit lleva `Co-Authored-By:` ni otra línea de atribución a una IA, y ningún PR lleva "Generated with …" ni enlaces de sesión. El único autor es la persona del repositorio. Si una herramienta añade la atribución sola, quítala antes de hacer el commit (ver [05-trazabilidad-y-convenciones.md §3.2](05-trazabilidad-y-convenciones.md)). Está configurado en `.claude/settings.json` (`attribution` vacío), pero la regla aplica a cualquier agente y herramienta.
14. **No hagas commit, push ni PR sin que te lo pidan** en esa sesión. Al final de cada sesión, propón el commit y espera la confirmación.

## 2. Roles que puede tomar un agente

| Rol | Hace | No hace |
|---|---|---|
| **Especificador** | `/speckit-specify`, `/speckit-clarify`, `/speckit-checklist` a partir de historias de `docs/` | Decidir alcance nuevo |
| **Planificador** | `/speckit-plan`, `/speckit-tasks`, `/speckit-analyze`; asocia `T###` ↔ subtareas Jira | Cambiar el stack sin ADR |
| **Implementador** | `/speckit-implement` sobre tareas asignadas; pruebas primero; PR | Verificar su propio trabajo como verificación final |
| **Verificador** | Protocolo de [06-verificacion.md](06-verificacion.md) §2 nivel 5; acta de verificación | Recibir o confiar en el resumen del implementador |
| **Documentador** | Redactar un CD siguiendo la matriz de impacto | Fusionar su propio CD sin revisión |
| **Auditor de sincronización** | Checklist de [04-sincronizacion.md](04-sincronizacion.md) §8 | Corregir diferencias sin CD |

Un mismo agente **no** puede ser implementador y verificador de la misma tarea.

## 3. Plantillas de delegación

### 3.1 Implementar una tarea

```text
Rol: implementador en el proyecto Rosetta (SDD con Spec Kit).
Tarea Jira: ROS-133 — Implementar el cálculo de puntaje por columna (historia ROS-25, épica E02).
Feature: specs/005-motor-de-evidencia/

Antes de empezar lee, en este orden:
1. docs/README.md
2. docs/00-metodologia/07-delegacion-a-ia.md (reglas obligatorias)
3. .specify/memory/constitution.md
4. specs/005-motor-de-evidencia/spec.md, plan.md, tasks.md, data-model.md, contracts/
5. docs/02-requisitos/04-reglas-de-negocio.md (RN que aplican)

Alcance: SOLO las tareas T### de tasks.md marcadas con [ROS-133].
Actividades mínimas (de Jira): <pegar actividades de la subtarea>
Listo cuando: <pegar "Listo cuando" de la subtarea>

Procedimiento:
- Rama: 005-motor-de-evidencia.
- Para cada criterio: escribe la prueba con @pytest.mark.story/fr, ejecútala y muéstrala fallando; commit "test(evidence): ROS-133 … (roja)"; implementa; ejecuta; commit "feat(evidence): ROS-133 …".
- Ejecuta /speckit-converge al terminar y repite hasta "Converged".
- Ejecuta la suite completa y el lint.

Entrega un reporte con: comandos ejecutados y su salida, commits creados, tareas T### cubiertas,
cualquier ambigüedad encontrada (sin resolverla por tu cuenta), y posibles EC-NNN.
No declares éxito sin mostrar la salida de las pruebas.
```

### 3.2 Verificar una tarea

```text
Rol: verificador independiente en el proyecto Rosetta.
NO has visto el trabajo del implementador y no debes confiar en ningún resumen suyo.
Objetivo: comprobar si el PR <enlace> cumple las historias ROS-25, ROS-26.

1. Lee los criterios de aceptación desde docs/02-requisitos/02-historias-de-usuario.md (#ros-25, #ros-26)
   y los FR de specs/005-motor-de-evidencia/spec.md.
2. Para CADA criterio: localiza la prueba que lo cubre, ejecútala, y si no existe márcalo como NO CUBIERTO.
3. Busca comportamiento no especificado o que contradiga los no-objetivos.
4. Revisa trazabilidad: claves en commits/PR, marcadores de pruebas, commit de prueba roja previo.
5. Ejecuta /speckit-analyze y /speckit-converge y reporta su salida.
6. Rellena el "Acta de verificación" de docs/00-metodologia/06-verificacion.md §3.
Veredicto: Aprobado / Aprobado con observaciones / Rechazado, con evidencia por criterio.
```

### 3.3 Escribir una spec

```text
Rol: especificador. Ejecuta /speckit-specify para la feature 005-motor-de-evidencia.
Historias que cubre (copiar texto EXACTO desde docs/02-requisitos/02-historias-de-usuario.md):
ROS-25, ROS-26, ROS-27, ROS-28, ROS-29, ROS-33.
Reglas: docs/02-requisitos/04-reglas-de-negocio.md (RN-01 a RN-12).
No-objetivos: docs/01-producto/03-alcance-y-no-objetivos.md.
Requisitos:
- La spec NO menciona tecnología.
- La primera línea lista las claves ROS cubiertas.
- Cada FR-### indica la clave ROS de la que deriva.
- Incluye una sección "Fuera de alcance".
- Marca con [NEEDS CLARIFICATION] todo lo que no esté en docs/ (no inventes umbrales).
Luego ejecuta /speckit-clarify y /speckit-checklist.
```

### 3.4 Auditoría de sincronización

```text
Rol: auditor de sincronización. Ejecuta el checklist de docs/00-metodologia/04-sincronizacion.md §8.
No corrijas nada: reporta cada diferencia con su ubicación exacta (archivo/línea, clave Jira, commit)
y propone el EC-NNN o CD-NNN correspondiente.
```

## 4. Contexto mínimo que un agente necesita siempre

| Qué | Dónde |
|---|---|
| Qué es el producto | [01-producto/01-vision.md](../01-producto/01-vision.md) |
| Vocabulario | [01-producto/04-glosario.md](../01-producto/04-glosario.md) |
| Stack y estructura del repo | [03-arquitectura/02-stack-y-servicios.md](../03-arquitectura/02-stack-y-servicios.md), [03-backend.md](../03-arquitectura/03-backend.md), [04-frontend.md](../03-arquitectura/04-frontend.md) |
| Reglas del motor | [02-requisitos/04-reglas-de-negocio.md](../02-requisitos/04-reglas-de-negocio.md) |
| Datos | [04-datos/](../04-datos/) |
| Estilo | [05-diseno/](../05-diseno/) |
| Qué está roto o pendiente | [07-registro/](../07-registro/) |

## 5. Archivo de instrucciones del agente en el repositorio

En la raíz existen `CLAUDE.md` y `AGENTS.md` (para otros agentes), **cortos**: solo apuntan a este documento y a la constitución, y repiten las reglas que no se negocian (incluida la 13). Toda regla vive aquí, no allí, para no duplicar fuentes de verdad.

## 6. Protocolo de sesión (cómo empieza y termina cada chat)

**Una sesión = una unidad de trabajo** (una fase de Spec Kit de una feature, una tarea de Jira, un CD o un error). Para cada unidad nueva se abre un chat nuevo: el contexto queda limpio, el agente relee `docs/` y no arrastra decisiones viejas.

### 6.1 Mensaje de arranque (copiar y rellenar)

```text
Proyecto Rosetta. Antes de nada lee CLAUDE.md y sigue docs/00-metodologia/07-delegacion-a-ia.md.
Objetivo de esta sesión: <una sola unidad de trabajo, p. ej. "/speckit-specify de 002-autenticacion-oauth">
Jira: <ROS-n de la historia/tarea>
Spec/feature: <specs/NNN-slug o "aún no existe">
Rama: <la que corresponda según 05-trazabilidad §3.1, o "créala tú">
Límites: <lo que NO debe tocar>
Al terminar: muéstrame el resumen de cierre (6.3) y propón el commit; no hagas commit sin mi OK.
```

### 6.2 Lo que el agente hace al empezar (y debe mostrar)

1. Lee `CLAUDE.md`, la constitución, este documento y la spec/historia indicada.
2. Ejecuta `git status` y `git branch --show-current` y **muestra** en qué rama está y si hay cambios sin commit (si los hay y no son de esta sesión, pregunta antes de seguir).
3. Revisa `docs/07-registro/02-decisiones-pendientes.md` y `01-errores-conocidos.md` buscando entradas que afecten la unidad de trabajo, y las **lista**.
4. Muestra un **plan corto** (pasos y archivos que tocará) antes de cambiar nada.

### 6.3 Resumen de cierre que la persona siempre debe ver

| Qué | Contenido |
|---|---|
| Hecho | Lista de lo realizado, con archivos tocados |
| Evidencia | Salida real de pruebas, lint y tipos (o por qué no aplica) |
| Sincronización | Docs cambiados (CD-NNN), specs, incidencias de Jira actualizadas o pendientes |
| Pendiente | Lo que no se hizo y por qué; EC/DP nuevos propuestos |
| Decisiones para la persona | Preguntas abiertas, con recomendación |
| Commit propuesto | Mensaje en Conventional Commits con clave Jira, **sin** líneas de coautoría; se hace solo con el OK |

### 6.4 Reglas de cierre

- No se termina una sesión con trabajo a medias sin dejarlo escrito (en `tasks.md`, en Jira o en el resumen de cierre).
- Si la sesión cambió comportamiento, el CD correspondiente debe quedar registrado en [03-registro-de-sincronizacion.md](../07-registro/03-registro-de-sincronizacion.md).
