# Seguridad y autenticación

> Cómo se cumplen las historias ROS-84, ROS-89…93 y los RNF-01…09, 36–38. Decisión estructural: [ADR-0006](adr/ADR-0006-autenticacion-oauth-jwt-cookies.md).

## 1. Modelo de amenazas (resumen)

| Activo | Amenaza | Control |
|---|---|---|
| Esquemas y muestras del cliente | Otro usuario accede a un proyecto ajeno | Filtro por propietario en QuerySets, UUID, 404 para ajenos, pruebas de acceso cruzado (ROS-178) |
| Sesión del usuario | Robo de token vía XSS | Tokens en cookies `httpOnly`; CSP estricta; React escapa por defecto; prohibido `dangerouslySetInnerHTML` |
| Sesión del usuario | CSRF | `SameSite=Lax` + token CSRF de doble envío en mutaciones |
| Sesión del usuario | Robo de refresh token | Rotación en cada uso + detección de reuso → revocación de la familia |
| Flujo OAuth | Interceptación del código, CSRF de login, redirect abierto | PKCE (S256), `state`, `nonce` (OIDC), redirect URIs en lista blanca (ROS-189) |
| Secretos | Filtrado en el repositorio o logs | Variables de entorno, `gitleaks`, filtros de logs (ROS-190) |
| Archivos subidos | Archivo malicioso / enorme | Límite de tamaño, extensión y tipo; se procesan como texto, nunca se ejecutan; nombre aleatorio en almacenamiento |
| Datos en tránsito | Escucha | HTTPS obligatorio + HSTS (ROS-179) |
| Datos en reposo | Robo de disco/copia | Cifrado de volumen y backups del proveedor (ROS-179) |

## 2. Flujo de inicio de sesión (OAuth 2.0 / OIDC + PKCE)

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuario
    participant F as Frontend (Next.js)
    participant B as Backend (Django + allauth)
    participant P as Proveedor (Google / Microsoft)
    U->>F: Clic "Continuar con Google"
    F->>B: GET /auth/google/login?next=/projects
    B->>B: genera state, nonce, code_verifier (sesión temporal firmada)
    B-->>U: 302 → P /authorize?code_challenge=S256…&state…&scope=openid email profile
    U->>P: consiente
    P-->>U: 302 → /auth/google/callback?code…&state…
    U->>B: GET /auth/google/callback
    B->>B: valida state (anti-CSRF) y redirect URI
    B->>P: POST /token (code + code_verifier)
    P-->>B: id_token + access_token
    B->>B: valida firma, iss, aud, exp, nonce del id_token
    B->>B: crea o recupera User por (proveedor, sub); primer inicio → onboarding pendiente
    B->>B: crea AuthSession, emite cookies rosetta_access + rosetta_refresh
    B-->>U: 302 → /onboarding o /projects
