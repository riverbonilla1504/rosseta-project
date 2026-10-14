# Quickstart: validar el inicio de sesión de punta a punta

**Feature**: [spec.md](spec.md) · **Plan**: [plan.md](plan.md) · **Contratos**: [accounts-api.yaml](contracts/accounts-api.yaml), [bff-proxy.md](contracts/bff-proxy.md), [auth-flow.md](contracts/auth-flow.md) · **Tarea**: ROS-182

Esta guía es el procedimiento del tenant de identidad, la lista de comprobación de configuración que se anexa al acta de verificación (FR-035, ROS-189) y los escenarios que demuestran que la feature funciona. No contiene código de la implementación. Los comandos que dependen de lo que aún no existe (`pnpm e2e`, la pantalla `/login`) se marcan *(disponible al terminar ROS-xxx)*.

> **Seguridad.** Nunca pegues secretos aquí ni en el repositorio. Los valores van en `.env` y `frontend/.env.local` (ambos ignorados por git). El servidor MCP de Auth0 se usa **solo contra el tenant de desarrollo**; al terminar: `npx @auth0/auth0-mcp-server logout`.

## 1. Prerrequisitos

| Qué | Cómo |
|---|---|
| Servicios locales | `make services` (PostgreSQL en el puerto 5433 y Redis) |
| Backend | `make migrate` y `make dev-backend` (puerto 8000) |
| Frontend | `make dev-frontend` (puerto 3000) |
| Variables del backend (`.env`) | `AUTH0_DOMAIN`, `AUTH0_AUDIENCE` (y las de `.env.example`) |
| Variables del frontend (`frontend/.env.local`) | `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_SECRET`, `APP_BASE_URL`, `AUTH0_AUDIENCE`, `BACKEND_INTERNAL_URL` — ver [auth-flow.md §8](contracts/auth-flow.md) |
| Generar `AUTH0_SECRET` | `openssl rand -hex 32` |
| Persona de prueba | Una cuenta personal de Google y una cuenta personal de Microsoft **de prueba**, tuyas; nunca cuentas ni datos de clientes (Constitución V) |

## 2. Procedimiento del tenant de desarrollo (ROS-182)

El tenant de desarrollo ya existe (creado el 2026-09-30, [08-infraestructura §4](../../docs/03-arquitectura/08-infraestructura-y-entornos.md)). Este procedimiento sirve para **verificarlo** o para **recrearlo** en otro tenant (por ejemplo, el de producción, que se configura a mano en el panel, nunca con el MCP).

1. **Aplicación "Rosetta Web"** de tipo *Regular Web Application*. Anota `Client ID` y `Client Secret` solo en `frontend/.env.local`.
2. **URLs permitidas**, sin comodines, una por entorno:
   - *Allowed Callback URLs*: `{APP_BASE_URL}/auth/callback`
   - *Allowed Logout URLs*: `{APP_BASE_URL}/login` y `{APP_BASE_URL}/auth/error`
   - *Allowed Web Origins* y *Allowed Origins (CORS)*: `{APP_BASE_URL}`
