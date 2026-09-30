# ADR-0004 · Multi-tenant preparado pero no implementado en el MVP

- **Estado:** Propuesto
- **Fecha:** 2026-09-29
- **Relacionado:** ROS-105 (Fase 3), E15, RN-24

## Contexto
El MVP es de un solo usuario por proyecto (RN-24). La Fase 3 introduce organizaciones, dominios permitidos, planes y facturación (E15). Añadir la organización más tarde en tablas con datos exige migraciones de datos arriesgadas.

## Decisión
- La entidad raíz `Project` tiene desde el MVP un campo **`organization_id` UUID nullable, sin FK** (la tabla `Organization` todavía no existe), indexado.
- Todo acceso a datos pasa por `QuerySet.for_user(user)` (regla B4). En Fase 3 ese método pasa a considerar la organización sin tocar las vistas.
- No se implementa ninguna lógica de organización, rol ni plan en el MVP.

## Alternativas
| Opción | Por qué no |
|---|---|
| Implementar organizaciones desde el MVP | Alcance y complejidad que el MVP no necesita (no-objetivo) |
| Esquema por tenant (django-tenants) | Operación compleja; no se justifica sin clientes B2B |
| No preparar nada | Migración más cara en Fase 3 |

## Consecuencias
- (+) La Fase 3 añade la FK y rellena `organization_id` sin reestructurar.
- (−) Un campo sin uso en el MVP (documentado en el diccionario de datos).
