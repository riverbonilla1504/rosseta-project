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
| Frase de valor (acceso) | "Rosetta reconstruye el significado de tu base de datos heredada, a partir de evidencia verificable." (DP-025) |
| Nota de privacidad (acceso, `/login`) | "Usamos tu nombre, correo y foto de perfil solo para identificarte. No accedemos a nada más de tu cuenta de Google o Microsoft." (DP-025) |
| Bienvenida (onboarding) | "Hola, {nombre}. Crea tu primer proyecto para empezar." (DP-025) |
| Correo ya registrado con otro proveedor | "Ya existe una cuenta con ese correo, creada con otro proveedor. Entra con el proveedor que usaste al registrarte." No nombra el proveedor, para no revelar datos de la cuenta (DP-025) |
| Correo no verificado | "{proveedor} no confirma que tu correo esté verificado. Verifícalo allí e inténtalo de nuevo." (DP-025) |
| Correo no entregado | "{proveedor} no compartió tu correo y lo necesitamos para crear tu cuenta. Revisa los permisos e inténtalo de nuevo." (DP-025) |
| Cuenta desactivada | "Tu cuenta está desactivada." Sin canal de contacto en el MVP (DP-025, DP-024) |
| Forma genérica de {proveedor} (cuando no se conoce) | "tu proveedor de acceso" (p. ej. "Cancelaste el inicio de sesión con tu proveedor de acceso.") (DP-025) |
| Control de cierre de sesión | "Cerrar sesión" (DP-025) |
| Sin proyectos (lista de proyectos) | "Aún no tienes proyectos." (ROS-174, EC-022) |
| Pantalla de proyectos (título) | "Proyectos" (DP-028) |
| Formulario de proyecto: campos y botón | "Nombre del proyecto" · "Dialecto SQL" · "Crear proyecto" (DP-028) |
| Nombre vacío | "Escribe un nombre para el proyecto." (DP-028) |
| Nombre de más de 120 caracteres | "El nombre puede tener hasta 120 caracteres." (DP-028) |
| Sin dialecto | "Elige el dialecto SQL de tu base." (DP-028) |
| Nombre repetido entre activos | "Ya tienes un proyecto activo con ese nombre. Elige otro." (DP-028) |
| Columnas de la lista de proyectos | "Nombre" · "Dialecto" · "Última actividad" · "Tablas" · "Columnas" · "Confirmadas"; sin columnas, "–" (DP-028) |
| Filtro de proyectos | "Ver archivados" / "Ver activos" (DP-028) |
| Renombrar proyecto | Acción "Renombrar"; diálogo "Renombrar proyecto"; botones "Guardar" y "Cancelar" (DP-028) |
| Archivar proyecto (confirmación) | Título "Archivar {nombre}"; texto "El proyecto deja de aparecer en tu lista. Sus datos se conservan y puedes desarchivarlo cuando quieras."; botones "Archivar" y "Cancelar" (DP-028) |
| Proyecto archivado (aviso) | "Proyecto archivado: solo lectura. Desarchívalo para hacer cambios." · acción "Desarchivar" (DP-028) |
| Desarchivar con nombre ocupado | "Ya tienes un proyecto activo llamado {nombre}. Elige otro nombre para desarchivarlo." (DP-028) |
| Selector de proyecto (nombre accesible) | "Cambiar de proyecto" (DP-028) |
| Campo descripción (renombrar proyecto) | Etiqueta "Descripción (opcional)" (DP-029) |
| Campo que no se puede cambiar | "Este campo no se puede cambiar." (DP-029) |
| Filtro de archivados sin resultados | "No tienes proyectos archivados." (DP-029) |
| Proyecto inexistente o ajeno | "Este proyecto no existe o no tienes acceso." · acción "Ir a tus proyectos" (DP-028) |
| Pestaña cuya pantalla aún no existe | "{Pestaña} aún no está disponible." (temporal, hasta su feature; DP-028) |
| Dialectos (selector del formulario de proyecto) | "SQL Server", "Oracle", "PostgreSQL"; en la insignia del proyecto se muestra el valor interno `tsql`, `oracle` o `postgres` (DP-019) |
| Insignia de solo lectura | "solo lectura" (title: "Rosetta nunca escribe en tu base de datos.") |
| Modo de redacción (MVP) | "redacción por reglas" (title: "Descripciones generadas con plantillas deterministas, sin LLM.") |

## 6. Descripciones generadas (modo reglas)

Las plantillas y ejemplos están en [06-motor-de-evidencia.md §10](../03-arquitectura/06-motor-de-evidencia.md). Reglas de redacción:
- Empezar por el significado ("Cuenta afectada.") y seguir con la evidencia ("Contención 0,998 con…").
- Hipótesis: empezar con "Probablemente" y decir por qué no se afirma.
- Desconocido: empezar con "Desconocido." y decir qué se buscó sin éxito, **solo sobre fuentes cargadas**.
- No mencionar fuentes que no existen en el proyecto (evita el problema de [EC-003](../07-registro/01-errores-conocidos.md)).
- Un LLM (Fase 2) podrá reescribir estas frases pero **no** añadir hechos (RN-23).
