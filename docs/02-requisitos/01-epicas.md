# Épicas

> Una **épica** es una funcionalidad grande que agrupa un conjunto de necesidades. Regla de identificación: **E`nn` = ROS-`n`** en Jira.
> Fuente de verdad del texto de cada épica: este archivo. Jira es espejo.

| ID | Jira | Épica | Descripción | Prioridad | Fases | Historias |
|---|---|---|---|---|---|---|
| E01 | [ROS-1](https://fermentai.atlassian.net/browse/ROS-1) | **Ingesta de fuentes** | Conectar e importar las fuentes de evidencia (esquema/DDL, datos de muestra, consultas/logs, documentación, código, convenciones de nombres) y normalizarlas a un formato común | P0 | 1–3 | 11 (ROS-16…24, ROS-191, ROS-192) |
| E02 | [ROS-2](https://fermentai.atlassian.net/browse/ROS-2) | **Motor de evidencia** | El núcleo: ponderar fuentes (el nombre de la columna pesa 0,40), calcular confianza por columna, asignar niveles, detectar conflictos, propagar confirmaciones y ofrecer un modo sin LLM | P0 | 1–2 | 12 (ROS-25…36) |
| E03 | [ROS-3](https://fermentai.atlassian.net/browse/ROS-3) | **Panorama** | Dashboard de entrada: cobertura por nivel de confianza, fuentes recolectadas, cola priorizada por impacto y hallazgos abiertos | P0 | 1–2 | 5 (ROS-37…41) |
| E04 | [ROS-4](https://fermentai.atlassian.net/browse/ROS-4) | **Revisión y validación** | El circuito humano: ficha de evidencia con citas verificables, perfil de datos, efecto de propagación y avisos de conflicto; confirmar, editar o rechazar con atajos de teclado. **Pantalla central del producto** | P0 | 1–2 | 8 (ROS-42…49) |
| E05 | [ROS-5](https://fermentai.atlassian.net/browse/ROS-5) | **Catálogo de datos** | Diccionario tabla por tabla y columna por columna con rastro de evidencia, relaciones inferidas y chips de confianza diferenciados | P0 | 1–2 | 8 (ROS-50…57) |
| E06 | [ROS-6](https://fermentai.atlassian.net/browse/ROS-6) | **Hallazgos** | Reporte de problemas de calidad por severidad, con esfuerzo estimado, vínculo a las columnas afectadas y recomendaciones de remediación | P1 | 2–3 | 5 (ROS-58…62) |
| E07 | [ROS-7](https://fermentai.atlassian.net/browse/ROS-7) | **Generador de datos** | Datos sintéticos coherentes con el catálogo: tres modos, registro de ejecución y garantías declaradas por modo | P1 | 2–3 | 6 (ROS-63…68) |
| E08 | [ROS-8](https://fermentai.atlassian.net/browse/ROS-8) | **Grafo/ERD** | Visualización de relaciones por dominio funcional, distinguiendo relaciones confirmadas de inferidas. *Alcance pendiente de decisión* | P2 | 3 | 2 (ROS-69…70) |
| E09 | [ROS-9](https://fermentai.atlassian.net/browse/ROS-9) | **Servidor MCP e integraciones** | Exponer el catálogo como servidor MCP y API para que otras herramientas y agentes lo consuman | P3 | 4 | 3 (ROS-71…73) |
| E10 | [ROS-10](https://fermentai.atlassian.net/browse/ROS-10) | **Sistema de diseño Nocturne** | Tokens, tipografía, color, biblioteca de componentes, tema oscuro, accesibilidad y responsividad | P0 | 1–3 | 4 (ROS-74…77) |
| E11 | [ROS-11](https://fermentai.atlassian.net/browse/ROS-11) | **Cuentas y proyectos** | Múltiples proyectos/bases por usuario, roles y permisos, y colaboración multiusuario dentro de un proyecto | P0/P2 | 1–3 | 3 (ROS-78…80) |
| E12 | [ROS-12](https://fermentai.atlassian.net/browse/ROS-12) | **Persistencia y exportación** | Guardar catálogo, evidencia y confirmaciones; versionado e historial, audit trail | P0/P1 | 1–2 | 3 (ROS-81…83) |
| E13 | [ROS-13](https://fermentai.atlassian.net/browse/ROS-13) | **No funcionales y cumplimiento** | Seguridad, privacidad y enmascarado, auditabilidad ("aprobable por un banco"), rendimiento con esquemas grandes y manejo de errores | P0/P1 | 1–3 | 5 (ROS-84…88) |
| E14 | [ROS-14](https://fermentai.atlassian.net/browse/ROS-14) | **Inicio de sesión (OAuth)** | OAuth (Google/Microsoft/Apple) y todo lo derivado: registro y onboarding, sesión y tokens, seguridad del flujo (PKCE/state), MFA, verificación de correo, SSO empresarial y restricción por dominio permitido | P0/P2 | 1–3 | 15 (ROS-89…103) |
| E15 | [ROS-15](https://fermentai.atlassian.net/browse/ROS-15) | **Administración y monetización** | Backoffice B2B: organizaciones multi-tenant, dominios permitidos y su verificación, correos personalizados por dominio, planes y precios, pagos y facturación, suscripciones y límites por plan. **Épica final** | P1/P3 | 3–4 | 16 (ROS-104…119) |

**Totales:** 15 épicas · 106 historias · 71 subtareas del MVP.

## Notas

- **E11 vs. E14:** la historia genérica "Autenticación de usuarios" nació en E11 y se movió a E14 para que toda la autenticación viva en una sola épica. E11 quedó con proyectos, roles y colaboración.
- **E14 ↔ E15:** "Restringir inicio de sesión a dominios permitidos" (ROS-94, E14) consume la gestión de dominios (ROS-106) y los correos personalizados (ROS-108) de E15; por eso ROS-94 se movió a **Fase 3** (CD-003, [DP-016](../07-registro/02-decisiones-pendientes.md#dp-016)).
- **E03 ↔ E06:** el widget "Resumen de hallazgos abiertos" (ROS-40, MVP) se anticipa a la épica Hallazgos (Fase 2). Ver [RN-15](04-reglas-de-negocio.md).
- Las prioridades mixtas (P0/P2) indican que la épica tiene historias en varias fases.
