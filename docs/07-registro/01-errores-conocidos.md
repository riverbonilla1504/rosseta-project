# Errores conocidos

> **Lugar único** donde se anotan errores, limitaciones, inconsistencias y deuda conocidas del producto, de la documentación y de las herramientas (Jira, Notion, prototipo).
> Regla: si lo sabes y no está aquí, no está registrado. Nadie "lo arregla de paso": se registra, se decide y se corrige por el flujo (CD para documentación, `fix/ROS-NNN` para código).
> Plantilla para nuevas entradas: [../plantillas/error-conocido.md](../plantillas/error-conocido.md). Numeración `EC-NNN` correlativa, nunca se reutiliza.

## Cómo registrar

1. Copia la plantilla al final de la sección *Abiertos* con el siguiente número.
2. Si afecta a código o a algo que se ejecutará en un sprint: crea incidencia tipo **Error** en Jira (`ROS`) con el enlace a esta entrada y pon su clave en el campo *Jira*.
3. Enlaza el `EC-NNN` desde el documento donde se manifiesta (`> ⚠️ … [EC-NNN]`).
4. Al resolver: mueve la entrada a *Resueltos* con fecha, cómo se resolvió (CD/PR) y deja el enlace funcionando.

**Severidad:** S1 crítico · S2 alto · S3 medio · S4 bajo (definiciones en [01-estrategia-de-pruebas.md §7](../06-calidad/01-estrategia-de-pruebas.md)).
**Tipo:** `producto` (comportamiento/requisito), `doc` (documentación), `diseño`, `proceso`, `herramienta` (Jira/Notion/Spec Kit), `código`.

## Resumen

