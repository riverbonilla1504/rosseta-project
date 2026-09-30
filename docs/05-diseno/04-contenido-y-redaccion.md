# Contenido y redacción

> Cómo habla Rosetta. Aplica a toda la UI, mensajes de error, descripciones generadas y correos futuros. Los textos viven en `features/*/copy.ts` (frontend) y `apps/*/messages.py` (backend).

## 1. Principios

1. **Honestidad epistémica.** El texto nunca sugiere más certeza de la que da la evidencia. "Probablemente…" para Hipótesis; "Desconocido" cuando no hay evidencia. Nunca "es" para algo no confirmado (ROS-137: "revisar los textos de la UI para que no sugieran certeza").
2. **Seco y verificable.** Cifras y hechos antes que adjetivos: "Contención 0,998 con CTA0001.CTANRO" en lugar de "muy probablemente relacionada".
3. **Breve.** Frases cortas; sin signos de exclamación ni emojis.
4. **El usuario decide.** Los botones dicen lo que hacen: "Confirmar", "Rechazar", no "Aceptar sugerencia mágica".
5. **Errores que ayudan:** qué pasó + qué hacer ahora.

## 2. Idioma y registro

- **Español** en toda la interfaz; identificadores de esquema tal cual el origen (`MOV0010`).
- **Tuteo neutro** ("confirmas", "quieres") en toda la interfaz, aunque el prototipo usa voseo (decidido en [DP-009](../07-registro/02-decisiones-pendientes.md#dp-009)).
- Formato de números **es-CO**: `18.442`, `0,91`, `84.500`, `4,1 TB`, porcentajes `96,1%`.
- Fechas: `29 sep 2026, 14:03` en la UI; relativas cuando aporta ("hace 14 minutos").

## 3. Vocabulario canónico

| Concepto | Texto en UI | No usar |
|---|---|---|
| `CONFIRMED` | **Confirmada** — "validada por una persona" | "Verificada", "Aprobada" |
| `HIGH_UNVALIDATED` | **Alta · sin validar** — "puntaje alto, falta una persona" | "Confirmada", "Casi segura" |
| `INFERRED` | **Inferida** — "≥2 fuentes de acuerdo" | "Probable" |
| `HYPOTHESIS` | **Hipótesis** — "revisar antes de usar" | "Sugerencia" |
| `UNKNOWN` | **Desconocido** (chip) / **Desconocidas** (plural) — "sin evidencia: no se inventa" | "Sin datos", "N/A" |
| Columna del cliente | columna | campo |
| Nombre de negocio | nombre de negocio | alias, etiqueta |
| Evidencia | evidencia / cita | prueba |
| Propagación | "desbloquea N columnas" / "se propaga a…" | "auto-confirma" |
| Cola | cola priorizada por impacto | lista de tareas |
| Fuente | fuente de evidencia | input |
| Rechazar | Rechazar (con motivo) | Descartar |

> Nota: el chip del prototipo dice "Desconocido" (masculino, concuerda con "nivel") y la leyenda del Panorama "Desconocidas" (concuerda con "columnas"). Se mantienen ambas formas según el sustantivo implícito.

## 4. Etiquetas de enums

| Enum | Valor | Texto |
|---|---|---|
| Fuente | `SCHEMA_DDL` | Esquema (DDL) |
| | `DATA_SAMPLE` | Muestra de datos |
| Estado de fuente | `PENDING` / `PROCESSING` / `READY` / `FAILED` | En cola / Procesando / Lista / Falló |
| Evidencia | `NAME_CONVENTION` | Nombre de columna |
| | `DDL_TYPE` / `DDL_CONSTRAINT` / `DDL_DECLARED_FK` | Tipo declarado / Restricción declarada / Clave foránea declarada |
| | `PROFILE_PATTERN` / `PROFILE_EMPTY` | Perfil de datos / Columna vacía |
| | `CONTAINMENT` | Contención con catálogo |
| | `HUMAN_REJECTION` / `HUMAN_EDIT` | Rechazo de un revisor / Edición de un revisor |
| Acción | `CONFIRM` / `EDIT` / `REJECT` / `REVERT` | Confirmó / Editó / Rechazó / Revirtió |

## 5. Microcopy de referencia

| Situación | Texto |
|---|---|
| Confirmación exitosa | "Confirmada. Se desbloquearon 210 columnas." |
| Confirmación sin propagación | "Confirmada. No hay otras columnas con el mismo nombre y tipo." |
| Previsualización | "Confirmar desbloqueará **210** columnas." / "3 excluidas por conflicto." |
| Rechazo (diálogo) | Título "Rechazar interpretación" · campo "¿Por qué no es correcta?" · ayuda "El motivo queda registrado y el motor no volverá a proponer este valor." |
| Aviso de conflicto | "Las fuentes no coinciden sobre {campo}. Revisa las citas antes de confirmar." |
| Cola vacía | "No quedan columnas por revisar." |
| Proyecto sin fuentes | "Todavía no hay evidencia. Sube el DDL de tu base para empezar." |
| DDL procesándose | "Leyendo el esquema… {n} tablas encontradas hasta ahora." |
| DDL fallido | "No encontramos ninguna sentencia CREATE TABLE en {archivo}. Verifica que sea el script del esquema." |
| Muestra sin coincidencias | "Ninguna cabecera del CSV coincide con columnas de {tabla}. Revisa que sea la tabla correcta." |
| Archivo grande | "El archivo supera {n} MB. Sube una muestra más pequeña." |
| Sesión vencida | "Tu sesión terminó. Vuelve a iniciar sesión para continuar." |
| OAuth cancelado | "Cancelaste el inicio de sesión con {proveedor}. Puedes intentarlo de nuevo cuando quieras." |
| Proveedor caído | "{proveedor} no respondió. Intenta en unos minutos o usa otro proveedor." |
| Error genérico | "Algo salió mal y no se guardó ningún cambio. Intenta de nuevo." |
| Insignia de solo lectura | "solo lectura" (title: "Rosetta nunca escribe en tu base de datos.") |
| Modo de redacción (MVP) | "redacción por reglas" (title: "Descripciones generadas con plantillas deterministas, sin LLM.") |

## 6. Descripciones generadas (modo reglas)

Las plantillas y ejemplos están en [06-motor-de-evidencia.md §10](../03-arquitectura/06-motor-de-evidencia.md). Reglas de redacción:
- Empezar por el significado ("Cuenta afectada.") y seguir con la evidencia ("Contención 0,998 con…").
- Hipótesis: empezar con "Probablemente" y decir por qué no se afirma.
- Desconocido: empezar con "Desconocido." y decir qué se buscó sin éxito, **solo sobre fuentes cargadas**.
- No mencionar fuentes que no existen en el proyecto (evita el problema de [EC-003](../07-registro/01-errores-conocidos.md)).
- Un LLM (Fase 2) podrá reescribir estas frases pero **no** añadir hechos (RN-23).
