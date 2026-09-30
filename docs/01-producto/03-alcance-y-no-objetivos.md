# Alcance y no-objetivos

> Delimitar lo que **no** se construye es tan crítico como definir lo que sí. Ningún agente ni desarrollador implementa algo de la lista de no-objetivos sin un cambio de documentación aprobado.

## 1. Dentro del alcance del MVP (Fase 1)

38 historias en 10 épicas. Detalle en [02-historias-de-usuario.md](../02-requisitos/02-historias-de-usuario.md) (filtrar por *Fase-1*).

| Épica | Qué entra en el MVP |
|---|---|
| E01 Ingesta de fuentes | Importar DDL (ROS-16), cargar muestras CSV (ROS-17), convenciones de nombres (ROS-21), panel de fuentes (ROS-22), evidencia normalizada (ROS-23) |
| E02 Motor de evidencia | Puntuación ponderada (ROS-25), 5 niveles (ROS-26), "Desconocida" (ROS-27), conflictos (ROS-28), propagación (ROS-29), citas (ROS-33), cola por impacto (ROS-36) |
| E03 Panorama | Cobertura (ROS-37), fuentes (ROS-38), cola (ROS-39), hallazgos abiertos (ROS-40) |
| E04 Revisión | Ficha (ROS-42), perfil (ROS-43), previsualización de propagación (ROS-44), avisos de conflicto (ROS-45), acciones (ROS-46), atajos (ROS-47), "Alta · sin validar" ≠ "Confirmada" (ROS-48) |
| E05 Catálogo | Vista tablas/columnas (ROS-50), chips (ROS-51), rastro (ROS-52), nombres únicos (ROS-54), estado compartido (ROS-55) |
| E10 Nocturne | Fundaciones (ROS-74), componentes (ROS-75) |
| E11 Cuentas y proyectos | Múltiples proyectos (ROS-78) |
| E12 Persistencia | Persistir todo (ROS-81) |
| E13 No funcionales | Seguridad y control de acceso (ROS-84) |
| E14 Inicio de sesión | Autenticación (ROS-89), OAuth (ROS-90), registro/onboarding (ROS-91), sesión/tokens (ROS-92), seguridad OAuth (ROS-93) |

## 2. No-objetivos del MVP

Lo que **deliberadamente NO** se construye en la Fase 1:

| # | No-objetivo | Por qué | Cuándo |
|---|---|---|---|
| NO-01 | **Conexión directa a bases de datos** del cliente | El MVP trabaja con archivos (DDL y CSV) para reducir riesgo y alcance | Fase 3 (ROS-24) — ver [DP-002](../07-registro/02-decisiones-pendientes.md) |
| NO-02 | **Escribir en la base de origen** (publicar comentarios al catálogo) | Rosetta es solo lectura | Sin fecha — [DP-005](../07-registro/02-decisiones-pendientes.md) |
| NO-03 | Ingerir **logs de consulta, documentación, código, vistas y procedimientos** | Fuentes adicionales | Fase 2–3 (ROS-18, ROS-19, ROS-20) — [DP-001](../07-registro/02-decisiones-pendientes.md) |
| NO-04 | **Inferencia de llaves foráneas** como funcionalidad visible (relaciones en el catálogo) | Fase 2 | ROS-30, ROS-53 |
| NO-05 | **Modo sin LLM** y **redacción con LLM** como funcionalidad configurable | Fase 2. En el MVP las descripciones se generan **solo con reglas** (deterministas) | ROS-31 — [DP-004](../07-registro/02-decisiones-pendientes.md) |
| NO-06 | **Umbral de confirmación configurable** por el usuario | Fase 2; en el MVP es fijo (0,85) | ROS-32 |
| NO-07 | **Informe de hallazgos** completo (pantalla Hallazgos) | Fase 2; el MVP solo muestra un resumen en el Panorama | E06 |
| NO-08 | **Generador de datos sintéticos** | Fase 2 | E07 |
| NO-09 | **Grafo / ERD** | Fase 3; decisión de alcance pendiente | E08 — [DP-008](../07-registro/02-decisiones-pendientes.md) |
| NO-10 | **Servidor MCP / API pública / webhooks** | Fase 4 | E09 |
| NO-11 | **Exportar catálogo** (YAML/Markdown/JSON/SQL) | Fase 2 | ROS-57 — [DP-006](../07-registro/02-decisiones-pendientes.md) |
| NO-12 | **Búsqueda y filtros** avanzados del catálogo | Fase 2 | ROS-56 |
| NO-13 | **Roles, permisos y colaboración multiusuario** | Fase 3; en el MVP cada proyecto tiene un solo usuario | ROS-79, ROS-80 |
| NO-14 | **MFA, verificación de correo, recuperación de contraseña, SSO empresarial** | Fase 2–3; en el MVP solo hay OAuth | E14 |
| NO-15 | **Organizaciones, dominios permitidos, planes, pagos, facturación** | Fase 3–4 | E15 |
| NO-16 | **Historial/versionado** con comparación y reversión | Fase 2; en el MVP sí se registra quién hizo cada acción (auditoría básica) | ROS-82, ROS-83 |
| NO-17 | **Tema claro** | Nocturne es oscuro; no se diseña tema claro | Sin fecha |
| NO-18 | **Aplicación móvil** o diseño para teléfono | Escritorio y tablet (Fase 3, ROS-77) | — |
| NO-19 | **Notificaciones por correo o SMS** | No se necesitan en el MVP | Fase 2–3 |
| NO-20 | **Procesar pagos en línea** | Monetización es Fase 3 | ROS-112 |

## 3. Supuestos del MVP

- El usuario tiene permiso para usar el DDL y las muestras que carga.
- Las muestras de datos que se cargan son **acotadas** (no la tabla completa). `[PENDIENTE]` tamaño máximo ([DP-013](../07-registro/02-decisiones-pendientes.md)).
- El motor de base de datos de origen de referencia es **SQL Server** (`CORE_PRD · sqlserver` en el prototipo); el parser debe tolerar también Oracle y PostgreSQL (ROS-120).
- Uso en navegadores de escritorio modernos (Chrome, Edge, Firefox, Safari — últimas 2 versiones).
- Idioma de la interfaz: español.