3. **Refresh token** de la aplicación: rotación activada, detección de reutilización activada, vigencia absoluta de 30 días y de inactividad de 14 (provisional, [DP-022](../../docs/07-registro/02-decisiones-pendientes.md#dp-022)).
4. **API "Rosetta API"**: identificador = valor de `AUTH0_AUDIENCE`, firma `RS256`, vida del access token de **900 s**, "Allow Offline Access" activado.
5. **Conexiones**: habilitar `google-oauth2` y la conexión social de Microsoft **solo para "Rosetta Web"**; deshabilitar la base de datos de usuario y contraseña ([DP-014](../../docs/07-registro/02-decisiones-pendientes.md#dp-014)). Microsoft solo con cuentas personales.
6. **Acción post-login** `rosetta-claims-post-login`: desplegada y añadida al flujo de inicio de sesión. Contrato en [auth-flow.md §7](contracts/auth-flow.md).
7. **Producción únicamente:** registrar aplicaciones propias en Google Cloud Console y en Microsoft Entra ID (con la audiencia de Microsoft limitada a **cuentas personales**) y cargar sus credenciales en las conexiones del tenant. Las claves de desarrollo de Auth0 solo sirven en local. Los secretos de Google y Microsoft se guardan **en el panel de Auth0**, no en Rosetta.
8. **Administradores del panel** del tenant con segundo factor activado.

## 3. Lista de comprobación de configuración (FR-035)

Se rellena por entorno y se **anexa al acta de verificación** de la feature (ROS-189). Cada fila indica qué debe ser cierto y cómo comprobarlo. Un elemento fallido impide aprobar. **Formato de la evidencia:** un archivo `specs/002-autenticacion-oauth/evidence/tenant-config-<entorno>.md` con una fila por comprobación C1…C16 y las columnas Resultado (✅, ❌ o N/A), Fecha (AAAA-MM-DD) y Revisó (persona). Un entorno está *verificado* cuando las 16 filas tienen resultado, fecha y persona y ninguna es ❌. Una prueba automática (`backend/tests/security/test_tenant_config_evidence.py`) lo comprueba para desarrollo; **no sustituye** la revisión humana ni la verificación independiente.

| # | Comprobación | Esperado | Cómo se comprueba |
|---|---|---|---|
| C1 | URLs de retorno (*callback*) | Exactamente `{APP_BASE_URL}/auth/callback`; **sin** comodines | Panel › Applications › Rosetta Web › Settings |
| C2 | URLs de cierre de sesión | Exactamente `/login` y `/auth/error` del origen; **sin** comodines | Ídem |
| C3 | Orígenes web permitidos | Solo `{APP_BASE_URL}` | Ídem |
| C4 | Tipo de aplicación y autenticación del cliente | *Regular Web*; secreto de cliente requerido | Ídem |
| C5 | Refresh token | Rotación y detección de reutilización activadas; 30 días de máximo y 14 de inactividad | Ídem › Refresh Token Rotation / Expiration |
| C6 | API "Rosetta API" | Audiencia = `AUTH0_AUDIENCE`; `RS256`; access token de 900 s | Panel › APIs › Rosetta API › Settings |
| C7 | Proveedores habilitados | Solo `google-oauth2` y Microsoft (personales) para Rosetta Web | Panel › Authentication › Social y Applications › Connections |
| C8 | Base de datos de contraseñas | Deshabilitada para Rosetta Web | Panel › Authentication › Database |
| C9 | Tipo de cuenta de Microsoft | Solo personales | Registro de la aplicación en Microsoft Entra ID (producción) |
| C10 | Scopes que pide la aplicación | Solo `openid profile email offline_access` (RNF-36) | Prueba V10 (URL de `/auth/login`) |
| C11 | Acción post-login | Desplegada y asociada al flujo; deniega correo no verificado o ausente; añade los tres claims | Panel › Actions › Flows › Login |
| C12 | Credenciales propias en producción | Conexiones con credenciales de Rosetta, no las de desarrollo de Auth0 | Panel › Authentication › Social (producción) |
| C13 | Separación de entornos | Tenant de desarrollo distinto del de producción; el MCP no apunta a producción | Dominios distintos en `.env` de cada entorno |
| C14 | MFA en el panel | Todos los administradores del tenant con segundo factor | Panel › Dashboard Admins |
| C15 | Protecciones contra abuso | Estado de *Attack Protection* (bots, fuerza bruta, IP sospechosas) registrado | Panel › Security › Attack Protection |
| C16 | Secretos | Ningún secreto en el repositorio; escáner sin hallazgos (RNF-05) | `gitleaks detect --source . --no-banner` |

Opcional para C1 a C6 en el tenant de desarrollo: consultar la configuración con la CLI de Auth0 (`auth0 api get "clients/<client_id>"`) en lugar del panel.

## 4. Escenarios de validación

Cada uno indica los requisitos que demuestra. Los escenarios con proveedor real (V1, V2) se hacen **a mano** en el tenant de desarrollo; el resto también se automatizan en E2E con el proveedor simulado *(disponible al terminar ROS-184 y ROS-188)*.

| # | Escenario | Pasos | Resultado esperado | Demuestra |
|---|---|---|---|---|
| V1 | Primer acceso con Google | Abre `http://localhost:3000/login` › "Continuar con Google" › autoriza | Llegas al onboarding con tu nombre. En la base existe **una** fila: `docker compose exec db psql -U rosetta -d rosetta -c "select count(*) from accounts_user"` | FR-001, FR-002, FR-005, FR-017, SC-001 |
| V2 | Acceso con Microsoft personal | Cierra sesión y repite con "Continuar con Microsoft" (cuenta personal, **otro** correo) | Cuenta nueva e independiente (dos filas) | FR-001, FR-009 (límites), SC-001 |
| V3 | Reingreso sin duplicar | Cierra sesión y vuelve a entrar con la misma cuenta | Misma fila; el conteo no cambia | FR-005, SC-002 |
| V4 | Onboarding de un paso | Crea el primer proyecto (nombre y dialecto) | Quedas en `/projects`; reabrir `/onboarding` te devuelve a `/projects` | FR-018…FR-021 |
| V5 | Ruta privada sin sesión | Cerrada la sesión, abre `/projects` por enlace directo | Vas a `/login?returnTo=/projects` y, tras entrar, regresas a `/projects` | FR-014, FR-015 |
| V6 | Renovación silenciosa | Trabaja más de 15 minutos seguidos (o usa el proveedor simulado con vida corta) | Ninguna pantalla de acceso intermedia | FR-022, FR-023, SC-006 |
| V7 | Sesión vencida | Borra `__session` o deja caducar la sesión y haz una acción | "Tu sesión terminó. Vuelve a iniciar sesión para continuar." y, al entrar, regresas donde estabas | FR-026 |
| V8 | Cierre de sesión | Usa el control de cierre de sesión | Llegas a `/login`; abrir una ruta privada te devuelve a `/login`; tu sesión de Google/Microsoft sigue abierta | FR-025, SC-006 |
| V9 | Fallos de acceso | Cancela el consentimiento; detén el proveedor simulado; usa un correo ya registrado con otro proveedor | Pantalla de error con mensaje y "Volver a intentar"; ningún bucle ni pantalla en blanco | FR-036…FR-039, SC-007 |
| V10 | Flujo con PKCE y `state` | Ver §5, comprobación S1 | La URL de autorización incluye `code_challenge` (`S256`), `state` y la audiencia | FR-027, FR-003 |

El choque de correo entre proveedores (V9, tercer caso) y la cuenta desactivada se prueban con el proveedor simulado y datos sintéticos; con proveedores reales exigiría dos cuentas con el mismo correo.

## 5. Comprobaciones de seguridad

Con el frontend en `http://localhost:3000` y el backend en `http://localhost:8000`.

| # | Comprobación | Comando | Esperado |
|---|---|---|---|
| S1 | PKCE y `state` en la URL de autorización | `curl -sI "http://localhost:3000/auth/login?connection=google-oauth2&returnTo=/"` y revisar `location` | Contiene `code_challenge=`, `code_challenge_method=S256`, `state=` y `audience=` |
| S2 | API sin credencial | `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/me` | `401` |
| S3 | Rutas públicas | `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/health` | `200` (o `503` si falta un servicio, pero **sin** credencial) |
| S4 | Mutación desde otro origen | `curl -s -o /dev/null -w "%{http_code}\n" -X POST -H "Origin: https://otro.example" http://localhost:3000/api/me/onboarding/complete` | `403` |
| S5 | Cabeceras del frontend | `curl -sI http://localhost:3000/login` | `content-security-policy` con nonce, `x-frame-options: DENY`, `x-content-type-options: nosniff`, `referrer-policy` |
| S6 | Cabeceras del backend | `curl -sI http://localhost:8000/api/health` | `x-frame-options: DENY`, `x-content-type-options: nosniff`, CSP `default-src 'none'` |
| S7 | Cookie de sesión | Tras V1, en las herramientas del navegador: Application › Cookies › `__session` | `HttpOnly`; `SameSite=Lax`; `Secure` en staging y producción (en `http://localhost` no aplica) |
| S8 | Credenciales fuera del navegador | En las herramientas del navegador, buscar el access token en almacenamiento, respuestas de red y direcciones | Cero apariciones (SC-005) |
| S9 | Registros sin datos sensibles | Tras V1: `docker compose logs backend 2>&1 \| grep -E "eyJ[A-Za-z0-9_-]+\.|@[A-Za-z0-9.-]+\.[a-z]{2,}"` | Sin coincidencias (SC-008). Repetir con los registros de `pnpm dev` |
| S10 | Escáner de secretos | `gitleaks detect --source . --no-banner` | Sin hallazgos (SC-008) |
| S11 | Casos maliciosos de la credencial | `cd backend && uv run pytest tests/security -m "story('ROS-93')"` *(disponible al terminar ROS-181 y ROS-189)* | Pasan: ausente, vencida, otra audiencia, otro emisor, firma alterada, `alg: none`, `kid` desconocido y recarga del JWKS limitada |

## 6. Comprobaciones con el proveedor simulado *(al terminar ROS-184 y ROS-188)*

```bash
cd frontend && pnpm exec playwright test        # E2E-01 (parcial, ver research R-13), E2E-08 y accesibilidad (axe)
```

Esperado: recorrido acceso → onboarding con la creación de proyecto simulada; cierre de sesión → ruta privada redirige a `/login`; las tres pantallas nuevas sin violaciones serias o críticas de accesibilidad y navegables solo con teclado (SC-009).

## 7. Cierre

1. Rellena la lista de la sección 3 para cada entorno y anéxala al acta de verificación.
2. Si usaste el MCP de Auth0: `npx @auth0/auth0-mcp-server logout`.
3. No dejes sesiones de prueba abiertas en proveedores reales.