```

- La parte OAuth (state, PKCE, validación OIDC) la hace **django-allauth** (`socialaccount` con `OAUTH_PKCE_ENABLED=True`). El backend **no** reimplementa criptografía.
- Tras el login de allauth, un adaptador (`accounts.adapters.SocialAccountAdapter`) crea la `AuthSession`, emite las cookies propias y **cierra la sesión de Django** (no quedan dos mecanismos de sesión activos).
- Scopes: solo `openid email profile` (RNF-36, ROS-101).
- Identidad: se vincula por **(proveedor, `sub`)**. Si llega un correo ya registrado con otro proveedor, en el MVP **no** se vincula automáticamente: se muestra error `account_exists_other_provider` (la vinculación es ROS-98, Fase 3). `[NECESITA ACLARACIÓN]` [DP-014](../07-registro/02-decisiones-pendientes.md).
- Solo se aceptan correos **verificados** por el proveedor (`email_verified=true`).
- Cancelar el consentimiento → `/auth/error?code=oauth_denied` con mensaje claro y botón para reintentar (sin pantalla en blanco ni bucle).

## 3. Sesión y tokens (ROS-92, ROS-187, ROS-188)

| Elemento | Valor |
|---|---|
| Access token | JWT HS256 firmado con `JWT_SIGNING_KEY`; `sub`=user id, `sid`=session id, `exp` = **15 min** |
| Cookie de access | `rosetta_access`; `HttpOnly; Secure; SameSite=Lax; Path=/` |
| Refresh token | **Opaco**, 256 bits aleatorios (`secrets.token_urlsafe(32)`); en BD solo su **SHA-256** (`AuthSession.refresh_token_hash`) |
| Cookie de refresh | `rosetta_refresh`; `HttpOnly; Secure; SameSite=Lax; Path=/auth` |
| Vida del refresh | **14 días** deslizante, máximo absoluto 30 días *(provisional)* |
| Rotación | Cada `POST /auth/refresh` emite un refresh nuevo y marca el anterior como usado (`rotated_at`) |
| Reuso | Presentar un refresh ya rotado → se revocan **todas** las sesiones de esa familia (`family_id`) y `401` |
| Logout | `POST /auth/logout` → `revoked_at = now`, cookies borradas; el access vigente caduca en ≤ 15 min y además se rechaza porque su `sid` está revocado (el middleware comprueba `sid` contra caché Redis de sesiones revocadas) |
| CSRF | Cookie `csrftoken` (no httpOnly) + cabecera `X-CSRFToken` en `POST/PATCH/DELETE`; la clase de autenticación por cookie aplica `CsrfViewMiddleware` |

Cliente (ROS-188): el JS no lee tokens; ante `401` llama una vez a `/auth/refresh`; si falla, redirige a `/login?next=<ruta actual>`. `middleware.ts` de Next redirige a `/login` si no hay cookie `rosetta_refresh`.

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
| `Content-Security-Policy` | `default-src 'self'; img-src 'self' data: https://lh3.googleusercontent.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; frame-ancestors 'none'; connect-src 'self'` *(ajustar en 001 si las fuentes se autoalojan)* |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `SECURE_PROXY_SSL_HEADER`, `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE` | activos en prod |
| `DEBUG` | `False` fuera de dev (prueba en CI que `prod.py` lo fuerza) |
| `ALLOWED_HOSTS`, `CSRF_TRUSTED_ORIGINS` | por entorno |

## 6. Secretos (ROS-182, ROS-190)

- Nunca en el repositorio. `.env` solo en local y en `.gitignore`; `.env.example` versionado **sin valores**.
- Lista de secretos: `DJANGO_SECRET_KEY`, `JWT_SIGNING_KEY`, `GOOGLE_CLIENT_ID/SECRET`, `MICROSOFT_CLIENT_ID/SECRET/TENANT`, `DATABASE_URL`, `REDIS_URL`, credenciales de almacenamiento, `SENTRY_DSN`.
- Rotación: `JWT_SIGNING_KEY` admite clave anterior durante 15 min (lista de claves de verificación) para rotar sin cerrar sesiones. Procedimiento en [08-infraestructura-y-entornos.md](08-infraestructura-y-entornos.md).
- `gitleaks` en pre-commit y CI.

## 7. Logs y privacidad

- Prohibido registrar: tokens, cookies, cabecera `Authorization`, códigos OAuth, correos, nombres, **valores de muestras** de clientes.
- Filtro de logging (`accounts.logging.RedactFilter`) que enmascara patrones de JWT y correos; prueba que ejecuta un login completo y busca esos patrones en los logs capturados (RNF-06).
- Sentry con `send_default_pii=False` y `before_send` que elimina cuerpos de petición.
- Muestras de datos: se guardan el tiempo necesario para perfilar y según la retención que se decida ([DP-013](../07-registro/02-decisiones-pendientes.md)). El perfil guarda agregados y **top valores**; en Fase 2 las columnas PII se enmascaran (ROS-85, RN-26).

## 8. Archivos subidos

- Extensiones permitidas: `.sql`, `.ddl`, `.txt` (DDL); `.csv` (muestras). Se valida además que el contenido sea texto decodificable.
- Tamaño máximo por archivo: `[PENDIENTE]` propuesta 20 MB DDL, 200 MB CSV ([DP-013](../07-registro/02-decisiones-pendientes.md)).
- Se almacenan con nombre aleatorio (UUID) bajo `projects/<project_id>/sources/`; el nombre original solo como metadato.
- Nunca se ejecuta el SQL: se **parsea** con sqlglot.
