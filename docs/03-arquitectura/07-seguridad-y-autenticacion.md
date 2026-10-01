# Seguridad y autenticación

> Cómo se cumplen las historias ROS-84, ROS-89…93 y los RNF-01…09, 36–38. Decisión estructural: [ADR-0007](adr/ADR-0007-autenticacion-auth0.md) (Auth0; reemplaza a ADR-0006).

## 1. Modelo de amenazas (resumen)

| Activo | Amenaza | Control |
|---|---|---|
| Esquemas y muestras del cliente | Otro usuario accede a un proyecto ajeno | Filtro por propietario en QuerySets, UUID, 404 para ajenos, pruebas de acceso cruzado (ROS-178) |
| Sesión del usuario | Robo de token vía XSS | El navegador **nunca** recibe tokens: sesión en cookie cifrada httpOnly del SDK y proxy BFF (ROS-188); CSP estricta; prohibido `dangerouslySetInnerHTML` |
| Sesión del usuario | CSRF | Cookie `SameSite=Lax` + el proxy BFF rechaza mutaciones cuyo `Origin` no sea el de Rosetta |
| Sesión del usuario | Robo de refresh token | El refresh vive solo en la sesión cifrada del servidor de Next; rotación con detección de reuso activada en Auth0 |
| Flujo OAuth | Interceptación del código, CSRF de login, redirect abierto | PKCE (S256) y `state` del SDK de Auth0; callback, logout y orígenes en lista blanca del tenant, sin comodines (ROS-189) |
| API | Token falsificado o de otra aplicación | Django valida firma RS256 con JWKS del tenant, `iss`, `aud` = Rosetta API, `exp`, algoritmo y `kid` (ROS-181) |
| Tenant de Auth0 | Cambios no autorizados en la configuración | Acceso al panel con MFA; el MCP de Auth0 solo contra el tenant de **desarrollo** y con permisos mínimos |
| Secretos | Filtrado en el repositorio o logs | Variables de entorno, `gitleaks`, filtros de logs (ROS-190) |
| Archivos subidos | Archivo malicioso / enorme | Límite de tamaño, extensión y tipo; se procesan como texto, nunca se ejecutan; nombre aleatorio en almacenamiento |
| Datos en tránsito | Escucha | HTTPS obligatorio + HSTS (ROS-179) |
| Datos en reposo | Robo de disco/copia | Cifrado de volumen y backups del proveedor (ROS-179) |

## 2. Flujo de inicio de sesión (Auth0 + OIDC + PKCE)

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuario
    participant F as Next.js (SDK Auth0 + BFF)
    participant A as Auth0 (tenant Rosetta)
    participant P as Google / Microsoft
    participant D as Django (API)
    U->>F: Clic "Continuar con Google"
    F-->>U: 302 → A /authorize?connection=google-oauth2&code_challenge=S256…&state…&audience=Rosetta API
    U->>A: sigue
    A-->>U: 302 → P (login y consentimiento)
    P-->>A: identidad del usuario
    A->>A: Action post-login: añade email, nombre y avatar al access token
    A-->>U: 302 → /auth/callback?code…&state…
    U->>F: GET /auth/callback
    F->>A: POST /oauth/token (code + code_verifier)
    A-->>F: id_token + access_token (15 min) + refresh_token
    F->>F: valida state/id_token, guarda la sesión cifrada en cookie httpOnly
    F-->>U: 302 → /projects (o /onboarding)
    U->>F: GET /api/me (con la cookie de sesión)
    F->>D: GET /api/me · Authorization: Bearer <access_token>
    D->>D: valida JWT (RS256, JWKS, iss, aud, exp); crea el usuario local si es el primer acceso
    D-->>F: {id, email, full_name, onboarding_completed}
    F-->>U: respuesta
