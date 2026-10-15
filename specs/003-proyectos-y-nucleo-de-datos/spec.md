**Historias Jira cubiertas:** ROS-78 · ROS-81 · ROS-84 (subtareas ROS-172…ROS-179) · Épicas E11 (ROS-11), E12 (ROS-12) y E13 (ROS-13)

# Feature Specification: Proyectos y núcleo de datos

**Feature Branch**: `003-proyectos-y-nucleo-de-datos`

**Created**: 2026-10-14

**Status**: Draft

**Input**: User description: "003-proyectos-y-nucleo-de-datos — historias ROS-78, ROS-81, ROS-84 (subtareas ROS-172…ROS-179). Debe aportar el formulario de creación de proyecto (nombre y dialecto: SQL Server, Oracle o PostgreSQL, DP-019) reutilizable en el onboarding de la 002 y en /projects; estado vacío \"aún no tienes proyectos\" (EC-022)."

**Fuentes de verdad**: historias en [02-historias-de-usuario.md](../../docs/02-requisitos/02-historias-de-usuario.md) (`#ros-78`, `#ros-81`, `#ros-84`), tareas ROS-172…ROS-179 en [03-tareas-mvp.md](../../docs/02-requisitos/03-tareas-mvp.md), reglas RN-24 y RN-25 de [04-reglas-de-negocio.md](../../docs/02-requisitos/04-reglas-de-negocio.md), requisitos RNF-01…04, RNF-16 y RNF-20 de [05-requisitos-no-funcionales.md](../../docs/02-requisitos/05-requisitos-no-funcionales.md), decisiones [DP-017](../../docs/07-registro/02-decisiones-pendientes.md#dp-017), [DP-019](../../docs/07-registro/02-decisiones-pendientes.md#dp-019), [DP-020](../../docs/07-registro/02-decisiones-pendientes.md#dp-020) y [DP-009](../../docs/07-registro/02-decisiones-pendientes.md#dp-009), no-objetivos NO-02, NO-11, NO-13 y NO-16 de [03-alcance-y-no-objetivos.md](../../docs/01-producto/03-alcance-y-no-objetivos.md), pantalla "Proyectos" de [03-pantallas §7](../../docs/05-diseno/03-pantallas.md) y modelo de [02-diccionario-de-datos.md](../../docs/04-datos/02-diccionario-de-datos.md).

## Clarifications

### Session 2026-10-14

- Q: ¿Puede una persona tener dos proyectos activos con el mismo nombre (sin distinguir mayúsculas)? → A: No. El nombre es único entre los proyectos **activos** de la persona, sin distinguir mayúsculas; los archivados no cuentan.
- Q: ¿Qué se puede hacer con un proyecto archivado? → A: Abrirlo en solo lectura desde el filtro de archivados y desarchivarlo; al desarchivar vuelve a la lista y al selector, y si su nombre choca con el de un proyecto activo se pide renombrarlo antes.
- Q: Al crear un proyecto desde la pantalla de proyectos, ¿a dónde va la persona? → A: Entra directamente en el proyecto nuevo (su Panorama). Desde el onboarding, en cambio, sigue yendo a la lista de proyectos (feature 002, FR-018).
- Q: ¿Qué fecha muestra la lista de proyectos y por cuál se ordena? → A: La de la última actividad del proyecto (cualquier cambio en el proyecto o en su contenido: crear, renombrar, archivar o desarchivar, cargar fuentes, acciones de revisión); la lista se ordena por ella, la más reciente primero. Abrir un proyecto sin cambiar nada no cuenta como actividad.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Crear un proyecto (Priority: P1)

Una persona autenticada crea un proyecto para una base de datos que quiere descifrar. Indica el nombre del proyecto y el dialecto SQL de esa base (SQL Server, Oracle o PostgreSQL). Es el mismo formulario en el onboarding (primer proyecto) y en la pantalla de proyectos.

**Why this priority**: sin proyecto no hay dónde cargar fuentes ni guardar trabajo; además es el paso único del onboarding de la feature 002, que no puede cerrarse sin él (T055, T087 de la 002).

**Independent Test**: con una cuenta nueva, completar el formulario con un nombre y un dialecto y comprobar que el proyecto aparece en su lista con ese nombre y ese dialecto; repetir desde el onboarding y comprobar que el onboarding se completa.

**Acceptance Scenarios**:

1. **Given** una persona autenticada en la pantalla de proyectos, **When** crea un proyecto con nombre "CORE_PRD" y dialecto "SQL Server", **Then** entra en el Panorama del proyecto nuevo, cuya insignia muestra `CORE_PRD · tsql`, y al volver a la lista el proyecto aparece con ese nombre, sin fuentes, con 0 tablas y 0 columnas (FR-001, FR-005, FR-008).
2. **Given** una persona con el onboarding pendiente, **When** crea su primer proyecto desde el onboarding, **Then** se usa el mismo formulario, con las mismas reglas y textos, y el proyecto queda creado igual que desde la pantalla de proyectos (FR-002).
3. **Given** el formulario de creación, **When** la persona deja el nombre vacío (o solo con espacios) o no elige dialecto, **Then** no se crea ningún proyecto y el formulario indica qué falta, sin perder lo ya escrito (FR-003).
4. **Given** el formulario de creación, **When** la persona escribe un nombre de más de 120 caracteres, **Then** no se crea el proyecto y el formulario indica el límite (FR-003).
5. **Given** el selector de dialecto, **When** la persona lo abre, **Then** ve exactamente tres opciones, "SQL Server", "Oracle" y "PostgreSQL", y ninguna otra (FR-001).
6. **Given** un proyecto ya creado, **When** la persona busca cambiar su dialecto, **Then** no hay forma de hacerlo (FR-010).

---

### User Story 2 - Ver mis proyectos y moverme entre ellos (Priority: P1)

La persona ve la lista de sus proyectos con lo esencial de cada uno, abre el que quiere trabajar y cambia de proyecto desde la barra superior sin que se mezclen los datos de uno con los del otro.

**Why this priority**: es la puerta de entrada a todo el trabajo y el destino de la 002 al terminar el onboarding (`/projects`). "Cambiar de proyecto nunca mezcla datos de otro" es el criterio de listo de ROS-174.

**Independent Test**: con dos proyectos sembrados con datos distintos, abrir uno, cambiar al otro desde el selector y comprobar que en ninguna pantalla queda dato alguno del primero.

**Acceptance Scenarios**:

1. **Given** una persona sin proyectos activos, **When** abre la pantalla de proyectos, **Then** ve el estado vacío "aún no tienes proyectos" y la acción de crear uno (FR-006).
2. **Given** una persona con tres proyectos activos, **When** abre la pantalla de proyectos, **Then** ve los tres, cada uno con nombre, dialecto, fecha, número de tablas y de columnas y porcentaje de columnas confirmadas (FR-005).
3. **Given** la lista de proyectos, **When** la persona abre un proyecto, **Then** llega al Panorama de ese proyecto, con las pestañas Panorama, Revisión, Catálogo y Fuentes, y la insignia "nombre · dialecto" de ese proyecto (FR-007, FR-008).
4. **Given** la persona trabajando en el proyecto A, **When** elige el proyecto B en el selector de la barra superior, **Then** llega al proyecto B y ninguna pantalla muestra datos del proyecto A, ni siquiera durante la carga (FR-009).
5. **Given** dos pestañas del navegador con proyectos distintos abiertos, **When** la persona trabaja en ambas, **Then** cada una muestra solo los datos de su proyecto (FR-009).

---

### User Story 3 - Aislamiento de los datos de cada persona (Priority: P1)

Los esquemas y las muestras de un cliente son sensibles. Una persona solo puede ver y modificar sus propios proyectos y todo lo que hay dentro; para cualquier otra persona, esos proyectos no existen.

**Why this priority**: es un requisito no negociable del producto (Constitución V, RN-24) y el criterio de listo de ROS-178: "la suite de pruebas de acceso cruzado pasa al 100 %".

**Independent Test**: con dos personas, A y B, cada una con un proyecto con datos, B intenta leer, modificar o archivar cada recurso de A por todas las vías que ofrece el producto, y en todos los casos obtiene la misma respuesta que para un recurso inexistente.

**Acceptance Scenarios**:

1. **Given** el proyecto P de la persona A, **When** la persona B pide P por su identificador, **Then** recibe la misma respuesta que para un proyecto que no existe y no se revela que P existe (FR-014, FR-015).
2. **Given** el proyecto P de A, **When** B intenta renombrarlo, archivarlo o leer cualquier dato dentro (fuentes, tablas, columnas, evidencia), **Then** la operación se rechaza como "no encontrado" y P queda intacto (FR-014, FR-015).
3. **Given** cualquier intento denegado de B, **When** se revisan los registros, **Then** hay un evento con la persona, la ruta y el identificador del recurso, sin correos, nombres ni contenido del proyecto (FR-017).
4. **Given** la lista de B, **When** B la abre, **Then** no aparece ningún proyecto de A, ni en la lista ni en el selector (FR-014).
5. **Given** cualquier dirección del producto que identifique un proyecto o un recurso, **When** se observa, **Then** el identificador no es predecible (no es secuencial ni derivable de otro) y no contiene nombres de tablas, columnas, valores de muestras ni datos personales (FR-016, FR-019).

---

### User Story 4 - El trabajo no se pierde (Priority: P2)

Todo lo que se hace en un proyecto (fuentes, catálogo, niveles, evidencia, confirmaciones) queda guardado. Al cerrar y volver a abrir el proyecto, en otra sesión o en otro navegador, el estado es exactamente el mismo.

**Why this priority**: es la promesa de ROS-81 ("no perder el descifrado entre sesiones") y la base de datos sobre la que trabajan las features 004 a 008. Va después de P1 porque en esta feature solo puede comprobarse con el caso de ejemplo sembrado: la carga de fuentes llega con la feature 004.

**Independent Test**: sembrar el caso de ejemplo (MOV0010, CTANRO, IMPTE…) en un proyecto, abrirlo, cerrar la sesión, volver a entrar desde otro navegador y comparar el estado completo: debe ser idéntico.

**Acceptance Scenarios**:

1. **Given** un proyecto con el caso de ejemplo sembrado, **When** la persona lo abre, cierra la sesión y lo vuelve a abrir, **Then** el catálogo, los niveles de cada columna, la cola de revisión y las fuentes son exactamente iguales (FR-021).
2. **Given** una operación que cambia varias cosas a la vez (por ejemplo, una confirmación que propaga a otras columnas), **When** falla a mitad, **Then** no queda ningún cambio parcial: o se guarda todo o nada (FR-024).
3. **Given** una acción humana registrada (confirmar, editar o rechazar), **When** se intenta modificarla o borrarla, **Then** no es posible: el registro conserva autor, fecha, estado anterior y estado posterior (FR-023).
4. **Given** un entorno nuevo, **When** se prepara el almacenamiento desde cero y se siembra el caso de ejemplo, **Then** el resultado es el mismo en cada ejecución (FR-027, FR-028).

---

### User Story 5 - Renombrar y archivar proyectos (Priority: P3)

La persona cambia el nombre o la descripción de un proyecto y archiva los que ya no usa para que no le estorben, sin perder sus datos.

**Why this priority**: ordena el trabajo cuando hay varios proyectos, pero no bloquea el uso del producto.

**Independent Test**: renombrar un proyecto y comprobar el nombre nuevo en la lista, el selector y la insignia; archivarlo y comprobar que sale de la lista por defecto, que aparece con el filtro de archivados y que sus datos siguen intactos.

**Acceptance Scenarios**:

1. **Given** un proyecto activo, **When** la persona lo renombra con un nombre válido, **Then** el nombre nuevo aparece en la lista, en el selector y en la insignia (FR-011).
2. **Given** un proyecto activo, **When** la persona lo archiva, **Then** deja de aparecer en la lista por defecto y en el selector, y aparece al activar el filtro de archivados (FR-010, FR-012).
3. **Given** un proyecto archivado, **When** se consulta su contenido guardado, **Then** fuentes, catálogo, evidencia y acciones siguen completos (FR-012).
4. **Given** un proyecto archivado, **When** la persona lo abre o quiere volver a usarlo, **Then** puede abrirlo en solo lectura (ninguna operación lo modifica) y desarchivarlo; al desarchivarlo vuelve a la lista por defecto y al selector (FR-013).
5. **Given** un proyecto archivado cuyo nombre coincide con el de un proyecto activo, **When** la persona lo desarchiva, **Then** se le pide un nombre nuevo válido antes de desarchivar y nada cambia hasta que lo da (FR-004, FR-013).

---

### Edge Cases

- **Nombre con espacios al principio o al final:** se recortan antes de validar y guardar; un nombre que solo tiene espacios cuenta como vacío (FR-003).
- **Dos proyectos con el mismo nombre:** no se permite entre proyectos activos de la misma persona, sin distinguir mayúsculas ("core_prd" choca con "CORE_PRD"); sí se puede reutilizar el nombre de un proyecto archivado, y dos personas distintas pueden usar el mismo nombre (FR-004).
- **Doble envío del formulario** (doble clic o reintento tras un fallo de red): no se crean dos proyectos por un mismo envío (FR-003).
- **Sesión que vence mientras se crea o renombra:** aplica FR-026 de la feature 002: la operación se rechaza completa, se pide un nuevo acceso y no se pierde nada ya guardado.
- **Archivar el proyecto que está abierto:** la persona sale de él a la pantalla de proyectos y el proyecto deja de aparecer en el selector (FR-010).
- **Todos los proyectos archivados:** la lista por defecto muestra el estado vacío "aún no tienes proyectos"; el filtro de archivados sigue mostrándolos (FR-006, FR-012). El onboarding no vuelve a aparecer: ya se completó (feature 002, FR-018).
- **Proyecto recién creado:** sin fuentes, con 0 tablas y 0 columnas, y el porcentaje confirmado se muestra como "sin dato" (no hay columnas sobre las que calcularlo; texto en DP-028); su Panorama muestra el estado "Todavía no hay evidencia. Sube el DDL de tu base para empezar." de [04-contenido §5](../../docs/05-diseno/04-contenido-y-redaccion.md) cuando exista esa pantalla.
- **Dirección de un proyecto ajeno o inexistente abierta a mano:** la misma pantalla de "no encontrado" en los dos casos (FR-015).
- **Cambio de proyecto mientras el anterior aún carga:** los datos que llegan tarde del proyecto anterior se descartan y nunca se muestran en el nuevo (FR-009).
- **Persona desactivada:** no puede usar sus proyectos (feature 002, FR-011); los proyectos y sus acciones auditadas se conservan, porque una persona con proyectos no se borra.

## Requirements *(mandatory)*

### Functional Requirements

**Crear y listar proyectos**

- **FR-001** [ROS-78]: Una persona autenticada DEBE poder crear un proyecto indicando un **nombre** (obligatorio, de 1 a 120 caracteres tras recortar espacios) y un **dialecto SQL** (obligatorio) elegido entre exactamente tres opciones: "SQL Server", "Oracle" y "PostgreSQL" ([DP-019](../../docs/07-registro/02-decisiones-pendientes.md#dp-019)). La persona que lo crea es su única propietaria. El proyecto se crea activo, sin fuentes y con la descripción vacía. Creado desde la pantalla de proyectos, la persona entra directamente en el proyecto nuevo (su Panorama); creado desde el onboarding, va a la lista de proyectos (feature 002, FR-018).
- **FR-002** [ROS-78]: La creación de proyectos DEBE ser **un solo formulario reutilizable**, con las mismas reglas, textos y comportamiento en el onboarding (paso único de la feature 002, FR-019) y en la pantalla de proyectos. El onboarding solo añade lo que le es propio (bienvenida y completar el onboarding tras crear).
- **FR-003** [ROS-78]: Si el nombre está vacío o supera 120 caracteres, o no se eligió dialecto, el sistema NO DEBE crear el proyecto y DEBE indicar junto al campo qué falta o qué está mal, conservando lo escrito. Un mismo envío NO DEBE crear más de un proyecto aunque se repita.
- **FR-004** [ROS-78]: El nombre de un proyecto DEBE ser único entre los proyectos **activos** de la misma persona, sin distinguir mayúsculas de minúsculas, al crear y al renombrar. Los proyectos archivados no cuentan para esta regla. Un nombre repetido se rechaza como en FR-003, sin crear ni cambiar nada.
- **FR-005** [ROS-78]: La pantalla de proyectos DEBE listar los proyectos **activos** de la persona y, de cada uno: nombre, dialecto, fecha, número de tablas, número de columnas y porcentaje de columnas confirmadas (confirmadas directas más propagadas sobre el total de columnas, [DP-020](../../docs/07-registro/02-decisiones-pendientes.md#dp-020)). La fecha es la de la **última actividad** del proyecto: el último cambio en el proyecto o en su contenido (crear, renombrar, archivar o desarchivar, cargar fuentes, acciones de revisión); abrirlo sin cambiar nada no cuenta. La lista se ordena por esa fecha, la más reciente primero.
- **FR-006** [ROS-78]: Sin proyectos activos, la pantalla de proyectos DEBE mostrar el estado vacío **"aún no tienes proyectos"** (tuteo, [DP-009](../../docs/07-registro/02-decisiones-pendientes.md#dp-009), EC-022) junto con la acción de crear un proyecto.

**Abrir y cambiar de proyecto**

- **FR-007** [ROS-78]: Abrir un proyecto DEBE llevar a su Panorama. La navegación del proyecto DEBE tener las pestañas Panorama, Revisión, Catálogo y Fuentes, en ese orden; Hallazgos y Generador no se muestran ([DP-017](../../docs/07-registro/02-decisiones-pendientes.md#dp-017)). El contenido de cada pestaña pertenece a otras features.
- **FR-008** [ROS-78]: Dentro de un proyecto, la barra superior DEBE mostrar la insignia "nombre del proyecto · dialecto" con el valor interno del dialecto (`tsql`, `oracle` o `postgres`, [DP-019](../../docs/07-registro/02-decisiones-pendientes.md#dp-019)).
- **FR-009** [ROS-78]: La barra superior DEBE ofrecer un **selector de proyecto** con los proyectos activos de la persona. Al cambiar de proyecto, NINGUNA pantalla DEBE mostrar datos del proyecto anterior, tampoco mientras se carga el nuevo; los datos del proyecto anterior que lleguen tarde se descartan. Dos pestañas con proyectos distintos NO DEBEN mezclar datos entre sí.

**Modificar y archivar**

- **FR-010** [ROS-78]: El dialecto NO DEBE poder cambiarse después de crear el proyecto: el DDL que se suba se interpreta con él ([DP-019](../../docs/07-registro/02-decisiones-pendientes.md#dp-019); [05-api §2](../../docs/03-arquitectura/05-api.md) solo permite renombrar, cambiar la descripción o archivar). Archivar el proyecto abierto DEBE llevar a la persona a la pantalla de proyectos.
- **FR-011** [ROS-78]: La persona DEBE poder cambiar el nombre (con las reglas de FR-001 y FR-003) y la descripción de sus proyectos. El nombre nuevo DEBE verse en la lista, en el selector y en la insignia.
- **FR-012** [ROS-78]: La persona DEBE poder **archivar** un proyecto. Un proyecto archivado no aparece en la lista por defecto ni en el selector, aparece al activar el filtro de archivados de la pantalla de proyectos, y **conserva todos sus datos** (fuentes, catálogo, evidencia, acciones). En el MVP no se borran proyectos.
- **FR-013** [ROS-78]: Un proyecto archivado DEBE poder abrirse desde el filtro de archivados en **solo lectura**: se ven sus datos, pero ninguna operación lo modifica (ni renombrar, ni cargar fuentes, ni acciones de revisión) salvo **desarchivarlo**. Al desarchivar, el proyecto vuelve a la lista por defecto y al selector; si su nombre choca con el de un proyecto activo (FR-004), se pide un nombre nuevo antes y no cambia nada hasta que se da uno válido.

**Aislamiento y protección**

- **FR-014** [ROS-84]: Cada persona DEBE ver y modificar **solo sus propios proyectos** y todo lo que contienen (fuentes, tablas, columnas, interpretaciones, evidencia, conflictos, acciones). Esto aplica a toda operación del producto, también a las que añadan las features siguientes (RN-24).
- **FR-015** [ROS-84]: Pedir o intentar modificar un proyecto o un recurso de otra persona DEBE producir **el mismo código y el mismo cuerpo** de respuesta que un recurso inexistente o con un identificador inválido ("no encontrado"), sin revelar que existe. El tiempo de respuesta no forma parte de este requisito.
- **FR-016** [ROS-84]: Los identificadores de proyectos y recursos que aparecen en las direcciones del producto NO DEBEN ser predecibles: ni secuenciales ni derivables de otro identificador (RNF-04).
- **FR-017** [ROS-84]: Todo intento de acceso denegado por pertenencia DEBE registrarse con la persona, la ruta y el identificador del recurso, sin correos, nombres, tokens ni contenido del proyecto ([07-seguridad §4](../../docs/03-arquitectura/07-seguridad-y-autenticacion.md)).
- **FR-018** [ROS-84]: DEBE existir una comprobación automática de acceso cruzado entre dos personas que cubra **cada operación** del producto sobre datos de proyectos, y una operación nueva sin esa comprobación DEBE hacer fallar la verificación (RNF-03).
- **FR-019** [ROS-84]: Ni las direcciones ni los registros DEBEN contener datos sensibles: valores de muestras, contenido de esquemas de clientes, correos, nombres ni credenciales (ROS-84, ROS-179; Constitución V).
- **FR-020** [ROS-84]: Fuera del entorno local, toda la comunicación DEBE ir cifrada con el transporte seguro obligatorio y activado de forma permanente en el navegador (RNF-01), y los datos guardados DEBEN estar cifrados en reposo (RNF-02). La configuración de cifrado y la gestión y rotación de llaves DEBEN quedar documentadas; los detalles que dependen del proveedor de hosting esperan a [DP-015](../../docs/07-registro/02-decisiones-pendientes.md#dp-015).

**Persistencia del trabajo**

- **FR-021** [ROS-81]: El sistema DEBE guardar, por proyecto, sus fuentes, su catálogo (tablas y columnas), la interpretación y el nivel de confianza de cada columna, la evidencia con su cita, los conflictos y las acciones humanas, de forma que cerrar y volver a abrir el proyecto (también en otra sesión o en otro navegador) devuelva **exactamente el mismo estado**: catálogo, niveles, cola de revisión y fuentes (RNF-16).
- **FR-022** [ROS-81]: Al abrir un proyecto, el sistema DEBE entregar de una vez el estado resumido del proyecto (catálogo, niveles, cola y fuentes) y DEBE poder diferir o paginar las partes pesadas sin cambiar el resultado. No se fijan metas de tiempo ([DP-018](../../docs/07-registro/02-decisiones-pendientes.md#dp-018)).
- **FR-023** [ROS-81]: Toda acción humana sobre una interpretación (confirmar, editar, rechazar) DEBE quedar registrada de forma **inmutable** con autor, fecha, estado anterior y estado posterior; ese registro no se modifica ni se borra (Constitución IV). Las acciones en sí son de la feature de revisión; esta feature garantiza su guardado.
- **FR-024** [ROS-81]: Toda operación que cambie varias cosas a la vez (por ejemplo, una confirmación con propagación) DEBE guardarse completa o no guardarse: nunca deja cambios parciales.
- **FR-025** [ROS-81]: La evidencia guardada NO DEBE editarse: si cambia, se borra y se vuelve a generar. Cada evidencia guarda su cita (Constitución III, RN-10).
- **FR-026** [ROS-81]: El modelo guardado DEBE implementar el [diccionario de datos](../../docs/04-datos/02-diccionario-de-datos.md) completo del MVP (tablas, columnas, tipos, nulabilidad, restricciones e índices) sin desviaciones, de modo que soporte las cinco pantallas del MVP (Panorama, Revisión, Catálogo, Fuentes y Proyectos).
- **FR-027** [ROS-81]: El sistema DEBE poder sembrar, en un proyecto de ejemplo, el caso de referencia (MOV0010, CTANRO, IMPTE…) de [03-datos-de-referencia](../../docs/04-datos/03-datos-de-referencia.md), solo con datos sintéticos (Constitución V), para desarrollo, pruebas y demostraciones. Es una herramienta del equipo (semilla de ROS-176), no una función de la interfaz: las personas usuarias no ven una opción de "proyecto de ejemplo".
- **FR-028** [ROS-81]: El almacenamiento DEBE poder construirse desde cero de forma reproducible, con los cambios de estructura versionados (RNF-20).

**Interfaz**

- **FR-029** [ROS-78]: La pantalla de proyectos, el formulario de creación y el selector DEBEN usar el sistema de diseño Nocturne, estar en español con tuteo neutro y cumplir WCAG 2.1 AA (teclado, foco visible y en orden, contraste, errores anunciados a lectores de pantalla), con las mismas exigencias que FR-040 de la feature 002 (Constitución VII).

### Key Entities *(include if feature involves data)*

- **Proyecto**: el espacio de trabajo de una base de datos que se quiere descifrar. Tiene nombre, descripción (puede estar vacía), dialecto (no cambia), propietaria única, fechas de creación y de última actividad (FR-005), y estado activo o archivado. Reserva un campo de organización que en el MVP siempre está vacío.
- **Fuente**: un archivo cargado en el proyecto (DDL o muestra), con tipo, estado de procesamiento y resumen. La crea la feature 004; aquí solo se guarda.
- **Tabla y Columna del catálogo**: la estructura de la base del cliente tal como la declara el DDL, con tipos, nulabilidad, llaves y la marca de dato personal.
- **Interpretación de una columna**: lo que Rosetta cree que significa la columna (nombre de negocio, descripción, tipo semántico, referencia), con su nivel de confianza (los cinco niveles), su puntaje y su desglose, y quién y cuándo la confirmó.
- **Perfil de columna**: estadísticas calculadas desde una muestra (nulos, distintos, valores frecuentes, patrón).
- **Evidencia**: una afirmación sobre una columna con su peso, su fuerza y su cita verificable; inmutable.
- **Conflicto**: el desacuerdo entre evidencias sobre una misma columna.
- **Acción de revisión**: el registro inmutable de una acción humana (confirmar, editar, rechazar) con autor, fecha y estados anterior y posterior.
- **Regla de nombres**: una convención (prefijo, sufijo…) global o del proyecto que aporta evidencia de peso acotado.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: La comprobación automática de acceso cruzado cubre el 100 % de las operaciones sobre datos de proyectos y el 100 % de los intentos de una persona sobre recursos de otra obtienen la respuesta de "no encontrado", con cero datos revelados (RNF-03).
- **SC-002**: Al cerrar y reabrir un proyecto sembrado con el caso de ejemplo, también desde otro navegador, coinciden en el 100 % de las comparaciones el estado al abrir (cobertura, fuentes, número de tablas y cabeza de la cola) y el catálogo guardado (tablas, columnas e interpretaciones con su nivel) (RNF-16).
- **SC-003**: Una persona nueva va del primer acceso a su primer proyecto creado con un solo formulario, sin pasos intermedios ajenos (recorrido E2E-01 de [01-estrategia-de-pruebas](../../docs/06-calidad/01-estrategia-de-pruebas.md), que ejecuta la tarea T087 de la feature 002 con el formulario de esta feature y cierra el SC-001 de la 002).
- **SC-004**: En el recorrido de cambio entre dos proyectos con datos distintos, cero elementos del proyecto anterior aparecen en el nuevo en ningún momento.
- **SC-005**: Los registros y las direcciones capturados durante un recorrido completo (crear, abrir, renombrar, archivar, cambiar de proyecto, accesos denegados) contienen cero correos, nombres, credenciales, valores de muestras o contenidos de esquemas.
- **SC-006**: Una operación de varias escrituras interrumpida a mitad deja cero cambios parciales en el 100 % de los casos probados.
- **SC-007**: El almacenamiento se construye desde cero y el caso de ejemplo se siembra con el mismo resultado en cada ejecución de la integración continua (RNF-20).
- **SC-008**: Las pantallas de esta feature pasan la auditoría automática de accesibilidad sin violaciones serias ni críticas y se recorren completas solo con teclado.
- **SC-009**: En el entorno desplegado, una revisión de configuración no encuentra tráfico ni almacenamiento sin cifrar (ROS-179; depende de DP-015).

## Assumptions

- **Un solo rol (NO-13):** cada proyecto tiene una sola persona, su propietaria. No hay proyectos compartidos, roles ni permisos.
- **Dependencia de la feature 002:** la identidad, la sesión, el área privada y el onboarding los aporta la 002; esta feature aporta el formulario de creación que el onboarding usa (T055 y T087 de la 002 esperan por él).
- **Lo que llega después:** la carga de fuentes (004), el motor de evidencia (005), la revisión con sus acciones (006) y el contenido del Panorama y del Catálogo usan el modelo de esta feature. Hasta entonces, la persistencia se comprueba con el caso de ejemplo sembrado (FR-027).
- **Descripción:** el formulario de creación no la pide (DP-019, FR-019 de la 002); se crea vacía y se puede cambiar después junto con el nombre ([05-api §2](../../docs/03-arquitectura/05-api.md)).
- **Textos de la interfaz:** `docs/` define las etiquetas de los dialectos (DP-019), el estado vacío "aún no tienes proyectos" (ROS-174, EC-022) y el estado "Todavía no hay evidencia…" del proyecto sin fuentes. **No** define las etiquetas del formulario, los botones, los errores de validación, la confirmación de archivar, el filtro de archivados ni la página de "no encontrado". Ningún agente decide textos de la interfaz: se proponen en una decisión pendiente nueva (propuesta **DP-028**, a registrar por CD con el OK de la persona) y se aprueban en [04-contenido §5](../../docs/05-diseno/04-contenido-y-redaccion.md) antes de implementar, como se hizo con DP-025.
- **Contraste:** mientras EC-024 siga abierto, las pantallas no usan `--nx-text-secondary` ni `--nx-text-muted` sobre `--nx-surface`.
- **Cifrado y llaves:** HTTPS, HSTS y cifrado en reposo dependen del entorno desplegado, cuyo proveedor sigue pendiente ([DP-015](../../docs/07-registro/02-decisiones-pendientes.md#dp-015)); en local no se exige. La parte de ROS-179 que depende del proveedor queda bloqueada por DP-015, como T089 en la 002.
- **Sin metas de tiempo:** `docs/` no fija tiempos de respuesta para estas pantallas ni para la recuperación del estado (DP-018); los criterios de éxito son invariantes verificables.
- **Retención:** la retención de archivos subidos y perfiles es [DP-013](../../docs/07-registro/02-decisiones-pendientes.md#dp-013) (feature 004); archivar un proyecto no borra nada.
- **Navegadores y dispositivos:** escritorio moderno (RNF-29), sin diseño para teléfono (NO-18), interfaz solo en español.

## Fuera de alcance

Ningún elemento de esta lista se construye en esta feature sin un cambio de documentación aprobado.

- **Borrar proyectos:** `docs/` solo pide crear, abrir y archivar.
- **Roles, colaboración y proyectos compartidos** (ROS-79, ROS-80, NO-13) y **organizaciones** (E15, NO-15); el campo de organización solo se reserva.
- **Historial y versionado visibles**, con comparación y reversión (ROS-82, ROS-83, NO-16). En el MVP solo se registra quién hizo cada acción (FR-023).
- **Carga y procesamiento de fuentes** (ROS-16, ROS-17, feature 004), **motor de evidencia** (feature 005), **acciones de revisión** (feature 006) y el contenido de **Panorama, Catálogo y Fuentes**; aquí solo el modelo y la navegación del proyecto.
- **Enmascarar datos personales** en perfiles y muestras (ROS-85, Fase 2, RN-26) y la retención de archivos (DP-013).
- **Exportar el catálogo** (NO-11) y **búsqueda y filtros avanzados** (NO-12), salvo el filtro de archivados de la pantalla de proyectos.
- **Conexión directa a la base del cliente** (NO-01) y **escribir en ella** (NO-02, RN-25).
- **Cambiar el dialecto** de un proyecto existente (FR-010).
- **Tema claro y aplicación móvil** (NO-17, NO-18).