| EC | Título | Tipo | Sev. | Estado | Bloquea |
|---|---|---|---|---|---|
| [EC-001](#ec-001) | Artefactos de origen del diseño y documentos de concepto no disponibles | diseño | S2 | Abierto | ROS-168 (tokens exactos) |
| [EC-002](#ec-002) | Solo 2 de 5 pantallas del prototipo capturadas | diseño | S3 | Abierto | ROS-151 |
| [EC-003](#ec-003) | Las "seis fuentes" del prototipo no coinciden con las fuentes del MVP | producto | S2 | Abierto | Sprint 2, ROS-22, ROS-38 |
| [EC-004](#ec-004) | Incidencias de Jira sin bloque "Fuente de verdad" | herramienta | S3 | Abierto | Fase 0.5 |
| [EC-005](#ec-005) | Prioridad nativa de Jira en "Medium" para todo | herramienta | S4 | Abierto | — |
| [EC-006](#ec-006) | JQL `issuetype = Historia` devuelve 0 resultados | herramienta | S4 | Mitigado | — |
| [EC-007](#ec-007) | El prototipo muestra conexión en vivo a SQL Server; el MVP trabaja con archivos | producto | S3 | Abierto | — |
| [EC-008](#ec-008) | Voseo rioplatense en los textos del prototipo | diseño | S4 | Abierto | Textos de UI |
| [EC-009](#ec-009) | Sprint 1 sobrecargado (174 h) | proceso | S3 | Abierto | Planificación |
| [EC-010](#ec-010) | La carpeta del proyecto no es un repositorio git; Spec Kit sin inicializar | proceso | S2 | Abierto | Fase 0.5 |
| [EC-011](#ec-011) | El control `umbralConfirmada` en realidad es el umbral de "Alta · sin validar" | producto | S4 | Abierto | — |
| [EC-012](#ec-012) | Panorama: barra de cobertura sin "Alta · sin validar" y cifras 3.810 vs 4.120 | producto | S3 | Abierto | ROS-37, ROS-146 |
| [EC-013](#ec-013) | "Exportar YAML" y "Publicar comentarios al catálogo" en el prototipo | producto | S3 | Abierto | ROS-50 (UI) |
| [EC-014](#ec-014) | El widget de hallazgos del MVP anticipa una épica de Fase 2 | producto | S4 | Mitigado | ROS-40 |
| [EC-015](#ec-015) | Parámetros numéricos del motor incompletos | producto | S1 | Abierto | Sprint 3 |
| [EC-016](#ec-016) | Horas de las subtareas solo en la descripción de Jira | herramienta | S4 | Abierto | Informes de esfuerzo |
| [EC-017](#ec-017) | ROS-89 figura bajo E11 en Notion y bajo E14 en docs | herramienta | S4 | Aceptado | — |
| [EC-018](#ec-018) | Inconsistencia de fase: ROS-94 (Fase 2) depende de ROS-106/108 (Fase 3) | producto | S3 | Abierto | Plan Fase 2 |
| [EC-019](#ec-019) | ROS-135 (MVP) incluye recalcular al cambiar el umbral, que es Fase 2 | producto | S4 | Abierto | ROS-135 |
| [EC-020](#ec-020) | Contraste insuficiente probable en etiquetas de sección | diseño | S3 | Abierto | ROS-168, RNF-24 |

---

## Abiertos

<a id="ec-001"></a>
### EC-001 · Artefactos de origen del diseño y documentos de concepto no disponibles
- **Tipo / Sev.:** diseño · S2 — **Detectado:** 2026-09-29 — **Jira:** — (se crea en Fase 0.5)
- **Descripción:** Los archivos del sistema de diseño Nocturne del proyecto de Claude Design (`_ds/nocturne-…/readme.md`, `styles.css`, `support.js`, `_ds_bundle.js`) no se pudieron leer (la sincronización con Claude Design requiere inicio de sesión interactivo). Tampoco están los dos documentos de concepto (~1.000 y ~500 líneas) de los que se fusionó el prototipo.
- **Impacto:** los tokens de [01-sistema-de-diseno-nocturne.md](../05-diseno/01-sistema-de-diseno-nocturne.md) son **aproximados** (medidos sobre capturas); tipografías supuestas; posibles requisitos de los documentos de concepto no capturados en el backlog.
- **Mitigación actual:** valores marcados como aproximados; ROS-168 debe reemplazarlos.
- **Resolución propuesta:** en Fase 0.5 exportar desde Claude Design los archivos (`/design-login` + descarga, o exportación manual del proyecto) y guardarlos en `docs/05-diseno/fuentes/`; CD para actualizar tokens. Pedir al responsable los dos documentos de concepto y guardarlos en `docs/01-producto/fuentes/`.

<a id="ec-002"></a>
### EC-002 · Solo 2 de 5 pantallas del prototipo capturadas
- **Tipo / Sev.:** diseño · S3 — **Detectado:** 2026-09-29
- **Descripción:** Al navegar el prototipo en modo presentación, el renderizador se bloqueó al cambiar de pantalla; solo se capturaron **Panorama** y **Catálogo**. Revisión, Hallazgos y Generador se conocen solo por el resumen del propio prototipo.
- **Impacto:** la distribución visual exacta de **Revisión** (pantalla central) no está documentada.
- **Resolución propuesta:** en ROS-151 revisar el prototipo en vivo y completar [03-pantallas.md §2](../05-diseno/03-pantallas.md) mediante CD (con capturas en `docs/05-diseno/capturas/`).

<a id="ec-003"></a>
### EC-003 · Las "seis fuentes" del prototipo no coinciden con las fuentes del MVP
- **Tipo / Sev.:** producto · S2 — **Detectado:** 2026-09-29
- **Descripción:** El Panorama del prototipo muestra seis fuentes: *Perfilado de datos, Catálogos embebidos, Logs de consulta, Vistas y procedimientos, Etiquetas de aplicación, Nombre de columna*. El backlog define otras: DDL, muestras, logs (F2), documentación (F2), código (F3), convenciones. *Vistas y procedimientos* y *Etiquetas de aplicación* **no tienen historia**; *Catálogos embebidos* no tiene historia explícita (se aproxima con contención entre muestras); el DDL no aparece como fuente en el prototipo. Además, varias descripciones del prototipo citan fuentes fuera del MVP ("sin referencias en consultas ni en el repositorio").
- **Impacto:** ROS-22 ("las seis fuentes") y ROS-38 no se pueden cumplir literalmente en el MVP; riesgo de que las descripciones mencionen fuentes inexistentes.
- **Resolución propuesta:** decidir en [DP-001](02-decisiones-pendientes.md#dp-001) qué fuentes muestra el MVP y crear historias para las que falten (Fase 2+). Mientras tanto: el MVP muestra solo las fuentes cargadas y las plantillas no mencionan fuentes ausentes.

<a id="ec-004"></a>
### EC-004 · Incidencias de Jira sin bloque "Fuente de verdad"
- **Tipo / Sev.:** herramienta · S3 — **Detectado:** 2026-09-29
- **Descripción:** Las 190 incidencias (`ROS-1`…`ROS-190`) se crearon antes de definir la metodología; no tienen el bloque que enlaza a `docs/` y a la spec ([04-sincronizacion.md §7](../00-metodologia/04-sincronizacion.md)).
- **Impacto:** quien lea Jira puede editarlo como si fuera la fuente de verdad (drift).
- **Resolución propuesta:** **CD-001** en Fase 0.5: añadir el bloque a las 190 incidencias (script con la API de Jira).

<a id="ec-005"></a>
### EC-005 · Prioridad nativa de Jira en "Medium" para todo
- **Tipo / Sev.:** herramienta · S4 — **Detectado:** 2026-09-29
- **Descripción:** Al crear las incidencias no se asignó el campo *Prioridad*; la prioridad real está en las etiquetas `P0`…`P3`.
- **Impacto:** filtros y tableros por prioridad nativa no sirven.
- **Resolución propuesta:** en CD-001 mapear `P0→Highest`, `P1→High`, `P2→Medium`, `P3→Low`, o acordar usar solo etiquetas (y documentarlo en [05-trazabilidad-y-convenciones.md](../00-metodologia/05-trazabilidad-y-convenciones.md)).

<a id="ec-006"></a>
### EC-006 · JQL `issuetype = Historia` devuelve 0 resultados
- **Tipo / Sev.:** herramienta · S4 — **Estado:** Mitigado
- **Descripción:** El proyecto usa tipos con nombre traducido; la búsqueda por nombre falla.
- **Mitigación:** usar IDs: Épica `10049`, Historia `10050`, Subtarea `10048`, Error `10051`, Tarea `10052` (documentado en [05-trazabilidad-y-convenciones.md](../00-metodologia/05-trazabilidad-y-convenciones.md)).

<a id="ec-007"></a>
### EC-007 · El prototipo muestra conexión en vivo a SQL Server; el MVP trabaja con archivos
- **Tipo / Sev.:** producto · S3 — **Detectado:** 2026-09-29
- **Descripción:** La cabecera del prototipo muestra `CORE_PRD · sqlserver`, "última corrida hace 14 minutos, incremental", "1,8 h perfilado incremental": sugiere conexión directa y re-perfilado continuo. El MVP carga DDL y CSV (NO-01); la conexión directa es ROS-24 (Fase 3).
- **Impacto:** expectativas de demo/cliente distintas a lo que entrega el MVP.
- **Resolución propuesta:** [DP-002](02-decisiones-pendientes.md#dp-002). En el MVP la insignia muestra `nombre del proyecto · dialecto`.

<a id="ec-008"></a>
### EC-008 · Voseo rioplatense en los textos del prototipo
- **Tipo / Sev.:** diseño · S4
- **Descripción:** El prototipo usa voseo ("confirmás", "querés").
- **Resolución propuesta:** [DP-009](02-decisiones-pendientes.md#dp-009). Propuesta por defecto: tuteo neutro.

<a id="ec-009"></a>
### EC-009 · Sprint 1 sobrecargado (174 h)
- **Tipo / Sev.:** proceso · S3
- **Descripción:** El Sprint 1 suma 174 h frente a 79–104 h de los demás.
- **Resolución propuesta:** dividir en 1a (Design system + OAuth, 99 h) y 1b (Proyectos + persistencia + seguridad, 75 h) — [DP-011](02-decisiones-pendientes.md#dp-011).

<a id="ec-010"></a>
### EC-010 · La carpeta del proyecto no es un repositorio git; Spec Kit sin inicializar
- **Tipo / Sev.:** proceso · S2 — **Detectado:** 2026-09-29
- **Descripción:** `DB_MVP/` no tiene `.git` ni remoto; no existen `.specify/`, `specs/`, `backend/`, `frontend/`.
- **Impacto:** no hay historial de la documentación ni se puede aplicar el flujo de ramas/PR.
- **Resolución propuesta:** tareas 1–2 de la Fase 0.5 ([05-roadmap-y-sprints.md §4](../01-producto/05-roadmap-y-sprints.md)); primer commit = esta carpeta `docs/`.

<a id="ec-011"></a>
### EC-011 · El control `umbralConfirmada` en realidad es el umbral de "Alta · sin validar"
- **Tipo / Sev.:** producto · S4
- **Descripción:** En el prototipo el ajuste se llama `umbralConfirmada` (0.85), pero por RN-02 ningún umbral produce "Confirmada": lo que clasifica es "Alta · sin validar".
- **Resolución:** en código y UI se llama `umbral_alta` / "Umbral de Alta · sin validar" (RN-03). Aplicar al especificar ROS-32 (Fase 2).

<a id="ec-012"></a>
### EC-012 · Panorama: barra de cobertura sin "Alta · sin validar" y cifras 3.810 vs 4.120
- **Tipo / Sev.:** producto · S3 — **Detectado:** 2026-09-29
- **Descripción:** (1) La barra y la leyenda de cobertura muestran 4 niveles (Confirmadas, Inferidas, Hipótesis, Desconocidas) que suman 18.442, pero el catálogo del mismo prototipo tiene columnas "Alta · sin validar": o se contaron dentro de otro nivel o falta el segmento. (2) "34 validaciones … documentaron 3.810 columnas" pero Confirmadas = 4.120: la diferencia (310) no se explica.
- **Impacto:** ambigüedad en ROS-37 y en el invariante de ROS-146.
- **Resolución propuesta:** mostrar **5 niveles** en la cobertura; `columns_documented_by_validations` = directas + propagadas; `CONFIRMED` = ese mismo número (sin diferencia). Ratificar en [DP-020](02-decisiones-pendientes.md#dp-020).

<a id="ec-013"></a>
### EC-013 · "Exportar YAML" y "Publicar comentarios al catálogo" en el prototipo
- **Tipo / Sev.:** producto · S3
- **Descripción:** El Catálogo del prototipo tiene dos botones que contradicen el backlog: exportación es Fase 2 y en Markdown/JSON/SQL (ROS-57, no YAML); "Publicar comentarios al catálogo" implica **escribir** en la base del cliente, contra el principio de solo lectura (NO-02, RN-25), mientras el prototipo muestra además la insignia "solo lectura".
- **Resolución propuesta:** fuera del MVP; formatos en [DP-006](02-decisiones-pendientes.md#dp-006); escritura en [DP-005](02-decisiones-pendientes.md#dp-005) (alternativa: generar un script `COMMENT ON` que el cliente ejecuta él mismo).

<a id="ec-014"></a>
### EC-014 · El widget de hallazgos del MVP anticipa una épica de Fase 2
- **Tipo / Sev.:** producto · S4 — **Estado:** Mitigado
- **Descripción:** ROS-40 (MVP) resume "hallazgos abiertos" pero la épica Hallazgos (E06) es Fase 2.
- **Mitigación:** RN-16 define "hallazgo" en el MVP = conflicto abierto o columna Desconocida.

<a id="ec-015"></a>
### EC-015 · Parámetros numéricos del motor incompletos
- **Tipo / Sev.:** producto · **S1** — **Detectado:** 2026-09-29
- **Descripción:** Solo están decididos: peso del nombre 0,40, contención 0,90, umbral de Alta 0,85. Faltan: pesos de perfil y DDL, umbral de Inferida, umbral de abstención, límite por conflicto, definición exacta de "misma columna" para propagar, fórmula de impacto. [06-motor-de-evidencia.md](../03-arquitectura/06-motor-de-evidencia.md) propone valores **provisionales**.
- **Impacto:** sin ellos el Sprint 3 no puede cerrar (niveles no reproducibles contra el prototipo).
- **Resolución propuesta:** ROS-132 (inicio del Sprint 3) calibra con los 11 casos de MOV0010 y se ratifica por CD — [DP-003](02-decisiones-pendientes.md#dp-003).

<a id="ec-016"></a>
### EC-016 · Horas de las subtareas solo en la descripción de Jira
- **Tipo / Sev.:** herramienta · S4
- **Descripción:** Las horas estimadas de ROS-120…190 están en el texto de la descripción; el campo de estimación de tiempo (*Original estimate*) está vacío.
- **Impacto:** Jira no puede sumar esfuerzo por sprint ni mostrar burndown por horas.
- **Resolución propuesta:** en CD-001 copiar las horas de [03-tareas-mvp.md](../02-requisitos/03-tareas-mvp.md) al campo `timetracking.originalEstimate`.

<a id="ec-018"></a>
### EC-018 · Inconsistencia de fase: ROS-94 (Fase 2) depende de ROS-106/108 (Fase 3)
- **Tipo / Sev.:** producto · S3
- **Descripción:** "Restringir inicio de sesión a dominios permitidos" (ROS-94, Fase 2) necesita la gestión de dominios (ROS-106) y correos personalizados (ROS-108), que son Fase 3.
- **Resolución propuesta:** [DP-016](02-decisiones-pendientes.md#dp-016): mover ROS-94 a Fase 3, o adelantar a Fase 2 una versión mínima de ROS-106/108 (lista gestionada por el super-admin).

<a id="ec-019"></a>
### EC-019 · ROS-135 (MVP) incluye recalcular al cambiar el umbral, que es Fase 2
- **Tipo / Sev.:** producto · S4
- **Descripción:** La tarea ROS-135 tiene la actividad "Recalcular niveles al cambiar el umbral configurado", pero el umbral configurable es ROS-32 (Fase 2); en el MVP el umbral es fijo (RN-03).
- **Resolución propuesta:** en el MVP la actividad se cumple como "el recálculo completo funciona si cambia `EngineConfig`" (sin UI ni endpoint); CD para reformular la actividad en Fase 0.5.

<a id="ec-020"></a>
### EC-020 · Contraste insuficiente probable en etiquetas de sección
- **Tipo / Sev.:** diseño · S3
- **Descripción:** Las etiquetas en mayúsculas pequeñas ("COBERTURA DEL ESQUEMA") medidas ≈ `#6c6c90` sobre `#232532` dan ≈ 3,2:1, por debajo de 4,5:1 (WCAG AA para texto pequeño). El gris secundario queda al límite (≈ 4,4:1).
- **Impacto:** incumplimiento de RNF-24 si se replica tal cual.
- **Resolución propuesta:** confirmar con los valores reales (EC-001); si se confirma, aclarar el token en ROS-168 y registrarlo como desviación del prototipo.

---

## Aceptados (no se corregirán)

<a id="ec-017"></a>
### EC-017 · ROS-89 figura bajo E11 en Notion y bajo E14 en docs
- **Tipo / Sev.:** herramienta · S4 — **Estado:** Aceptado
- **Descripción:** "Autenticación de usuarios" se movió de E11 a E14; Notion (congelado) conserva E11.
- **Decisión:** Notion es archivo histórico congelado; no se corrige. `docs/` y Jira mandan.

## Resueltos

*(vacío)*
