# Research: Inicio de sesión con Google y Microsoft

**Feature**: [spec.md](spec.md) · **Plan**: [plan.md](plan.md) · **Fecha**: 2026-10-01

Las decisiones estructurales (Auth0, patrón BFF, JWT validado en Django, un solo rol) ya están tomadas en [ADR-0007](../../docs/03-arquitectura/adr/ADR-0007-autenticacion-auth0.md) y no se reabren aquí. Este documento resuelve lo que ese ADR deja sin concretar, deja constancia de qué se verificó contra las fuentes y qué queda como riesgo.

## Verificaciones externas realizadas

| # | Qué se verificó | Cómo | Resultado |
|---|---|---|---|
| V1 | Opciones de sesión del SDK `@auth0/nextjs-auth0` | Se descargó la versión publicada **4.31.0** y se leyeron sus tipos y su código | `session.rolling` (por defecto `true`), `session.absoluteDuration` (por defecto 3 días, en segundos), `session.inactivityDuration` (por defecto 1 día, en segundos), `session.cookie` (`sameSite`, `secure`, `path`, `domain`, `name`; `httpOnly` siempre activo). Cookie de sesión por defecto: `__session`. Cookie de transacción: prefijo `__txn_`, `sameSite=lax`, `maxAge` por defecto 1 h |
| V2 | Pruebas con un proveedor sin TLS | Tipos del SDK | Existe `allowInsecureRequests`; el SDK lo prohíbe si `NODE_ENV=production` |
| V3 | Hooks y rutas del SDK | Tipos del SDK | `onCallback(error, ctx, session) → NextResponse`, `beforeSessionSaved`, `routes`, `signInReturnToPath`, `authorizationParameters` (audiencia y scopes). El SDK valida `returnTo` como destino seguro y no reenvía `returnTo` como parámetro de autorización; el resto de parámetros de `/auth/login` (p. ej. `connection`) sí viajan al servidor de autorización |
| V4 | Compatibilidad de versiones | `peerDependencies` de 4.31.0 | `next ~15.5.9` (el proyecto tiene 15.5.26: compatible) y **`react ~19.1.2`** (el proyecto tiene **19.1.0: incompatible**) |
| V5 | PyJWT: clave desconocida | Documentación de PyJWT | `PyJWKClient` **vuelve a pedir el JWKS** cuando el `kid` no está y reintenta antes de fallar. Es el vector de R-02 |
| V6 | PyJWT: algoritmos | Documentación de PyJWT | `algorithms` es obligatorio y explícito; con una lista cerrada un token `alg: none` se rechaza |
| V7 | Acción post-login de Auth0 | Documentación de Auth0 | `api.access.deny(motivo)` corta el inicio de sesión; `api.accessToken.setCustomClaim(clave, valor)` exige claves con espacio de nombres (URL) |
| V8 | CSP con nonce en Next.js | Guía oficial (describe Next 16 con `proxy.ts`; en Next 15 el archivo es `middleware.ts`) | Con `default-src 'self'` y sin `script-src` los scripts en línea de Next quedan bloqueados; la vía recomendada es un nonce por petición en el middleware con `'strict-dynamic'`. Obliga a renderizado dinámico |
| V9 | Proveedor simulado para E2E | Paquete `oauth2-mock-server` 9.2.0 (MIT, Node `^22.12`) | Expone descubrimiento OIDC, JWKS, `authorize`, `token` y fin de sesión; soporta PKCE `S256` y `authorization_code` |

**No se pudo verificar y queda como riesgo:** ver la sección *Riesgos abiertos* al final.

## Decisiones

### R-01 · Validación del access token en Django

