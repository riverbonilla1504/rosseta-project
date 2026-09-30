# Requisitos no funcionales

> ID `RNF-NN`. Cada uno es **medible**. Los que no tienen valor acordado están marcados `[PENDIENTE]` con su decisión pendiente.

## Seguridad

| ID | Requisito | Medida / verificación | Historias |
|---|---|---|---|
| RNF-01 | Todo el tráfico cifrado | HTTPS obligatorio, HSTS activo; prueba de configuración | ROS-84, ROS-179 |
| RNF-02 | Datos cifrados en reposo | Volumen/BD cifrados en el proveedor; documentado en infraestructura | ROS-179 |
| RNF-03 | Aislamiento por usuario/proyecto | Suite de pruebas de acceso cruzado 100 % en verde | ROS-178 |
| RNF-04 | Identificadores no predecibles | UUID en todas las rutas públicas | ROS-178 |
| RNF-05 | Sin secretos en el repositorio | Escáner de secretos en CI sin hallazgos | ROS-190 |
| RNF-06 | Sin tokens ni PII en logs | Revisión + prueba que inspecciona logs de un flujo de login | ROS-190 |
| RNF-07 | OAuth seguro | PKCE, `state`, redirect URIs en lista blanca; casos maliciosos rechazados | ROS-189 |
| RNF-08 | Sesión segura | Cookies `httpOnly` + `Secure` + `SameSite=Lax`; access token ≤ 15 min; refresh rotado | ROS-187, ROS-188 |
| RNF-09 | Cabeceras de seguridad | CSP, HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` | ROS-190 |

## Rendimiento

| ID | Requisito | Medida | Historias |
|---|---|---|---|
| RNF-10 | Catálogo de una tabla grande responde rápido | `GET /api/tables/{id}/columns` p95 < 500 ms con 1.000 columnas | ROS-162 |
| RNF-11 | Ficha de revisión en una sola llamada | `GET /api/columns/{id}` p95 < 400 ms | ROS-152 |
| RNF-12 | Perfilado no bloquea la UI | Muestras > 10 MB se perfilan en segundo plano (Celery); la UI muestra progreso | ROS-124 |
| RNF-13 | Recálculo tras confirmar | Confirmación con propagación de hasta 500 columnas < 2 s | ROS-141 |
| RNF-14 | Escala de referencia | Proyecto con 918 tablas y 18.442 columnas (caso del prototipo) usable sin degradación visible | ROS-87 (Fase 3 para optimización completa) |
| RNF-15 | Listas largas | Listas de > 200 filas virtualizadas | ROS-163 |

> `[PENDIENTE]` Los valores de p95 son propuestas iniciales; se validan con el primer esquema real ([DP-018](../07-registro/02-decisiones-pendientes.md)).

## Confiabilidad y datos

| ID | Requisito | Medida | Historias |
|---|---|---|---|
| RNF-16 | Sin pérdida de trabajo | Cerrar y reabrir un proyecto devuelve exactamente el mismo estado | ROS-177 |
| RNF-17 | Consistencia transaccional | Una confirmación fallida no deja el catálogo inconsistente (transacción atómica) | ROS-141 |
| RNF-18 | Concurrencia | Dos confirmaciones simultáneas sobre columnas relacionadas no corrompen el estado | ROS-141 |
| RNF-19 | Idempotencia de importación | Reimportar el mismo DDL no duplica | ROS-121 |
| RNF-20 | Migraciones reproducibles | Migraciones corren desde cero en CI | ROS-176 |

## Auditabilidad

| ID | Requisito | Medida | Historias |
|---|---|---|---|
| RNF-21 | Determinismo del motor | Dos ejecuciones sobre la misma evidencia → mismo puntaje (prueba de propiedad) | ROS-133 |
| RNF-22 | Registro inmutable de acciones | Las acciones de revisión no se pueden editar ni borrar por API | ROS-158 |
| RNF-23 | Trazabilidad de afirmaciones | 0 interpretaciones sobre "Hipótesis" sin cita resoluble | ROS-142 |

## Usabilidad y accesibilidad

| ID | Requisito | Medida | Historias |
|---|---|---|---|
| RNF-24 | WCAG 2.1 AA | Contraste ≥ 4,5:1 en texto normal; auditoría axe sin violaciones serias | ROS-74, ROS-76 |
| RNF-25 | Navegación por teclado | Revisión completa de una cola sin ratón (J/K/A/E/R) | ROS-160 |
| RNF-26 | Estados no dependientes del color | Chips de nivel con texto/ícono además del color | ROS-164 |
| RNF-27 | Foco visible | Todo elemento interactivo tiene foco visible | ROS-170 |
| RNF-28 | Estados vacíos y errores claros | Toda lista tiene estado vacío con siguiente acción; ningún error silencioso | ROS-88 |
| RNF-29 | Navegadores | Últimas 2 versiones de Chrome, Edge, Firefox y Safari de escritorio | — |
| RNF-30 | Resolución mínima | 1280 × 720 sin scroll horizontal del cuerpo | ROS-77 |

## Mantenibilidad y calidad

| ID | Requisito | Medida |
|---|---|---|
| RNF-31 | Cobertura de pruebas | Backend ≥ 85 % (motor de evidencia ≥ 95 %), frontend ≥ 80 % |
| RNF-32 | Tipado | `mypy`/type hints en código Python nuevo; TypeScript `strict` |
| RNF-33 | Lint limpio | `ruff` y `eslint` sin errores en CI |
| RNF-34 | Contrato de API documentado | Esquema OpenAPI generado y coincidente con [05-api.md](../03-arquitectura/05-api.md) |
| RNF-35 | Trazabilidad | 100 % de PRs con clave Jira y spec referenciada |

## Privacidad

| ID | Requisito | Medida | Historias |
|---|---|---|---|
| RNF-36 | Minimización OAuth | Scopes solo de perfil y correo | ROS-101 (Fase 2), aplicado desde el MVP en ROS-182 |
| RNF-37 | Retención de muestras | `[PENDIENTE]` plazo de retención y borrado de muestras cargadas | [DP-013](../07-registro/02-decisiones-pendientes.md) |
| RNF-38 | Datos reales fuera de pruebas | Semillas y fixtures solo con datos sintéticos | Constitución V |
