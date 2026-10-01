# Cómo usamos GitHub Spec Kit

> Repositorio: https://github.com/github/spec-kit — revisado el 2026-09-29.
> Spec Kit es el **framework** con el que aplicamos la **metodología** SDD. Las reglas de *cuándo* y *cómo* se usa cada comando en Rosetta están aquí; lo que diga la documentación oficial de Spec Kit aplica para todo lo demás.

## 1. Instalación (hecha el 2026-09-30, versión fijada **v1.0.13**)

Requisitos: **Python 3.11+**, **[uv](https://docs.astral.sh/uv/)**, **Git** y un agente de IA compatible (usamos **Claude Code**).

Cada persona instala la CLI una vez en su equipo, **fijando la misma versión** que el repositorio:

```bash
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git@v1.0.13
```

Inicialización ya ejecutada sobre el repositorio (no hay que repetirla):

```bash
specify init --here --force --non-interactive --integration claude --script sh
```

- Integración Claude: las órdenes se instalan como **skills** en `.claude/skills/speckit-*/SKILL.md` y se invocan como `/speckit-<orden>`. Una sesión de Claude Code abierta **antes** de instalarlas no las ve: hay que abrir una sesión nueva.
- Scripts `sh` (Git Bash en Windows, bash en macOS/Linux) para que todo el equipo use los mismos.
- Actualizar Spec Kit = cambiar la versión aquí (CD) y ejecutar `specify init --here --force --integration claude --script sh` en una rama, revisando el diff de `.specify/` y `.claude/skills/`.

## 2. Estructura que crea Spec Kit

```text
DB_MVP/
├── .specify/
│   ├── memory/
│   │   └── constitution.md        ← principios no negociables (borrador en docs/00-metodologia/08-constitucion.md)
│   ├── templates/                 ← spec-template, plan-template, tasks-template, checklist-template
│   ├── scripts/                   ← scripts de soporte (create-new-feature, check-prerequisites…)
│   └── feature.json               ← feature activa
├── specs/
│   └── NNN-nombre-feature/        ← una carpeta por feature (001, 002, …)
│       ├── spec.md                ← QUÉ y POR QUÉ (sin tecnología)
│       ├── plan.md                ← CÓMO (stack, estructura, gates de la constitución)
│       ├── research.md            ← investigación técnica que justifica el plan
│       ├── data-model.md          ← entidades de la feature
│       ├── contracts/             ← contratos de API de la feature
│       ├── quickstart.md          ← escenarios de validación clave
│       ├── checklists/            ← checklists de calidad de requisitos
│       └── tasks.md               ← tareas ejecutables T001, T002…
├── docs/                          ← ESTA documentación (fuente de verdad global)
├── backend/                       ← Django
└── frontend/                      ← Next.js
```

**Relación entre `docs/` y `specs/`:**

- `docs/` describe el **producto completo** y las decisiones transversales (arquitectura, datos, estilo, metodología).
- `specs/NNN-*/` describe **una feature concreta** y deriva de `docs/`. Una spec nunca contradice a `docs/`; si hace falta contradecirla, primero se cambia `docs/` (ver [04-sincronizacion.md](04-sincronizacion.md)).

## 3. Los comandos y cuándo se usan

Los comandos son **skills del agente** (se escriben en el chat del agente, no en la terminal). En Claude Code se invocan como `/speckit-<comando>`.

### 3.1 Una vez por proyecto

| Comando | Qué produce | Regla en Rosetta |
|---|---|---|
| `/speckit-constitution` | `.specify/memory/constitution.md` | Se genera a partir de [08-constitucion.md](08-constitucion.md). Cambiarla exige un ADR. |

### 3.2 Por cada feature (ciclo principal)

| Orden | Comando | Entrada | Salida | Obligatorio |
|---|---|---|---|---|
| 1 | `/speckit-specify` | Descripción de la feature + historias de Jira que cubre | `specs/NNN-*/spec.md`, rama `NNN-*` | ✅ |
| 2 | `/speckit-clarify` | `spec.md` | Preguntas y respuestas integradas en la spec | ✅ si quedan `[NEEDS CLARIFICATION]` |
| 3 | `/speckit-checklist` | `spec.md` | `checklists/*.md` de calidad de requisitos | ✅ (mínimo: requisitos) |
| 4 | `/speckit-plan` | `spec.md` + stack de `docs/03-arquitectura` | `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md` | ✅ |
| 5 | `/speckit-tasks` | `plan.md` y artefactos | `tasks.md` | ✅ |
| 6 | `/speckit-analyze` | `spec.md`, `plan.md`, `tasks.md` | Informe de consistencia (solo lectura) | ✅ **gate antes de implementar** |
| 7 | `/speckit-implement` | `tasks.md` | Código y pruebas | ✅ |
| 8 | `/speckit-converge` | spec + plan + tasks + código | Tareas faltantes añadidas a `tasks.md` o estado **Converged** | ✅ **se repite 7→8 hasta "Converged"** |

### 3.3 Procesos independientes (extensiones)

| Proceso | Instalación | Comandos | Uso en Rosetta |
|---|---|---|---|
| **Corrección de errores** | `specify extension add bug` | `/speckit-bug-assess` → `/speckit-bug-fix` → `/speckit-bug-test` (veredicto `verified` / `partial` / `failed`) | Todo error de código. Se registra también en [errores conocidos](../07-registro/01-errores-conocidos.md) y en Jira (tipo *Error*). |
| **Evaluación de ideas** | `specify extension add assess` | `intake` → `research` → `define` → `shape` → `decide` (go / clarify / kill) | Ideas nuevas grandes antes de convertirlas en épica. |

> `taskstoissues` de Spec Kit crea **GitHub Issues**. **No lo usamos**: nuestro gestor es **Jira**. La conversión tareas → Jira sigue el procedimiento de [04-sincronizacion.md §6](04-sincronizacion.md).

## 4. Reglas de uso en Rosetta

1. **Una feature de Spec Kit agrupa historias de Jira relacionadas** (normalmente de una misma épica y sprint). La primera línea de `spec.md` lista las claves `ROS-…` que cubre.
2. **La spec no inventa alcance:** solo puede contener historias que ya existen en [02-historias-de-usuario.md](../02-requisitos/02-historias-de-usuario.md). Si surge algo nuevo, primero se agrega a `docs/` y a Jira.
3. **Nada de tecnología en `spec.md`.** El stack vive en `plan.md` y debe coincidir con [03-arquitectura](../03-arquitectura/).
4. **Cada `FR-###` de la spec se mapea a una historia `ROS-…`** y cada tarea `T###` de `tasks.md` lleva la clave Jira de la subtarea que implementa (`[ROS-133]`).
5. **`/speckit-analyze` es un gate:** si reporta un hallazgo CRITICAL, no se implementa.
6. **`/speckit-converge` es la verificación de completitud:** no se cierra ninguna tarea en Jira hasta que la feature esté "Converged" y las pruebas pasen (ver [06-verificacion.md](06-verificacion.md)).
7. **Pruebas primero:** en Rosetta las pruebas **no son opcionales** (la plantilla de Spec Kit las marca como opcionales; nuestra constitución las hace obligatorias).

## 5. Plan inicial de features (MVP)

Propuesta de cómo agrupar las 38 historias del MVP en features de Spec Kit. Se confirma al iniciar cada una.

| Feature | Sprint | Historias Jira |
|---|---|---|
| `001-design-system-nocturne` | 1 | ROS-74, ROS-75 |
| `002-autenticacion-oauth` | 1 | ROS-89, ROS-90, ROS-91, ROS-92, ROS-93 |
| `003-proyectos-y-nucleo-de-datos` | 1 | ROS-78, ROS-81, ROS-84 |
| `004-ingesta-de-fuentes` | 2 | ROS-16, ROS-17, ROS-21, ROS-22, ROS-23 |
| `005-motor-de-evidencia` | 3 | ROS-25, ROS-26, ROS-27, ROS-28, ROS-29, ROS-33 |
| `006-cola-priorizada` | 3 | ROS-36 |
| `007-revision-humana` | 4 | ROS-42, ROS-43, ROS-44, ROS-45, ROS-46, ROS-47, ROS-48 |
| `008-catalogo` | 5 | ROS-50, ROS-51, ROS-52, ROS-54, ROS-55 |
| `009-panorama` | 5 | ROS-37, ROS-38, ROS-39, ROS-40 |

## 6. Mapeo con la terminología del curso

| Curso / nosotros | Spec Kit |
|---|---|
| Intención | `spec.md` → introducción + "Why this priority" |
| Comportamiento | `spec.md` → User Scenarios + Acceptance Scenarios (Given/When/Then) |
| Restricciones | `spec.md` → Functional Requirements + Edge Cases; constitución |
| No-objetivos | `spec.md` → Assumptions / sección "Fuera de alcance" (la agregamos siempre) |
| Gaps | `[NEEDS CLARIFICATION]` → `/speckit-clarify` |
