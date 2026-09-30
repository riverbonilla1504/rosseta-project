# Decisiones pendientes

> Preguntas abiertas que la documentación **no** puede responder sin el responsable del producto. Cada `[PENDIENTE]` o `[NECESITA ACLARACIÓN]` de `docs/` apunta a una de estas entradas.
> **Regla para agentes y personas:** mientras una decisión esté abierta, se usa el **valor por defecto** indicado aquí (si lo hay) y se marca en el código/spec como provisional. Nadie decide por su cuenta: una decisión se cierra con un **CD** que actualiza todos los documentos afectados, y aquí se anota el resultado.
>
> Numeración `DP-NNN` correlativa. Estados: **Abierta** · **Decidida** (con CD) · **Descartada**.

## Resumen

| DP | Pregunta | Bloquea | Por defecto mientras tanto | Estado |
|---|---|---|---|---|
| [DP-001](#dp-001) | ¿Qué fuentes de evidencia incluye el MVP y qué pasa con las del prototipo sin historia? | **Sprint 2** | DDL + muestras + convenciones + contención entre muestras | **Decidida** |
| [DP-002](#dp-002) | ¿Conexión directa a la BD del cliente o archivos? | — (MVP ya decidido: archivos) | Archivos | Abierta (post-MVP) |
| [DP-003](#dp-003) | Parámetros numéricos y reglas finas del motor | **Sprint 3** | Valores *provisionales* de 06-motor | Abierta |
| [DP-004](#dp-004) | ¿Se usa un LLM local para redactar? ¿Cuál? | Fase 2 | Sin LLM | Abierta |
| [DP-005](#dp-005) | ¿Rosetta escribirá alguna vez en la BD del cliente ("publicar comentarios")? | Fase 2+ | No; como mucho generar script | **Decidida** |
| [DP-006](#dp-006) | Formatos de exportación del catálogo | Fase 2 | Markdown, JSON, SQL `COMMENT ON` | Abierta |
| [DP-007](#dp-007) | ¿Cuáles son los tres modos del generador? | Fase 2 | — | Abierta |
| [DP-008](#dp-008) | ¿Entran la vista de grafo/ERD y la pantalla MCP? | Fase 3–4 | Fase 3 / 4 según backlog | Abierta |
| [DP-009](#dp-009) | ¿Voseo o tuteo en la interfaz? | Sprint 1 (textos) | Tuteo neutro | **Decidida** |
| [DP-010](#dp-010) | ¿Notion queda como archivo o como espejo? | — | Archivo congelado | Abierta |
| [DP-011](#dp-011) | ¿Se divide el Sprint 1 en 1a/1b? | **Planificación** | Dividir | **Decidida** |
| [DP-012](#dp-012) | Flujo de Jira (estados) e integración con GitHub | Fase 0.5 | Por hacer → En curso → En revisión → Listo | Abierta |
| [DP-013](#dp-013) | Tamaño máximo y retención de archivos subidos | **Sprint 2** | 20 MB DDL / 200 MB CSV; borrar archivo al terminar de procesar | Abierta |
| [DP-014](#dp-014) | Métodos de acceso del MVP (Apple, correo/contraseña, vinculación) | **Sprint 1** | Solo Google y Microsoft; sin vinculación automática | **Decidida** |
| [DP-015](#dp-015) | Hosting, almacenamiento de objetos y monitoreo | Fin del MVP | Docker + S3 compatible + Sentry | Abierta |
| [DP-016](#dp-016) | Fase de ROS-94 frente a ROS-106/108 | Plan Fase 2 | Mover ROS-94 a Fase 3 | **Decidida** |
| [DP-017](#dp-017) | Navegación del MVP: Hallazgos/Generador y ubicación de Fuentes | Sprint 1 (layout) | Ocultos; Fuentes como pestaña; Convenciones dentro de Fuentes | Abierta |
| [DP-018](#dp-018) | Objetivos cuantitativos y métricas del Panorama | Piloto | Valores propuestos en RNF | Abierta |
| [DP-019](#dp-019) | Dialectos SQL soportados en el MVP | **Sprint 2** | T-SQL (SQL Server) obligatorio; Oracle y PostgreSQL deseables | Abierta |
| [DP-020](#dp-020) | Cobertura: ¿5 niveles en la barra? ¿cómo se cuentan las propagadas? | Sprint 5 | 5 niveles; confirmadas = directas + propagadas | **Decidida** |
| [DP-021](#dp-021) | ¿Se usa Jev (TypeSafe AI) como fuente de evidencia en Fase 2? | Fase 2 | No en el MVP; piloto acotado en Fase 2 | **Decidida** |

---

<a id="dp-001"></a>
### DP-001 · Fuentes de evidencia del MVP
- **Contexto:** [EC-003](01-errores-conocidos.md#ec-003). El prototipo muestra 6 fuentes; el backlog MVP tiene DDL, muestras y convenciones.
- **Preguntas:** (1) ¿La contención entre muestras ("catálogos embebidos") entra al MVP? (2) ¿Se crean historias para "Vistas y procedimientos" y "Etiquetas de aplicación"? ¿En qué fase? (3) ¿El Panorama muestra fuentes no cargadas como "no cargada"?
- **Opciones:** A) MVP = DDL + muestras + convenciones + contención; resto a Fase 2 con historias nuevas. B) MVP sin contención (más simple, pero no se reproducen PAPEL/CTANRO del prototipo).
- **Recomendación:** **A**. La contención es la evidencia de mayor peso (0,90) y la que da sentido al motor.
- **Afecta:** ROS-22, 23, 38, 131; [06-motor §3](../03-arquitectura/06-motor-de-evidencia.md); [03-datos-de-referencia §4](../04-datos/03-datos-de-referencia.md).
- **Decisión (2026-09-30, CD-003, responsable del producto):** Sí: el MVP incluye DDL + muestras + convenciones + **contención entre muestras**. "Vistas y procedimientos" y "Etiquetas de aplicación" pasan a Fase 2 como historias nuevas de E01.

<a id="dp-002"></a>
### DP-002 · Conexión directa vs. archivos
- **Contexto:** [EC-007](01-errores-conocidos.md#ec-007). NO-01 ya deja la conexión directa en Fase 3 (ROS-24).
- **Pregunta:** ¿Se mantiene Fase 3? ¿Qué motores primero (SQL Server parece el del caso de ejemplo)?
- **Recomendación:** mantener Fase 3; SQL Server primero, solo lectura, credenciales cifradas.

<a id="dp-003"></a>
### DP-003 · Parámetros del motor
- **Contexto:** [EC-015](01-errores-conocidos.md#ec-015).
- **Por decidir:** pesos de `PROFILE_PATTERN`, `DDL_*`; umbral de Inferida (prop. 0,60); umbral de abstención (prop. 0,20); umbral de conflicto (prop. 0,30); si el conflicto limita a Inferida o Hipótesis; "misma columna" para propagar (nombre exacto normalizado + tipo con longitud); propagación en un salto o en cadena; si `UNKNOWN` entra en la cola; si se puede confirmar directamente una `UNKNOWN`/`HYPOTHESIS` (prop. sí, con nombre obligatorio); fórmula de impacto (prop. = nº de destinos); cómo nombrar un campo ambiguo (caso USRALT).
- **Cómo se decide:** ROS-132 prepara ejemplos resueltos a mano con MOV0010 y una tabla de sensibilidad; el responsable elige; CD actualiza RN-03…RN-15 y 06-motor; sube `ENGINE_VERSION` a 1.0.0.

<a id="dp-004"></a>
### DP-004 · LLM local para redacción
- **Contexto:** El prototipo dice "redacción con LLM local" y ofrece "modo sin LLM". El MVP usa solo reglas (RN-22, ADR-0005).
- **Preguntas:** ¿Se quiere LLM en Fase 2? ¿Local (Ollama + modelo abierto) o API? ¿Qué hardware? ¿Qué pasa con la privacidad de los datos del cliente?
- **Recomendación:** decidir tras el piloto del MVP; si se adopta, local y solo sobre texto ya calculado.

<a id="dp-005"></a>
### DP-005 · Escritura en la base del cliente
- **Contexto:** [EC-013](01-errores-conocidos.md#ec-013); Constitución V (solo lectura).
- **Opciones:** A) Nunca escribir; exportar un script `COMMENT ON`/`sp_addextendedproperty` que el cliente ejecuta. B) Publicar con credenciales de escritura explícitas (enmienda de la constitución).
- **Recomendación:** **A**.
- **Decisión (2026-09-30, CD-003, responsable del producto):** Rosetta **nunca escribe** en la base del cliente. En Fase 2 (ROS-57) exporta un script SQL de comentarios que el cliente ejecuta por su cuenta.

<a id="dp-006"></a>
### DP-006 · Formatos de exportación
- **Contexto:** El prototipo dice "Exportar YAML"; ROS-57 dice Markdown/JSON/SQL/diccionario.
- **Recomendación:** JSON (canónico) + Markdown + SQL de comentarios; YAML opcional si un cliente lo pide (es trivial desde JSON).

<a id="dp-007"></a>
### DP-007 · Los tres modos del generador
- **Contexto:** El prototipo menciona "los tres modos… con garantías por modo" sin nombrarlos en lo capturado.
- **Acción:** revisar el prototipo en vivo o los documentos de concepto ([EC-001](01-errores-conocidos.md#ec-001), [EC-002](01-errores-conocidos.md#ec-002)).

<a id="dp-008"></a>
### DP-008 · Grafo/ERD y pantalla MCP
- **Contexto:** El prototipo termina con "Falta decidir: si querés la vista de grafo/ERD por dominio funcional y la pantalla de servidor MCP (fase 4 de la hoja de ruta)".
- **Por defecto:** E08 en Fase 3 y E09 en Fase 4, como el backlog.

<a id="dp-009"></a>
### DP-009 · Voseo o tuteo
- **Contexto:** [EC-008](01-errores-conocidos.md#ec-008).
- **Recomendación:** tuteo neutro para mercado latinoamericano amplio (los números ya usan formato es-CO).
- **Decisión (2026-09-30, CD-003, responsable del producto):** **Tuteo neutro** en toda la interfaz.

<a id="dp-010"></a>
### DP-010 · Rol de Notion
- **Contexto:** Notion tiene el backlog original (páginas y BD). Desde 2026-09-29 está congelado ([04-sincronizacion.md](../00-metodologia/04-sincronizacion.md)).
- **Opciones:** A) Archivo congelado con aviso en la página raíz. B) Espejo de solo lectura sincronizado desde `docs/` (más trabajo, un nivel más en la jerarquía).
- **Recomendación:** **A**; añadir aviso "Congelado — ver docs/ del repositorio" en la página raíz de Notion (acción de Fase 0.5).

<a id="dp-011"></a>
### DP-011 · Dividir el Sprint 1
- **Contexto:** [EC-009](01-errores-conocidos.md#ec-009).
- **Recomendación:** 1a (ROS-74, 75, 89–93: 99 h) y 1b (ROS-78, 81, 84: 75 h). 1b puede empezar en paralelo con otra persona porque solo depende del esqueleto de auth para `owner`.
- **Decisión (2026-09-30, CD-003, responsable del producto):** **No se divide**: el Sprint 1 se mantiene con 174 h (riesgo aceptado, ver EC-009).

<a id="dp-012"></a>
### DP-012 · Flujo de Jira e integración GitHub
- **Contexto:** El flujo del proyecto ROS tiene *Por hacer*, *En curso* y *Listo* (verificado 2026-09-29); falta un estado de revisión.
- **Recomendación:** añadir *En revisión* entre *En curso* y *Listo*; instalar "GitHub for Jira" para enlazar ramas/PR/commits por clave; regla: solo quien verifica mueve a *Listo*.

<a id="dp-013"></a>
### DP-013 · Tamaño máximo y retención de archivos
- **Preguntas:** tamaño máximo de DDL y CSV; ¿se conserva el archivo original tras procesar? ¿cuánto tiempo se guardan perfiles con top valores (pueden contener datos personales)?
- **Recomendación:** 20 MB DDL / 200 MB CSV; borrar el CSV original al terminar el perfilado (se conserva el perfil); conservar el DDL (no contiene datos); top valores de columnas PII enmascarados desde que exista ROS-85.

<a id="dp-014"></a>
### DP-014 · Métodos de acceso del MVP
- **Preguntas:** (1) ¿Apple en el MVP? Requiere cuenta de desarrollador de pago y dominio verificado. (2) ¿Correo/contraseña? (ROS-95/96 lo suponen). (3) Si un correo ya existe con otro proveedor, ¿se vincula automáticamente?
- **Recomendación:** solo Google + Microsoft; sin contraseña; sin vinculación automática (error claro), vinculación manual en ROS-98.
- **Decisión (2026-09-30, CD-003, responsable del producto):** MVP con **Google + Microsoft**; sin Apple, sin correo/contraseña y sin vinculación automática (error claro si el correo ya existe con otro proveedor).
- **Actualización (2026-09-30, CD-004):** el login usa **Auth0** ([ADR-0007](../03-arquitectura/adr/ADR-0007-autenticacion-auth0.md)). Microsoft con cuentas personales = conexión social; con cuentas de trabajo (Entra ID) = conexión empresarial, que consume la única del plan gratis.

<a id="dp-015"></a>
### DP-015 · Infraestructura de producción
- **Preguntas:** proveedor (AWS, GCP, Azure, Render, Railway, Fly.io, VPS propio…), almacenamiento S3 compatible, Sentry u otro, presupuesto, región (datos de clientes latinoamericanos).
- **Recomendación:** decidir antes del Sprint 5 para tener staging durante el QA del MVP.

<a id="dp-016"></a>
### DP-016 · Fase de ROS-94
- **Contexto:** [EC-018](01-errores-conocidos.md#ec-018).
- **Recomendación:** mover ROS-94 a Fase 3 junto con E15.
- **Decisión (2026-09-30, CD-003, responsable del producto):** **ROS-94 pasa a Fase 3**, junto con la administración B2B de E15.

<a id="dp-017"></a>
### DP-017 · Navegación del MVP
- **Preguntas:** ¿Hallazgos y Generador se ocultan o se muestran como "Próximamente"? ¿Fuentes es pestaña propia? ¿Convenciones es pestaña o sección?
- **Recomendación:** ocultos; Fuentes como 4.ª pestaña; Convenciones como sección de Fuentes.

<a id="dp-018"></a>
### DP-018 · Objetivos cuantitativos
- **Preguntas:** valores p95 de rendimiento, metas de producto (tiempo hasta primer hallazgo, % confirmado), definición de "22 min al primer hallazgo" y "1,8 h perfilado incremental" del Panorama.
- **Recomendación:** validar con el primer esquema real en el piloto; hasta entonces, los RNF propuestos.

<a id="dp-019"></a>
### DP-019 · Dialectos SQL del MVP
- **Contexto:** ROS-120 pide tolerar Oracle, SQL Server y PostgreSQL; el caso de ejemplo es SQL Server.
- **Recomendación:** T-SQL obligatorio con pruebas completas; Oracle y PostgreSQL con un DDL de ejemplo cada uno; MySQL "mejor esfuerzo".

<a id="dp-020"></a>
### DP-020 · Cómo se cuenta la cobertura
- **Contexto:** [EC-012](01-errores-conocidos.md#ec-012).
- **Recomendación:** barra con 5 niveles; "validaciones" = acciones `CONFIRM` humanas; "columnas documentadas" = confirmadas directas + propagadas = total `CONFIRMED`.
- **Decisión (2026-09-30, CD-003, responsable del producto):** La cobertura muestra **los 5 niveles**; "validaciones" = acciones CONFIRM humanas; columnas confirmadas = directas + propagadas.

<a id="dp-021"></a>
### DP-021 · Jev (TypeSafe AI) como fuente de evidencia
- **Contexto:** evaluación completa en [2026-09-30-jev-typesafe-ai.md](../03-arquitectura/evaluaciones/2026-09-30-jev-typesafe-ai.md). Jev devuelve decisiones tipadas con probabilidades; filosofía muy alineada, pero es servicio externo, sin determinismo garantizado, débil en fechas/códigos/conteos, mejor en inglés y en *early access*.
- **Preguntas:** (1) ¿Se hace un piloto en Fase 2? (2) ¿Se acepta enviar metadatos de esquemas (no valores) a un tercero? (3) ¿Se pide acceso ya a la lista de espera?
- **Recomendación:** no en el MVP; piloto en Fase 2 como evidencia opcional `MODEL_JUDGMENT` (peso ≤ 0,40, solo metadatos, *opt-in* por proyecto, respuesta almacenada) para emparejar documentación/etiquetas con columnas y verificar la redacción del LLM. Requiere ADR-0007.
- **Decisión (2026-09-30, CD-003, responsable del producto):** **No en el MVP.** Piloto en Fase 2 como evidencia opcional (peso ≤ 0,40, solo metadatos, *opt-in* por proyecto); pedir acceso a la lista de espera desde ya. Requiere ADR-0007 antes del piloto.
