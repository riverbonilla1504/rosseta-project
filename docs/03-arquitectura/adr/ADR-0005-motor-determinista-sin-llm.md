# ADR-0005 · Motor de evidencia determinista, puro y sin LLM en el MVP

- **Estado:** Propuesto
- **Fecha:** 2026-09-29
- **Relacionado:** Constitución III y IV, RN-08, RN-22, RN-23, [06-motor-de-evidencia.md](../06-motor-de-evidencia.md), [DP-004](../../07-registro/02-decisiones-pendientes.md)

## Contexto
El valor diferencial de Rosetta es ser **auditable** ("lo que aprobaría un banco"): cada afirmación debe reconstruirse desde su evidencia y la misma entrada debe dar la misma salida. El prototipo muestra "redacción con LLM local" y un "modo sin LLM".

## Decisión
- El motor es un **paquete Python puro** (`evidence_engine`) sin Django ni I/O, con funciones deterministas.
- **El MVP no usa LLM.** Las descripciones se generan con plantillas deterministas (equivale al "modo sin LLM").
- Si en Fase 2 se añade un LLM, **solo reescribe texto** a partir de evidencia ya calculada (RN-23) y requiere un ADR nuevo.

## Alternativas
| Opción | Por qué no |
|---|---|
| LLM para inferir significados | No determinista, no auditable, riesgo de inventar (viola Constitución III) |
| Motor dentro de modelos Django | Difícil de probar aislado y de razonar sobre el determinismo |
| LLM local desde el MVP solo para redacción | Añade un servicio (p. ej. Ollama) y variabilidad antes de validar el núcleo |

## Consecuencias
- (+) Pruebas rápidas sin BD, pruebas de propiedades, reproducibilidad total.
- (+) Sin coste ni infraestructura de LLM en el MVP.
- (−) Las descripciones serán más "secas" que las del prototipo con LLM.
