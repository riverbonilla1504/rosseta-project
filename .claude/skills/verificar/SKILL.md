---
name: "verificar"
description: "Lanza el verificador independiente de Rosetta (agente nuevo de contexto limpio, solo lectura más pruebas) con el prompt fijo de docs/00-metodologia/07-delegacion-a-ia.md §3.2, pasándole solo la rama y la carpeta de la feature. El implementador la ejecuta al llegar a Converged (CD-009)."
argument-hint: "<rama> <carpeta de la feature, p. ej. specs/002-autenticacion-oauth>"
user-invocable: true
disable-model-invocation: false
---

## Entrada

```text
$ARGUMENTS
```

Regla de origen: [docs/00-metodologia/07-delegacion-a-ia.md §2.1](../../../docs/00-metodologia/07-delegacion-a-ia.md) (CD-009). Quien ejecuta esta orden (normalmente el implementador) **no** verifica: solo lanza al verificador y entrega su acta.

## Pasos

1. **Argumentos.** El primero es la rama y el segundo la carpeta de la feature. Si falta la carpeta, usa `specs/<rama>`. Comprueba:
   - `git rev-parse --verify <rama>` existe y `git branch --show-current` es esa rama; si no, detente y dilo.
   - `<carpeta>/spec.md` existe; si no, detente y dilo.
   - `git status --porcelain` está vacío. El verificador revisa lo commiteado (prueba roja previa, claves en commits); si hay cambios sin commit, detente y pide a la persona que decida si se commitean. **No hagas commit por tu cuenta.**
2. **Prompt.** Lee el bloque de código `text` de la sección `### 3.2 Verificar una tarea` de `docs/00-metodologia/07-delegacion-a-ia.md` y sustituye **solo** `<rama>` y `<carpeta>`. No añadas, quites ni reformules nada: ni contexto, ni tu resumen, ni conclusiones, ni pistas de dónde están las pruebas.
3. **Lanzamiento.** Llama a la herramienta `Agent` con `subagent_type: "verificador"` (definición en `.claude/agents/verificador.md`), `prompt` = el texto del paso 2 y en primer plano (`run_in_background: false`). Nada de `fork` ni de contexto heredado. Si el tipo `verificador` no está disponible (la sesión se abrió antes de que existiera el archivo), **no** uses otro tipo de agente: detente y pide a la persona que abra una sesión nueva o que verifique desde un chat nuevo con el prompt de §3.2.
4. **Acta.** Muestra a la persona la respuesta del verificador **completa y literal**, dentro de un bloque, sin resumirla, recortarla ni comentarla en el mismo bloque. Si discrepas de algo, dilo aparte y como opinión del implementador; el acta no se toca.
5. **PR.** Si existe un PR para la rama (`gh pr view <rama>`), propone pegar el acta **tal cual** como comentario (`gh pr comment <n> --body-file <archivo temporal con el acta literal>`). Publicar requiere el OK explícito de la persona en la sesión. Si todavía no hay PR, dilo: el acta se pega al abrirlo.
6. **Jira.** No muevas incidencias: solo el verificador las pasa a *Listo*, y solo con veredicto *Aprobado*, el PR aprobado por la persona y el CI en verde. Si el acta dice que no pudo cerrar por falta de aprobación del PR, se vuelve a lanzar `/verificar` después de la aprobación.
