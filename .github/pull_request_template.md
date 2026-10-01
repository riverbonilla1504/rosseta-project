<!--
Plantilla de PR (fuente: docs/plantillas/pull-request.md).
Título: ROS-<n> · <resumen>   (o CD-NNN · <resumen> para PRs solo de docs)
-->

## Qué y por qué
<Resumen en 2–3 frases. Qué comportamiento aporta o corrige.>

## Trazabilidad
- **Jira:** ROS-<historia> / ROS-<tarea>
- **Spec:** `specs/NNN-slug/spec.md` — FR-<###>
- **Tareas Spec Kit:** T<###>
- **Reglas:** RN-<NN> · **RNF:** RNF-<NN>
- **CD / EC relacionados:** CD-<NNN> / EC-<NNN> (si aplica)

## Evidencia
- [ ] Commit de **prueba roja** previo: <hash>
- [ ] Pruebas nuevas con marcadores `story` / `fr`
- [ ] CI verde
- [ ] Cobertura: backend __ % (motor __ %) · frontend __ % (no baja respecto a `main`)
- [ ] Capturas / video (si hay UI) · axe sin violaciones serias

## Cambios de contrato y datos
- [ ] Sin cambios de API / OpenAPI y tipos TS regenerados y coherentes con `docs/03-arquitectura/05-api.md`
- [ ] Sin migraciones / Migración reversible y coherente con `docs/04-datos/02-diccionario-de-datos.md`

## Comportamiento no especificado
<Nada / Describe cualquier comportamiento que el código hace y la spec no dice. Si existe, NO se fusiona sin CD.>

## Checklist de Terminado
- [ ] Cumple la DoD (`docs/06-calidad/02-definicion-de-listo-y-terminado.md`)
- [ ] `tasks.md` y matriz de trazabilidad actualizados
- [ ] Sin secretos, sin datos reales, sin TODO sin clave Jira
- [ ] Revisado por alguien que no lo escribió
