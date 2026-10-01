**Historias Jira cubiertas:** ROS-89 · ROS-90 · ROS-91 · ROS-92 · ROS-93 (subtareas ROS-180…ROS-190) · Épica E14 (ROS-14)

# Feature Specification: Inicio de sesión con Google y Microsoft

**Feature Branch**: `002-autenticacion-oauth`

**Created**: 2026-09-30

**Status**: Draft

**Input**: User description: "/speckit-specify de 002-autenticacion-oauth — historias ROS-89, ROS-90, ROS-91, ROS-92, ROS-93 (tareas ROS-180…190)"

**Fuentes de verdad**: historias en [02-historias-de-usuario.md](../../docs/02-requisitos/02-historias-de-usuario.md) (`#ros-89`…`#ros-93`), tareas en [03-tareas-mvp.md](../../docs/02-requisitos/03-tareas-mvp.md), reglas RN-24, requisitos RNF-03, RNF-05…09, RNF-36, decisiones [DP-014](../../docs/07-registro/02-decisiones-pendientes.md#dp-014) y [DP-009](../../docs/07-registro/02-decisiones-pendientes.md#dp-009), no-objetivos NO-13, NO-14 y NO-15 de [03-alcance-y-no-objetivos.md](../../docs/01-producto/03-alcance-y-no-objetivos.md).

## Clarifications

### Session 2026-10-01

- Q: ¿Qué cuentas de Microsoft pueden iniciar sesión en el MVP: solo las personales, o también las de trabajo o institucionales? → A: Solo las personales. Las cuentas de trabajo o institucionales quedan para la Fase 3 junto con el SSO empresarial (ROS-102).
- Q: Si una persona con cuenta entra y su proveedor informa un correo nuevo que ya pertenece a otra cuenta de Rosetta, ¿qué debe hacer el sistema? → A: Dejarla entrar, conservar el correo anterior sin actualizarlo y registrar el evento sin datos personales.
- Q: ¿Qué debe pasar con el segundo paso del onboarding ("subir el DDL") cuando se entregue esta feature, si la carga de DDL todavía no existe? → A: Omitirlo hasta que exista la feature 004; el onboarding es de un solo paso y termina al crear el primer proyecto.

## User Scenarios & Testing *(mandatory)*

<!--
  Las cinco historias de origen son P0 / Must en Jira. La prioridad P1/P2 de abajo ordena el
  recorrido de implementación y de prueba; no reduce el alcance. Todo lo descrito aquí es MVP.
-->

### User Story 1 - Iniciar sesión con Google o Microsoft (Priority: P1)

*Origen: ROS-90, ROS-89.* Una persona entra a Rosetta con su cuenta de Google o de Microsoft, sin crear otra contraseña. La primera vez se le crea la cuenta; las siguientes veces se la reconoce. Rosetta trae su nombre, correo y avatar del proveedor.

**Why this priority**: sin acceso no hay producto, y este es el único método de acceso del MVP (DP-014). Todo lo demás depende de poder identificar a la persona.

**Independent Test**: con un proveedor simulado y personas de prueba sintéticas, entrar por cada uno de los dos botones, llegar a la aplicación, salir y volver a entrar, y comprobar que existe una sola cuenta con los datos del proveedor.

**Acceptance Scenarios**:

1. **Dado** un visitante sin sesión en la pantalla de acceso, **cuando** elige "Continuar con Google" y autoriza en Google, **entonces** queda autenticado y su cuenta de Rosetta existe con el nombre, el correo y el avatar (si lo hay) que entregó Google.
2. **Dado** un visitante sin sesión con una cuenta personal de Microsoft, **cuando** elige "Continuar con Microsoft" y autoriza en Microsoft, **entonces** ocurre lo mismo con los datos que entregó Microsoft.
3. **Dado** una persona que ya tiene cuenta, **cuando** vuelve a entrar con el mismo proveedor, **entonces** se la reconoce, no se crea otra cuenta y conserva su estado (onboarding, proyectos).
4. **Dado** una persona que cambió su nombre, su avatar o su correo en el proveedor (sin que el correo nuevo choque con otra cuenta), **cuando** entra de nuevo, **entonces** sigue siendo la misma cuenta y Rosetta guarda y muestra los datos actualizados.
5. **Dado** un correo que ya pertenece a una cuenta creada con otro proveedor, **cuando** esa persona intenta entrar con el proveedor distinto, **entonces** el acceso se rechaza con un error claro: no se vinculan cuentas automáticamente y no se crea una segunda cuenta.
6. **Dado** un proveedor que declara el correo como no verificado, **cuando** la persona intenta entrar, **entonces** el acceso se rechaza con un mensaje claro y no se crea cuenta.
7. **Dado** la pantalla de acceso, **cuando** se carga, **entonces** ofrece exactamente dos métodos (Google y Microsoft), no tiene campo de contraseña ni de registro por correo, y muestra una nota de privacidad que explica qué datos se piden y para qué.
8. **Dado** un acceso con cualquiera de los dos proveedores, **cuando** se revisan los datos que Rosetta solicita, **entonces** son solo el nombre, el correo y el avatar, y ningún otro dato de la cuenta del proveedor.
9. **Dado** las pantallas de acceso, de error de acceso y de onboarding, **cuando** se auditan, **entonces** usan el sistema de diseño Nocturne, están en español con tuteo neutro y cumplen WCAG 2.1 AA (teclado, foco visible, contraste, estados no dependientes solo del color).
10. **Dado** una persona con cuenta cuyo proveedor ahora informa un correo que ya pertenece a otra cuenta de Rosetta, **cuando** entra, **entonces** accede a su propia cuenta, su correo anterior se conserva sin cambios, no se vinculan cuentas y el evento queda registrado sin datos personales.

---

### User Story 2 - Acceso solo para personas autenticadas, cada una con lo suyo (Priority: P1)

*Origen: ROS-89.* Ninguna pantalla ni operación de Rosetta funciona sin una identidad válida, y cada persona ve y modifica únicamente lo suyo.

**Why this priority**: es la garantía de seguridad base del producto (RN-24, RNF-03): los clientes objetivo son del sector regulado y no aceptan accesos cruzados.

**Independent Test**: con dos personas de prueba, A y B: abrir cada pantalla privada sin sesión y verificar la redirección; invocar cada operación privada sin identidad válida y verificar el rechazo; verificar que ninguna operación de esta feature devuelve datos de la otra persona.

**Acceptance Scenarios**:

1. **Dado** un visitante sin sesión, **cuando** abre por enlace directo una pantalla privada, **entonces** es llevado a la pantalla de acceso y, al entrar, regresa a la pantalla que había pedido.
2. **Dado** una petición sin identidad válida a cualquier operación privada, **cuando** el sistema la recibe, **entonces** responde "no autenticado" en el formato de error estándar y no devuelve ningún dato.
3. **Dado** dos personas autenticadas, A y B, **cuando** A consulta su cuenta, **entonces** solo ve datos de A, nunca de B.
4. **Dado** la pantalla de acceso, la pantalla de error de acceso y la comprobación pública del estado del servicio, **cuando** se piden sin sesión, **entonces** responden con normalidad (son las únicas excepciones).
5. **Dado** una cuenta desactivada, **cuando** su titular intenta entrar, **entonces** no obtiene acceso y ve un mensaje claro.

---

### User Story 3 - Alta clara y primer proyecto (Priority: P1)

*Origen: ROS-91.* Una persona nueva, en su primer acceso, queda dada de alta con su espacio personal y es guiada por un onboarding mínimo para crear su primer proyecto.

**Why this priority**: sin un primer proyecto la persona no puede usar nada del producto; el onboarding la lleva a ese punto sin fricción.

**Independent Test**: con una persona de prueba nueva, completar el recorrido acceso → onboarding → primer proyecto → lista de proyectos, y comprobar que no vuelve a ver el onboarding en accesos posteriores ni desde otro navegador.

**Acceptance Scenarios**:

1. **Dado** un primer acceso, **cuando** termina el acceso con el proveedor, **entonces** la cuenta queda creada con el onboarding pendiente y la persona ve una bienvenida con su nombre.
2. **Dado** una persona con el onboarding pendiente, **cuando** intenta abrir cualquier otra pantalla privada, **entonces** es llevada de vuelta al onboarding.
3. **Dado** el primer paso del onboarding, **cuando** la persona crea su primer proyecto con nombre y dialecto SQL válidos, **entonces** el proyecto existe, el onboarding queda completado y la persona llega a su lista de proyectos, sin ningún paso adicional de carga de archivos.
4. **Dado** una persona que completó el onboarding, **cuando** vuelve a entrar (también desde otro navegador o dispositivo), **entonces** no ve el onboarding.
5. **Dado** una persona que abandonó el onboarding a medias, **cuando** vuelve a entrar (también desde otro navegador), **entonces** retoma el onboarding.

---

### User Story 4 - Sesión que se mantiene y se cierra a tiempo (Priority: P1)

*Origen: ROS-92.* La sesión sigue abierta mientras la persona trabaja, sin interrupciones, y se cierra cuando corresponde: al caducar o cuando la persona decide salir.

**Why this priority**: una sesión que se cae a mitad del trabajo destruye la confianza en el producto; una que no se cierra es un riesgo de seguridad.

**Independent Test**: simular el paso del tiempo sobre una sesión vigente (credencial vencida, inactividad, antigüedad) y verificar renovación silenciosa, caducidad y cierre; abrir dos pestañas y cerrar sesión en una.

**Acceptance Scenarios**:

1. **Dado** una sesión vigente cuya credencial de acceso ya venció (más de 15 minutos), **cuando** la persona hace cualquier acción, **entonces** la sesión se renueva en silencio, sin pantalla de acceso y sin perder lo que estaba haciendo.
2. **Dado** una sesión que cumplió 14 días sin uso, o 30 días desde su inicio, **cuando** la persona intenta usar la aplicación, **entonces** ve "Tu sesión terminó. Vuelve a iniciar sesión para continuar.", es llevada al acceso y, tras entrar, regresa a donde estaba.
3. **Dado** una sesión vigente, **cuando** la persona cierra sesión, **entonces** es llevada a la pantalla de acceso, abrir una pantalla privada la devuelve al acceso y ninguna petición de ese navegador accede a datos. Su sesión en Google o Microsoft no se cierra.
4. **Dado** dos pestañas abiertas con la misma sesión, **cuando** la persona cierra sesión en una, **entonces** la otra, en su siguiente acción, lleva al acceso.
5. **Dado** una credencial de renovación que ya se usó, **cuando** se presenta de nuevo, **entonces** esa sesión se cierra y se exige un nuevo acceso.

---

### User Story 5 - El flujo de acceso resiste ataques comunes (Priority: P1)

*Origen: ROS-93.* Una persona responsable de seguridad puede comprobar que el flujo de acceso resiste los ataques comunes y que ningún secreto ni dato personal se filtra.

**Why this priority**: Rosetta procesa esquemas y muestras de clientes bancarios; una debilidad en el acceso invalida todo el producto (Constitución V).

**Independent Test**: ejecutar los casos maliciosos definidos y comprobar que todos se rechazan; recorrer un acceso completo inspeccionando navegador y registros.

**Acceptance Scenarios**:

1. **Dado** el inicio de un acceso, **cuando** el proveedor responde, **entonces** una respuesta que no corresponda a un acceso iniciado desde ese mismo navegador se rechaza y no crea sesión.
2. **Dado** un destino de regreso externo a Rosetta, **cuando** se solicita tras el acceso, **entonces** se ignora y la persona llega al destino por defecto; y **dado** un destino de regreso o de cierre de sesión, o un origen, que no está en la lista blanca, **cuando** se solicita, **entonces** se rechaza.
3. **Dado** una credencial ausente, vencida, emitida para otra aplicación, de otro emisor, con la firma alterada, sin firma o firmada con una clave desconocida, **cuando** se presenta a una operación privada, **entonces** se rechaza.
4. **Dado** un acceso completo, **cuando** se inspecciona el navegador (almacenamiento, respuestas, direcciones), **entonces** no aparece ninguna credencial de acceso ni de renovación, y la sesión del navegador no es legible por scripts de la página, solo viaja por conexión cifrada y no se envía en peticiones iniciadas desde otros sitios.
5. **Dado** un acceso completo, **cuando** se revisan los registros del sistema, **entonces** no contienen credenciales, códigos de autorización, correos ni nombres.
6. **Dado** una acción que modifica datos y que se origina en otro sitio, **cuando** llega al sistema, **entonces** se rechaza.
7. **Dado** el repositorio y la configuración del servicio de identidad, **cuando** se revisan, **entonces** el escáner de secretos no reporta hallazgos y la lista de comprobación de configuración está completa y anexada al acta de verificación.
8. **Dado** cualquier respuesta del producto, **cuando** se inspeccionan sus cabeceras, **entonces** incluye las protecciones de navegador exigidas por RNF-09.

---

### User Story 6 - Fallos de acceso explicados, sin callejones sin salida (Priority: P2)

*Origen: ROS-90 (mínimo de ROS-100 exigido en el MVP) y RNF-28.* Cuando el acceso falla, la persona entiende qué pasó y qué hacer; nunca ve una pantalla en blanco ni queda atrapada en un bucle.

**Why this priority**: es parte del "listo" de ROS-90 y evita que un fallo del proveedor se perciba como un fallo de Rosetta; va después del camino feliz porque no tiene sentido sin él.

**Independent Test**: provocar cada fallo con el proveedor simulado y verificar mensaje, salida y ausencia de bucle.

**Acceptance Scenarios**:

1. **Dado** una persona que cancela el consentimiento en el proveedor, **cuando** vuelve a Rosetta, **entonces** ve "Cancelaste el inicio de sesión con {proveedor}. Puedes intentarlo de nuevo cuando quieras." y una acción para reintentar.
2. **Dado** un proveedor que no responde, **cuando** la persona intenta entrar, **entonces** ve "{proveedor} no respondió. Intenta en unos minutos o usa otro proveedor.".
3. **Dado** un correo ya registrado con otro proveedor, **cuando** la persona intenta entrar, **entonces** ve un mensaje que explica qué pasó y qué hacer, con una acción para volver al acceso.
4. **Dado** un correo no verificado o una cuenta desactivada, **cuando** la persona intenta entrar, **entonces** ve un mensaje claro propio de esa situación, con una acción para volver al acceso.
5. **Dado** un fallo inesperado, **cuando** ocurre durante el acceso, **entonces** ve "Algo salió mal y no se guardó ningún cambio. Intenta de nuevo.".
6. **Dado** cualquiera de los fallos anteriores, **cuando** la persona usa "Volver a intentar", **entonces** regresa a la pantalla de acceso sin cadenas de redirecciones automáticas.

---

### Edge Cases

- **Abandono en el proveedor:** la persona cierra la ventana del proveedor o vuelve atrás durante el acceso. No se crea sesión ni cuenta parcial; puede reintentar desde la pantalla de acceso.
- **Primer acceso simultáneo:** la misma identidad entra por primera vez desde dos navegadores a la vez. Resulta una sola cuenta (FR-005).
- **Correo con otra capitalización:** `Ana@x.com` y `ana@x.com` son el mismo correo (FR-008, FR-009).
- **Cuenta de Microsoft de trabajo o institucional:** no se admite en el MVP (FR-001). No se crea cuenta ni sesión en Rosetta.
- **Cambio de correo en el proveedor que choca con otra cuenta:** ver FR-010.
- **Datos incompletos del proveedor:** el avatar es opcional. Un proveedor que no entrega correo no permite crear la cuenta y se trata como un fallo de acceso (FR-038). El comportamiento ante un nombre ausente no está definido en `docs/` y se registra como propuesta de decisión pendiente, no se resuelve aquí.
- **Sesión que vence a mitad de una operación:** la operación se rechaza completa, nunca a medias; ningún dato ya guardado se pierde (FR-026).
- **Pantalla de acceso con sesión abierta:** la persona es llevada a su destino (onboarding si está pendiente, lista de proyectos si no), no ve el acceso de nuevo.
- **Onboarding ya completado:** abrir la pantalla de onboarding lleva a la lista de proyectos (FR-018).
- **Onboarding pendiente y otra ruta privada:** se redirige al onboarding (FR-018).
- **Destino de regreso externo o malicioso** (por ejemplo, una dirección de otro sitio): se ignora y se usa el destino por defecto (FR-015).
- **Servicio de identidad sin respuesta durante una renovación silenciosa:** la persona no pierde datos guardados, ve el mensaje de proveedor sin respuesta y puede reintentar; no hay bucle.
- **Cuenta desactivada con sesión abierta:** pierde el acceso en su siguiente acción (FR-011).
- **Credencial de renovación reutilizada** (señal de posible robo): se cierra esa sesión (FR-023).

## Requirements *(mandatory)*

### Functional Requirements

**Acceso con proveedor externo**

- **FR-001** [ROS-90]: El sistema DEBE permitir iniciar sesión con una cuenta de **Google** y con una cuenta **personal** de **Microsoft**. Las cuentas de Microsoft de trabajo o institucionales NO se admiten en el MVP (Fase 3, junto con el SSO empresarial, ROS-102). Son los únicos métodos de acceso del MVP: no hay contraseña propia de Rosetta, ni registro por correo, ni acceso con Apple (DP-014).
- **FR-002** [ROS-90]: La pantalla de acceso DEBE ofrecer una acción por proveedor, "Continuar con Google" y "Continuar con Microsoft", y una nota de privacidad que diga qué datos se piden y para qué. Elegir una acción inicia el acceso con ese proveedor.
- **FR-003** [ROS-90, ROS-93]: El sistema DEBE pedir al proveedor solo los datos necesarios para identificar a la persona: nombre, correo y avatar. NO DEBE pedir acceso a ningún otro dato de la cuenta del proveedor (RNF-36).
- **FR-004** [ROS-93]: El sistema DEBE aceptar solo cuentas cuyo correo el proveedor declare verificado. Con un correo no verificado, el acceso se rechaza con un mensaje claro y no se crea cuenta.

**Cuenta de usuario**

- **FR-005** [ROS-90, ROS-91]: La primera vez que accede una identidad del proveedor, el sistema DEBE crear exactamente una cuenta de Rosetta con su nombre, su correo y su avatar (si lo hay). En cada acceso posterior DEBE reconocer esa misma cuenta, sin duplicarla, incluso si dos accesos de la misma identidad llegan a la vez.
- **FR-006** [ROS-90]: El sistema DEBE reconocer la cuenta por la identidad que asegura el proveedor, no por el correo: si la persona cambia su correo en el proveedor, sigue siendo la misma cuenta.
- **FR-007** [ROS-90]: En cada acceso el sistema DEBE actualizar el nombre, el correo y el avatar de la cuenta con los datos que el proveedor entregue en ese momento, salvo el correo cuando el nuevo choca con otra cuenta (FR-010).
- **FR-008** [ROS-90]: NO DEBEN existir dos cuentas con el mismo correo, sin distinguir mayúsculas de minúsculas.
- **FR-009** [ROS-90]: Si el correo del proveedor ya pertenece a una cuenta creada con otro proveedor, el sistema DEBE rechazar el acceso con un error claro, sin vincular las cuentas automáticamente y sin crear una segunda cuenta (DP-014; la vinculación manual es ROS-98, Fase 3).
- **FR-010** [ROS-90]: Si el proveedor informa, para una identidad ya conocida, un correo distinto que ya pertenece a otra cuenta de Rosetta, el sistema DEBE dejar entrar a la persona, conservar el correo anterior de su cuenta sin actualizarlo y registrar el evento sin datos personales (FR-033). No se vinculan cuentas ni se crea una segunda.
- **FR-011** [ROS-89]: Una cuenta desactivada NO DEBE poder iniciar sesión ni seguir usando una sesión abierta, y DEBE ver un mensaje claro (diccionario de datos: el estado "desactivada" existe para conservar a las personas con acciones auditadas).

**Acceso protegido y datos propios**

- **FR-012** [ROS-89]: Toda pantalla y toda operación de Rosetta DEBEN exigir una identidad autenticada válida, con la sola excepción de la pantalla de acceso, la pantalla de error de acceso y las comprobaciones públicas que enumere la documentación (estado del servicio y descripción del contrato, ver [05-api.md](../../docs/03-arquitectura/05-api.md)).
- **FR-013** [ROS-89]: Una operación sin identidad válida DEBE recibir una respuesta de "no autenticado" en el formato de error estándar del producto, sin datos internos.
- **FR-014** [ROS-89]: Un visitante sin sesión que abra una pantalla privada DEBE ser llevado a la pantalla de acceso y, al entrar, regresar a la pantalla que había pedido.
- **FR-015** [ROS-93]: El regreso tras el acceso DEBE admitir solo destinos internos de Rosetta; cualquier otro destino se ignora y se usa el destino por defecto (onboarding si está pendiente, lista de proyectos si no).
- **FR-016** [ROS-89]: Cada persona DEBE ver y modificar únicamente su propia cuenta (RN-24, RNF-03). Ninguna operación de esta feature devuelve datos de otra persona y toda acción posterior queda atribuida a la cuenta autenticada. El aislamiento de proyectos y de sus datos es de la feature 003 (ROS-84) y se apoya en esta identidad.

**Alta y onboarding**

- **FR-017** [ROS-91]: En el primer acceso el sistema DEBE crear la cuenta y su espacio personal (sin proyectos) y marcar el onboarding como pendiente.
- **FR-018** [ROS-91]: Mientras el onboarding esté pendiente, toda persona autenticada que intente entrar al área de trabajo DEBE ser llevada al onboarding. Al completarlo DEBE llegar a su lista de proyectos y no volver a ver el onboarding.
- **FR-019** [ROS-91]: El onboarding DEBE dar la bienvenida por el nombre de la persona y guiarla en un único paso: crear su primer proyecto (nombre y dialecto SQL). Crear ese proyecto completa el onboarding.
- **FR-020** [ROS-91]: El onboarding NO DEBE incluir en esta feature un paso de carga de DDL: ese paso pertenece a la ingesta de fuentes (feature 004) y se añadirá cuando esta exista. Hasta entonces el onboarding termina al crear el primer proyecto.
- **FR-021** [ROS-91]: El estado del onboarding (pendiente o completado) DEBE guardarse en la cuenta, no en el dispositivo: quien lo abandona a medias lo retoma al volver, también desde otro navegador, y quien lo completó no lo ve de nuevo.

**Sesión**

- **FR-022** [ROS-92]: El sistema DEBE mantener la sesión sin pedir un nuevo acceso mientras sea vigente, renovando en silencio las credenciales de acceso, sin que la persona pierda lo que está haciendo.
- **FR-023** [ROS-92, ROS-93]: Las credenciales de acceso DEBEN ser de vida corta (como máximo 15 minutos, RNF-08). Cada renovación DEBE invalidar la credencial de renovación anterior; si una credencial de renovación ya usada se presenta de nuevo, DEBE cerrarse esa sesión y exigirse un nuevo acceso.
- **FR-024** [ROS-92]: La sesión DEBE caducar tras 14 días sin uso y, en cualquier caso, a los 30 días de iniciada; después se exige un nuevo acceso. *Valores provisionales según [07-seguridad-y-autenticacion.md §3](../../docs/03-arquitectura/07-seguridad-y-autenticacion.md); ver Assumptions.*
- **FR-025** [ROS-92]: La persona DEBE poder cerrar sesión desde cualquier pantalla privada. Cerrar sesión DEBE terminar la sesión en Rosetta y en el servicio de identidad, llevar a la pantalla de acceso y, desde ese momento, ninguna petición de ese navegador DEBE acceder a datos. NO cierra la sesión de la persona en Google ni en Microsoft.
- **FR-026** [ROS-92]: Si la sesión vence o se invalida mientras la persona trabaja, el sistema DEBE mostrar "Tu sesión terminó. Vuelve a iniciar sesión para continuar.", llevarla a la pantalla de acceso y, tras entrar, devolverla a la pantalla donde estaba. La operación en curso se rechaza completa y ningún dato ya guardado se pierde.

**Seguridad del flujo de acceso**

- **FR-027** [ROS-93]: Todo acceso DEBE iniciarse con pruebas de origen y de integridad (los mecanismos estándar contra la falsificación de solicitudes y contra la interceptación del código de autorización, fijados en RNF-07), de modo que una respuesta del proveedor que no corresponda a un acceso iniciado desde ese mismo navegador se rechace y no cree sesión.
- **FR-028** [ROS-93]: Los destinos permitidos tras el acceso, tras el cierre de sesión y los orígenes autorizados DEBEN estar en una lista blanca explícita, sin comodines; cualquier otro destino se rechaza.
- **FR-029** [ROS-93]: El sistema DEBE aceptar solo credenciales emitidas por el emisor de identidad de Rosetta, destinadas a Rosetta, vigentes y con firma válida y algoritmo permitido. DEBE rechazar las ausentes, las vencidas, las emitidas para otra aplicación o por otro emisor, las de firma alterada, las sin firma y las firmadas con una clave desconocida.
- **FR-030** [ROS-93, ROS-92]: Ninguna credencial de acceso ni de renovación DEBE ser accesible al código que se ejecuta en la página de la persona. La sesión del navegador DEBE ser inaccesible para scripts de la página, viajar solo por conexión cifrada y no enviarse en peticiones iniciadas desde otros sitios (RNF-08).
- **FR-031** [ROS-93]: El sistema DEBE rechazar toda acción que modifique datos si no proviene del propio origen de Rosetta.
- **FR-032** [ROS-93]: Los secretos DEBEN existir solo en la configuración del entorno de ejecución: nunca en el repositorio ni en el código que llega al navegador. Los secretos de Google y Microsoft se guardan en el servicio de identidad, no en Rosetta. El escáner de secretos NO DEBE reportar hallazgos (RNF-05).
- **FR-033** [ROS-93]: El sistema NO DEBE registrar credenciales, códigos de autorización, correos ni nombres en ningún registro (RNF-06), tampoco en los del intermediario entre el navegador y el servicio.
- **FR-034** [ROS-93]: Las respuestas del producto DEBEN incluir las protecciones de navegador exigidas por RNF-09.
- **FR-035** [ROS-93]: La configuración del servicio de identidad (destinos de regreso y de cierre, orígenes, audiencia, vida de las credenciales, proveedores habilitados, con solo cuentas personales en Microsoft, y acceso por contraseña desactivado) DEBE revisarse contra una lista de comprobación que se anexa al acta de verificación de esta feature (ADR-0007).

**Fallos de acceso**

- **FR-036** [ROS-90]: Si la persona cancela el consentimiento, el sistema DEBE llevarla a una pantalla de error de acceso con el texto "Cancelaste el inicio de sesión con {proveedor}. Puedes intentarlo de nuevo cuando quieras." y una acción para reintentar.
- **FR-037** [ROS-90]: Si el proveedor no responde, el sistema DEBE mostrar "{proveedor} no respondió. Intenta en unos minutos o usa otro proveedor.".
- **FR-038** [ROS-90]: Ante un correo ya registrado con otro proveedor, un correo no verificado, un correo ausente, una cuenta desactivada o un fallo inesperado, el sistema DEBE mostrar un mensaje que explique qué pasó y qué hacer ahora; el fallo inesperado usa "Algo salió mal y no se guardó ningún cambio. Intenta de nuevo.".
- **FR-039** [ROS-90]: Ningún fallo del acceso DEBE dejar una pantalla en blanco ni producir un bucle de redirecciones: toda pantalla de error ofrece una salida ("Volver a intentar" o elegir otro proveedor).

**Interfaz**

- **FR-040** [ROS-90, ROS-91]: Las pantallas nuevas (acceso, error de acceso y onboarding) DEBEN usar el sistema de diseño Nocturne, estar en español con tuteo neutro (DP-009) y cumplir WCAG 2.1 AA: navegación por teclado, foco visible, contraste suficiente y estados que no dependan solo del color (RNF-24, RNF-26, RNF-27; Constitución VII).

### Key Entities *(include if feature involves data)*

- **Usuario**: la persona que usa Rosetta. Atributos: identidad asegurada por el proveedor (única y estable), correo (único sin distinguir mayúsculas), nombre, avatar (opcional), estado activo o desactivado, estado del onboarding (pendiente o fecha de finalización), fecha del último acceso. Es propietario de sus proyectos (feature 003). En el MVP existe un solo rol (propietario).
- **Proveedor de acceso**: Google o Microsoft (en el MVP, solo cuentas personales de Microsoft). Asegura quién es la persona y si su correo está verificado; Rosetta nunca ve ni guarda su contraseña.
- **Sesión**: periodo en el que la persona está autenticada. Tiene vigencia por inactividad y vigencia máxima, se renueva en silencio y se puede cerrar. Una sesión pertenece a una sola persona.
- **Onboarding**: estado persistente de la cuenta que indica si la persona ya completó su alta guiada (crear el primer proyecto).

### Trazabilidad ROS → FR

| Historia | Requisitos |
|---|---|
| ROS-89 | FR-011, FR-012, FR-013, FR-014, FR-016 |
| ROS-90 | FR-001, FR-002, FR-003, FR-005…FR-010, FR-036…FR-040 |
| ROS-91 | FR-005, FR-017…FR-021, FR-040 |
| ROS-92 | FR-022…FR-026, FR-030 |
| ROS-93 | FR-003, FR-004, FR-015, FR-023, FR-027…FR-035 |

## Bocetos de pantallas

Las tres pantallas no existen en el prototipo y deben diseñarse con Nocturne ([03-pantallas.md §7](../../docs/05-diseno/03-pantallas.md)). Los bocetos fijan estructura y contenido mínimo; los textos entre ‹ › aún no están definidos en [04-contenido-y-redaccion.md](../../docs/05-diseno/04-contenido-y-redaccion.md) y no se inventan aquí.

**Acceso**

```text
┌──────────────────────────────────────────────────────────┐
│                        ROSETTA                           │
│              ‹frase de valor del producto›               │
│                                                          │
│            [ Continuar con Google    ]                   │
│            [ Continuar con Microsoft ]                   │
│                                                          │
│   ‹nota de privacidad: qué datos se piden y para qué›    │
└──────────────────────────────────────────────────────────┘
```

**Error de acceso**

```text
┌──────────────────────────────────────────────────────────┐
│                        ROSETTA                           │
│   ‹mensaje según la situación: qué pasó y qué hacer›     │
│                                                          │
│                  [ Volver a intentar ]                   │
└──────────────────────────────────────────────────────────┘
```

**Onboarding**

```text
┌──────────────────────────────────────────────────────────┐
│  ‹bienvenida con el nombre de la persona›                │
│                                                          │
│  ‹título: crear el primer proyecto›                      │
│      Nombre  [______________]   Dialecto SQL [‹lista›▾]  │
│                                    [ ‹crear proyecto› ]  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Con cada uno de los dos proveedores, una persona de prueba nueva completa el recorrido acceso → onboarding → primer proyecto → lista de proyectos sin errores en el 100 % de las ejecuciones (E2E-01).
- **SC-002**: Tras varios accesos de la misma persona, incluidos accesos simultáneos desde dos navegadores, existe exactamente una cuenta: cero cuentas duplicadas (FR-005, FR-008).
- **SC-003**: El 100 % de las operaciones privadas enumeradas rechazan una petición sin identidad válida; ninguna responde con datos (criterio "listo cuando" de ROS-181).
- **SC-004**: El 100 % de los casos maliciosos definidos se rechaza: credencial de otra audiencia o de otro emisor, vencida, sin firma, con firma alterada, con clave desconocida, destino de regreso fuera de la lista blanca, respuesta sin correspondencia con un acceso iniciado y acción de modificación originada en otro sitio (ROS-189).
- **SC-005**: En un acceso completo no se observa ninguna credencial de acceso ni de renovación en el navegador: cero apariciones en almacenamiento, respuestas y direcciones.
- **SC-006**: Una sesión de trabajo continua que cruce varios vencimientos de la credencial de acceso (cada 15 minutos o menos) no muestra ninguna pantalla de acceso intermedia; tras cerrar sesión, cero peticiones de ese navegador acceden a datos (E2E-08).
- **SC-007**: El 100 % de los fallos de acceso definidos (cancelado, proveedor sin respuesta, correo ya registrado con otro proveedor, correo no verificado, correo ausente, cuenta desactivada, error inesperado) muestra un mensaje con una salida; cero pantallas en blanco y cero bucles de redirección.
- **SC-008**: El escáner de secretos reporta cero hallazgos y los registros capturados durante un acceso completo contienen cero credenciales, correos o nombres (RNF-05, RNF-06).
- **SC-009**: Las tres pantallas nuevas pasan la auditoría automática de accesibilidad sin violaciones serias o críticas y se recorren completas solo con teclado (RNF-24, RNF-27; E2E-10).
- **SC-010**: La lista de comprobación de la configuración del servicio de identidad está completa, sin elementos fallidos, y anexada al acta de verificación de la feature.

## Assumptions

- **Alcance de acceso (DP-014):** solo Google y Microsoft (esta última, únicamente con cuentas personales). Sin Apple, sin correo y contraseña, sin vinculación automática de cuentas. El título de ROS-90 aún nombra a Apple; está fuera del MVP.
- **Un solo rol (NO-13):** la persona autenticada es propietaria de sus proyectos; no hay roles, permisos ni proyectos compartidos. Tampoco hay MFA, verificación de correo, recuperación de contraseña ni SSO empresarial (NO-14), ni dominios permitidos ni organizaciones (NO-15).
- **Dependencias entre features del Sprint 1:** el primer paso del onboarding usa la capacidad de crear proyectos de la feature 003 (ROS-78); las pantallas usan Nocturne de la feature 001. La lista de dialectos SQL del formulario la define el producto (DP-019: T-SQL obligatorio) y no se fija aquí.
- **Onboarding de un solo paso (clarificación 2026-10-01):** ROS-186 menciona un segundo paso para subir el DDL; se omite hasta la feature 004. Hace falta un cambio de documentación que reformule esa actividad de ROS-186 antes de implementar.
- **Servicio de identidad externo:** el acceso lo respalda un servicio de identidad de un tercero (decisión [ADR-0007](../../docs/03-arquitectura/adr/ADR-0007-autenticacion-auth0.md)). El nombre, el correo y el avatar de las personas se guardan en él; los esquemas y las muestras de los clientes no pasan por él (Constitución V). La región donde opera está pendiente de DP-015.
- **Duración de la sesión:** 14 días sin uso y 30 días como máximo son valores provisionales de [07-seguridad-y-autenticacion.md §3](../../docs/03-arquitectura/07-seguridad-y-autenticacion.md) que aún no tienen una decisión pendiente asociada; se proponen como DP.
- **Sin metas de tiempo:** `docs/` no define objetivos de tiempo para el acceso o el onboarding (DP-018). Esta spec no inventa umbrales; los criterios de éxito son invariantes verificables (100 %, cero).
- **Textos:** se usan los textos ya definidos en `04-contenido-y-redaccion.md`. Faltan los de la frase de valor, la nota de privacidad, la bienvenida y los errores de correo ya registrado con otro proveedor, correo no verificado y cuenta desactivada; se definirán en `docs/` por un cambio de documentación antes de implementar, no en el código.
- **Entorno de pruebas:** las pruebas usan un proveedor simulado y personas sintéticas; nunca cuentas ni datos reales (RNF-38, Constitución V).
- **Navegadores y dispositivos:** navegadores de escritorio modernos (RNF-29); sin diseño para teléfono (NO-18); interfaz solo en español.
- **Atribución de acciones:** las acciones auditadas de otras features (confirmar, editar, rechazar) se apoyan en la identidad de esta feature; aquí solo se garantiza que cada petición se atribuye a una sola cuenta.

## Fuera de alcance

Ningún elemento de esta lista se construye en esta feature sin un cambio de documentación aprobado.

- **Otros métodos de acceso:** Apple, correo y contraseña, y la vinculación de varios proveedores a una cuenta (ROS-98, Fase 3). Si un correo ya existe con otro proveedor, solo se muestra el error; no se ofrece vincular (la oferta de vincular de ROS-100 es de Fase 2).
- **Seguridad avanzada de cuentas:** MFA (ROS-97), verificación de correo (ROS-95), recuperación de contraseña (ROS-96), SSO empresarial, incluidas las cuentas de Microsoft de trabajo o institucionales (ROS-102), cierre de sesión en todos los dispositivos (ROS-103). NO-14.
- **Organizaciones:** restringir el acceso por dominios permitidos (ROS-94, Fase 3), gestión de organizaciones, planes y pagos (E15, NO-15).
- **Roles y colaboración:** roles, permisos y proyectos compartidos (ROS-79, ROS-80, NO-13).
- **Perfil de usuario:** ver y editar nombre, avatar o idioma, y proveedores vinculados (ROS-99, Fase 2). En el MVP el nombre y el avatar solo se leen del proveedor.
- **Aislamiento y protección de los datos de los proyectos:** aislamiento por usuario y proyecto en todas las operaciones, y cifrado de las comunicaciones y de los datos almacenados (ROS-84, ROS-178, ROS-179, feature 003). Esta feature solo aporta la identidad en la que se apoyan.
- **Proyectos y carga de fuentes:** la pantalla de proyectos, la creación y el listado de proyectos (ROS-78, feature 003) y la carga y el procesamiento del DDL (ROS-16, feature 004), incluido el paso de carga de DDL del onboarding que pide ROS-186, que se añade cuando exista la 004.
- **Sistema de diseño:** los tokens y los componentes de Nocturne (ROS-74, ROS-75, feature 001); aquí solo se usan.
- **Notificaciones:** correos de bienvenida o de alerta de acceso (NO-19).
- **Acceso de administración interna:** no está cubierto por ROS-89…93; el diccionario de datos lo marca `[PENDIENTE]` para esta feature sin una decisión asociada y se registra como propuesta de decisión.
- **Tema claro y aplicación móvil** (NO-17, NO-18).
