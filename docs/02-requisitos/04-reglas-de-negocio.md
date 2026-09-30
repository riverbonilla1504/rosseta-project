# Reglas de negocio

> Reglas que el sistema **debe** cumplir. Cada una tiene un ID `RN-NN` que las specs referencian en sus FR y las pruebas en sus marcadores.
> Fuentes: prototipo final (Claude Design, 2026-09), historias de usuario, constitución.
> Donde el prototipo no define un valor, está marcado `[NECESITA ACLARACIÓN]` con su decisión pendiente. **Ningún agente debe inventar esos valores.**

## A. Niveles de confianza

**RN-01 — Cinco niveles, siempre los mismos.**
Toda interpretación de columna (y de relación) tiene exactamente uno de estos niveles: `CONFIRMED` (Confirmada), `HIGH_UNVALIDATED` (Alta · sin validar), `INFERRED` (Inferida), `HYPOTHESIS` (Hipótesis), `UNKNOWN` (Desconocida).
*Historias:* ROS-26.

**RN-02 — "Confirmada" solo por acción humana.**
Una interpretación pasa a `CONFIRMED` únicamente por una acción *Confirmar* (o por propagación de una confirmación, RN-12) registrada con autor y fecha. Ningún cálculo automático, ningún LLM y ningún cambio de umbral produce `CONFIRMED`.
Una interpretación pendiente con puntaje alto se muestra **"Alta · sin validar"**, nunca "Confirmada".
*Historias:* ROS-26, ROS-48. *Constitución:* III.

**RN-03 — Umbral de "Alta · sin validar".**
Si el puntaje ≥ `umbral_alta` y no hay conflicto abierto → `HIGH_UNVALIDATED`. Valor por defecto: **0,85** (control `umbralConfirmada` del prototipo). En el MVP es fijo; configurable en Fase 2 (ROS-32), sin alterar nunca las columnas ya confirmadas.

**RN-04 — Inferida.**
`INFERRED` = **≥ 2 fuentes independientes de acuerdo** (definición literal del Panorama del prototipo) y puntaje por debajo de `umbral_alta`.
`[NECESITA ACLARACIÓN: puntaje mínimo para Inferida]` — referencia del prototipo: `PAPEL` = 0,71 → Inferida. Propuesta provisional: ≥ 0,60. Ver [DP-003](../07-registro/02-decisiones-pendientes.md).

**RN-05 — Hipótesis.**
`HYPOTHESIS` = existe evidencia, pero no alcanza Inferida (una sola fuente, o fuentes que no concuerdan, o puntaje bajo). Texto de UI: "revisar antes de usar". El motor **no afirma** una hipótesis como hecho: la descripción la presenta como posibilidad. Referencia: `USRALT` = 0,48 → Hipótesis ("ninguna fuente distingue si es el usuario de alta o el de última modificación, así que el motor no lo afirma").

**RN-06 — Desconocida (abstención).**
`UNKNOWN` = no hay evidencia útil (p. ej. solo el nombre, sin datos, sin referencias). Texto de UI: "sin evidencia: no se inventa". La columna **no recibe nombre de negocio** (se muestra "—") y su confianza se muestra "–".
Referencia: `RESERV3` — "Desconocido. 100 % NULL en 412 M filas, sin referencias en consultas ni en el repositorio".
`[NECESITA ACLARACIÓN: umbral mínimo de evidencia]` — [DP-003](../07-registro/02-decisiones-pendientes.md).
*Historias:* ROS-27. *Constitución:* III.

**RN-07 — Un conflicto abierto limita el nivel.**
Una columna con un conflicto abierto no puede estar en `HIGH_UNVALIDATED`; como máximo `INFERRED`, y se marca con aviso de conflicto. `[NECESITA ACLARACIÓN: ¿limita a Inferida o a Hipótesis?]` [DP-003](../07-registro/02-decisiones-pendientes.md).
*Historias:* ROS-28, ROS-45.

## B. Puntuación

**RN-08 — Puntaje ponderado y determinista.**
El puntaje de una columna (0–1) combina las evidencias de todas las fuentes según su peso. Es **determinista**: la misma evidencia produce siempre el mismo puntaje y el mismo desglose.
*Historias:* ROS-25. *Constitución:* IV.

**RN-09 — Pesos por tipo de evidencia.**

| Evidencia | Peso | Fuente del valor |
|---|---|---|
| **Nombre de la columna** (vía convenciones de nombres) | **0,40 (máximo)** — "la fuente de menor peso, deliberadamente" | Prototipo |
| **Contención con catálogo** (valores de la columna contenidos en una tabla de códigos) | **0,90** | Prototipo |
| Perfil de datos (tipo real, patrones, rango) | `[NECESITA ACLARACIÓN]` | [DP-003](../07-registro/02-decisiones-pendientes.md) |
| DDL (tipo declarado, PK, nulabilidad) | `[NECESITA ACLARACIÓN]` | DP-003 |
| Edición manual de un revisor | Máximo (ROS-49) | Historia |
| Fuentes de Fase 2+ (logs, vistas, etiquetas, código, documentación) | `[NECESITA ACLARACIÓN]` | DP-003 |

