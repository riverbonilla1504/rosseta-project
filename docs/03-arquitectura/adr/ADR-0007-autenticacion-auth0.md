# ADR-0007 · Autenticación con Auth0 (reemplaza a ADR-0006)

- **Estado:** Aceptado
- **Fecha:** 2026-09-30
- **Decisores:** responsable del proyecto (CD-004)
- **Reemplaza a:** [ADR-0006](ADR-0006-autenticacion-oauth-jwt-cookies.md)
- **Relacionado:** ROS-89…103 (E14), ROS-94 y ROS-105…110 (E15), ROS-180…190, RNF-07, RNF-08, Constitución V y VI, [DP-014](../../07-registro/02-decisiones-pendientes.md#dp-014)

## Contexto
ADR-0006 proponía hacer la autenticación nosotros con django-allauth, tokens JWT propios, refresh opaco con rotación y detección de reuso. Es mucho código delicado de seguridad que no es el diferencial de Rosetta. Además, las fases 2 y 3 piden MFA, verificación de correo, recuperación de contraseña, SSO empresarial, organizaciones y dominios permitidos, funciones que un proveedor de identidad ya ofrece.

## Decisión
1. **Auth0** es el proveedor de identidad. Tenant de desarrollo y, más adelante, uno de producción.
2. **Frontend:** `@auth0/nextjs-auth0` v4 (aplicación *Regular Web*). El SDK maneja el flujo OAuth/OIDC con PKCE y `state`, las rutas `/auth/login`, `/auth/logout`, `/auth/callback`, `/auth/profile` y `/auth/access-token`, y la sesión en una cookie cifrada httpOnly.
3. **Patrón BFF:** el navegador llama a `/api/*` en Next.js. Un *route handler* del servidor obtiene el access token con `auth0.getAccessToken()` y reenvía a Django con `Authorization: Bearer`. **El navegador nunca ve tokens.**
4. **Backend:** Django valida el access token de la API "Rosetta API" (RS256, JWKS del tenant en caché, `iss`, `aud`, `exp`) con PyJWT. No guarda sesiones ni refresh tokens. El usuario local se identifica por `auth0_sub` y se crea en el primer acceso.
5. **Proveedores:** Google y Microsoft (DP-014). La base de datos de contraseñas de Auth0 queda desactivada.
6. **Enriquecimiento:** una Action *post-login* añade email, nombre y avatar como claims del access token.
7. **Administración asistida:** el tenant de desarrollo se puede configurar con el servidor MCP oficial de Auth0 (`@auth0/auth0-mcp-server`) con los permisos mínimos. Las conexiones sociales se configuran en el panel, porque el MCP no las gestiona. **El MCP nunca se conecta al tenant de producción.**

## Alternativas
| Opción | Por qué no |
|---|---|
| django-allauth + JWT propios (ADR-0006) | Más código de seguridad propio; MFA, SSO y organizaciones quedan por construir |
| Clerk | Muy orientado a React/SPA; el B2B (organizaciones, SSO) también es de pago; menos maduro para validar desde Django |
| Keycloak (autoalojado) | Gratis y potente, pero es un servicio más que operar (Constitución VI) |
| WorkOS | Fuerte en SSO empresarial, pero sin plan gratis equivalente para usuarios B2C del MVP |

## Consecuencias
- (+) Se eliminan la tabla de sesiones, la rotación y la detección de reuso propias. Las tareas de autenticación del MVP bajan de **75 h a 56 h**; el ahorro grande llega en Fase 2–3 (ROS-95…103, 105…110 pasan a ser sobre todo configuración).
- (+) PKCE, `state`, rotación de refresh, MFA y SSO los mantiene un proveedor especializado.
- (−) **Dependencia de proveedor y costo:** el plan gratis cubre 25.000 MAU, conexiones sociales ilimitadas, **1 conexión empresarial** y 5 organizaciones. El SSO empresarial para varios clientes exige plan B2B (≈ USD 150/mes o más).
- (−) **Microsoft:** con cuentas personales se usa la conexión social de Microsoft. Si se quieren cuentas de trabajo (Entra ID), se configura como conexión empresarial y **consume la única del plan gratis**.
- (−) Nombre, correo y avatar de los usuarios se guardan en Auth0 (encargado del tratamiento). Los esquemas y muestras de clientes **no** pasan por Auth0 (Constitución V se mantiene). Región del tenant: a decidir con [DP-015](../../07-registro/02-decisiones-pendientes.md#dp-015).
- (−) El proxy BFF de Next.js es obligatorio: sin él el navegador tendría que manejar tokens.
- **Cambios:** [07-seguridad-y-autenticacion.md](../07-seguridad-y-autenticacion.md), [02-stack-y-servicios.md](../02-stack-y-servicios.md), [04-frontend.md](../04-frontend.md), [05-api.md](../05-api.md), [08-infraestructura-y-entornos.md](../08-infraestructura-y-entornos.md), diccionario de datos, tareas ROS-180…190.

## Verificación
- Pruebas de la clase de autenticación con claves RSA generadas en la prueba: token válido, expirado, `aud`/`iss` incorrectos, firma alterada, `alg: none`, `kid` desconocido.
- Prueba de la URL de `/auth/login`: contiene `code_challenge` (S256) y `state`.
- Pruebas del proxy BFF: añade Bearer, no expone el token y rechaza mutaciones de otro origen.
- Checklist de configuración del tenant en el acta de verificación de la feature 002.
