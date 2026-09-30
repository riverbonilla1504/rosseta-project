# ADR-0006 · Autenticación: allauth (OAuth/OIDC + PKCE) + JWT en cookies httpOnly detrás del proxy de Next.js

- **Estado:** Reemplazado por [ADR-0007](ADR-0007-autenticacion-auth0.md) (2026-09-30, CD-004)
- **Fecha:** 2026-09-29
- **Relacionado:** ROS-89…93, ROS-180…190, RNF-07, RNF-08, [07-seguridad-y-autenticacion.md](../07-seguridad-y-autenticacion.md)

## Contexto
Las historias exigen inicio de sesión con Google y Microsoft (ROS-90), PKCE/state/redirect URIs (ROS-93), access y refresh tokens con renovación silenciosa y revocación (ROS-92) y guardar solo el hash del refresh (ROS-187). El frontend es Next.js y el backend Django en otro proceso.

## Decisión
1. **django-allauth** (`socialaccount`, PKCE activado) gestiona el flujo OAuth/OIDC: `state`, `nonce`, `code_verifier`, validación del `id_token`.
2. Tras el login, `accounts` emite credenciales propias:
   - **access**: JWT de 15 min firmado con `JWT_SIGNING_KEY`;
   - **refresh**: token **opaco** aleatorio, guardado como SHA-256 en `AuthSession`, rotado en cada uso con detección de reuso.
3. Ambos viajan en **cookies `httpOnly; Secure; SameSite=Lax`**. Las mutaciones llevan token CSRF de doble envío.
4. El navegador solo habla con **el origen de Next.js**, que reenvía `/api` y `/auth` al backend (rewrites). Sin CORS.

## Alternativas
| Opción | Por qué no |
|---|---|
| Sesiones de Django (cookie `sessionid`) sin JWT | Más simple y también segura. Se descarta porque las historias piden access/refresh explícitos y sesiones revocables por dispositivo (ROS-103). *Si el equipo prefiere simplicidad es la alternativa natural; requeriría un CD sobre ROS-92/187* |
| NextAuth/Auth.js en el frontend | Duplica la identidad en dos sistemas; el backend es la fuente de verdad del usuario |
| Tokens en `localStorage` | Expuestos a XSS |
| Auth0 / Clerk | Servicio externo y costo; prohibido sin ADR (Constitución VI) |
| Refresh como JWT con lista negra de SimpleJWT | SimpleJWT guarda el token completo, no su hash (contradice ROS-187) |

## Consecuencias
- (+) Cumple los criterios de ROS-92/93 y RNF-07/08.
- (+) Base para MFA (ROS-97), sesiones por dispositivo (ROS-103) y SSO (ROS-102) con allauth.
- (−) Código propio para emisión y rotación de sesiones (acotado, con pruebas de seguridad).
- (−) El proxy de Next.js es obligatorio en todos los entornos.
