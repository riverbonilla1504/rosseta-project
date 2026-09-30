# Tareas técnicas del MVP (Fase 1)

> **Fuente de verdad** de las tareas técnicas (TAREA) y sus actividades (ACTIVIDAD) del MVP. En Jira cada tarea es una **Subtarea** (`ROS-120`…`ROS-190`) hija de su historia; las actividades viven como checklist en la descripción.
> **Tarea** = trabajo técnico necesario para desarrollar una historia. **Actividad** = trabajo pequeño y específico dentro de una tarea.
> Cuando exista la spec de la feature, su `tasks.md` (T001…) **refina** estas tareas: cada `T###` lleva la clave `[ROS-xxx]` de la tarea de la que sale ([04-sincronizacion.md](../00-metodologia/04-sincronizacion.md) §6). Si el refinamiento cambia el alcance de una tarea, primero se actualiza este archivo (CD) y luego Jira.

## Resumen

| Sprint | Foco | Feature(s) Spec Kit | Tareas | Horas |
|---|---|---|---|---|
| [1 · Fundaciones](#sprint-1) | Design system, OAuth y sesiones, proyectos, núcleo de datos, seguridad | 001, 002, 003 | 23 | 174 h |
| [2 · Ingesta](#sprint-2) | Parser DDL, perfilado, convenciones, evidencia normalizada | 004 | 12 | 93 h |
| [3 · Motor](#sprint-3) | Puntuación, niveles, abstención, conflictos, propagación, citas, cola | 005, 006 | 14 | 104 h |
| [4 · Revisión](#sprint-4) | Ficha, perfil, previsualización, avisos, acciones, atajos, estados | 007 | 11 | 82 h |
| [5 · Catálogo y Panorama](#sprint-5) | Catálogo, chips, rastro, estado compartido, dashboard y widgets | 008, 009 | 11 | 79 h |
| **Total** | | | **71** | **532 h** |

**Horas por área:** Frontend 201 h · Backend 184 h · Motor/Algoritmo 74 h · Base de datos 26 h · Seguridad 21 h · Diseño UI 16 h · DevOps/Infra 10 h.

> Las horas son **esfuerzo estimado**, no calendario. En Jira las horas están solo en la descripción, no en el campo de estimación ([EC-016](../07-registro/01-errores-conocidos.md)).
> El Sprint 1 está sobrecargado; propuesta de división 1a/1b en [05-roadmap-y-sprints.md](../01-producto/05-roadmap-y-sprints.md) ([DP-011](../07-registro/02-decisiones-pendientes.md)).

**Etiquetas de área en Jira:** Backend · Frontend · BaseDeDatos · Motor · Seguridad · DevOps · DisenoUI (+ `Sprint-N`).

---

<a id="sprint-1"></a>
## Sprint 1 · Fundaciones — 174 h

### Historia [ROS-74](02-historias-de-usuario.md#ros-74) · Fundaciones del sistema de diseño Nocturne
Feature: `001-design-system-nocturne` · 2 tarea(s) · 14 h

<a id="ros-168"></a>
#### ROS-168 · Definir tokens de diseño (color, tipografía, espaciado)
Diseño UI · **8 h** · Sprint 1

- [ ] Inventariar los estilos usados en el prototipo Rosetta.dc.html
- [ ] Definir paleta de color (fondo, superficie, acento, semánticos por nivel de confianza)
- [ ] Definir escala tipográfica y pesos
- [ ] Definir escala de espaciado, radios y sombras
- [ ] Exportar todo como variables CSS en styles.css
- [ ] Verificar contraste AA de cada par texto/fondo

**Listo cuando:** existe un archivo de tokens único del que dependen todos los componentes, sin colores hardcodeados.

<a id="ros-169"></a>
#### ROS-169 · Configurar proyecto frontend y carga del design system
Frontend · **6 h** · Sprint 1

- [ ] Inicializar el proyecto frontend y su estructura de carpetas
- [ ] Integrar styles.css y los tokens de Nocturne
- [ ] Configurar tema oscuro como predeterminado
- [ ] Configurar build, linter y formateador
- [ ] Smoke test: una página que renderiza con los tokens aplicados

**Listo cuando:** el proyecto arranca en local y muestra una pantalla con el estilo Nocturne.

### Historia [ROS-75](02-historias-de-usuario.md#ros-75) · Biblioteca de componentes (chips, fichas, tablas, cola)
Feature: `001-design-system-nocturne` · 2 tarea(s) · 24 h

<a id="ros-170"></a>
#### ROS-170 · Implementar componentes base (botón, input, card, tabla)
Frontend · **12 h** · Sprint 1

- [ ] Componente Botón con variantes y estados (hover, activo, deshabilitado, cargando)
- [ ] Componentes Input y Select con estados de error
- [ ] Componente Card/Panel
- [ ] Componente Tabla con scroll horizontal propio
- [ ] Estados de foco visibles y navegables por teclado
- [ ] Página catálogo de componentes para revisarlos

**Listo cuando:** los componentes base se usan desde el catálogo y respetan los tokens.

<a id="ros-171"></a>
#### ROS-171 · Implementar componentes de dominio (chip, ficha, cola, aviso)
Frontend · **12 h** · Sprint 1

- [ ] Chip de confianza con 4 variantes (acento, contorno, tenue, neutro)
- [ ] Componente Ficha de evidencia (contenedor y secciones)
- [ ] Componente Ítem de cola
- [ ] Componente Banner de aviso/conflicto
- [ ] Componente Estado vacío reutilizable
- [ ] Pruebas visuales de cada variante

**Listo cuando:** las 5 pantallas pueden construirse combinando estos componentes.

### Historia [ROS-78](02-historias-de-usuario.md#ros-78) · Múltiples proyectos/bases por usuario
Feature: `003-proyectos-y-nucleo-de-datos` · 3 tarea(s) · 21 h

<a id="ros-172"></a>
#### ROS-172 · Modelar proyectos y su pertenencia
Base de datos · **5 h** · Sprint 1

- [ ] Tabla proyectos (nombre, descripción, propietario, fechas, archivado)
- [ ] Relación usuario ↔ proyecto
- [ ] Índices por propietario y por fecha
- [ ] Migración y datos de ejemplo

**Listo cuando:** un usuario puede tener varios proyectos aislados entre sí.

<a id="ros-173"></a>
#### ROS-173 · API CRUD de proyectos
Backend · **8 h** · Sprint 1

- [ ] POST /api/projects — crear proyecto
- [ ] GET /api/projects — listar los del usuario
- [ ] GET /api/projects/:id — detalle
- [ ] PATCH /api/projects/:id — renombrar y archivar
- [ ] Verificar propiedad del proyecto en cada endpoint
- [ ] Pruebas de API incluyendo acceso de otro usuario

**Listo cuando:** un usuario no puede ver ni tocar proyectos ajenos.

<a id="ros-174"></a>
#### ROS-174 · UI de listado y cambio de proyecto
Frontend · **8 h** · Sprint 1

- [ ] Pantalla de listado de proyectos
- [ ] Modal de creación de proyecto
- [ ] Selector de proyecto activo en la barra superior
- [ ] Limpiar y recargar el estado al cambiar de proyecto
- [ ] Estado vacío "aún no tenés proyectos"

**Listo cuando:** cambiar de proyecto nunca mezcla datos de otro.

### Historia [ROS-81](02-historias-de-usuario.md#ros-81) · Persistir catálogo, evidencia y confirmaciones
Feature: `003-proyectos-y-nucleo-de-datos` · 3 tarea(s) · 26 h

<a id="ros-175"></a>
#### ROS-175 · Diseñar el esquema de datos del núcleo
Base de datos · **10 h** · Sprint 1

- [ ] Tablas tablas y columnas del catálogo
- [ ] Tabla fuentes (tipo, origen, fecha, estado)
- [ ] Tabla evidencia (objetivo, fuente, afirmación, peso, cita)
- [ ] Tabla confirmaciones (columna, autor, fecha, acción, motivo)
- [ ] Claves foráneas, índices y restricciones
- [ ] Diagrama del modelo documentado

**Listo cuando:** el modelo soporta las 5 pantallas sin cambios estructurales previsibles.

> ⚠️ Tarea de mayor riesgo del sprint: todo el motor depende de este modelo.

<a id="ros-176"></a>
#### ROS-176 · Implementar capa de persistencia y migraciones
Backend · **10 h** · Sprint 1

- [ ] Configurar el acceso a datos (ORM o consultas)
- [ ] Sistema de migraciones versionadas
- [ ] Repositorio por entidad (columnas, evidencia, confirmaciones)
- [ ] Transacciones para la confirmación con propagación
- [ ] Seeds con un esquema de prueba (MOV0010, CTANRO, IMPTE…)
- [ ] Pruebas de integración contra base real

**Listo cuando:** las migraciones corren desde cero y los seeds cargan el caso de ejemplo.

<a id="ros-177"></a>
#### ROS-177 · Recuperar el estado completo del proyecto al abrir
Backend · **6 h** · Sprint 1

- [ ] Endpoint GET /api/projects/:id/state
- [ ] Incluir catálogo, niveles, cola y fuentes
- [ ] Paginar o diferir lo que sea pesado
- [ ] Caché ligera del estado por proyecto
- [ ] Pruebas de consistencia tras confirmar y recargar

**Listo cuando:** cerrar y reabrir el proyecto devuelve exactamente el mismo estado.

### Historia [ROS-84](02-historias-de-usuario.md#ros-84) · Seguridad de datos y control de acceso
Feature: `003-proyectos-y-nucleo-de-datos` · 2 tarea(s) · 14 h

<a id="ros-178"></a>
#### ROS-178 · Aplicar aislamiento por usuario/proyecto en toda la API
Seguridad · **8 h** · Sprint 1

- [ ] Verificar pertenencia del recurso al proyecto del usuario en cada endpoint
- [ ] Usar identificadores no predecibles (UUID) en las rutas públicas
- [ ] Registrar los intentos de acceso denegados
- [ ] Pruebas automatizadas de acceso cruzado entre dos usuarios

**Listo cuando:** la suite de pruebas de acceso cruzado pasa al 100 %.

<a id="ros-179"></a>
#### ROS-179 · Cifrado en tránsito y en reposo
DevOps/Infra · **6 h** · Sprint 1

- [ ] Forzar HTTPS y activar HSTS
- [ ] Habilitar cifrado en reposo de la base de datos
- [ ] Definir la gestión y rotación de llaves
- [ ] Verificar que no viajan datos sensibles en URLs ni en logs
- [ ] Documentar la configuración de seguridad

**Listo cuando:** una revisión de configuración no encuentra tráfico ni almacenamiento sin cifrar.

### Historia [ROS-89](02-historias-de-usuario.md#ros-89) · Autenticación de usuarios
Feature: `002-autenticacion-oauth` · 2 tarea(s) · 14 h

<a id="ros-180"></a>
#### ROS-180 · Diseñar modelo de datos de usuarios y sesiones
Base de datos · **6 h** · Sprint 1

- [ ] Tabla usuarios (id, correo, nombre, avatar, fechas)
- [ ] Tabla sesiones (refresh token hasheado, expiración, dispositivo)
- [ ] Tabla proveedores_vinculados (usuario, proveedor, id externo)
- [ ] Índices y restricción de unicidad por correo
- [ ] Escribir la migración inicial

**Listo cuando:** la migración corre limpia y permite crear un usuario con proveedor vinculado.

<a id="ros-181"></a>
#### ROS-181 · Implementar middleware de autenticación y guardas de ruta
Backend · **8 h** · Sprint 1

- [ ] Middleware que verifica y decodifica el token de acceso
- [ ] Aplicar el middleware a todas las rutas privadas
- [ ] Respuestas 401 / 403 consistentes
- [ ] Guarda de rutas en el frontend con redirección a login
- [ ] Pruebas: sin token, token expirado, token válido

**Listo cuando:** ninguna ruta privada responde sin un token válido.

### Historia [ROS-90](02-historias-de-usuario.md#ros-90) · Inicio de sesión con OAuth (Google, Microsoft, Apple)
Feature: `002-autenticacion-oauth` · 3 tarea(s) · 20 h

<a id="ros-182"></a>
#### ROS-182 · Registrar apps OAuth y configurar proveedores
DevOps/Infra · **4 h** · Sprint 1

- [ ] Crear credenciales OAuth en Google Cloud Console
- [ ] Crear credenciales en Microsoft Entra ID
- [ ] Configurar redirect URIs de desarrollo y producción
- [ ] Guardar client id/secret en variables de entorno (nunca en el repo)
- [ ] Documentar el procedimiento de configuración

**Listo cuando:** existen credenciales válidas por entorno y documentadas.

<a id="ros-183"></a>
#### ROS-183 · Implementar flujo OAuth en backend (callback e intercambio de código)
Backend · **10 h** · Sprint 1

- [ ] Endpoint GET /auth/:provider que inicia el flujo
- [ ] Endpoint GET /auth/:provider/callback
- [ ] Intercambiar el code por el token del proveedor
- [ ] Obtener el perfil (correo, nombre, avatar)
- [ ] Crear el usuario si no existe, o recuperarlo por correo
- [ ] Emitir la sesión propia y redirigir a la app

**Listo cuando:** un usuario real entra con Google y queda persistido.

<a id="ros-184"></a>
#### ROS-184 · Construir pantalla de login con botones de proveedor
Frontend · **6 h** · Sprint 1

- [ ] Maquetar la pantalla de login con componentes Nocturne
- [ ] Botones de Google, Microsoft y Apple
- [ ] Estados de carga y de error del proveedor
- [ ] Redirección al destino previo tras iniciar sesión
- [ ] Prueba manual del flujo completo

**Listo cuando:** desde la pantalla se completa el login end-to-end.

### Historia [ROS-91](02-historias-de-usuario.md#ros-91) · Registro y onboarding de cuenta nueva
Feature: `002-autenticacion-oauth` · 2 tarea(s) · 14 h

<a id="ros-185"></a>
#### ROS-185 · Implementar alta de usuario en el primer inicio
Backend · **6 h** · Sprint 1

- [ ] Detectar si es el primer inicio de sesión del usuario
- [ ] Crear el usuario y su espacio de trabajo
- [ ] Marcar el estado de onboarding como pendiente
- [ ] Endpoint para consultar y actualizar el estado de onboarding
- [ ] Pruebas de alta y de segundo inicio

**Listo cuando:** el primer login deja al usuario listo para crear su primer proyecto.

<a id="ros-186"></a>
#### ROS-186 · Construir flujo de onboarding en la UI
Frontend · **8 h** · Sprint 1

- [ ] Pantalla de bienvenida con el propósito de Rosetta
- [ ] Paso 1: crear o abrir un proyecto
- [ ] Paso 2: cargar la primera fuente (esquema)
- [ ] Persistir el progreso del onboarding
- [ ] Permitir omitir y retomar después

**Listo cuando:** un usuario nuevo llega solo hasta tener un proyecto con una fuente cargada.

### Historia [ROS-92](02-historias-de-usuario.md#ros-92) · Gestión de sesión y tokens (refresh, expiración, cierre)
Feature: `002-autenticacion-oauth` · 2 tarea(s) · 14 h

<a id="ros-187"></a>
#### ROS-187 · Implementar emisión, refresh y revocación de tokens
Backend · **8 h** · Sprint 1

- [ ] Generar access token de vida corta y refresh token de vida larga
- [ ] Endpoint POST /auth/refresh con rotación del refresh
- [ ] Endpoint POST /auth/logout que invalida la sesión
- [ ] Guardar solo el hash del refresh token
- [ ] Pruebas de expiración, rotación y reuso de token revocado

**Listo cuando:** un token revocado o expirado deja de dar acceso de inmediato.

<a id="ros-188"></a>
#### ROS-188 · Gestionar la sesión en el cliente
Frontend · **6 h** · Sprint 1

- [ ] Almacenar la sesión de forma segura (cookie httpOnly)
- [ ] Renovación silenciosa antes de que expire el access token
- [ ] Interceptor que reintenta una vez ante un 401
- [ ] Cerrar sesión y limpiar todo el estado del cliente
- [ ] Pruebas de sesión larga y de expiración

**Listo cuando:** el usuario no ve cortes de sesión inesperados durante el uso normal.

### Historia [ROS-93](02-historias-de-usuario.md#ros-93) · Seguridad del flujo OAuth (PKCE, state, redirect URIs)
Feature: `002-autenticacion-oauth` · 2 tarea(s) · 13 h

<a id="ros-189"></a>
#### ROS-189 · Implementar PKCE, state y validación de redirect URIs
Seguridad · **8 h** · Sprint 1

- [ ] Generar code_verifier / code_challenge y verificarlos en el callback
- [ ] Generar y validar el parámetro state (anti-CSRF)
- [ ] Lista blanca de redirect URIs permitidas
- [ ] Validar firma, issuer y audience del token del proveedor
- [ ] Pruebas con state inválido, redirect no permitido y código reusado

**Listo cuando:** los casos maliciosos de prueba son rechazados por el backend.

<a id="ros-190"></a>
#### ROS-190 · Endurecer manejo de secretos y cookies
Seguridad · **5 h** · Sprint 1

- [ ] Mover todos los secretos a variables de entorno
- [ ] Cookies con httpOnly, secure y SameSite
- [ ] Cabeceras de seguridad (CSP, HSTS, X-Frame-Options)
- [ ] Revisar que no se registren tokens ni PII en los logs
- [ ] Checklist de seguridad revisado

**Listo cuando:** no hay secretos en el repositorio y las cabeceras están activas.

---

<a id="sprint-2"></a>
## Sprint 2 · Ingesta — 93 h

### Historia [ROS-16](02-historias-de-usuario.md#ros-16) · Importar esquema / DDL de la base de datos
Feature: `004-ingesta-de-fuentes` · 3 tarea(s) · 26 h

<a id="ros-120"></a>
#### ROS-120 · Implementar parser de DDL SQL
Backend · **12 h** · Sprint 2

- [ ] Evaluar e integrar una librería de parseo SQL
- [ ] Extraer tablas y columnas del CREATE TABLE
- [ ] Extraer tipo de dato, longitud y nulabilidad
- [ ] Extraer llaves primarias, foráneas declaradas e índices
- [ ] Tolerar dialectos comunes (Oracle, SQL Server, Postgres)
- [ ] Pruebas con un DDL real de banca con nombres crípticos

**Listo cuando:** un DDL de ejemplo produce el listado completo de tablas y columnas sin perder información.

<a id="ros-121"></a>
#### ROS-121 · API de importación de esquema
Backend · **8 h** · Sprint 2

- [ ] Endpoint POST /api/projects/:id/sources/schema
- [ ] Validar tamaño, extensión y formato del archivo
- [ ] Persistir tablas y columnas del catálogo
- [ ] Registrar la importación como fuente de evidencia
- [ ] Devolver resumen (tablas, columnas, advertencias)
- [ ] Pruebas de reimportación (idempotencia)

**Listo cuando:** reimportar el mismo DDL no duplica columnas.

<a id="ros-122"></a>
#### ROS-122 · UI de carga de esquema
Frontend · **6 h** · Sprint 2

- [ ] Componente de carga de archivo (drag & drop)
- [ ] Validación en cliente antes de enviar
- [ ] Barra de progreso de la importación
- [ ] Pantalla de resumen del resultado
- [ ] Mensajes claros ante errores de parseo

**Listo cuando:** el usuario carga un DDL y ve cuántas tablas y columnas entraron.

### Historia [ROS-17](02-historias-de-usuario.md#ros-17) · Cargar datos de muestra para perfilado
Feature: `004-ingesta-de-fuentes` · 3 tarea(s) · 26 h

<a id="ros-123"></a>
#### ROS-123 · Implementar perfilador de datos
Motor/Algoritmo · **12 h** · Sprint 2

- [ ] Parseo de CSV con detección de delimitador y codificación
- [ ] Calcular % de nulos y cardinalidad por columna
- [ ] Calcular distribución, mínimo, máximo y valores frecuentes
- [ ] Detectar patrones (fecha, importe, código, booleano)
- [ ] Detectar valores fuera del catálogo esperado
- [ ] Pruebas unitarias con columnas de cada tipo

**Listo cuando:** el perfil de IMPTE detecta que es numérico monetario y el de FEPRO que es fecha.

<a id="ros-124"></a>
#### ROS-124 · API de carga y perfilado de muestras
Backend · **8 h** · Sprint 2

- [ ] Endpoint POST /api/projects/:id/sources/sample
- [ ] Asociar la muestra a la tabla correspondiente
- [ ] Ejecutar el perfilado en segundo plano si el archivo es grande
- [ ] Persistir el perfil resultante por columna
- [ ] Endpoint de consulta del estado del perfilado
- [ ] Pruebas con archivo grande

**Listo cuando:** una muestra de miles de filas se perfila sin bloquear la interfaz.

<a id="ros-125"></a>
#### ROS-125 · UI de carga de muestra y vista de perfil
Frontend · **6 h** · Sprint 2

- [ ] Carga de CSV asociada a una tabla
- [ ] Previsualización de las primeras filas y columnas detectadas
- [ ] Indicador de progreso del perfilado
- [ ] Vista del perfil resultante por columna
- [ ] Manejo de errores de formato

**Listo cuando:** tras cargar la muestra el usuario ve el perfil de cada columna.

### Historia [ROS-21](02-historias-de-usuario.md#ros-21) · Definir catálogo de convenciones de nombres
Feature: `004-ingesta-de-fuentes` · 2 tarea(s) · 13 h

<a id="ros-126"></a>
#### ROS-126 · Modelar y almacenar reglas de nomenclatura
Base de datos · **5 h** · Sprint 2

- [ ] Tabla reglas_nomenclatura (patrón, tipo, significado, peso)
- [ ] Reglas propias por proyecto y reglas globales
- [ ] Semilla con abreviaturas comunes (FE→fecha, IMPTE→importe, NRO→número)
- [ ] Migración e índices

**Listo cuando:** el catálogo de convenciones se puede consultar y ampliar por proyecto.

<a id="ros-127"></a>
#### ROS-127 · API y UI de gestión de convenciones
Backend · **8 h** · Sprint 2

- [ ] CRUD de reglas de nomenclatura
- [ ] Pantalla de edición de reglas
- [ ] Detectar y avisar conflictos entre reglas
- [ ] Disparar el recálculo de inferencias al guardar
- [ ] Pruebas de la API

**Listo cuando:** editar una regla cambia visiblemente las inferencias afectadas.

### Historia [ROS-22](02-historias-de-usuario.md#ros-22) · Panel de fuentes recolectadas con estado y cobertura
Feature: `004-ingesta-de-fuentes` · 2 tarea(s) · 12 h

<a id="ros-128"></a>
#### ROS-128 · API de listado de fuentes y cobertura
Backend · **6 h** · Sprint 2

- [ ] Endpoint GET /api/projects/:id/sources
- [ ] Calcular la cobertura aportada por cada fuente
- [ ] Incluir tipo, estado, fecha y número de evidencias
- [ ] Endpoint para eliminar una fuente y su evidencia
- [ ] Pruebas

**Listo cuando:** eliminar una fuente retira su evidencia y recalcula los niveles.

<a id="ros-129"></a>
#### ROS-129 · UI del panel de fuentes
Frontend · **6 h** · Sprint 2

- [ ] Lista de fuentes con tipo, estado y fecha
- [ ] Indicador visual de cobertura por fuente
- [ ] Acciones de recargar y eliminar fuente
- [ ] Enlace a la evidencia que generó cada fuente
- [ ] Estado vacío con llamada a cargar la primera fuente

**Listo cuando:** el panel refleja las fuentes recolectadas y su aporte.

### Historia [ROS-23](02-historias-de-usuario.md#ros-23) · Normalizar toda la evidencia a un formato común
Feature: `004-ingesta-de-fuentes` · 2 tarea(s) · 16 h

<a id="ros-130"></a>
#### ROS-130 · Definir el modelo de evidencia unificado
Backend · **6 h** · Sprint 2

- [ ] Definir la estructura {objetivo, tipo_fuente, afirmación, peso, cita}
- [ ] Formalizar la tabla evidencia y sus índices
- [ ] Versionar el formato para permitir evolución
- [ ] Documentar el contrato para los adaptadores

**Listo cuando:** cualquier fuente nueva puede escribir evidencia sin cambiar el motor.

<a id="ros-131"></a>
#### ROS-131 · Implementar adaptadores por tipo de fuente
Backend · **10 h** · Sprint 2

- [ ] Definir la interfaz común de adaptador
- [ ] Adaptador de esquema/DDL → evidencia
- [ ] Adaptador de perfil de datos → evidencia
- [ ] Adaptador de convenciones de nombres → evidencia (peso 0,40)
- [ ] Pruebas unitarias por adaptador

**Listo cuando:** las tres fuentes del MVP producen evidencia en el mismo formato.

---

<a id="sprint-3"></a>
## Sprint 3 · Motor — 104 h

### Historia [ROS-25](02-historias-de-usuario.md#ros-25) · Modelo de puntuación ponderada de evidencia
Feature: `005-motor-de-evidencia` · 3 tarea(s) · 25 h

<a id="ros-132"></a>
#### ROS-132 · Diseñar y documentar la fórmula de puntuación
Motor/Algoritmo · **8 h** · Sprint 3

- [ ] Definir el peso de cada tipo de fuente (nombre de columna = 0,40)
- [ ] Definir cómo se combinan varias evidencias sobre la misma columna
- [ ] Definir la normalización del puntaje a rango 0–1
- [ ] Documentar la fórmula con ejemplos resueltos a mano
- [ ] Validar contra los casos del prototipo (PAPEL, USRALT, RESERV3)

**Listo cuando:** la documentación permite reproducir a mano el puntaje de una columna.

<a id="ros-133"></a>
#### ROS-133 · Implementar el cálculo de puntaje por columna
Motor/Algoritmo · **12 h** · Sprint 3

- [ ] Agregar todas las evidencias de una columna
- [ ] Aplicar los pesos y calcular el puntaje final
- [ ] Garantizar que el cálculo sea determinista y reproducible
- [ ] Persistir el puntaje y el desglose por fuente
- [ ] Pruebas unitarias con casos límite (sin evidencia, evidencia única, contradictoria)

**Listo cuando:** dos ejecuciones sobre la misma evidencia dan exactamente el mismo puntaje.

<a id="ros-134"></a>
#### ROS-134 · Exponer el puntaje y su desglose vía API
Backend · **5 h** · Sprint 3

- [ ] Endpoint GET /api/columns/:id/score
- [ ] Incluir el aporte de cada fuente al puntaje
- [ ] Incluir qué falta para subir de nivel
- [ ] Pruebas

**Listo cuando:** la API explica por qué una columna tiene su puntaje.

### Historia [ROS-26](02-historias-de-usuario.md#ros-26) · Asignar niveles de confianza (5 niveles)
Feature: `005-motor-de-evidencia` · 2 tarea(s) · 12 h

<a id="ros-135"></a>
#### ROS-135 · Implementar la clasificación en 5 niveles de confianza
Motor/Algoritmo · **8 h** · Sprint 3

- [ ] Definir los umbrales de cada nivel
- [ ] Mapear puntaje → nivel (Alta sin validar / Inferida / Hipótesis / Desconocida)
- [ ] Forzar que "Confirmada" solo provenga de validación humana
- [ ] Recalcular niveles al cambiar el umbral configurado
- [ ] Pruebas de frontera en cada umbral

**Listo cuando:** ninguna columna puede llegar a "Confirmada" sin una confirmación registrada.

<a id="ros-136"></a>
#### ROS-136 · Persistir y exponer el nivel por columna
Backend · **4 h** · Sprint 3

- [ ] Campo nivel en la tabla de columnas
- [ ] Actualizar el nivel en cada recálculo
- [ ] Incluir el nivel en las respuestas de catálogo y cola
- [ ] Pruebas de consistencia entre endpoints

**Listo cuando:** catálogo, cola y ficha devuelven siempre el mismo nivel para una columna.

### Historia [ROS-27](02-historias-de-usuario.md#ros-27) · Declarar "Desconocida" en lugar de inventar
Feature: `005-motor-de-evidencia` · 1 tarea(s) · 6 h

<a id="ros-137"></a>
#### ROS-137 · Implementar la regla de abstención del motor
Motor/Algoritmo · **6 h** · Sprint 3

- [ ] Definir el umbral mínimo de evidencia para afirmar algo
- [ ] Marcar como "Desconocida" por debajo de ese umbral
- [ ] Impedir que el motor rellene con una suposición presentada como hecho
- [ ] Caso de prueba explícito con RESERV3
- [ ] Revisar los textos de la UI para que no sugieran certeza

**Listo cuando:** RESERV3 aparece como Desconocida y no con un significado inventado.

### Historia [ROS-28](02-historias-de-usuario.md#ros-28) · Detección de conflictos entre fuentes
Feature: `005-motor-de-evidencia` · 2 tarea(s) · 14 h

<a id="ros-138"></a>
#### ROS-138 · Implementar detección de contradicciones entre evidencias
Motor/Algoritmo · **10 h** · Sprint 3

- [ ] Definir formalmente qué constituye un conflicto
- [ ] Comparar las afirmaciones de distintas fuentes sobre la misma columna
- [ ] Registrar el conflicto con las fuentes implicadas
- [ ] Limitar el nivel de confianza cuando hay conflicto abierto
- [ ] Pruebas con evidencia deliberadamente contradictoria

**Listo cuando:** una contradicción entre el nombre y los datos genera un conflicto visible.

<a id="ros-139"></a>
#### ROS-139 · Exponer conflictos en la API
Backend · **4 h** · Sprint 3

- [ ] Incluir los conflictos en el detalle de la columna
- [ ] Endpoint GET /api/projects/:id/conflicts
- [ ] Permitir marcar un conflicto como resuelto
- [ ] Pruebas

**Listo cuando:** la ficha de revisión puede mostrar los conflictos de una columna.

### Historia [ROS-29](02-historias-de-usuario.md#ros-29) · Propagación de confirmaciones con contadores reales
Feature: `005-motor-de-evidencia` · 2 tarea(s) · 20 h

<a id="ros-140"></a>
#### ROS-140 · Implementar el grafo de dependencias entre columnas
Motor/Algoritmo · **10 h** · Sprint 3

- [ ] Construir el grafo de relaciones y dependencias entre columnas
- [ ] Calcular qué columnas se ven afectadas por una confirmación
- [ ] Detectar y cortar ciclos
- [ ] Calcular el conteo real de columnas que se desbloquean
- [ ] Pruebas con cadenas de propagación de varios niveles

**Listo cuando:** el conteo mostrado coincide con las columnas realmente afectadas.

<a id="ros-141"></a>
#### ROS-141 · Implementar confirmación con propagación transaccional
Backend · **10 h** · Sprint 3

- [ ] Endpoint POST /api/columns/:id/confirm
- [ ] Recalcular las columnas afectadas dentro de una transacción
- [ ] Devolver el conteo real de columnas desbloqueadas
- [ ] Soportar la reversión al rechazar una confirmación previa
- [ ] Pruebas de concurrencia (dos confirmaciones simultáneas)

**Listo cuando:** una confirmación fallida no deja el catálogo en estado inconsistente.

### Historia [ROS-33](02-historias-de-usuario.md#ros-33) · Trazabilidad: cada aserción enlaza a su evidencia
Feature: `005-motor-de-evidencia` · 2 tarea(s) · 14 h

<a id="ros-142"></a>
#### ROS-142 · Implementar almacenamiento y resolución de citas
Backend · **8 h** · Sprint 3

- [ ] Guardar una referencia precisa por evidencia (archivo, línea, valor)
- [ ] Endpoint para resolver una cita y devolver su contexto
- [ ] Validar que no se afirme por encima de "Hipótesis" sin cita
- [ ] Manejar citas cuya fuente fue eliminada
- [ ] Pruebas

**Listo cuando:** toda afirmación de nivel alto tiene al menos una cita resoluble.

<a id="ros-143"></a>
#### ROS-143 · Mostrar citas verificables en la UI
Frontend · **6 h** · Sprint 3

- [ ] Componente de cita reutilizable
- [ ] Vista previa del origen al hacer clic
- [ ] Agrupar las citas por fuente
- [ ] Estado cuando la cita no se puede resolver

**Listo cuando:** desde una afirmación se llega al dato original que la sustenta.

### Historia [ROS-36](02-historias-de-usuario.md#ros-36) · Cola priorizada por impacto
Feature: `006-cola-priorizada` · 2 tarea(s) · 13 h

<a id="ros-144"></a>
#### ROS-144 · Implementar el cálculo de impacto y orden de la cola
Motor/Algoritmo · **8 h** · Sprint 3

- [ ] Definir la fórmula de impacto (desbloqueos, uso, conflicto abierto)
- [ ] Ordenar los pendientes por impacto descendente
- [ ] Recalcular el orden tras cada confirmación o rechazo
- [ ] Excluir de la cola lo ya confirmado
- [ ] Pruebas del orden resultante

**Listo cuando:** la primera columna de la cola es la que más desbloquea.

<a id="ros-145"></a>
#### ROS-145 · API de la cola de revisión
Backend · **5 h** · Sprint 3

- [ ] Endpoint GET /api/projects/:id/queue con paginación
- [ ] Filtros por nivel y por tabla
- [ ] Endpoint "siguiente ítem" para el flujo de teclado
- [ ] Pruebas

**Listo cuando:** la pantalla de Revisión puede recorrer la cola sin recargar.

---

<a id="sprint-4"></a>
## Sprint 4 · Revisión — 82 h

### Historia [ROS-42](02-historias-de-usuario.md#ros-42) · Ficha de evidencia por columna con citas verificables
Feature: `007-revision-humana` · 3 tarea(s) · 28 h

<a id="ros-151"></a>
#### ROS-151 · Diseñar la interfaz de la ficha de evidencia
Diseño UI · **8 h** · Sprint 4

- [ ] Definir la jerarquía visual de la ficha (qué se lee primero)
- [ ] Ubicar afirmación propuesta, nivel, citas, perfil y propagación
- [ ] Diseñar los estados: con conflicto, sin validar, confirmada
- [ ] Especificar todo con componentes de Nocturne
- [ ] Revisar el diseño contra el prototipo original

**Listo cuando:** la ficha está especificada al detalle y aprobada antes de codificar.

<a id="ros-152"></a>
#### ROS-152 · API de detalle de columna para revisión
Backend · **6 h** · Sprint 4

- [ ] Endpoint GET /api/columns/:id con todo lo que la ficha necesita
- [ ] Incluir evidencias, citas, perfil, conflictos y previsualización de propagación
- [ ] Optimizar para evitar consultas N+1
- [ ] Pruebas de contrato de la respuesta

**Listo cuando:** la ficha se pinta completa con una sola llamada.

<a id="ros-153"></a>
#### ROS-153 · Implementar la pantalla de Revisión
Frontend · **14 h** · Sprint 4

- [ ] Layout de la pantalla (cola a un lado, ficha al centro)
- [ ] Render de la afirmación, el nivel y las evidencias con sus citas
- [ ] Integrar la cola priorizada y la navegación entre ítems
- [ ] Estados de carga, error y cola vacía
- [ ] Pruebas del recorrido completo de revisión

**Listo cuando:** se puede revisar la cola entera de principio a fin sin salir de la pantalla.

> ⚠️ Pantalla central del producto: es la tarea de mayor valor del sprint.

### Historia [ROS-43](02-historias-de-usuario.md#ros-43) · Perfil de datos (distribución, nulos, valores fuera de catálogo)
Feature: `007-revision-humana` · 1 tarea(s) · 8 h

<a id="ros-154"></a>
#### ROS-154 · Componente de visualización de perfil de datos
Frontend · **8 h** · Sprint 4

- [ ] Gráfico de distribución de valores
- [ ] Métricas de nulos, cardinalidad y rango
- [ ] Resaltar los valores fuera del catálogo esperado
- [ ] Versión compacta que entra en la ficha
- [ ] Alternativa accesible al gráfico (tabla/texto)

**Listo cuando:** el revisor entiende la forma de los datos sin salir de la ficha.

### Historia [ROS-44](02-historias-de-usuario.md#ros-44) · Previsualización del efecto de propagación al confirmar
Feature: `007-revision-humana` · 2 tarea(s) · 12 h

<a id="ros-155"></a>
#### ROS-155 · API de previsualización de propagación
Backend · **6 h** · Sprint 4

- [ ] Endpoint GET /api/columns/:id/propagation-preview
- [ ] Calcular el efecto sin persistir nada
- [ ] Devolver la lista y el conteo de columnas afectadas
- [ ] Pruebas de que el cálculo coincide con la confirmación real

**Listo cuando:** la previsualización y la confirmación real dan el mismo número.

<a id="ros-156"></a>
#### ROS-156 · UI de previsualización antes de confirmar
Frontend · **6 h** · Sprint 4

- [ ] Panel "esto desbloqueará N columnas"
- [ ] Listar las columnas que se verán afectadas
- [ ] Actualizar la previsualización si cambia la evidencia
- [ ] Permitir confirmar desde el propio panel

**Listo cuando:** el revisor ve el impacto antes de decidir.

### Historia [ROS-45](02-historias-de-usuario.md#ros-45) · Avisos de conflicto en la ficha
Feature: `007-revision-humana` · 1 tarea(s) · 6 h

<a id="ros-157"></a>
#### ROS-157 · UI de avisos de conflicto
Frontend · **6 h** · Sprint 4

- [ ] Banner de conflicto destacado en la ficha
- [ ] Listar las fuentes en conflicto y qué afirma cada una
- [ ] Sugerir cómo resolverlo
- [ ] Advertir explícitamente antes de confirmar con conflicto abierto
- [ ] Pruebas del caso con conflicto

**Listo cuando:** es imposible confirmar un conflicto sin haberlo visto.

### Historia [ROS-46](02-historias-de-usuario.md#ros-46) · Acciones Confirmar / Editar / Rechazar
Feature: `007-revision-humana` · 2 tarea(s) · 16 h

<a id="ros-158"></a>
#### ROS-158 · API de acciones de validación
Backend · **8 h** · Sprint 4

- [ ] POST /api/columns/:id/confirm
- [ ] POST /api/columns/:id/reject con motivo obligatorio
- [ ] PATCH /api/columns/:id para editar el significado
- [ ] Registrar autor y fecha en cada acción
- [ ] Pruebas de las tres acciones y sus efectos en el nivel

**Listo cuando:** cada acción deja rastro de quién la hizo y cuándo.

<a id="ros-159"></a>
#### ROS-159 · UI de acciones y feedback
Frontend · **8 h** · Sprint 4

- [ ] Botones Confirmar / Editar / Rechazar en la ficha
- [ ] Modal de edición del significado
- [ ] Captura del motivo al rechazar
- [ ] Actualización optimista con reversión si falla
- [ ] Avanzar automáticamente al siguiente ítem de la cola

**Listo cuando:** confirmar avanza al siguiente ítem sin recargar la pantalla.

### Historia [ROS-47](02-historias-de-usuario.md#ros-47) · Atajos de teclado (J/K, A, E, R)
Feature: `007-revision-humana` · 1 tarea(s) · 6 h

<a id="ros-160"></a>
#### ROS-160 · Implementar navegación por teclado J/K/A/E/R
Frontend · **6 h** · Sprint 4

- [ ] Manejador global de teclas en la pantalla de Revisión
- [ ] J/K navegar, A aceptar, E editar, R rechazar
- [ ] Desactivar los atajos dentro de campos de texto
- [ ] Overlay de ayuda con "?"
- [ ] Verificar que no rompen la navegación con Tab

**Listo cuando:** se puede revisar una cola completa sin tocar el mouse.

### Historia [ROS-48](02-historias-de-usuario.md#ros-48) · Diferenciar "Alta · sin validar" de "Confirmada"
Feature: `007-revision-humana` · 1 tarea(s) · 6 h

<a id="ros-161"></a>
#### ROS-161 · Unificar la semántica de estados en backend y UI
Frontend · **6 h** · Sprint 4

- [ ] Auditar todos los lugares donde se muestra el estado de una columna
- [ ] Asegurar que un pendiente muestra "Alta · sin validar"
- [ ] Reservar "Confirmada" al estado posterior a la validación humana
- [ ] Actualizar textos y chips en las 5 pantallas
- [ ] Prueba de regresión que recorre las pantallas comparando el estado

**Listo cuando:** ninguna pantalla presenta como confirmado algo que nadie validó.

---

<a id="sprint-5"></a>
## Sprint 5 · Catálogo y Panorama — 79 h

### Historia [ROS-37](02-historias-de-usuario.md#ros-37) · Dashboard de cobertura por nivel de confianza
Feature: `009-panorama` · 2 tarea(s) · 14 h

<a id="ros-146"></a>
#### ROS-146 · API de métricas de cobertura
Backend · **6 h** · Sprint 5

- [ ] Endpoint GET /api/projects/:id/coverage
- [ ] Agregado de columnas por nivel de confianza
- [ ] Desglose por tabla y por dominio
- [ ] Caché con invalidación al confirmar
- [ ] Pruebas de exactitud de los totales

**Listo cuando:** la suma por nivel coincide exactamente con el total de columnas.

<a id="ros-147"></a>
#### ROS-147 · UI del dashboard de cobertura
Frontend · **8 h** · Sprint 5

- [ ] Gráfico de distribución por nivel de confianza
- [ ] Vista global y desglose por tabla
- [ ] Leyenda accesible (no sólo color)
- [ ] Clic en un nivel lleva al catálogo filtrado
- [ ] Estado vacío cuando aún no hay fuentes

**Listo cuando:** el panorama muestra la mezcla honesta de niveles, no todo confirmado.

### Historia [ROS-38](02-historias-de-usuario.md#ros-38) · Widget de fuentes recolectadas
Feature: `009-panorama` · 1 tarea(s) · 4 h

<a id="ros-148"></a>
#### ROS-148 · Widget de fuentes recolectadas en el panorama
Frontend · **4 h** · Sprint 5

- [ ] Tarjeta con la lista de fuentes y su estado
- [ ] Indicador de la cobertura aportada por cada una
- [ ] Enlace al panel de fuentes completo
- [ ] Estado vacío con acción de cargar fuente

**Listo cuando:** desde el panorama se ve qué evidencia se tiene y qué falta.

### Historia [ROS-39](02-historias-de-usuario.md#ros-39) · Cola por impacto en el panorama
Feature: `009-panorama` · 1 tarea(s) · 5 h

<a id="ros-149"></a>
#### ROS-149 · Widget de cola prioritaria en el panorama
Frontend · **5 h** · Sprint 5

- [ ] Mostrar el top de la cola ordenado por impacto
- [ ] Clic en un ítem abre su ficha en Revisión
- [ ] Mantenerlo sincronizado con la cola del motor
- [ ] Estado vacío "no hay nada pendiente"

**Listo cuando:** el panorama es el punto de entrada natural al trabajo de revisión.

### Historia [ROS-40](02-historias-de-usuario.md#ros-40) · Resumen de hallazgos abiertos
Feature: `009-panorama` · 1 tarea(s) · 5 h

<a id="ros-150"></a>
#### ROS-150 · Widget de hallazgos abiertos en el panorama
Frontend · **5 h** · Sprint 5

- [ ] Contar los hallazgos abiertos por severidad
- [ ] Enlazar a la pantalla de Hallazgos
- [ ] Refrescar el conteo al resolver un hallazgo
- [ ] Estado vacío sin hallazgos

**Listo cuando:** el panorama avisa de los problemas abiertos sin entrar al detalle.

> ⚠️ En el MVP la fuente de hallazgos es mínima (conflictos abiertos y columnas Desconocidas); el informe completo llega en Fase 2 con la épica E6.

### Historia [ROS-50](02-historias-de-usuario.md#ros-50) · Vista tabla-por-tabla y columna-por-columna
Feature: `008-catalogo` · 2 tarea(s) · 22 h

<a id="ros-162"></a>
#### ROS-162 · API del catálogo (tablas y columnas)
Backend · **8 h** · Sprint 5

- [ ] Endpoint GET /api/projects/:id/tables
- [ ] Endpoint GET /api/tables/:id/columns
- [ ] Paginación y ordenamiento
- [ ] Incluir nivel de confianza y significado por columna
- [ ] Pruebas de rendimiento con muchas columnas

**Listo cuando:** el catálogo de una tabla grande responde sin degradarse.

<a id="ros-163"></a>
#### ROS-163 · Implementar la pantalla de Catálogo
Frontend · **14 h** · Sprint 5

- [ ] Listado de tablas del proyecto
- [ ] Vista columna por columna de una tabla (ej. MOV0010)
- [ ] Navegación entre tablas sin perder el contexto
- [ ] Virtualización de listas largas
- [ ] Estados vacío y de carga
- [ ] Pruebas de navegación

**Listo cuando:** se recorre el catálogo completo y cada columna muestra su nivel.

### Historia [ROS-51](02-historias-de-usuario.md#ros-51) · Chips de confianza diferenciados
Feature: `008-catalogo` · 1 tarea(s) · 5 h

<a id="ros-164"></a>
#### ROS-164 · Implementar el chip de confianza en todas las vistas
Frontend · **5 h** · Sprint 5

- [ ] Variante relleno de acento = Confirmada
- [ ] Variante contorno = Alta · sin validar
- [ ] Variante relleno tenue = Inferida; neutro = Hipótesis
- [ ] Añadir icono o texto para no depender solo del color
- [ ] Aplicar el chip en catálogo, cola, ficha y panorama
- [ ] Verificar contraste de cada variante

**Listo cuando:** el nivel de una columna se distingue de un vistazo y sin color.

### Historia [ROS-52](02-historias-de-usuario.md#ros-52) · Rastro de evidencia por columna
Feature: `008-catalogo` · 1 tarea(s) · 8 h

<a id="ros-165"></a>
#### ROS-165 · UI del rastro de evidencia en el catálogo
Frontend · **8 h** · Sprint 5

- [ ] Panel lateral o fila expandible por columna
- [ ] Listar las fuentes que sustentan el significado
- [ ] Enlazar a las citas verificables
- [ ] Explicar por qué está en ese nivel
- [ ] Pruebas de apertura y cierre del panel

**Listo cuando:** desde el catálogo se llega a la evidencia sin pasar por Revisión.

### Historia [ROS-54](02-historias-de-usuario.md#ros-54) · Convención única de nombres en toda la app
Feature: `008-catalogo` · 1 tarea(s) · 6 h

<a id="ros-166"></a>
#### ROS-166 · Centralizar identificadores y auditar inconsistencias de nombres
Frontend · **6 h** · Sprint 5

- [ ] Definir la fuente única de verdad de los nombres de tablas y columnas
- [ ] Auditar cola, catálogo, hallazgos y generador
- [ ] Eliminar literales divergentes y datos de ejemplo hardcodeados
- [ ] Prueba de regresión que compara los nombres entre pantallas

**Listo cuando:** las cuatro pantallas nombran el mismo esquema de forma idéntica.

### Historia [ROS-55](02-historias-de-usuario.md#ros-55) · Estado compartido entre catálogo, cola y revisión
Feature: `008-catalogo` · 1 tarea(s) · 10 h

<a id="ros-167"></a>
#### ROS-167 · Implementar store compartido y sincronización de estado
Frontend · **10 h** · Sprint 5

- [ ] Definir el store central del estado del proyecto
- [ ] Invalidar y refrescar los datos afectados tras confirmar
- [ ] Actualización optimista con reconciliación al responder el servidor
- [ ] Evitar estados divergentes entre catálogo, cola y revisión
- [ ] Pruebas: confirmar en Revisión y verificar el cambio en Catálogo

**Listo cuando:** confirmar una columna la deja como Confirmada en todas las pantallas al instante.

