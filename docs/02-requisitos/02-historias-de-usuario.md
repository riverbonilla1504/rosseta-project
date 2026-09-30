# Historias de usuario

> **Fuente de verdad** del texto, criterios de aceptación, prioridad y fase de cada historia. Jira (`ROS-16`…`ROS-119`, tipo *Historia*) es espejo: se copia desde aquí.
> Formato: *Como* [rol], *quiero* [acción] *para* [beneficio]. Cada historia tiene un ancla `#ros-NN`.
>
> **Leyenda de metadatos:** Tipo · Prioridad (P0 crítico MVP, P1 alto, P2 medio, P3 bajo) · MoSCoW · Fase · Estimación (XS–XL, esfuerzo relativo) · Valor.

## Índice rápido

| Épica | Historias | MVP (Fase 1) |
|---|---|---|
| [E01 Ingesta de fuentes](#e01--ingesta-de-fuentes-ros-1) | ROS-16…24, ROS-191, ROS-192 | 16, 17, 21, 22, 23 |
| [E02 Motor de evidencia](#e02--motor-de-evidencia-ros-2) | ROS-25…36 | 25, 26, 27, 28, 29, 33, 36 |
| [E03 Panorama](#e03--panorama-ros-3) | ROS-37…41 | 37, 38, 39, 40 |
| [E04 Revisión y validación](#e04--revisión-y-validación-ros-4) | ROS-42…49 | 42, 43, 44, 45, 46, 47, 48 |
| [E05 Catálogo de datos](#e05--catálogo-de-datos-ros-5) | ROS-50…57 | 50, 51, 52, 54, 55 |
| [E06 Hallazgos](#e06--hallazgos-ros-6) | ROS-58…62 | — |
| [E07 Generador de datos](#e07--generador-de-datos-ros-7) | ROS-63…68 | — |
| [E08 Grafo/ERD](#e08--grafoerd-ros-8) | ROS-69…70 | — |
| [E09 Servidor MCP](#e09--servidor-mcp-e-integraciones-ros-9) | ROS-71…73 | — |
| [E10 Nocturne](#e10--sistema-de-diseño-nocturne-ros-10) | ROS-74…77 | 74, 75 |
| [E11 Cuentas y proyectos](#e11--cuentas-y-proyectos-ros-11) | ROS-78…80 | 78 |
| [E12 Persistencia](#e12--persistencia-y-exportación-ros-12) | ROS-81…83 | 81 |
| [E13 No funcionales](#e13--no-funcionales-y-cumplimiento-ros-13) | ROS-84…88 | 84 |
| [E14 Inicio de sesión](#e14--inicio-de-sesión-oauth-ros-14) | ROS-89…103 | 89, 90, 91, 92, 93 |
| [E15 Administración y monetización](#e15--administración-y-monetización-ros-15) | ROS-104…119 | — |

---

## E01 · Ingesta de fuentes (ROS-1)

<a id="ros-16"></a>
### ROS-16 · Importar esquema / DDL de la base de datos
Funcionalidad · **P0** · Must · Fase 1 · M · Alto

*Como* analista, *quiero* cargar el DDL/esquema de una base heredada *para* extraer automáticamente tablas, columnas, tipos, llaves e índices.
- Acepta scripts SQL (`CREATE TABLE`) y/o metadata exportada.
- Extrae nombre, tipo, nulabilidad, PK/FK e índices por columna.
- Cada elemento importado queda registrado como fuente de evidencia.

<a id="ros-17"></a>
### ROS-17 · Cargar datos de muestra para perfilado
Funcionalidad · **P0** · Must · Fase 1 · M · Alto

*Como* analista, *quiero* subir datos de muestra *para* que el motor perfile valores reales de cada columna.
- Calcula distribución, % de nulos, cardinalidad y valores fuera de rango.
- Soporta CSV y muestra de tabla.
- El perfil alimenta el motor de evidencia.

<a id="ros-18"></a>
### ROS-18 · Ingerir consultas y logs de uso
Funcionalidad · P1 · Should · Fase 2 · M · Medio

*Como* analista, *quiero* cargar consultas/logs *para* inferir el uso real de columnas y los joins frecuentes.
- Detecta columnas usadas en JOIN/WHERE.
- Sugiere relaciones a partir de patrones de join.
- Registra las consultas como evidencia con su peso.

<a id="ros-19"></a>
### ROS-19 · Cargar documentación y diccionarios existentes
Funcionalidad · P1 · Should · Fase 2 · S · Medio

*Como* analista, *quiero* adjuntar documentación/diccionarios previos *para* incorporarlos como evidencia.
- Acepta texto/PDF/planilla.
- Vincula entradas del documento con columnas del esquema.
- La coincidencia aporta al puntaje de confianza.

<a id="ros-20"></a>
### ROS-20 · Importar código de la aplicación (ORM / SQL embebido)
Funcionalidad · P2 · Could · Fase 3 · L · Medio

*Como* analista, *quiero* analizar el código de la app *para* detectar mapeos ORM y usos de columnas.
- Detecta entidades/campos mapeados a tablas/columnas.
- Asocia nombres del dominio (código) con nombres crípticos (DB).
- Se registra como fuente de alta relevancia.

<a id="ros-21"></a>
### ROS-21 · Definir catálogo de convenciones de nombres
Requisito · P1 · Should · **Fase 1** · S · Medio

*Como* analista, *quiero* mantener un catálogo de convenciones (prefijos, abreviaturas) *para* que el nombre de columna aporte de forma controlada.
- Reglas editables (p. ej. `IMPTE`→importe, `FE`→fecha).
- El nombre pesa como máximo 0,40 en el puntaje.
- Cambios recalculan las inferencias afectadas.

<a id="ros-22"></a>
### ROS-22 · Panel de fuentes recolectadas con estado y cobertura
Funcionalidad · **P0** · Must · Fase 1 · S · Alto

*Como* analista, *quiero* ver todas las fuentes cargadas y su cobertura *para* saber qué evidencia tengo.
- Lista las fuentes (las "seis fuentes") con tipo y fecha.
- Muestra cobertura por fuente.
- Enlaza a la evidencia que cada fuente generó.

> ⚠️ Las "seis fuentes" del prototipo no coinciden con las fuentes del backlog: ver [EC-003](../07-registro/01-errores-conocidos.md) / [DP-001](../07-registro/02-decisiones-pendientes.md).

<a id="ros-23"></a>
### ROS-23 · Normalizar toda la evidencia a un formato común
Técnico/Infra · **P0** · Must · Fase 1 · M · Alto

*Como* desarrollador, *quiero* normalizar toda fuente a un modelo de evidencia común *para* que el motor las combine.
- Modelo unificado {objetivo, tipo de fuente, afirmación, peso, referencia}.
- Cada evidencia guarda su cita verificable.
- Independiente del origen de la fuente.

<a id="ros-24"></a>
### ROS-24 · Conectores directos a motores de BD
Técnico/Infra · P2 · Could · Fase 3 · L · Medio

*Como* analista, *quiero* conectarme directo a Postgres/MySQL/Oracle/SQL Server *para* importar esquema y muestras sin exportar a mano.
- Conexión de solo lectura configurable.
- Importa esquema y muestra acotada.
- Credenciales gestionadas de forma segura.

<a id="ros-191"></a>
### ROS-191 · Ingerir vistas y procedimientos almacenados
Funcionalidad · P1 · Should · Fase 2 · M · Medio

*Como* analista, *quiero* cargar las definiciones de vistas y procedimientos almacenados *para* que su SQL aporte evidencia de uso, joins y alias de columnas.
- Acepta el DDL de vistas y procedimientos (`CREATE VIEW`, `CREATE PROCEDURE`).
- Extrae columnas referenciadas, joins y alias (`AS nombre_legible`) como evidencia citada.
- Se muestra como la fuente "Vistas y procedimientos" del Panorama.

> Añadida en CD-003 ([DP-001](../07-registro/02-decisiones-pendientes.md#dp-001)).

<a id="ros-192"></a>
### ROS-192 · Emparejar etiquetas de la aplicación con columnas
Funcionalidad · P1 · Should · Fase 2 · M · Alto

*Como* analista, *quiero* cargar las etiquetas de la interfaz de la aplicación heredada (formularios, reportes) *para* que los nombres que ve el usuario final aporten evidencia sobre el significado de las columnas.
- Acepta un listado de etiquetas con su contexto (pantalla/campo), en CSV o texto.
- Propone el emparejamiento etiqueta ↔ columna con evidencia citada y peso acotado.
- Se muestra como la fuente "Etiquetas de aplicación" del Panorama.

> Añadida en CD-003 ([DP-001](../07-registro/02-decisiones-pendientes.md#dp-001)). Candidata al piloto de Jev ([DP-021](../07-registro/02-decisiones-pendientes.md#dp-021)).

---

## E02 · Motor de evidencia (ROS-2)

<a id="ros-25"></a>
### ROS-25 · Modelo de puntuación ponderada de evidencia
Funcionalidad · **P0** · Must · Fase 1 · L · Alto

*Como* motor, *quiero* combinar evidencia de varias fuentes con pesos *para* producir un puntaje por columna.
- El nombre de la columna pesa 0,40; el resto lo aportan datos/uso/código/docs.
- El puntaje es reproducible y auditable.
- Cambios en las fuentes actualizan el puntaje.

<a id="ros-26"></a>
### ROS-26 · Asignar niveles de confianza (5 niveles)
Funcionalidad · **P0** · Must · Fase 1 · M · Alto

*Como* analista, *quiero* que cada afirmación tenga un nivel de confianza claro.
- Niveles: Confirmada, Alta · sin validar, Inferida, Hipótesis, Desconocida.
- El nivel deriva del puntaje y del estado de validación.
- "Confirmada" solo tras validación humana.

<a id="ros-27"></a>
### ROS-27 · Declarar "Desconocida" en lugar de inventar
Requisito · **P0** · Must · Fase 1 · S · Alto

*Como* analista, *quiero* que el motor admita ignorancia cuando no hay evidencia, *para* no confiar en datos inventados.
- Sin evidencia suficiente → "Desconocida" (ej. `RESERV3`).
- Nunca rellena con una suposición presentada como hecho.
- El estado "Desconocida" es visible y filtrable.

<a id="ros-28"></a>
### ROS-28 · Detección de conflictos entre fuentes
Funcionalidad · **P0** · Must · Fase 1 · M · Alto

*Como* revisor, *quiero* que se marquen los conflictos cuando las fuentes se contradicen.
- Detecta afirmaciones contradictorias sobre la misma columna.
- Muestra aviso de conflicto con las fuentes implicadas.
- El conflicto baja/limita el nivel de confianza.

<a id="ros-29"></a>
### ROS-29 · Propagación de confirmaciones con contadores reales
Funcionalidad · **P0** · Must · Fase 1 · M · Alto

*Como* revisor, *quiero* que confirmar una columna desbloquee las relacionadas, *para* ver el impacto real.
- Confirmar propaga a columnas dependientes.
- Los contadores suben con el número real de columnas desbloqueadas.
- La propagación es reversible al rechazar.

<a id="ros-30"></a>
### ROS-30 · Inferencia de relaciones (llaves foráneas)
Funcionalidad · P1 · Should · Fase 2 · L · Alto

*Como* analista, *quiero* que el motor infiera relaciones entre tablas/columnas aunque no haya FK declaradas.
- Propone relaciones por nombre, tipo, contención de valores y joins.
- Cada relación inferida lleva evidencia y nivel de confianza.
- Se puede confirmar o rechazar una relación.

<a id="ros-31"></a>
### ROS-31 · Modo sin LLM (reglas deterministas)
Funcionalidad · P1 · Should · Fase 2 · M · Alto

*Como* responsable de cumplimiento, *quiero* un modo que use solo reglas deterministas *para* obtener una salida que "aprobaría un banco".
- Toggle `modoSinLlm` cambia toda la redacción a la versión seca de reglas.
- Ningún resultado depende de un LLM en ese modo.
- Las garantías del modo quedan documentadas.

<a id="ros-32"></a>
### ROS-32 · Umbral de "Confirmada" configurable con reclasificación en vivo
Mejora · P1 · Should · Fase 2 · S · Medio

*Como* analista, *quiero* ajustar el umbral de confirmación y ver cómo se reclasifican los niveles al instante.
- Control `umbralConfirmada` (ej. 0,85).
- Cambiarlo reclasifica los niveles en vivo.
- No altera las columnas ya validadas por humanos.

> Nota: el nombre del control es heredado del prototipo; en realidad es el umbral de **"Alta · sin validar"** ([RN-03](04-reglas-de-negocio.md)).

<a id="ros-33"></a>
### ROS-33 · Trazabilidad: cada aserción enlaza a su evidencia
Requisito · **P0** · Must · Fase 1 · M · Alto

*Como* revisor, *quiero* que toda afirmación muestre las citas verificables que la sustentan.
- Cada afirmación enlaza a fuente(s) concretas.
- Las citas son verificables (se puede ir al dato/línea original).
- Sin cita no se afirma nada por encima de "Hipótesis".

<a id="ros-34"></a>
### ROS-34 · Recálculo incremental al añadir fuentes o confirmar
Técnico/Infra · P1 · Should · Fase 2 · M · Medio

*Como* desarrollador, *quiero* recalcular solo lo afectado al cambiar evidencia *para* mantener la app ágil.
- Añadir fuente o confirmar recalcula únicamente lo impactado.
- El estado se mantiene consistente entre pantallas.
- Operación idempotente y auditable.

<a id="ros-35"></a>
### ROS-35 · Explicabilidad del puntaje (por qué este nivel)
Mejora · P1 · Should · Fase 2 · M · Alto

*Como* revisor, *quiero* entender por qué una columna tiene cierto nivel *para* poder confiar o corregir.
- Desglose de aportes por fuente al puntaje.
- Explica qué falta para subir de nivel.
- Disponible tanto con LLM como en modo reglas.

<a id="ros-36"></a>
### ROS-36 · Cola priorizada por impacto
Funcionalidad · **P0** · Must · Fase 1 · M · Alto

*Como* revisor, *quiero* una cola que ordene qué revisar primero según el impacto.
- Ordena por impacto (columnas que desbloquea, uso, conflicto).
- Se actualiza al confirmar/rechazar.
- Accesible desde el Panorama y la Revisión.

---

## E03 · Panorama (ROS-3)

<a id="ros-37"></a>
### ROS-37 · Dashboard de cobertura por nivel de confianza
Funcionalidad · **P0** · Must · Fase 1 · M · Alto

*Como* analista, *quiero* ver de un vistazo cuánto del esquema está en cada nivel de confianza.
- Distribución por Confirmada/Alta/Inferida/Hipótesis/Desconocida.
- Vista global y por tabla/dominio.
- Refleja la mezcla honesta (no todo "confirmado").

<a id="ros-38"></a>
### ROS-38 · Widget de fuentes recolectadas
Funcionalidad · **P0** · Must · Fase 1 · S · Medio

*Como* analista, *quiero* ver en el panorama las fuentes recolectadas y su aporte.
- Muestra las seis fuentes con su estado.
- Indica cobertura aportada por cada una.
- Enlaza al panel de fuentes.

<a id="ros-39"></a>
### ROS-39 · Cola por impacto en el panorama
Funcionalidad · **P0** · Must · Fase 1 · S · Alto

*Como* revisor, *quiero* acceder desde el panorama a lo más prioritario por revisar.
- Muestra el top de la cola por impacto.
- Un clic lleva a la ficha en Revisión.
- Sincronizada con la cola del motor.

<a id="ros-40"></a>
### ROS-40 · Resumen de hallazgos abiertos
Funcionalidad · **P0** · Must · Fase 1 · S · Medio

*Como* analista, *quiero* ver los hallazgos abiertos en el panorama *para* no perderlos de vista.
- Cuenta hallazgos abiertos por severidad.
- Enlaza a la pantalla de Hallazgos.
- Se actualiza al resolver.

> En el MVP, "hallazgo" = conflicto abierto o columna Desconocida ([RN-16](04-reglas-de-negocio.md)); la pantalla Hallazgos es Fase 2.

<a id="ros-41"></a>
### ROS-41 · KPIs de progreso (% confirmado, pendientes)
Mejora · P1 · Should · Fase 2 · S · Medio

*Como* líder, *quiero* KPIs de avance *para* medir el progreso del descifrado.
- % confirmado, pendientes y desconocidas.
- Tendencia en el tiempo.
- Exportable para reporte.

---

## E04 · Revisión y validación (ROS-4)

<a id="ros-42"></a>
### ROS-42 · Ficha de evidencia por columna con citas verificables
Funcionalidad · **P0** · Must · Fase 1 · L · Alto

*Como* revisor, *quiero* una ficha por columna que reúna toda la evidencia con citas verificables *para* decidir con criterio.
- Muestra afirmación propuesta, nivel y fuentes con cita.
- Pantalla central del flujo de trabajo.
- Permite ir a la evidencia original.

<a id="ros-43"></a>
### ROS-43 · Perfil de datos (distribución, nulos, valores fuera de catálogo)
Funcionalidad · **P0** · Must · Fase 1 · M · Alto

*Como* revisor, *quiero* ver el perfil de datos de la columna dentro de la ficha *para* validar la hipótesis.
- Distribución, % nulos, cardinalidad.
- Marca valores fuera del catálogo esperado.
- Sirve de base para bajar/subir el nivel.

<a id="ros-44"></a>
### ROS-44 · Previsualización del efecto de propagación al confirmar
Funcionalidad · **P0** · Must · Fase 1 · M · Alto

*Como* revisor, *quiero* ver qué se desbloqueará antes de confirmar *para* entender el impacto.
- Muestra columnas/relaciones que la confirmación propagará.
- Indica el número real de columnas afectadas.
- Se actualiza si cambia la evidencia.

<a id="ros-45"></a>
### ROS-45 · Avisos de conflicto en la ficha
Funcionalidad · **P0** · Must · Fase 1 · S · Alto

*Como* revisor, *quiero* que la ficha me alerte de conflictos entre fuentes *para* no confirmar a ciegas.
- Aviso visible cuando hay contradicción.
- Lista las fuentes en conflicto.
- Sugiere resolver antes de confirmar.

<a id="ros-46"></a>
### ROS-46 · Acciones Confirmar / Editar / Rechazar
Funcionalidad · **P0** · Must · Fase 1 · M · Alto

*Como* revisor, *quiero* confirmar, editar o rechazar una afirmación *para* cerrar el circuito humano.
- Confirmar sube a "Confirmada" y propaga.
- Editar permite corregir el significado.
- Rechazar baja el nivel y registra el motivo.

<a id="ros-47"></a>
### ROS-47 · Atajos de teclado (J/K, A, E, R)
Mejora · P1 · Should · **Fase 1** · S · Medio

*Como* revisor intensivo, *quiero* atajos de teclado *para* revisar en cola más rápido.
- J/K navegan, A acepta, E edita, R rechaza.
- Atajos visibles/descubribles.
- No interfieren con campos de texto.

<a id="ros-48"></a>
### ROS-48 · Diferenciar "Alta · sin validar" de "Confirmada"
Corrección · **P0** · Must · Fase 1 · S · Alto

*Como* revisor, *quiero* que un ítem pendiente nunca se lea como "Confirmada" *para* no confiar de más.
- Un pendiente muestra "Alta · sin validar".
- "Confirmada" queda reservada al estado posterior a la validación humana.
- Consistente en cola, catálogo y hallazgos.

<a id="ros-49"></a>
### ROS-49 · Edición manual de significado/etiqueta con registro de autor
Funcionalidad · P1 · Should · Fase 2 · M · Medio

*Como* revisor, *quiero* corregir manualmente el significado de una columna y que quede registro de quién lo hizo.
- Campo editable con validación.
- Registra autor y fecha del cambio.
- La edición manual cuenta como evidencia de máximo peso.

> Nota: la acción *Editar* básica está en el MVP (ROS-46); esta historia añade la edición como evidencia de máximo peso y el historial.

---

## E05 · Catálogo de datos (ROS-5)

<a id="ros-50"></a>
### ROS-50 · Vista tabla-por-tabla y columna-por-columna
Funcionalidad · **P0** · Must · Fase 1 · L · Alto

*Como* analista, *quiero* navegar el catálogo tabla por tabla y columna por columna (ej. `MOV0010`).
- Lista tablas y, al entrar, sus columnas.
- Cada columna muestra significado, tipo y nivel.
- Navegación fluida entre tablas.

<a id="ros-51"></a>
### ROS-51 · Chips de confianza diferenciados
Mejora · **P0** · Must · Fase 1 · S · Medio

*Como* analista, *quiero* distinguir de un vistazo el nivel de cada columna por su chip.
- Relleno de acento = Confirmada; contorno = Alta sin validar; relleno tenue = Inferida; neutro = Hipótesis.
- Accesible (no solo color).
- Consistente en toda la app.

<a id="ros-52"></a>
### ROS-52 · Rastro de evidencia por columna
Funcionalidad · **P0** · Must · Fase 1 · M · Alto

*Como* analista, *quiero* ver el rastro de evidencia de cada columna en el catálogo.
- Muestra qué fuentes sustentan el significado.
- Enlaza a las citas.
- Explica por qué está en ese nivel.

<a id="ros-53"></a>
### ROS-53 · Relaciones inferidas al hacer clic
Funcionalidad · P1 · Should · Fase 2 · M · Alto

*Como* analista, *quiero* ver las relaciones inferidas de una columna al hacer clic.
- Muestra tablas/columnas relacionadas y el tipo de relación.
- Indica el nivel de confianza de la relación.
- Permite navegar a la contraparte.

<a id="ros-54"></a>
### ROS-54 · Convención única de nombres en toda la app
Corrección · **P0** · Must · Fase 1 · S · Alto

*Como* usuario, *quiero* que la cola, el catálogo, los hallazgos y el generador hablen del mismo esquema.
- Una sola convención (ej. `MOV0010`, `CTANRO`, `IMPTE`, `CLI0001`, `CTA0001`, `PAR0012`).
- Sin nombres inconsistentes entre pantallas.
- Fuente única de verdad para los identificadores.

<a id="ros-55"></a>
### ROS-55 · Estado compartido entre catálogo, cola y revisión
Técnico/Infra · **P0** · Must · Fase 1 · M · Alto

*Como* usuario, *quiero* que confirmar en Revisión se refleje al instante en el Catálogo y la cola.
- Confirmar cambia la fila del catálogo a "Confirmada".
- Los pendientes muestran "Alta · sin validar" hasta confirmarse.
- Estado único y sincronizado.

<a id="ros-56"></a>
### ROS-56 · Búsqueda y filtros del catálogo
Funcionalidad · P1 · Should · Fase 2 · M · Medio

*Como* analista, *quiero* buscar y filtrar el catálogo *para* encontrar columnas rápido.
- Filtra por tabla, nivel de confianza y dominio.
- Búsqueda por nombre y por significado.
- Combina filtros.

<a id="ros-57"></a>
### ROS-57 · Exportar catálogo (Markdown/JSON/comentarios SQL/diccionario)
Funcionalidad · P1 · Should · Fase 2 · M · Alto

*Como* analista, *quiero* exportar el catálogo *para* usarlo fuera de la app.
- Exporta a Markdown, JSON y comentarios SQL (`COMMENT ON`).
- Incluye nivel de confianza y citas.
- Opción de exportar solo lo confirmado.

> ⚠️ El prototipo muestra "Exportar YAML" y "Publicar comentarios al catálogo": ver [EC-013](../07-registro/01-errores-conocidos.md) / [DP-006](../07-registro/02-decisiones-pendientes.md).

---

## E06 · Hallazgos (ROS-6)

<a id="ros-58"></a>
### ROS-58 · Informe de hallazgos por severidad
Funcionalidad · P1 · Should · Fase 2 · M · Alto

*Como* analista, *quiero* un informe de hallazgos ordenado por severidad *para* priorizar arreglos.
- Clasifica por severidad (crítico/alto/medio/bajo).
- Cada hallazgo describe el problema detectado.
- Filtrable y ordenable.

<a id="ros-59"></a>
### ROS-59 · Esfuerzo estimado por hallazgo
Funcionalidad · P1 · Should · Fase 2 · S · Medio

*Como* líder, *quiero* ver el esfuerzo estimado de cada hallazgo *para* planificar.
- Muestra esfuerzo estimado por hallazgo.
- Permite ordenar por esfuerzo vs severidad.
- Sirve para armar un plan de remediación.

<a id="ros-60"></a>
### ROS-60 · Vincular hallazgo con columnas/tablas afectadas
Funcionalidad · P1 · Should · Fase 2 · S · Medio

*Como* analista, *quiero* saltar de un hallazgo a las columnas/tablas afectadas.
- Cada hallazgo enlaza a sus columnas/tablas.
- Navegación directa al catálogo/ficha.
- Muestra el nivel de confianza afectado.

<a id="ros-61"></a>
### ROS-61 · Recomendaciones de remediación
Mejora · P2 · Could · Fase 3 · M · Medio

*Como* analista, *quiero* sugerencias de cómo resolver cada hallazgo.
- Recomienda acción concreta por tipo de hallazgo.
- Distingue recomendación automática de decisión humana.
- Enlaza a la evidencia relevante.

<a id="ros-62"></a>
### ROS-62 · Exportar reporte de hallazgos
Funcionalidad · P2 · Could · Fase 3 · S · Medio

*Como* analista, *quiero* exportar el reporte de hallazgos *para* compartirlo.
- Exporta a PDF/Markdown.
- Incluye severidad y esfuerzo.
- Refleja el estado al momento de exportar.

---

## E07 · Generador de datos (ROS-7)

<a id="ros-63"></a>
### ROS-63 · Generador de datos con 3 modos
Funcionalidad · P1 · Should · Fase 2 · L · Alto

*Como* analista, *quiero* generar datos sintéticos en tres modos según mi necesidad.
- Ofrece los tres modos de generación.
- Cada modo declara sus garantías.
- Selección clara del modo antes de ejecutar.

> `[NECESITA ACLARACIÓN: cuáles son los tres modos]` — [DP-007](../07-registro/02-decisiones-pendientes.md).

<a id="ros-64"></a>
### ROS-64 · Muestra generada coherente con el catálogo
Funcionalidad · P1 · Should · Fase 2 · M · Alto

*Como* analista, *quiero* que los datos generados respeten el significado y formato del catálogo.
- La muestra usa el mismo esquema y convenciones.
- Respeta tipos, dominios y niveles conocidos.
- No genera datos para columnas "Desconocidas" sin marcarlo.

<a id="ros-65"></a>
### ROS-65 · Registro de ejecución del generador
Funcionalidad · P1 · Should · Fase 2 · S · Medio

*Como* analista, *quiero* un registro de cada ejecución del generador *para* auditar qué se produjo.
- Registra modo, parámetros, fecha y volumen.
- Permite reproducir una ejecución.
- Visible junto a la muestra generada.

<a id="ros-66"></a>
### ROS-66 · Garantías por modo (documentadas y verificadas)
Requisito · P1 · Should · Fase 2 · M · Alto

*Como* responsable de datos, *quiero* saber qué garantiza cada modo (privacidad, realismo, consistencia).
- Cada modo lista sus garantías explícitas.
- Se verifica que la salida cumple la garantía.
- Documentación visible en la pantalla.

<a id="ros-67"></a>
### ROS-67 · Respetar relaciones/FK y restricciones al generar
Funcionalidad · P2 · Could · Fase 3 · L · Alto

*Como* analista, *quiero* que los datos generados respeten las relaciones y restricciones *para* ser usables.
- Mantiene integridad referencial (FK).
- Respeta unicidad y restricciones conocidas.
- Reporta conflictos que no pudo satisfacer.

<a id="ros-68"></a>
### ROS-68 · Exportar datos generados (CSV/SQL)
Funcionalidad · P2 · Could · Fase 3 · S · Medio

*Como* analista, *quiero* exportar los datos generados *para* cargarlos en un entorno de prueba.
- Exporta a CSV y a `INSERT` SQL.
- Respeta la convención de nombres.
- Incluye metadatos de la ejecución.

---

## E08 · Grafo/ERD (ROS-8)

> ⚠️ El prototipo marca esta vista como decisión pendiente de alcance: [DP-008](../07-registro/02-decisiones-pendientes.md).

<a id="ros-69"></a>
### ROS-69 · Vista de grafo/ERD por dominio funcional
Funcionalidad · P2 · Could · Fase 3 · L · Alto

*Como* analista, *quiero* ver un grafo/ERD del esquema agrupado por dominio funcional *para* entender la estructura.
- Dibuja tablas y relaciones (incluidas las inferidas).
- Agrupa por dominio funcional.
- Distingue relaciones confirmadas de inferidas.

<a id="ros-70"></a>
### ROS-70 · Navegación e interacción en el grafo
Mejora · P3 · Could · Fase 3 · M · Medio

*Como* analista, *quiero* explorar el grafo (zoom, foco, filtro) *para* navegar esquemas grandes.
- Zoom/paneo y foco en un nodo.
- Filtra por dominio y nivel de confianza.
- Clic en un nodo abre su ficha en el catálogo.

---

## E09 · Servidor MCP e integraciones (ROS-9)

<a id="ros-71"></a>
### ROS-71 · Servidor MCP que expone el catálogo
Funcionalidad · P3 · Could · Fase 4 · XL · Alto

*Como* desarrollador, *quiero* consumir el catálogo vía un servidor MCP *para* que otras herramientas/agentes lo usen.
- Expone tablas/columnas, significados, niveles y relaciones.
- Respeta permisos y solo lectura por defecto.
- Documentado para clientes MCP.

<a id="ros-72"></a>
### ROS-72 · API pública para consultar el catálogo
Funcionalidad · P3 · Could · Fase 4 · L · Medio

*Como* integrador, *quiero* una API *para* consultar el catálogo programáticamente.
- Endpoints para tablas, columnas y relaciones.
- Autenticación por token.
- Versionada y documentada.

<a id="ros-73"></a>
### ROS-73 · Webhooks / sincronización con fuentes en vivo
Funcionalidad · P3 · Won't (no ahora) · Fase 4 · L · Bajo

*Como* integrador, *quiero* que el catálogo se actualice cuando cambie la fuente en vivo.
- Webhooks ante cambios de esquema.
- Re-perfilado programado.
- Notifica columnas que cambiaron de nivel.

---

## E10 · Sistema de diseño Nocturne (ROS-10)

<a id="ros-74"></a>
### ROS-74 · Fundaciones del sistema de diseño Nocturne
Técnico/Infra · **P0** · Must · Fase 1 · M · Alto

*Como* desarrollador, *quiero* las fundaciones de Nocturne (tokens, tipografía, color) *para* construir una UI consistente.
- Tokens de color, espaciado y tipografía definidos.
- Un solo origen de estilos (`styles.css`).
- Documentado en el readme del design system.

> Especificación visual: [05-diseno/01-sistema-de-diseno-nocturne.md](../05-diseno/01-sistema-de-diseno-nocturne.md). Falta el `styles.css` original: [EC-001](../07-registro/01-errores-conocidos.md).

<a id="ros-75"></a>
### ROS-75 · Biblioteca de componentes (chips, fichas, tablas, cola)
Técnico/Infra · **P0** · Must · Fase 1 · L · Alto

*Como* desarrollador, *quiero* componentes reutilizables *para* armar las cinco pantallas rápido y coherente.
- Componentes: chips de confianza, ficha de evidencia, tablas, cola, avisos.
- Reutilizables entre pantallas.
- Alineados a los tokens de Nocturne.

<a id="ros-76"></a>
### ROS-76 · Tema oscuro y accesibilidad
Requisito · P1 · Should · Fase 2 · M · Alto

*Como* usuario, *quiero* una interfaz oscura, legible y accesible *para* trabajar largas sesiones.
- Contraste AA como mínimo.
- Navegación completa por teclado y foco visible.
- Los estados no dependen solo del color.

> Los mínimos de accesibilidad (contraste AA, foco visible, estados no solo por color) se exigen **desde el MVP** vía [RNF-24…27](05-requisitos-no-funcionales.md); esta historia cubre la auditoría y el pulido completos.

<a id="ros-77"></a>
### ROS-77 · Diseño responsivo
Mejora · P2 · Could · Fase 3 · M · Medio

*Como* usuario, *quiero* que la app funcione en distintos tamaños de pantalla.
- Layout adaptable en escritorio y tablet.
- El contenido ancho (tablas/grafo) hace scroll propio.
- Sin scroll horizontal en el cuerpo.

---

## E11 · Cuentas y proyectos (ROS-11)

<a id="ros-78"></a>
### ROS-78 · Múltiples proyectos/bases por usuario
Funcionalidad · **P0** · Must · Fase 1 · M · Alto

*Como* analista, *quiero* manejar varios proyectos (una base por proyecto) *para* separar mi trabajo.
- Crear/abrir/archivar proyectos.
- Cada proyecto guarda sus fuentes, catálogo y confirmaciones.
- Cambiar de proyecto sin mezclar datos.

<a id="ros-79"></a>
### ROS-79 · Roles y permisos (revisor/lector/admin)
Requisito · P2 · Could · Fase 3 · M · Medio

*Como* admin, *quiero* asignar roles *para* controlar quién puede confirmar o solo leer.
- Roles: admin, revisor, lector.
- Solo revisor/admin confirman.
- Permisos aplicados por proyecto.

<a id="ros-80"></a>
### ROS-80 · Colaboración multiusuario en un proyecto
Funcionalidad · P2 · Could · Fase 3 · L · Medio

*Como* equipo, *queremos* revisar el mismo proyecto sin pisarnos.
- Varios usuarios en un proyecto.
- Se evita/gestiona la edición concurrente del mismo ítem.
- Cada confirmación queda atribuida a su autor.

---

## E12 · Persistencia y exportación (ROS-12)

<a id="ros-81"></a>
### ROS-81 · Persistir catálogo, evidencia y confirmaciones
Técnico/Infra · **P0** · Must · Fase 1 · M · Alto

*Como* usuario, *quiero* que mi trabajo se guarde *para* no perder el descifrado entre sesiones.
- Persiste fuentes, catálogo, niveles y confirmaciones.
- Recupera el estado al reabrir el proyecto.
- Guardado confiable (sin pérdidas).

<a id="ros-82"></a>
### ROS-82 · Historial / versionado de cambios
Requisito · P1 · Should · Fase 2 · M · Alto

*Como* revisor, *quiero* ver el historial de cambios de una columna *para* entender su evolución.
- Registra cambios de nivel y de significado.
- Permite comparar versiones.
- Posibilidad de revertir a un estado previo.

<a id="ros-83"></a>
### ROS-83 · Registro de quién confirmó qué y cuándo (audit trail)
Requisito · P1 · Should · Fase 2 · S · Alto

*Como* auditor, *quiero* saber quién confirmó cada afirmación y cuándo.
- Cada confirmación guarda autor y timestamp.
- El registro es inmutable/consultable.
- Exportable para auditoría.

> El **registro** de autor/fecha se guarda desde el MVP ([RN-14](04-reglas-de-negocio.md), tarea ROS-158); esta historia añade consulta y exportación.

---

## E13 · No funcionales y cumplimiento (ROS-13)

<a id="ros-84"></a>
### ROS-84 · Seguridad de datos y control de acceso
Requisito · **P0** · Must · Fase 1 · M · Alto

*Como* responsable, *quiero* que los datos de la base analizada estén protegidos.
- Datos cifrados en tránsito y en reposo.
- Acceso restringido por usuario/proyecto.
- Sin exponer datos sensibles en URLs/logs.

<a id="ros-85"></a>
### ROS-85 · Privacidad / enmascarado de datos sensibles en perfiles
Requisito · P1 · Should · Fase 2 · M · Alto

*Como* responsable de datos, *quiero* que el perfilado no exponga valores sensibles.
- Enmascara/anonimiza PII en la muestra y el perfil.
- Configurable qué columnas son sensibles.
- El motor infiere sin filtrar datos crudos.

<a id="ros-86"></a>
### ROS-86 · Auditabilidad y salida aprobable por un banco (modo reglas)
Requisito · P1 · Should · Fase 2 · M · Alto

*Como* responsable de cumplimiento, *quiero* una salida trazable y defendible ante una auditoría.
- Toda afirmación reconstruible desde su evidencia.
- Modo sin LLM produce una versión "aprobable por un banco".
- Reporte de trazabilidad exportable.

<a id="ros-87"></a>
### ROS-87 · Rendimiento con esquemas grandes (miles de columnas)
Requisito · P2 · Could · Fase 3 · L · Medio

*Como* analista, *quiero* que la app siga siendo fluida con esquemas de miles de columnas.
- Listas/tablas virtualizadas.
- Recálculo incremental y en segundo plano.
- Tiempos de respuesta aceptables en cola y catálogo.

<a id="ros-88"></a>
### ROS-88 · Manejo de errores y estados vacíos claros
Requisito · P1 · Should · Fase 2 · S · Medio

*Como* usuario, *quiero* mensajes claros ante errores y pantallas vacías *para* no quedar bloqueado.
- Estados vacíos con siguiente acción sugerida.
- Errores de importación/parseo explicados.
- Sin fallos silenciosos.

> Las pantallas del MVP ya incluyen estados vacío/cargando/error en sus tareas (ROS-147, ROS-153, ROS-163) y en [RNF-28](05-requisitos-no-funcionales.md); esta historia cubre la revisión sistemática de todos los mensajes.

---

## E14 · Inicio de sesión (OAuth) (ROS-14)

<a id="ros-89"></a>
### ROS-89 · Autenticación de usuarios
Funcionalidad · **P0** · Must · Fase 1 · M · Alto

*Como* usuario, *quiero* iniciar sesión *para* acceder a mis proyectos de forma segura.
- Registro e inicio de sesión.
- Sesión segura y cierre de sesión.
- Datos de cada usuario aislados.

> Historia nacida en E11 y movida a E14 (ver [01-epicas.md](01-epicas.md)). En Notion sigue figurando bajo E11: [EC-017](../07-registro/01-errores-conocidos.md). En el MVP el único método de acceso es OAuth ([DP-014](../07-registro/02-decisiones-pendientes.md)).

<a id="ros-90"></a>
### ROS-90 · Inicio de sesión con OAuth (Google, Microsoft, Apple)
Funcionalidad · **P0** · Must · Fase 1 · M · Alto

*Como* usuario, *quiero* iniciar sesión con mi cuenta de Google/Microsoft/Apple *para* entrar sin crear otra contraseña.
- Botones de inicio con al menos Google y Microsoft.
- Crea la cuenta la primera vez y reconoce al usuario en las siguientes.
- Trae nombre, correo y avatar del proveedor.

> Apple queda fuera del MVP (requiere cuenta de desarrollador de pago y dominio verificado): [DP-014](../07-registro/02-decisiones-pendientes.md).

<a id="ros-91"></a>
### ROS-91 · Registro y onboarding de cuenta nueva
Funcionalidad · **P0** · Must · Fase 1 · M · Alto

*Como* usuario nuevo, *quiero* un alta clara *para* empezar a usar Rosetta rápido.
- Primer inicio crea el usuario y su espacio.
- Pasos mínimos de onboarding (crear/abrir proyecto).
- Estado de "cuenta creada" persistente.

<a id="ros-92"></a>
### ROS-92 · Gestión de sesión y tokens (refresh, expiración, cierre)
Técnico/Infra · **P0** · Must · Fase 1 · M · Alto

*Como* usuario, *quiero* que mi sesión se mantenga segura y se cierre cuando corresponde.
- Tokens de acceso y refresh con expiración.
- Renovación silenciosa del token.
- Cierre de sesión invalida el token.

<a id="ros-93"></a>
### ROS-93 · Seguridad del flujo OAuth (PKCE, state, redirect URIs)
Requisito · **P0** · Must · Fase 1 · M · Alto

*Como* responsable de seguridad, *quiero* que el flujo OAuth resista ataques comunes.
- Usa PKCE y parámetro `state` (anti-CSRF).
- Lista blanca de redirect URIs.
- Secretos fuera del cliente; validación del token en el backend.

<a id="ros-94"></a>
### ROS-94 · Restringir inicio de sesión a dominios permitidos
Funcionalidad · P1 · Should · **Fase 3** · S · Alto

*Como* admin de empresa, *quiero* que solo los correos de mis dominios permitidos puedan entrar.
- Valida el dominio del correo contra la allow-list.
- Permite también los correos personalizados autorizados.
- Rechazo claro si el dominio no está habilitado.

> Movida de Fase 2 a Fase 3 porque depende de ROS-106 y ROS-108 ([DP-016](../07-registro/02-decisiones-pendientes.md#dp-016), CD-003).

<a id="ros-95"></a>
### ROS-95 · Verificación de correo electrónico
Requisito · P1 · Should · Fase 2 · S · Medio

*Como* plataforma, *quiero* verificar el correo de cuentas no-OAuth *para* evitar cuentas falsas.
- Envía enlace/código de verificación.
- Marca el correo como verificado.
- Bloquea acciones sensibles hasta verificar.

<a id="ros-96"></a>
### ROS-96 · Recuperación / restablecimiento de contraseña
Funcionalidad · P1 · Should · Fase 2 · S · Medio

*Como* usuario con correo/contraseña, *quiero* recuperar el acceso si la olvido.
- Flujo de "olvidé mi contraseña" con enlace temporal.
- Enlace de un solo uso y con expiración.
- No revela si el correo existe o no.

> ROS-95 y ROS-96 solo tienen sentido si se habilita acceso con correo/contraseña ([DP-014](../07-registro/02-decisiones-pendientes.md)).

<a id="ros-97"></a>
### ROS-97 · Autenticación multifactor (MFA / 2FA)
Requisito · P1 · Should · Fase 2 · M · Alto

*Como* usuario, *quiero* un segundo factor *para* proteger mi cuenta.
- Soporta TOTP (app autenticadora).
- Códigos de respaldo.
- Admin puede exigir MFA a su organización.

<a id="ros-98"></a>
### ROS-98 · Vinculación de múltiples proveedores a una cuenta
Funcionalidad · P2 · Could · Fase 3 · M · Medio

*Como* usuario, *quiero* vincular Google y Microsoft a la misma cuenta *para* entrar por cualquiera.
- Vincula/desvincula proveedores desde el perfil.
- Evita duplicar cuentas con el mismo correo.
- Al menos un método de acceso siempre activo.

<a id="ros-99"></a>
### ROS-99 · Perfil de usuario y preferencias
Funcionalidad · P1 · Should · Fase 2 · S · Medio

*Como* usuario, *quiero* ver y editar mi perfil y preferencias.
- Nombre, avatar, idioma y proveedores vinculados.
- Cambios persistentes.
- Enlace a seguridad (MFA, sesiones).

<a id="ros-100"></a>
### ROS-100 · Manejo de errores de OAuth (denegado, cuenta duplicada, proveedor caído)
Requisito · P1 · Should · Fase 2 · S · Medio

*Como* usuario, *quiero* mensajes claros cuando el inicio con OAuth falla.
- Maneja consentimiento denegado y proveedor no disponible.
- Detecta correo ya registrado con otro método y ofrece vincular.
- Sin pantallas en blanco ni loops de redirección.

> Mínimo exigido desde el MVP: si el usuario cancela el consentimiento o el proveedor falla, la app muestra un error claro y vuelve al login (sin pantalla en blanco ni bucle). Se exige como FR en la spec `002-autenticacion-oauth`.

<a id="ros-101"></a>
### ROS-101 · Consentimiento y scopes mínimos (privacidad)
Requisito · P1 · Should · Fase 2 · S · Medio

*Como* usuario, *quiero* que la app pida solo los permisos necesarios.
- Solicita scopes mínimos (perfil y correo).
- Explica para qué se usan los datos.
- No pide acceso a datos que no usa.

<a id="ros-102"></a>
### ROS-102 · SSO empresarial (SAML / OIDC)
Funcionalidad · P2 · Could · Fase 3 · L · Alto

*Como* empresa cliente, *quiero* conectar mi proveedor de identidad *para* que mi equipo entre con SSO.
- Soporta SAML u OIDC empresarial.
- Aprovisionamiento de usuarios por dominio.
- Configurable por organización.

> Habilitador de ventas B2B; se relaciona con E15.

<a id="ros-103"></a>
### ROS-103 · Cierre de sesión en todos los dispositivos
Funcionalidad · P2 · Could · Fase 3 · S · Bajo

*Como* usuario, *quiero* cerrar sesión en todos mis dispositivos si sospecho un acceso indebido.
- Lista de sesiones activas.
- Revocar una o todas las sesiones.
- Fuerza reingreso tras la revocación.

---

## E15 · Administración y monetización (ROS-15)

<a id="ros-104"></a>
### ROS-104 · Panel de administración (backoffice)
Funcionalidad · P1 · Should · Fase 3 · M · Alto

*Como* administrador, *quiero* un panel central *para* gestionar dominios, usuarios, planes y pagos.
- Acceso restringido a roles administrativos.
- Secciones: organización, dominios, correos, usuarios, facturación.
- Punto de entrada único a toda la gestión.

<a id="ros-105"></a>
### ROS-105 · Modelo multi-tenant de organizaciones / empresas
Funcionalidad · P1 · Should · Fase 3 · L · Alto

*Como* plataforma, *quiero* separar los datos por empresa *para* poder vender por organización.
- Cada organización aísla usuarios, proyectos y facturación.
- Un usuario puede pertenecer a una o varias organizaciones.
- Base para dominios, planes y límites por empresa.

> Decisión de diseño que afecta al MVP: el modelo de datos del MVP deja preparado el campo `organization` (nullable) para no migrar de forma destructiva en Fase 3 — [ADR-0004](../03-arquitectura/adr/ADR-0004-multitenancy-preparado.md).

<a id="ros-106"></a>
### ROS-106 · Gestión de dominios permitidos (allow-list)
Funcionalidad · P1 · Should · Fase 3 · M · Alto

*Como* admin de empresa, *quiero* registrar los dominios permitidos *para* controlar quién puede acceder.
- Agregar/editar/quitar dominios permitidos.
- El inicio de sesión valida contra esta lista.
- Cada dominio queda asociado a la organización.

<a id="ros-107"></a>
### ROS-107 · Verificación de propiedad del dominio (DNS TXT)
Requisito · P2 · Could · Fase 3 · M · Medio

*Como* plataforma, *quiero* verificar que la empresa es dueña del dominio antes de habilitarlo.
- Genera un registro TXT para agregar en el DNS.
- Comprueba la verificación y marca el dominio como verificado.
- Solo dominios verificados habilitan acceso.

<a id="ros-108"></a>
### ROS-108 · Correos personalizados por dominio (autorizar correos externos)
Funcionalidad · P2 · Could · Fase 3 · M · Medio

*Como* admin de empresa, *quiero* autorizar correos que no pertenecen a mi dominio *para* sumar personas con correos distintos.
- Agregar correos individuales permitidos, además del dominio.
- Estos correos pueden iniciar sesión aunque no coincidan con el dominio.
- Lista gestionable (agregar/quitar) por organización.

<a id="ros-109"></a>
### ROS-109 · Invitar y administrar usuarios de la empresa
Funcionalidad · P2 · Could · Fase 3 · M · Medio

*Como* admin de empresa, *quiero* invitar y administrar a los usuarios de mi organización.
- Invitación por correo con rol asignado.
- Activar/desactivar y quitar usuarios.
- Ver estado de cada invitación.

<a id="ros-110"></a>
### ROS-110 · Roles administrativos (admin de empresa vs super-admin de plataforma)
Requisito · P2 · Could · Fase 3 · M · Medio

*Como* plataforma, *quiero* separar el admin de una empresa del super-admin global.
- Admin de empresa gestiona solo su organización.
- Super-admin gestiona todas las organizaciones y planes.
- Permisos claramente delimitados.

<a id="ros-111"></a>
### ROS-111 · Planes y precios (tiers de suscripción)
Funcionalidad · P1 · Should · Fase 3 · M · Alto

*Como* negocio, *quiero* definir planes y precios *para* monetizar la plataforma.
- Varios planes (ej. Free/Pro/Empresa) con sus límites.
- Página de precios visible.
- Cada organización tiene un plan asignado.

<a id="ros-112"></a>
### ROS-112 · Integración con pasarela de pago
Técnico/Infra · P2 · Could · Fase 3 · L · Alto

*Como* negocio, *quiero* cobrar de forma segura mediante una pasarela de pago.
- Integra un proveedor (ej. Stripe) con webhooks.
- No se almacenan datos de tarjeta en la app (PCI a cargo del proveedor).
- Cobros y estados sincronizados con la suscripción.

<a id="ros-113"></a>
### ROS-113 · Registros de pagos e historial de facturación
Funcionalidad · P1 · Should · Fase 3 · M · Alto

*Como* admin de empresa, *quiero* ver el historial de pagos de mi organización.
- Lista de pagos con fecha, monto, estado y método.
- Filtros por periodo y estado.
- Detalle de cada cobro trazable.

<a id="ros-114"></a>
### ROS-114 · Facturas y comprobantes descargables
Funcionalidad · P2 · Could · Fase 3 · S · Medio

*Como* admin de empresa, *quiero* descargar facturas/comprobantes *para* mi contabilidad.
- Genera factura en PDF por cada cobro.
- Incluye datos fiscales de la organización.
- Descargable desde el historial.

<a id="ros-115"></a>
### ROS-115 · Gestión de suscripción (alta / baja / upgrade / downgrade)
Funcionalidad · P2 · Could · Fase 3 · M · Alto

*Como* admin de empresa, *quiero* cambiar de plan cuando lo necesite.
- Alta, baja, upgrade y downgrade de plan.
- Prorrateo/ajuste del cobro según el cambio.
- Efecto claro sobre límites y funciones.

<a id="ros-116"></a>
### ROS-116 · Límites y cuotas por plan (feature gating)
Requisito · P2 · Could · Fase 3 · M · Medio

*Como* negocio, *quiero* limitar funciones y uso según el plan contratado.
- Cuotas por plan (proyectos, columnas, usuarios).
- Bloqueo/aviso al superar el límite.
- Funciones premium habilitadas por plan.

<a id="ros-117"></a>
### ROS-117 · Notificaciones de cobro, vencimiento y fallos de pago
Funcionalidad · P2 · Could · Fase 3 · S · Medio

*Como* admin de empresa, *quiero* avisos sobre cobros y problemas de pago *para* no perder el servicio.
- Notifica próximo cobro y renovación.
- Avisa fallos de pago con acción para corregir.
- Período de gracia antes de suspender.

<a id="ros-118"></a>
### ROS-118 · Dashboard de ingresos y uso (métricas de monetización)
Funcionalidad · P3 · Could · Fase 4 · M · Medio

*Como* super-admin, *quiero* métricas de ingresos y uso *para* tomar decisiones de negocio.
- MRR, altas/bajas y uso por organización.
- Filtros por periodo y plan.
- Exportable.

<a id="ros-119"></a>
### ROS-119 · Cumplimiento fiscal y datos de facturación (impuestos / IVA)
Requisito · P3 · Could · Fase 4 · M · Bajo

*Como* negocio, *quiero* manejar impuestos y datos fiscales correctamente en la facturación.
- Captura datos fiscales de la organización.
- Calcula y aplica impuestos (ej. IVA) según la región.
- Refleja los impuestos en factura y registros.

---

## Resumen por fase

| Fase | Historias | Claves |
|---|---|---|
| 1 · MVP | 38 | 16, 17, 21, 22, 23, 25, 26, 27, 28, 29, 33, 36, 37, 38, 39, 40, 42, 43, 44, 45, 46, 47, 48, 50, 51, 52, 54, 55, 74, 75, 78, 81, 84, 89, 90, 91, 92, 93 |
| 2 | 33 | 18, 19, 30, 31, 32, 34, 35, 41, 49, 53, 56, 57, 58, 59, 60, 63, 64, 65, 66, 76, 82, 83, 85, 86, 88, 95, 96, 97, 99, 100, 101, 191, 192 |
| 3 | 30 | 20, 24, 61, 62, 67, 68, 69, 70, 77, 79, 80, 87, 94, 98, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117 |
| 4 | 5 | 71, 72, 73, 118, 119 |

> **Nota sobre Jira:** el campo *Prioridad* nativo de Jira quedó en "Medium" para todas las historias; la prioridad real vive en las etiquetas `P0`–`P3`. Ver [EC-005](../07-registro/01-errores-conocidos.md).
