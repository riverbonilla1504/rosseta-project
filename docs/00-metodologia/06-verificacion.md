# Verificación: que lo que se dijo que se hizo, de verdad se hizo

> **Principio:** una afirmación de "listo" **no es evidencia**. Ni la de una persona ni la de un agente de IA. Una tarea está terminada solo cuando hay **evidencia verificable** de que cumple sus criterios, obtenida por alguien distinto a quien la implementó.

Este documento define **el protocolo de verificación del proceso**. La estrategia de pruebas del código (unitarias, integración, E2E…) está en [06-calidad/01-estrategia-de-pruebas.md](../06-calidad/01-estrategia-de-pruebas.md).

## 1. Qué cuenta como evidencia

| Evidencia | Válida | No válida |
|---|---|---|
| Ejecución de CI enlazada con las pruebas del requisito en verde | ✅ | |
| Salida de una prueba ejecutada por el verificador | ✅ | |
| PR fusionado con revisión aprobada | ✅ | |
| Captura o video del comportamiento en la UI (para criterios visuales) | ✅ | |
| Resultado de `/speckit-converge` = "Converged" | ✅ (necesaria, no suficiente) | |
| Consulta SQL/JQL que muestra el estado esperado | ✅ | |
| "Ya lo implementé" / "Debería funcionar" | | ❌ |
| Casilla marcada en `tasks.md` | | ❌ (una casilla es una afirmación, no una prueba) |
| Resumen de un agente sin salida de herramienta que lo respalde | | ❌ |
| Prueba que pasa pero que nunca se vio fallar | | ❌ (no demuestra que prueba algo) |

## 2. Niveles de verificación

Cada entrega pasa por **todos** los niveles, en orden:

### Nivel 1 — Consistencia de artefactos (antes de implementar)
- `/speckit-analyze` sobre `spec.md`, `plan.md`, `tasks.md`.
- **Gate:** cero hallazgos CRITICAL. Los HIGH se resuelven o se justifican por escrito en el PR.
- Verifica: cobertura requisito→tarea, ambigüedades, conflictos con la constitución, drift de terminología.

### Nivel 2 — Pruebas primero (durante la implementación)
- La prueba de cada criterio de aceptación se escribe **antes** del código y se ve **fallar** (commit `test(...): ... (roja)`).
- Después se escribe el código mínimo para que pase.
- **Evidencia:** en el historial del PR existe el commit de la prueba roja antes del commit de implementación.

### Nivel 3 — Completitud (después de implementar)
- `/speckit-converge`: evalúa el código contra spec + plan + tasks **ignorando las casillas marcadas** y agrega a `tasks.md` todo lo que falte.
- Se repite `implement → converge` hasta "Converged".
- **Evidencia:** salida de converge en el PR.

### Nivel 4 — Integración continua
- CI en verde: lint, tipos, pruebas unitarias, integración (con PostgreSQL real), contrato de API, E2E del flujo afectado, cobertura mínima, `makemigrations --check`, chequeo de trazabilidad.
- **Evidencia:** enlace a la ejecución de CI en el PR y en el comentario de cierre de Jira.

### Nivel 5 — Verificación independiente
- La hace **otra persona u otro agente** que no implementó la tarea (rol **verificador**).
- El verificador:
  1. Lee los criterios de aceptación **desde `docs/` y la spec**, no desde el PR.
  2. Para cada criterio, ejecuta la prueba correspondiente o reproduce el comportamiento, y anota el resultado.
  3. Revisa que no haya comportamiento extra no especificado (no-objetivos).
  4. Revisa la trazabilidad (claves, marcadores de pruebas, bloque "Fuente de verdad").
  5. Deja el **acta de verificación** en el PR (plantilla abajo).
- Si el verificador es un agente de IA, recibe el prompt de verificación de [07-delegacion-a-ia.md](07-delegacion-a-ia.md) y **no** recibe el resumen del implementador.

### Nivel 6 — QA funcional (por historia)
- Recorrido manual o E2E de los escenarios de `quickstart.md` de la feature.
- Accesibilidad básica (teclado, contraste) en pantallas nuevas.

### Nivel 7 — Cierre en Jira
- Se mueve a **Listo** solo con un comentario de cierre que enlace la evidencia (§4).

## 3. Acta de verificación (se pega en el PR)

```markdown
## Acta de verificación
- Verificador: <nombre o "agente verificador">  · Fecha: AAAA-MM-DD
- Implementador: <nombre o agente>  (debe ser distinto)
- Feature / historias: 005-motor-de-evidencia · ROS-25, ROS-26

| Criterio (fuente) | Cómo se verificó | Resultado |
|---|---|---|
| ROS-25 · "El nombre pesa 0,40" (docs RN-03 / 005:FR-002) | `pytest -m "fr('005:FR-002')"` → 4 passed | ✅ |
| ROS-26 · "Confirmada solo tras validación humana" (005:FR-005) | prueba test_nivel_confirmada_requiere_accion_humana | ✅ |
| … | … | … |

- /speckit-analyze: sin CRITICAL (enlace)
- /speckit-converge: Converged (enlace)
- CI: <enlace a ejecución>
- Comportamiento no especificado encontrado: ninguno / <detalle>
- Veredicto: ✅ Aprobado · ⚠️ Aprobado con observaciones (EC-NNN) · ❌ Rechazado
```

## 4. Comentario de cierre en Jira

```text
✅ Verificado — ROS-133
• PR: <enlace>  (squash <sha>)
• CI: <enlace a ejecución verde>
• Converge: Converged
• Acta de verificación: <enlace al comentario del PR>
• Pruebas: 005:FR-001, 005:FR-002 (6 pruebas)
• Docs: docs/02-requisitos/02-historias-de-usuario.md#ros-25 (sin cambios) / CD-NNN
```

## 5. Reglas para agentes de IA (implementadores)

1. **No declarar éxito sin salida de herramienta.** Si dice "las pruebas pasan", debe mostrar el comando y su salida.
2. **Reportar fallos tal como son.** Si algo no se pudo hacer o una prueba falla, se dice explícitamente; nunca se omite.
3. **No marcar casillas de `tasks.md` sin haber ejecutado la verificación de esa tarea.**
4. **No desactivar, saltar ni debilitar pruebas** (`skip`, `xfail`, bajar umbrales) para que el CI pase. Si una prueba parece incorrecta, se detiene y se reporta: puede ser un error de la spec (→ CD).
5. **No inventar comportamiento** que no esté en la spec, aunque "parezca útil" (no-objetivos).
6. Cuando la spec es ambigua, **detenerse y preguntar**; no adivinar.

## 6. Señales de alarma (se investigan siempre)

- Una tarea pasó a *Listo* sin comentario de cierre.
- Un PR sin commit de prueba roja previo al de implementación.
- Cobertura de una app que baja respecto de `main`.
- Pruebas con `skip`/`xfail` nuevas.
- `/speckit-converge` agrega tareas en una feature que ya estaba "Converged".
- Diferencias en la auditoría de sincronización (ver [04-sincronizacion.md §8](04-sincronizacion.md)).