```

- El flujo OAuth (PKCE, `state`, `nonce`, validación del `id_token`) lo hace el **SDK de Auth0**. Rosetta **no** implementa criptografía.
- Proveedores: **Google** (`google-oauth2`) y **Microsoft** (DP-014). La base de datos de usuario/contraseña de Auth0 está **desactivada**.
- Scopes: `openid profile email offline_access`, con audiencia `AUTH0_AUDIENCE` (Rosetta API). Nada más (RNF-36, ROS-101).
- Identidad: el usuario local se vincula por **`auth0_sub`**. Si el correo ya existe con otro proveedor, Auth0 crea otra identidad; en el MVP **no** se vinculan automáticamente y Rosetta muestra el error `account_exists_other_provider` (la vinculación es ROS-98, Fase 3).
- Solo se aceptan correos **verificados** (la Action post-login rechaza `email_verified=false`).
- Cancelar el consentimiento o fallo del proveedor → `/auth/error?code=…` con mensaje claro y botón para reintentar (sin pantalla en blanco ni bucle).

## 3. Sesión y tokens (ROS-92, ROS-187, ROS-188)

| Elemento | Valor |
|---|---|
| Sesión | Cookie cifrada del SDK (`__session`), `HttpOnly; Secure; SameSite=Lax`; duración deslizante **14 días**, máximo **30 días** *(provisional)* |
| Access token | JWT **RS256** emitido por Auth0 para la API "Rosetta API"; vida **15 min** (configurado en la API del tenant). Solo existe en el servidor de Next.js |
| Refresh token | Lo guarda el SDK dentro de la sesión cifrada; **rotación y detección de reuso activadas** en la aplicación del tenant |
| Renovación | `auth0.getAccessToken()` renueva en silencio cuando el access vence |
| Logout | `/auth/logout` borra la sesión de Rosetta y cierra la de Auth0 (`returnTo` = `/login`). Los access tokens emitidos caducan en ≤ 15 min y el navegador nunca los tuvo |
| CSRF | El proxy BFF solo acepta `POST/PATCH/PUT/DELETE` si `Origin` coincide con `APP_BASE_URL` |
| Backend | Sin estado de sesión: cada petición trae su Bearer. JWKS en caché (Redis/memoria) con recarga ante `kid` desconocido |

Cliente (ROS-188): el navegador llama a `/api/*` del mismo origen; el *route handler* añade el token. Ante sesión vencida responde `401` y el cliente redirige a `/auth/login?returnTo=<ruta actual>`. El middleware del SDK protege las rutas de la app.

## 4. Autorización y aislamiento (ROS-84, ROS-178)

- MVP: **un rol** (propietario). Un usuario solo ve sus proyectos (RN-24).
- Implementación: todos los modelos con datos de cliente cuelgan de `Project`; sus QuerySets exponen `.for_user(user)` que filtra por `project__owner=user`. Las vistas **solo** usan esos QuerySets (regla B4 en [03-backend.md](03-backend.md)).
- Recurso ajeno → **404** con el mismo cuerpo que un recurso inexistente.
- Se registran los intentos denegados (nivel `WARNING`, sin PII: user id, ruta, recurso id).
- Suite `tests/security/test_cross_access.py`: crea dos usuarios y prueba **cada endpoint** con recursos del otro; debe estar 100 % en verde (RNF-03). Se genera la lista de endpoints desde el OpenAPI para que un endpoint nuevo sin prueba haga fallar el CI.

## 5. Cabeceras y configuración (ROS-190)

| Cabecera / ajuste | Valor |
|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` (prod) |
| `Content-Security-Policy` | `default-src 'self'; img-src 'self' data: https://lh3.googleusercontent.com https://s.gravatar.com https://*.auth0.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; frame-ancestors 'none'; connect-src 'self'` *(ajustar en 001 si las fuentes se autoalojan)* |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `SECURE_PROXY_SSL_HEADER`, `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE` | activos en prod |
| `DEBUG` | `False` fuera de dev (prueba en CI que `prod.py` lo fuerza) |
| `ALLOWED_HOSTS`, `CSRF_TRUSTED_ORIGINS` | por entorno |

## 6. Secretos (ROS-182, ROS-190)

- Nunca en el repositorio. `.env` solo en local y en `.gitignore`; `.env.example` versionado **sin valores**.
- Secretos: `DJANGO_SECRET_KEY`, `AUTH0_SECRET` (cifra la cookie de sesión), `AUTH0_CLIENT_SECRET`, `DATABASE_URL`, credenciales de almacenamiento, `SENTRY_DSN`. Los secretos de Google y Microsoft **se guardan en el panel de Auth0**, no en Rosetta.
- Rotación: `AUTH0_CLIENT_SECRET` se rota desde el panel (Auth0 permite dos secretos durante la transición); `AUTH0_SECRET` rotado cierra las sesiones activas (aceptable).
- `gitleaks` en pre-commit y CI.
- El MCP de Auth0 guarda su token en el llavero del sistema operativo; al terminar se ejecuta `npx @auth0/auth0-mcp-server logout`.

## 7. Logs y privacidad

- Prohibido registrar: tokens, cookies, cabecera `Authorization`, códigos OAuth, correos, nombres, **valores de muestras** de clientes (también en los logs del proxy BFF de Next).
- Filtro de logging (`accounts.logging.RedactFilter`) que enmascara patrones de JWT y correos; prueba que ejecuta peticiones autenticadas y busca esos patrones en los logs capturados (RNF-06).
- Sentry con `send_default_pii=False` y `before_send` que elimina cuerpos de petición.
- Muestras de datos: se guardan el tiempo necesario para perfilar y según la retención que se decida ([DP-013](../07-registro/02-decisiones-pendientes.md)). El perfil guarda agregados y **top valores**; en Fase 2 las columnas PII se enmascaran (ROS-85, RN-26).

## 8. Archivos subidos

- Extensiones permitidas: `.sql`, `.ddl`, `.txt` (DDL); `.csv` (muestras). Se valida además que el contenido sea texto decodificable.
- Tamaño máximo por archivo: `[PENDIENTE]` propuesta 20 MB DDL, 200 MB CSV ([DP-013](../07-registro/02-decisiones-pendientes.md)).
- Se almacenan con nombre aleatorio (UUID) bajo `projects/<project_id>/sources/`; el nombre original solo como metadato.
- Nunca se ejecuta el SQL: se **parsea** con sqlglot.
