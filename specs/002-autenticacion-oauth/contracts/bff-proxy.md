# Contrato: proxy `/api/*` del servidor de Next.js (BFF)

**Feature**: [spec.md](../spec.md) · **Plan**: [plan.md](../plan.md) · **Decisiones**: [research R-08](../research.md#r-08--proxy-bff-api) · **Tarea**: ROS-188 · **Requisitos**: FR-012, FR-013, FR-022, FR-026, FR-030, FR-031, FR-033

El navegador solo habla con el origen de Next.js. Todo lo que empieza por `/api/` lo atiende un único *route handler* que añade la credencial de acceso y reenvía al backend (`BACKEND_INTERNAL_URL`). Es lo que garantiza que **el navegador nunca ve credenciales** (FR-030).

## Entrada

| Aspecto | Regla |
|---|---|
| Métodos | `GET`, `POST`, `PATCH`, `PUT`, `DELETE`. Otros → 405 |
| Ruta | `/api/<segmentos>`. Se rechazan (400 `validation_error`) segmentos vacíos, `.`, `..` y barras codificadas (`%2f`, `%5c`): no se puede salir de `/api/*` |
| Sesión | Se exige sesión del SDK salvo en las dos rutas públicas (abajo) |
| Origen en mutaciones | `POST`, `PUT`, `PATCH`, `DELETE` exigen `Origin` igual al origen de `APP_BASE_URL`. Si falta `Origin`, se acepta solo con `Sec-Fetch-Site: same-origin`. En otro caso → **403** `forbidden_origin` y no se reenvía nada (FR-031) |
| Rutas públicas (FR-012) | `GET /api/health` y `GET /api/schema/`: se reenvían **sin** credencial |

**Orden de las comprobaciones:** 1) método, 2) ruta, 3) origen (solo mutaciones), 4) sesión. Una mutación de otro origen se rechaza con 403 aunque no haya sesión, y nunca se pide ni se renueva una credencial para ella.

## Reenvío al backend

| Aspecto | Regla |
|---|---|
| Destino | `BACKEND_INTERNAL_URL` + la misma ruta y cadena de consulta. El anfitrión de destino es fijo; nunca se deriva de la petición |
| Credencial | `Authorization: Bearer <access token>`, obtenido en el servidor con la renovación silenciosa del SDK (FR-022). Cualquier `Authorization` que traiga el navegador se **descarta** |
| Cabeceras reenviadas (lista cerrada) | `accept`, `accept-language`, `content-length`, `content-type`, `if-none-match`, `x-request-id` (se genera si falta). `content-length` es necesaria para que Django reciba el cuerpo de las mutaciones ([EC-026](../../../docs/07-registro/01-errores-conocidos.md#ec-026)) |
| Cabeceras que nunca se reenvían | `cookie`, `authorization` del navegador, `host`, `origin`, `referer` |
| Cuerpo | Se reenvía en *streaming* (necesario para cargas multipart de las features siguientes) |
| Tiempo de espera | 30 s por petición (valor técnico provisional) |

## Respuesta al navegador

| Aspecto | Regla |
|---|---|
| Estado y cuerpo | Los del backend, sin modificar |
| Cabeceras devueltas (lista cerrada) | `content-type`, `content-disposition`, `etag`, `x-request-id`, `cache-control` |
| `set-cookie` del backend | **Se descarta**: el backend no gestiona cookies |
| Caché | Si el backend no indica otra cosa, se añade `Cache-Control: no-store` a las respuestas autenticadas |
| Cuerpo con la credencial | El handler nunca devuelve ni registra la credencial |

## Errores que genera el propio proxy

Mismo formato que el backend: `{ "error": { "code", "message", "details" } }`.

| Situación | Estado | `code` | Qué hace el cliente |
|---|---|---|---|
| Sin sesión, sesión vencida o no renovable (FR-026) | 401 | `session_expired` | Muestra "Tu sesión terminó. Vuelve a iniciar sesión para continuar." y lleva a `/login?returnTo=<ruta actual>&notice=session_expired` |
| El servicio de identidad no respondió al renovar | 503 | `identity_unavailable` | Muestra el mensaje de proveedor sin respuesta y permite reintentar; **no** cierra la sesión |
| `Origin` inválido en una mutación | 403 | `forbidden_origin` | Error genérico |
| Ruta mal formada | 400 | `validation_error` | Error genérico |
| El backend no responde | 502 | `backend_unavailable` | Error genérico: "Algo salió mal y no se guardó ningún cambio. Intenta de nuevo." |

## Respuestas 403 del backend para cuentas rechazadas

Si el backend devuelve **403** con `account_disabled`, `account_exists_other_provider`, `email_missing` o `email_not_verified`, el proxy **no** deja que el cliente reintente en bucle. Responde 403 con ese mismo código y la interfaz navega a `/auth/denied?code=<código>` (ver [auth-flow.md §5](auth-flow.md)), que cierra la sesión del SDK y muestra la pantalla de error de acceso.

## Registro (FR-033)

Una línea por petición con: método, ruta **sin cadena de consulta**, estado, duración y `request_id`. Nunca cuerpos, cabeceras, cookies, credenciales, correos ni nombres.

## Qué verifican las pruebas unitarias del proxy (ROS-188)

Añade el `Bearer`; no devuelve la credencial; descarta `cookie` y `authorization` entrantes; descarta `set-cookie` saliente; rechaza mutaciones de otro origen y sin origen comprobable; rechaza rutas con `..`; deja pasar `/api/health` sin credencial; responde 401 sin sesión; responde 503 si el servicio de identidad no responde.
