# Trazabilidad y convenciones

> Objetivo: desde cualquier línea de código se puede llegar a la historia, la épica y el documento que la justifican; y desde cualquier historia se puede llegar a su spec, sus pruebas y su código.

## 1. La cadena de trazabilidad

```text
Épica (E02 · ROS-2)
 └─ Historia (ROS-25)                          docs/02-requisitos/02-historias-de-usuario.md
     ├─ Spec (specs/005-motor-de-evidencia)    spec.md → FR-001, FR-002 …
     │   ├─ Plan / data-model / contracts
     │   └─ tasks.md → T012 [ROS-133]
     ├─ Subtarea Jira (ROS-133)
     │   ├─ Rama: 005-motor-de-evidencia
     │   ├─ Commits: feat(evidence): ROS-133 …
     │   ├─ PR: "ROS-133 · Cálculo de puntaje por columna"
     │   └─ Pruebas: @pytest.mark.story("ROS-25") + @pytest.mark.fr("005:FR-002")
     └─ Evidencia de cierre: PR + ejecución de CI + comentario en Jira
```

## 2. Identificadores

### 2.1 Épicas, historias y tareas

- La **clave de Jira es el identificador canónico** de historias y tareas. Se usa igual en docs, specs, commits, PRs y pruebas.
- Épicas: `E01`…`E15` (orden de documentación) ↔ `ROS-1`…`ROS-15`. Regla fija: **E`nn` = ROS-`n`**.
- Historias actuales: `ROS-16`…`ROS-119` (104).
- Subtareas actuales del MVP: `ROS-120`…`ROS-190` (71).
- Los rangos son históricos: las incidencias nuevas toman la siguiente clave que asigne Jira, sin importar la épica.

### 2.2 Tipos de incidencia en Jira

| Concepto nuestro | Tipo Jira | ID del tipo | Nivel |
|---|---|---|---|
| Épica | Epic | 10049 | 1 |
| Historia de usuario | Historia | 10050 | 0 |
| Tarea técnica | Subtask | 10048 | −1 (hija de Historia) |
| Error | Error | 10051 | 0 |
| Tarea sin historia (infra, deuda) | Tarea | 10052 | 0 |

> En JQL usa el **ID** del tipo Historia: `issuetype = 10050`. `issuetype = Historia` devuelve 0 resultados ([EC-006](../07-registro/01-errores-conocidos.md)).

### 2.3 Etiquetas (labels) de Jira

| Etiqueta | Valores | Aplica a |
|---|---|---|
| Prioridad | `P0`, `P1`, `P2`, `P3` | Épicas, historias |
| Fase | `Fase-1`, `Fase-2`, `Fase-3`, `Fase-4` | Épicas, historias |
| Sprint | `Sprint-1` … `Sprint-5` | Subtareas |
| Tipo de trabajo | `Frontend`, `Backend`, `BaseDeDatos`, `Motor`, `Seguridad`, `DevOps`, `DisenoUI`, `QA` | Subtareas |
| Sincronización | `sync-pendiente` | Cualquiera con cambio de docs aún no propagado |

## 3. Git

### 3.1 Ramas

| Tipo | Formato | Ejemplo |
|---|---|---|
| Feature (Spec Kit) | `NNN-slug` (la crea `/speckit-specify`) | `005-motor-de-evidencia` |
| Cambio de documentación | `docs/CD-NNN-slug` | `docs/CD-004-peso-contencion` |
| Corrección de error | `fix/ROS-NNN-slug` | `fix/ROS-201-fecha-aaaammdd` |
| Tarea técnica suelta | `chore/ROS-NNN-slug` | `chore/ROS-205-ci-cache` |

- Rama principal: `main`, protegida. Solo se fusiona por PR con CI verde y una aprobación.
- Estrategia de fusión: *squash merge*; el título del squash es el título del PR.

### 3.2 Commits

[Conventional Commits](https://www.conventionalcommits.org/es/) **con clave Jira obligatoria**:

```text
<tipo>(<ámbito>): ROS-<n> <descripción en imperativo, minúsculas>

[cuerpo opcional: por qué]

Refs: specs/005-motor-de-evidencia (FR-002) · docs/02-requisitos/04-reglas-de-negocio.md#rn-03
```

| Tipo | Uso |
|---|---|
| `feat` | Comportamiento nuevo |
| `fix` | Corrección de error |
| `test` | Solo pruebas (incluye la prueba roja antes del código) |
| `refactor` | Sin cambio observable |
| `docs` | Cambios en `docs/` o `specs/` |
| `chore` | Build, dependencias, CI |
| `perf` | Rendimiento |

Ámbitos: `accounts`, `projects`, `sources`, `profiling`, `naming`, `evidence`, `catalog`, `review`, `ui`, `design-system`, `infra`, `docs`, `specs`.

Ejemplos:

```text
test(evidence): ROS-133 prueba de puntaje determinista (roja)
feat(evidence): ROS-133 calcular puntaje ponderado por columna
docs(specs): ROS-25 plan de la feature 005
```

### 3.3 Pull requests

- Título: `ROS-<n> · <descripción>` (varias claves: `ROS-133, ROS-134 · …`).
- Cuerpo: plantilla [plantillas/pull-request.md](../plantillas/pull-request.md) (trazabilidad, evidencia, checklist DoD).
- Un PR implementa **una** feature de Spec Kit o parte de ella; nunca mezcla features.
- Un PR que toca `backend/` o `frontend/` **debe** referenciar una spec y al menos una subtarea Jira.

## 4. Pruebas

Toda prueba que verifica un requisito declara de dónde viene.

**Backend (pytest):**

```python
import pytest

@pytest.mark.story("ROS-27")
@pytest.mark.fr("005:FR-006")
def test_columna_sin_evidencia_queda_desconocida(proyecto_con_reserv3):
    ...
```

**Frontend (Vitest / Playwright):** el título de la prueba empieza con las claves:

```ts
test('[ROS-48][007:FR-010] un pendiente nunca se muestra como Confirmada', async () => { … })
```

La [matriz de trazabilidad](../06-calidad/03-matriz-de-trazabilidad.md) se construye leyendo estos marcadores.

## 5. Documentación

- Cada historia en [02-historias-de-usuario.md](../02-requisitos/02-historias-de-usuario.md) tiene un ancla con su clave en minúsculas (`#ros-25`) para enlazarla desde Jira y specs.
- Reglas de negocio: `RN-NN`. Requisitos no funcionales: `RNF-NN`.
- Marcadores de incertidumbre: `[PENDIENTE]` (se sabe qué falta) y `[NECESITA ACLARACIÓN: pregunta]` (falta una decisión). Cada uno debe tener un `DP-NNN` o `EC-NNN` asociado.

## 6. Código

| Ámbito | Convención |
|---|---|
| Idioma del código | Inglés para identificadores (clases, funciones, variables, tablas) |
| Idioma del dominio | Los valores de dominio visibles (niveles, textos) en español, definidos en un único lugar |
| Python | PEP 8 vía `ruff` (lint + formato), type hints obligatorios en código nuevo |
| TypeScript | `strict: true`, ESLint + Prettier |
| Nombres de niveles de confianza en código | `CONFIRMED`, `HIGH_UNVALIDATED`, `INFERRED`, `HYPOTHESIS`, `UNKNOWN` ↔ etiquetas "Confirmada", "Alta · sin validar", "Inferida", "Hipótesis", "Desconocida" |
| Comentarios con referencia | Solo cuando una regla no es obvia: `# RN-03: el nombre pesa como máximo 0,40` |