La fórmula exacta de combinación se define y documenta en la tarea ROS-132 (Sprint 3) **en este documento** mediante un CD, con ejemplos resueltos a mano que reproduzcan los puntajes del prototipo (tabla de referencia en [03-datos-de-referencia.md](../04-datos/03-datos-de-referencia.md)).

**RN-10 — Sin cita no hay afirmación.**
Toda evidencia guarda una **cita verificable** (fuente + localizador + extracto). Ninguna interpretación puede quedar por encima de `HYPOTHESIS` sin al menos una cita resoluble. Si la fuente de una cita se elimina, la evidencia se retira y la columna se recalcula.
*Historias:* ROS-33, ROS-22.

**RN-11 — Explicabilidad.**
El desglose del puntaje (aporte por fuente) y "qué falta para subir de nivel" están disponibles para cada columna. En el MVP se expone por API (ROS-134); la UI completa es Fase 2 (ROS-35).

## C. Revisión y propagación

**RN-12 — Propagación de una confirmación.**
Al confirmar una columna, la decisión se **propaga a todas las tablas donde la misma columna aparece con el mismo tipo** (texto del prototipo). El sistema informa el **número real** de columnas desbloqueadas.
`[NECESITA ACLARACIÓN: ¿"misma columna" = mismo nombre exacto? ¿y mismo tipo incluye longitud/precisión?]` — [DP-003](../07-registro/02-decisiones-pendientes.md).
La propagación es **reversible**: rechazar una confirmación revierte las columnas que se confirmaron por propagación desde ella.
*Historias:* ROS-29, ROS-44.

**RN-13 — Previsualización = realidad.**
El número "esto desbloqueará N columnas" que se muestra antes de confirmar debe ser **idéntico** al número que resulta al confirmar.
*Historias:* ROS-44.

**RN-14 — Acciones humanas auditadas.**
Confirmar, editar y rechazar guardan: autor, fecha/hora, estado anterior, estado posterior y (en rechazo) **motivo obligatorio**. El registro es inmutable.
*Historias:* ROS-46, ROS-83.

**RN-15 — Cola priorizada por impacto.**
La cola contiene las columnas **no confirmadas**, ordenadas por **impacto descendente**. Impacto = columnas que desbloquea (principal), más uso y conflictos abiertos. Se recalcula tras cada confirmación o rechazo.
Referencia del prototipo: `PGCOD` 380 · `CTANRO` 210 · `PETDOC` 60 columnas que desbloquea.
`[NECESITA ACLARACIÓN: fórmula exacta del impacto]` — [DP-003](../07-registro/02-decisiones-pendientes.md).
*Historias:* ROS-36, ROS-39.

**RN-16 — Hallazgos en el MVP.**
Mientras no exista la épica Hallazgos (Fase 2), un "hallazgo abierto" del Panorama es: (a) un conflicto abierto, o (b) una columna `UNKNOWN`. `[NECESITA ACLARACIÓN: severidad de cada tipo]`.
*Historias:* ROS-40.

## D. Datos y nombres

**RN-17 — Una sola convención de nombres en toda la app.**
Un identificador (`MOV0010`, `CTANRO`, `IMPTE`, `CLI0001`, `CTA0001`, `PAR0012`) se muestra exactamente igual en cola, catálogo, revisión, hallazgos y generador. Hay una única fuente de identificadores.
*Historias:* ROS-54.

**RN-18 — Estado compartido.**
Confirmar en Revisión cambia inmediatamente la fila en Catálogo, la cola y el Panorama. No hay estados divergentes entre pantallas.
*Historias:* ROS-55.

**RN-19 — Reimportar no duplica.**
Reimportar el mismo DDL no duplica tablas ni columnas (idempotencia).
*Historias:* ROS-121.

**RN-20 — Eliminar una fuente retira su evidencia.**
Al eliminar una fuente, se eliminan sus evidencias y se recalculan los niveles afectados. Las confirmaciones humanas **no** se eliminan.
*Historias:* ROS-128.

**RN-21 — Convenciones editables con recálculo.**
Editar una regla de convención de nombres recalcula las inferencias afectadas.
*Historias:* ROS-21.

## E. Redacción

**RN-22 — Descripciones en el MVP: solo reglas.**
En el MVP las descripciones se generan con **plantillas deterministas** a partir de la evidencia (equivalente al "modo sin LLM"). La redacción con LLM es Fase 2 ([DP-004](../07-registro/02-decisiones-pendientes.md)).

**RN-23 — El LLM no decide.**
Cuando exista redacción con LLM, el LLM **solo** reescribe texto a partir de evidencia ya calculada: no crea evidencia, no cambia puntajes, no cambia niveles.
*Constitución:* III.

## F. Seguridad y acceso

**RN-24 — Aislamiento.** Un usuario solo ve y modifica sus propios proyectos (MVP). *Historias:* ROS-78, ROS-84.

**RN-25 — Solo lectura sobre el origen.** Rosetta nunca escribe en la base del cliente en el MVP. *No-objetivo:* NO-02.

**RN-26 — PII.** Una columna puede marcarse como PII (p. ej. `USRALT`). En Fase 2 los valores de columnas PII se enmascaran en perfiles y muestras (ROS-85).
