# Rosetta — instrucciones para agentes

Este proyecto usa **Spec-Driven Development con GitHub Spec Kit**. La fuente de verdad es `docs/`.

Antes de cualquier tarea lee **`docs/00-metodologia/07-delegacion-a-ia.md`** (reglas obligatorias) y la
constitución **`.specify/memory/constitution.md`**. Toda regla vive allí; este archivo solo apunta.

Recordatorios que no se negocian:
- Los cambios bajan: docs → specs → Jira → código. Nunca cambies comportamiento solo en el código o en Jira.
- Prueba roja antes de implementar. No inventes valores marcados `[PENDIENTE]` o `[NECESITA ACLARACIÓN]`.
- Errores e inconsistencias se registran en `docs/07-registro/` (EC-NNN / DP-NNN), no se arreglan de paso.

Comandos: ver `README.md` (sección *Desarrollo local*).
