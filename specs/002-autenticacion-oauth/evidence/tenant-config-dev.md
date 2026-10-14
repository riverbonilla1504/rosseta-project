# Lista de comprobación del tenant · desarrollo (FR-035)

**Feature**: [002-autenticacion-oauth](../spec.md) · **Formato y criterios**: [quickstart.md §3](../quickstart.md) · **Tareas**: T002 (ROS-182), T059 (ROS-187), T074 (ROS-189)

> La rellena **la persona**. El 2026-10-14 el agente comprobó y corrigió con el MCP de Auth0 C1–C6 y C11 (columna Notas); **Revisó queda vacío hasta que la persona lo confirme**, porque una comprobación del agente no sustituye la revisión humana. Antes: (T002: lo decidió en la sesión del 2026-10-13, porque el MCP de Auth0 no estaba conectado y la prueba con cuentas reales no la puede hacer un agente). Resultado: ✅, ❌ o N/A; Fecha: AAAA-MM-DD; Revisó: persona. Un entorno está *verificado* cuando las 16 filas tienen resultado, fecha y persona y ninguna es ❌. Nunca pegues aquí secretos, IDs de cliente ni tokens.

| # | Comprobación | Resultado | Fecha | Revisó | Notas |
|---|---|---|---|---|---|
| C1 | URLs de retorno (*callback*): exactamente `{APP_BASE_URL}/auth/callback`, sin comodines | ✅ | 2026-10-14 |  | Agente vía MCP: `callbacks` = [`http://localhost:3000/auth/callback`]. T002 |
| C2 | URLs de cierre de sesión: exactamente `/login` y `/auth/error` del origen, sin comodines | ✅ | 2026-10-14 |  | Agente vía MCP: era `http://localhost:3000/`; corregido a [`/login`, `/auth/error`] (CD-007). T002 |
| C3 | Orígenes web permitidos: solo `{APP_BASE_URL}` | ✅ | 2026-10-14 |  | Agente vía MCP: `web_origins` = [`http://localhost:3000`]; sin `allowed_origins`. T002 |
| C4 | Aplicación *Regular Web*; secreto de cliente requerido | ✅ | 2026-10-14 |  | Agente vía MCP: `regular_web`, `client_secret_post`. Además se redujeron los `grant_types` de 13 a `authorization_code` y `refresh_token` (había `password`, `implicit`, `client_credentials`…). T002 |
| C5 | Refresh token: rotación y detección de reutilización; 30 días de máximo y 14 de inactividad (provisional, DP-022) | ✅ | 2026-10-14 |  | Agente vía MCP: fijado `rotating` + `expiring`, inactividad 1 209 600 s, máximo 2 592 000 s (DP-022). La API oculta el valor al leerlo: confírmalo en el panel. T002/T059 |
| C6 | API "Rosetta API": audiencia = `AUTH0_AUDIENCE`; `RS256`; access token de 900 s | ✅ | 2026-10-14 |  | Agente vía MCP: identificador `https://api.rosetta.local`, `RS256`, `token_lifetime` 900, `allow_offline_access`. T002/T059 |
| C7 | Proveedores: solo `google-oauth2` y Microsoft (cuentas personales) para Rosetta Web | pendiente | | | T002 |
| C8 | Base de datos de contraseñas deshabilitada para Rosetta Web | pendiente | | | T002 |
| C9 | Tipo de cuenta de Microsoft: solo personales (registro en Entra ID) | pendiente | | | Producción (T089 ⛔); en desarrollo se espera N/A con motivo |
| C10 | Scopes: solo `openid profile email offline_access` | pendiente | | | T002 (configuración); se confirma con V10/S1 |
| C11 | Acción post-login `rosetta-claims-post-login` desplegada y en el flujo; deniega correo no verificado o ausente; añade `https://rosetta/email`, `/name`, `/picture` y `/email_verified` ([auth-flow.md §7](../contracts/auth-flow.md)) | ✅ | 2026-10-14 |  | Agente vía MCP: la versión 1 no cumplía (no denegaba `email_missing`, dejaba pasar `email_verified` ausente y no añadía el claim `email_verified`); versión 2 corregida y desplegada. Falta comprobar con cuentas reales. T002 |
| C12 | Credenciales propias en producción | pendiente | | | Producción (T089 ⛔); en desarrollo se espera N/A con motivo |
| C13 | Separación de entornos (tenant de desarrollo ≠ producción; el MCP no apunta a producción) | pendiente | | | T074 |
| C14 | MFA para todos los administradores del panel | pendiente | | | T002 |
| C15 | Protecciones contra abuso (*Attack Protection*): estado registrado | pendiente | | | T074 (CHK004) |
| C16 | Secretos: `gitleaks detect --source . --no-banner` sin hallazgos | pendiente | | | T074 |

## Comprobación de `email_verified` con cuentas reales (T002)

Con una cuenta **personal de prueba** de Google y otra de Microsoft (nunca cuentas ni datos de clientes), confirmar que el access token para Rosetta API trae `https://rosetta/email_verified = true`. Anotar solo el resultado; no pegar el token.

| Proveedor | `email_verified = true` en el access token | Fecha | Revisó | Notas |
|---|---|---|---|---|
| Google (personal) | pendiente | | | |
| Microsoft (personal) | pendiente | | | Si **no** llega, parar y registrarlo: bloquea FR-004 en T016 y en la Acción |
