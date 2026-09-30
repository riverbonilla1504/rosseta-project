# CD-NNN · <título corto>

> Plantilla de **cambio de documentación**. Procedimiento completo: [04-sincronizacion.md §4](../00-metodologia/04-sincronizacion.md). Copiar como descripción del PR `docs/CD-NNN-slug`.

## 1. Qué cambia
<Descripción en una o dos frases del comportamiento/regla/alcance que cambia.>

## 2. Por qué
<Motivo: decisión del responsable (DP-NNN), error encontrado (EC-NNN), aprendizaje de implementación, pedido del cliente…>

- **Solicitado por:** <persona>
- **Decisión / error relacionado:** DP-NNN / EC-NNN
- **Tipo:** ☐ Alcance (MAYOR) ☐ Comportamiento (MENOR) ☐ Redacción (PARCHE)

## 3. Impacto (matriz de §5 de 04-sincronizacion)

| Nivel | Afectado | Detalle |
|---|---|---|
| Constitución | ☐ Sí ☐ No | <requiere ADR y enmienda> |
| docs/ | ☐ | <lista de archivos y secciones> |
| specs/ | ☐ | <specs/NNN-*/spec.md FR-…, plan.md, tasks.md> |
| Jira | ☐ | <ROS-n: qué campo cambia> |
| Código | ☐ | <módulos/pruebas afectadas> |
| Datos | ☐ | <migración necesaria> |

## 4. Antes / después

| | Antes | Después |
|---|---|---|
| <regla/campo> | <texto actual> | <texto nuevo> |

## 5. Checklist de propagación

- [ ] Todos los documentos afectados de `docs/` editados en este PR
- [ ] Entrada en [04-changelog.md](../07-registro/04-changelog.md) con versión
- [ ] DP/EC relacionados actualizados (estado + enlace a este CD)
- [ ] PR revisado por alguien distinto del autor y fusionado
- [ ] Specs actualizadas (`/speckit-specify` o edición) y `/speckit-analyze` sin CRITICAL
- [ ] Jira actualizado copiando el texto de `docs/`, bloque "Fuente de verdad" con este CD, comentario enlazando el PR
- [ ] Código y pruebas actualizados por tareas de Jira (`ROS-n`)
- [ ] Línea en [03-registro-de-sincronizacion.md](../07-registro/03-registro-de-sincronizacion.md) → **Cerrado**