- **Decisión:** una clase de autenticación de DRF (`Auth0JWTAuthentication`) que usa **PyJWT** con `jwt.decode(...)`: `algorithms=["RS256"]` (lista cerrada, rechaza `none`), `audience` = audiencia de Rosetta API, `issuer` = emisor del tenant, `options={"require": ["exp", "iat", "iss", "aud", "sub"]}` y `leeway` de 10 s. Se exige `kid` en la cabecera y que sea una cadena corta antes de consultar claves. La autenticación devuelve la cabecera `WWW-Authenticate: Bearer` para que DRF responda **401** (no 403) cuando falta o falla la credencial.
- **Razón:** es lo que fija ADR-0007; la lista cerrada de algoritmos y los claims obligatorios cubren los casos maliciosos de ROS-181/189 (V6).
- **Alternativas:** `python-jose` (menos mantenida); `Authlib` (más superficie de la necesaria); `django-allauth` + JWT propios (descartada por ADR-0007).
- **Parámetros provisionales:** el `leeway` de 10 s es un valor técnico propio del plan, no un requisito de producto.

### R-02 · JWKS en caché y límite de recargas forzadas

- **Decisión:** un `PyJWKClient` por proceso con caché en memoria del conjunto de claves y tiempo de vida de 1 hora. Como ante un `kid` desconocido el cliente vuelve a descargar el JWKS (V5), se envuelve con un **límite de una recarga forzada por 60 s por proceso**; mientras dura el límite, un `kid` desconocido se rechaza (401) sin tocar la red. Una prueba envía `kid` aleatorios repetidos y comprueba que no genera más de una petición al JWKS.
- **Razón:** sin el límite, cualquiera podría provocar una petición al proveedor por cada solicitud con un `kid` inventado (denegación de servicio y coste). Redis no entra en la ruta de autenticación: si Redis cae, el acceso no debe caer con él. [07-seguridad §3](../../docs/03-arquitectura/07-seguridad-y-autenticacion.md) permite "Redis/memoria".
- **Alternativas:** caché en Redis compartida (más piezas en la ruta crítica); sin límite (vector de abuso).
- **Parámetros provisionales:** 60 s y 1 h son valores técnicos del plan.

### R-03 · Qué hace la autenticación con el usuario

- **Decisión:** tras validar el token, el *service* rechaza con 403 `email_not_verified` toda credencial cuyo claim `https://rosetta/email_verified` falte o no sea exactamente `true` (FR-004). Es defensa en profundidad: la Acción post-login del tenant ya deniega los correos no verificados, pero es un control manual y no versionado en el repositorio, y no puede ser el único. Después, `get_or_create_from_claims()` (un *service* de `accounts`, regla B1) busca por `auth0_sub`:
  1. **No existe:** si el correo ya pertenece a otro usuario → rechaza con 403 `account_exists_other_provider` (FR-009); si no, lo crea con contraseña inutilizable y onboarding pendiente (FR-005, FR-017). La creación va en una transacción; ante un `IntegrityError` por acceso simultáneo, vuelve a leer por `auth0_sub` y devuelve esa fila (FR-005).
  2. **Existe y está desactivado:** 403 `account_disabled` en esa misma petición, sin caché (FR-011).
  3. **Existe y está activo:** actualiza nombre y avatar solo si cambiaron; el correo también, **salvo que choque con otro usuario**: en ese caso conserva el anterior, deja entrar y registra un evento de seguridad sin datos personales (FR-007, FR-010).
- `last_login_at` se actualiza como máximo una vez por hora (diccionario de datos). Cada petición autenticada cuesta **una** consulta a la base de datos por `auth0_sub`.
- **Datos del proveedor fuera de rango:** el nombre se trunca a 200 caracteres; un avatar de más de 500 caracteres o que no sea `http(s)` se guarda como nulo (decisión técnica para no rechazar accesos por un dato opcional).
- **Razón:** una sola ruta de código para alta, reconocimiento y actualización; el orden de las comprobaciones evita crear usuarios que luego habría que desactivar.

### R-04 · Modelo de usuario

