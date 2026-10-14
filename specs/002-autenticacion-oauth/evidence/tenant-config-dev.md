# Lista de comprobación del tenant · desarrollo (FR-035)

**Feature**: [002-autenticacion-oauth](../spec.md) · **Formato y criterios**: [quickstart.md §3](../quickstart.md) · **Tareas**: T002 (ROS-182), T059 (ROS-187), T074 (ROS-189)

> La rellena **la persona** (T002: lo decidió en la sesión del 2026-10-13, porque el MCP de Auth0 no estaba conectado y la prueba con cuentas reales no la puede hacer un agente). Resultado: ✅, ❌ o N/A; Fecha: AAAA-MM-DD; Revisó: persona. Un entorno está *verificado* cuando las 16 filas tienen resultado, fecha y persona y ninguna es ❌. Nunca pegues aquí secretos, IDs de cliente ni tokens.

| # | Comprobación | Resultado | Fecha | Revisó | Notas |
|---|---|---|---|---|---|
| C1 | URLs de retorno (*callback*): exactamente `{APP_BASE_URL}/auth/callback`, sin comodines | pendiente | | | T002 |
| C2 | URLs de cierre de sesión: exactamente `/login` y `/auth/error` del origen, sin comodines | pendiente | | | T002: **añadir `/auth/error`** (CD-007) |
| C3 | Orígenes web permitidos: solo `{APP_BASE_URL}` | pendiente | | | T002 |
| C4 | Aplicación *Regular Web*; secreto de cliente requerido | pendiente | | | T002 |
| C5 | Refresh token: rotación y detección de reutilización; 30 días de máximo y 14 de inactividad (provisional, DP-022) | pendiente | | | T002 (configuración) y T059 (evidencia) |
| C6 | API "Rosetta API": audiencia = `AUTH0_AUDIENCE`; `RS256`; access token de 900 s | pendiente | | | T002 y T059 |
| C7 | Proveedores: solo `google-oauth2` y Microsoft (cuentas personales) para Rosetta Web | pendiente | | | T002 |
| C8 | Base de datos de contraseñas deshabilitada para Rosetta Web | pendiente | | | T002 |
| C9 | Tipo de cuenta de Microsoft: solo personales (registro en Entra ID) | pendiente | | | Producción (T089 ⛔); en desarrollo se espera N/A con motivo |
| C10 | Scopes: solo `openid profile email offline_access` | pendiente | | | T002 (configuración); se confirma con V10/S1 |
| C11 | Acción post-login `rosetta-claims-post-login` desplegada y en el flujo; deniega correo no verificado o ausente; añade `https://rosetta/email`, `/name`, `/picture` y `/email_verified` ([auth-flow.md §7](../contracts/auth-flow.md)) | pendiente | | | T002. La Acción vive solo en el tenant (DP-026) |
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
