# Definición de Listo (DoR) y de Terminado (DoD)

> Dos puertas. **DoR**: cuándo una historia puede entrar a un sprint. **DoD**: cuándo una historia/tarea puede pasar a *Listo* en Jira. Nadie (persona ni agente) mueve una incidencia saltándose estas listas.

## 1. Definition of Ready — historia lista para empezar

Una historia está **Lista** cuando:

- [ ] Está en [02-historias-de-usuario.md](../02-requisitos/02-historias-de-usuario.md) con formato *Como / quiero / para* y criterios de aceptación verificables.
- [ ] Tiene prioridad, fase y estimación, y está asignada a un sprint en [05-roadmap-y-sprints.md](../01-producto/05-roadmap-y-sprints.md).
- [ ] Sus tareas técnicas están en [03-tareas-mvp.md](../02-requisitos/03-tareas-mvp.md) y en Jira.
- [ ] Las reglas de negocio que usa están en [04-reglas-de-negocio.md](../02-requisitos/04-reglas-de-negocio.md) **sin** `[NECESITA ACLARACIÓN]` bloqueantes (o la decisión pendiente tiene un valor provisional aceptado explícitamente).
- [ ] Existe la **spec** de su feature (`specs/NNN-*/spec.md`) con sus `FR-###`, y pasó `/speckit-clarify`.
- [ ] Existe `plan.md` y `tasks.md`, y `/speckit-analyze` no reporta CRITICAL.
- [ ] Sus dependencias (otras historias) están terminadas o planificadas antes en el mismo sprint.
- [ ] El diseño de la pantalla está descrito en [03-pantallas.md](../05-diseno/03-pantallas.md) o en la spec.
- [ ] La incidencia de Jira tiene el bloque **"Fuente de verdad"** con enlaces a doc y spec.

## 2. Definition of Done — tarea técnica (Subtarea en Jira)

- [ ] Todas las actividades de la tarea están hechas (checklist completo) y su "**Listo cuando**" se cumple.
- [ ] Hay pruebas nuevas, con marcadores `story`/`fr`, que **fallaron antes** de implementar (commit de prueba roja visible).
- [ ] Lint, tipos y pruebas en verde en local y en CI.
- [ ] Cobertura igual o mayor; umbrales cumplidos (85 / 95 / 80).
- [ ] Sin secretos, sin `print`/`console.log` de depuración, sin TODO sin clave Jira.
- [ ] Si tocó la API: OpenAPI y tipos TS regenerados y [05-api.md](../03-arquitectura/05-api.md) coherente.
- [ ] Si tocó datos: migración reversible y [02-diccionario-de-datos.md](../04-datos/02-diccionario-de-datos.md) coherente.
- [ ] PR revisado y aprobado, fusionado en `main`.
- [ ] Las `T###` correspondientes de `tasks.md` marcadas `[X]`.

## 3. Definition of Done — historia

Todo lo de la tarea para cada subtarea, y además:

- [ ] **Cada criterio de aceptación** tiene al menos una prueba automatizada que lo demuestra (o una verificación manual documentada si no es automatizable).
- [ ] `/speckit-converge` sobre la feature = **Converged** para los FR de la historia.
- [ ] **Verificación independiente** (otra persona u otro agente que no la implementó) con **acta de verificación** ([06-verificacion.md](../00-metodologia/06-verificacion.md)).
- [ ] QA en staging: criterios de aceptación ejecutados con evidencia.
- [ ] Accesibilidad: axe sin violaciones serias en las vistas tocadas; teclado revisado.
- [ ] Textos revisados contra [04-contenido-y-redaccion.md](../05-diseno/04-contenido-y-redaccion.md).
- [ ] Documentación actualizada si el comportamiento final difiere de lo documentado (vía CD, **antes** de cerrar).
- [ ] [03-matriz-de-trazabilidad.md](03-matriz-de-trazabilidad.md) actualizada (spec, pruebas, PRs).
- [ ] Comentario de cierre en Jira con el formato de evidencia (PRs, pruebas, acta, capturas).
- [ ] Sin errores S1/S2 abiertos asociados.

## 4. Definition of Done — sprint

- [ ] Todas las historias comprometidas cumplen su DoD o están explícitamente devueltas al backlog con motivo.
- [ ] Auditoría de sincronización de fin de sprint hecha (12 puntos de [04-sincronizacion.md](../00-metodologia/04-sincronizacion.md)) y registrada en [03-registro-de-sincronizacion.md](../07-registro/03-registro-de-sincronizacion.md).
- [ ] [01-errores-conocidos.md](../07-registro/01-errores-conocidos.md) actualizado con lo descubierto.
- [ ] [04-changelog.md](../07-registro/04-changelog.md) con los cambios de documentación del sprint.
- [ ] Staging desplegado con lo terminado.