- **Decisión:** `accounts.User` sobre `AbstractBaseUser` (como fija el [diccionario de datos](../../docs/04-datos/02-diccionario-de-datos.md)), con `USERNAME_FIELD = "auth0_sub"`, `last_login = None` (se descarta el campo heredado: la fecha propia es `last_login_at`), contraseña siempre inutilizable y un manager sin `create_superuser`. `AUTH_USER_MODEL = "accounts.User"` se define **antes de la primera migración de `accounts`**.
- **Decisión sobre aplicaciones de Django:** **no** se añaden `django.contrib.auth`, `admin`, `sessions` ni `messages`. Con ADR-0007 no hay sesiones de servidor ni contraseñas, y [DP-024](../../docs/07-registro/02-decisiones-pendientes.md#dp-024) deja por defecto la consola administrativa sin exponer. Se mantiene `UNAUTHENTICATED_USER: None`; `IsAuthenticated` tolera `request.user = None`. El comentario de `config/settings/base.py` que dice lo contrario es anterior a ADR-0007 y se corrige en la implementación.
- **Si [DP-024](../../docs/07-registro/02-decisiones-pendientes.md#dp-024) se decide por la opción B** (consola interna), se reabre este punto: harían falta `auth`, `admin`, `sessions` y `messages`.
- **Riesgo:** `AbstractBaseUser` sin `django.contrib.auth` instalado debe comprobarse en la primera prueba roja (migración limpia y creación de un usuario). Si fallara, se instala solo `django.contrib.auth` sin `admin`.

### R-05 · Configuración del SDK de Auth0 en Next.js

- **Decisión:** un único `Auth0Client` en `src/lib/auth0.ts` con:
  - `authorizationParameters`: `audience` = `AUTH0_AUDIENCE`, `scope` = `openid profile email offline_access` (RNF-36).
  - `session`: `rolling: true`, `inactivityDuration` = 1 209 600 s (14 días), `absoluteDuration` = 2 592 000 s (30 días) (FR-024, **provisional por [DP-022](../../docs/07-registro/02-decisiones-pendientes.md#dp-022)**), `cookie`: `sameSite: "lax"`, `secure` activo salvo en desarrollo local (V1; `httpOnly` ya es siempre cierto).
  - `transactionCookie.maxAge` = 600 s: una solicitud de acceso iniciada caduca a los 10 minutos (el valor por defecto es 1 h; respuesta a CHK005).
  - `signInReturnToPath: "/"`; `routes` sin personalizar (`/auth/login`, `/auth/logout`, `/auth/callback`).
  - `onCallback`: ver R-07.
  - `allowInsecureRequests` solo si la variable de pruebas lo pide **y** `NODE_ENV` no es `production` (V2).
- **Alineación con el tenant:** el refresh token del tenant tiene 14 días de inactividad y 30 de máximo ([08-infraestructura §4](../../docs/03-arquitectura/08-infraestructura-y-entornos.md)); la sesión del SDK usa los mismos plazos para que ninguna de las dos capas caduque antes que la otra.
- **Razón:** reutiliza el SDK sin envolverlo (Constitución VI); `returnTo` ya se valida como destino seguro (V3), y se añade una prueba propia de que un destino externo se ignora (FR-015).

### R-06 · Dónde se protege cada ruta y a dónde se redirige

- **Decisión:** `src/middleware.ts` ejecuta `auth0.middleware(request)` (monta `/auth/*` y renueva la sesión) y después aplica las reglas de acceso:
  - Públicas: `/login`, `/auth/error`, `/auth/denied` (R-07), `/auth/*` del SDK, `/api/*` (el *route handler* responde por sí mismo, ver R-08) y los recursos estáticos de `_next`.
  - El resto exige sesión. **Sin sesión → `/login?returnTo=<ruta pedida>`** (pantalla de acceso de Rosetta con Nocturne).
  - Con sesión, `/login` redirige a `/` (R-09).
- **Desviación respecto a `docs/`:** [04-frontend §4](../../docs/03-arquitectura/04-frontend.md), [07-seguridad §3](../../docs/03-arquitectura/07-seguridad-y-autenticacion.md) y ROS-188 dicen redirigir a `/auth/login?returnTo=`. Esa ruta, sin `connection`, abre la pantalla alojada por Auth0 y no la de Rosetta, lo que contradice FR-002 y FR-040. Por eso **el plan usa `/login?returnTo=`**; los botones de `/login` reenvían `returnTo` a `/auth/login?connection=…&returnTo=…`. Resuelto por CD-007 (ver *Desviaciones* en [plan.md](plan.md)).

### R-07 · Errores de acceso y cómo llegan a la pantalla de error

- **Decisión:** dos caminos, ambos terminan en `/auth/error?code=<código>` con "Volver a intentar" hacia `/login` conservando `returnTo` si es un destino interno (CHK033):
  1. **Antes de crear la sesión** (cancelación, proveedor caído, Acción que deniega por correo no verificado o ausente): el hook `onCallback` recibe el error y redirige a `/auth/error`. Correspondencia: cancelación del usuario → `oauth_denied`; denegación de la Acción → `email_not_verified` o `email_missing`; cualquier otro fallo → `oauth_failed`. El código `account_*` y los nuevos son **provisionales hasta [DP-025](../../docs/07-registro/02-decisiones-pendientes.md#dp-025)**.
  2. **Después de crearla** (Django responde 403 `account_exists_other_provider`, `account_disabled`, `email_missing` o `email_not_verified`): hay una sesión válida en el SDK, así que sin más la persona entraría en un bucle (`/login` → `/` → 403 → error → `/login`). El servidor lleva a un *route handler* `/auth/denied?code=…` que guarda el código en una cookie efímera (60 s, `httpOnly`, `sameSite=lax`) y redirige a **`/auth/logout?returnTo=/auth/error`**; `/auth/error` consume la cookie y muestra el mensaje. Así el cierre de sesión usa un destino fijo y no se necesitan comodines en la lista blanca de Auth0.
- **Lista blanca de cierre de sesión resultante:** exactamente `{APP_BASE_URL}/login` y `{APP_BASE_URL}/auth/error`, sin comodines (FR-028).
- **Razón:** cumple FR-009, FR-011 y FR-039 sin bucles y sin depender de si Auth0 admite parámetros de consulta en `returnTo` (R-F).
- **`/auth/denied` solo acepta una lista cerrada de códigos**; cualquier otro valor se trata como `oauth_failed`.
- **Cierre de sesión siempre con `returnTo` = la URL absoluta de `/login`** (aclarado en T032, ver *Riesgos abiertos* R-D): si se invoca `/auth/logout` sin `returnTo`, el SDK usa la raíz de la aplicación, que **no** está en la lista blanca (solo `/login` y `/auth/error`), y el tenant rechazaría el cierre. Lo verificó la lectura del código del SDK 4.31.0 (`returnTo` por defecto = `appBaseUrl`). Por eso el enlace de cierre es `/auth/logout?returnTo=/login` y el proveedor simulado valida la lista blanca como lo haría el tenant, para que una prueba lo detecte.
- **De dónde sale `{proveedor}`:** los mensajes de FR-036 y FR-037 (y los de DP-025) nombran al proveedor, pero `/auth/error` solo recibe el código y el SDK no garantiza entregar el proveedor a `onCallback`. El botón de `/login` escribe, al pulsarlo, la cookie `rosetta_login_provider` (`google` o `microsoft`, lista cerrada, 600 s, sin datos sensibles, no `HttpOnly`) y la pantalla de error la lee; sin cookie o con un valor inválido usa la forma genérica. **Alternativas descartadas:** un parámetro `provider` en la URL de error (manipulable y expuesto en el historial) y una ruta nueva que fije el proveedor antes de ir al SDK (más piezas para el mismo resultado).

### R-08 · Proxy BFF `/api/*`

Contrato completo en [contracts/bff-proxy.md](contracts/bff-proxy.md). Decisiones de fondo:

- Un *route handler* `src/app/api/[...path]/route.ts` (runtime Node, siempre dinámico) para `GET`, `POST`, `PATCH`, `PUT` y `DELETE`. Obtiene el token con `auth0.getAccessToken()` y reenvía a `BACKEND_INTERNAL_URL` con `Authorization: Bearer`.
- **Se eliminan** los `rewrites` de `/api` y `/auth` de `next.config.ts` (ROS-183 pide quitar el de `/auth`; el de `/api` dejaría un camino que reenvía sin pasar por el handler). La prueba existente `tests/unit/next-config.test.ts` se reescribe para comprobar justamente eso.
- **Lista de permitidos en ambos sentidos:** solo se reenvían cabeceras conocidas; **nunca** `cookie` ni un `authorization` del navegador; de la respuesta se descarta `set-cookie`.
- **Saneamiento de la ruta:** se rechazan segmentos vacíos, `.` y `..`, o barras codificadas, para que no se pueda salir de `/api/*` hacia otras rutas del backend.
- **Anti-CSRF:** en `POST/PUT/PATCH/DELETE` se exige que `Origin` coincida con el origen de `APP_BASE_URL`; si falta `Origin` se usa `Sec-Fetch-Site: same-origin`; si no, 403 (FR-031, RNF-08).
- **Sesión vencida o sin renovar → 401 `session_expired`.** Si Auth0 no responde al renovar → **503 `identity_unavailable`** y la sesión no se toca (CHK032).
- `/api/health` y `/api/schema/` (únicas excepciones públicas, FR-012) pasan sin token.
- Los registros del handler incluyen método, ruta sin cadena de consulta, estado y `request_id`; nunca cuerpos, cabeceras ni la consulta (FR-033).

### R-09 · Pantalla de destino y guarda de onboarding

- **Decisión:** tras el acceso, el destino por defecto es `/` y un componente de servidor lo resuelve: usuario con onboarding pendiente → `/onboarding`; en otro caso → `/projects` (CHK010). La guarda de FR-018 vive en el `layout` del grupo `(app)`: un componente de servidor consulta `/api/me` y redirige a `/onboarding` si está pendiente, y de `/onboarding` a `/projects` si ya está completado.
- **Limitación aceptada:** un `layout` de App Router no se vuelve a ejecutar en navegaciones del lado del cliente entre páginas que lo comparten; la guarda actúa en cada carga completa o apertura por enlace directo, que es el caso de FR-018. Durante el onboarding no hay navegación visible; una prueba E2E abre rutas privadas directamente.
- **`POST /api/me/onboarding/complete`** es idempotente y **no** comprueba que exista un proyecto: esa comprobación obligaría a `accounts` a depender de `projects` (003), invirtiendo la dependencia. La UI lo llama tras crear el primer proyecto con éxito.

### R-10 · Cabeceras de seguridad

- **Next.js:** nonce por petición generado en `middleware.ts` y `Content-Security-Policy` con `default-src 'self'`, `script-src 'self' 'nonce-…' 'strict-dynamic'` (más `'unsafe-eval'` solo en desarrollo, V8), `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`, `font-src 'self' https://fonts.gstatic.com`, `img-src` con los orígenes de avatar de [07-seguridad §5](../../docs/03-arquitectura/07-seguridad-y-autenticacion.md), `connect-src 'self'`, `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'`. Las demás (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, y `Strict-Transport-Security` solo en producción) se declaran en `next.config.ts`.
- **Django (respuestas JSON):** un middleware mínimo en `apps/core` añade `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'`; el resto ya está en `settings` (nosniff, `X-Frame-Options`, política de referencia, HSTS en producción). Sin dependencia nueva (Constitución VI).
- **Desviación respecto a `docs/`:** la CSP escrita en [07-seguridad §5](../../docs/03-arquitectura/07-seguridad-y-autenticacion.md) no tiene `script-src` y, con `default-src 'self'`, bloquearía los scripts en línea de Next. Resuelto por CD-007.

### R-11 · Registros sin datos sensibles

- **Decisión:** un filtro de `logging` (`accounts.logging.RedactFilter`) enmascara patrones de JWT y de correo en el mensaje, los argumentos y el texto de excepciones, y se asocia a todos los *handlers* de `LOGGING`. Los eventos de seguridad salen por un registrador propio (`rosetta.security`) con campos cerrados: `event`, `reason`, `user_id`, `path` (CHK003). Sin formateador JSON nuevo: el formato JSON y Sentry pertenecen a observabilidad, fuera de esta feature.
- **Prueba:** ejecutar un flujo autenticado con captura de registros y comprobar que no aparece ningún patrón de JWT ni de correo (SC-008).

### R-12 · Abuso, sesiones simultáneas y cierre de sesión forzado

- **Intentos repetidos de acceso (CHK004):** las contraseñas no existen; la protección contra automatización y fuerza bruta es de **Auth0 Attack Protection**. No se añade limitación propia en Django salvo el límite de recargas del JWKS (R-02). El estado de esas protecciones es un punto de la lista de comprobación de configuración (FR-035).
- **Sesiones simultáneas (CHK008):** permitidas sin límite (el backend no guarda sesiones). El cierre de sesión en todos los dispositivos es ROS-103 (Fase 3).
- **Cierre de sesión provocado por un tercero (CHK007):** `/auth/logout` es una navegación GET del SDK, así que otro sitio puede provocar un cierre de sesión. El impacto es solo tener que volver a entrar y no modifica datos; **riesgo aceptado para el MVP**, anotado para que `/speckit-analyze` y la verificación lo vean.
- **Correo registrado con otro proveedor (CHK006):** el aviso no nombra el proveedor y solo se llega a él tras autenticarse con un correo verificado, de modo que quien lo ve controla ese correo.

### R-13 · Proveedor simulado y pruebas E2E

- **Decisión:** Playwright con `@axe-core/playwright`, y `oauth2-mock-server` como **dependencia de desarrollo** que hace de proveedor de identidad en E2E (V9). Se configura el tenant de pruebas apuntando al mock; el backend acepta `AUTH0_ISSUER` y `AUTH0_JWKS_URL` como sobreescrituras **solo fuera de producción** (`settings/prod.py` exige `https` y una prueba lo verifica). El mock emite tokens con los claims con espacio de nombres y permite simular cancelación y denegación mediante sus enganches de redirección.
- **Alcance de E2E-01 en 002:** la creación del proyecto del onboarding pertenece a la feature 003; hasta que exista, el E2E intercepta `/api/projects` con una respuesta simulada del navegador. El recorrido completo se activa cuando 003 se fusione y queda como dependencia explícita.
- **Pruebas del backend sin red:** las claves RSA se generan en la prueba (`cryptography` llega con `pyjwt[crypto]`) y el cliente JWKS se sustituye; no hay llamadas al tenant real.
- **Razón:** social login real (Google, Microsoft) no se puede automatizar ni debe usar cuentas reales (Constitución V, RNF-38); el mock permite ejercitar el SDK de verdad.
- **Alternativas:** `node-oidc-provider` (más completo, más pesado); sustituir el SDK por un doble en pruebas (no ejercitaría PKCE/`state`); un acceso "de pruebas" dentro de la aplicación (descartado: sería una puerta trasera en el código de producción).

### R-14 · Dependencias nuevas y subida de React

| Dependencia | Dónde | Por qué | Decisión sobre alternativas |
|---|---|---|---|
| `pyjwt[crypto]` | backend | Validar el JWT (R-01) | Citada en ADR-0007 |
| `@auth0/nextjs-auth0` 4.31 | frontend | Flujo OIDC, PKCE, `state`, sesión cifrada | ADR-0007 |
| `react` y `react-dom` ≥ 19.1.2 (hoy 19.1.0) | frontend | Lo exige el SDK (V4); es un parche dentro de React 19 | Sin cambio de versión mayor; no requiere ADR |
| `@playwright/test`, `@axe-core/playwright` | frontend (dev) | E2E y accesibilidad, ya previstos en [01-estrategia-de-pruebas](../../docs/06-calidad/01-estrategia-de-pruebas.md) | — |
| `oauth2-mock-server` | frontend (dev) | Proveedor simulado (R-13) | Herramienta de pruebas, no se despliega |

## Riesgos abiertos

| Riesgo | Qué podría fallar | Mitigación |
|---|---|---|
| R-A | El SDK podría no aceptar un `domain` con `http://localhost:…` aunque `allowInsecureRequests` esté activo | **Cerrado (T032, 2026-10-14):** con `allowInsecureRequests` el SDK acepta `http://localhost:4010` y deriva el emisor **con barra final** (`http://localhost:4010/`, como Auth0). El mock se arranca con `shouldIssuerUrlBeSuffixedWithATralingSlash` y el backend de E2E usa `AUTH0_ISSUER` con barra final. Ida y vuelta completa (PKCE `S256`, `state`, `connection`, `audience`, scopes, cookie `__session` `HttpOnly` y `SameSite=Lax`) comprobada en `tests/e2e/smoke-idp.spec.ts` |
| R-B | La forma exacta en que el SDK entrega los errores a `onCallback` (código y descripción de la denegación de la Acción) no se pudo comprobar sin ejecutarlo | **Cerrado (T032, lectura del código del SDK 4.31.1):** un error en el *callback* llega como `AuthorizationError` con `cause = OAuth2Error{ code: <error>, message: <error_description> }`. Cancelar y la denegación de la Acción llegan ambos como `access_denied`; la Acción pone su motivo (`email_not_verified`, `email_missing`) en `error_description`. Un `state` ausente o distinto llega como `MissingStateError`/`InvalidStateError`. Correspondencia de R-07: `access_denied` con motivo de la Acción → ese código; otro `access_denied` → `oauth_denied`; el resto → `oauth_failed` (T077 lo prueba) |
| R-C | `middleware.ts` debe devolver a la vez la respuesta de `auth0.middleware` y las cabeceras de CSP | Prueba unitaria del middleware que comprueba que las cabeceras de CSP están en la respuesta del SDK |
| R-D | Que Auth0 acepte `returnTo` de cierre de sesión sin comodines y sin consulta | El diseño de R-07 usa destinos fijos; se verifica en el quickstart. **Observado en T032:** el SDK reenvía `returnTo` sin cambiarlo como `post_logout_redirect_uri`; con una ruta relativa (`/login`) el proveedor no la reconoce y la lista blanca (URLs absolutas) la rechazaría. Por eso el enlace de cierre y `/auth/denied` usan la URL absoluta (`{APP_BASE_URL}/login`, `{APP_BASE_URL}/auth/error`); el destino sigue siendo `/login` como dice 07-seguridad §3 |
| R-E | Semántica exacta de `lifespan` y de la caché del `PyJWKClient` entre versiones | La prueba de R-02 mide peticiones reales al cliente simulado, no se apoya en la documentación |
| R-F | Que la Acción post-login también se ejecute al renovar con el refresh token (la actualización de nombre y avatar depende de ello) | Se comprueba en el tenant de desarrollo (quickstart, V6) |
| R-G | El SDK no puede guardar una sesión renovada desde un componente de servidor; con la rotación de refresh tokens, la siguiente renovación reutilizaría el refresh token viejo y el tenant cerraría la sesión (detectado al implementar T041, 2026-10-14) | **Mitigado:** el middleware renueva con `auth0.getAccessToken(request, response)`, guarda la sesión en la respuesta y la pasa a la petición; páginas (`currentUser.ts`) y proxy ya la reciben fresca y no renuevan. Prueba en `tests/unit/middleware.test.ts`; la E2E de sesión (T058) cruza varios vencimientos |
