# Evaluación: Jev (TypeSafe AI) en Rosetta

> **Estado:** evaluación técnica, **no es una decisión**. La decisión es [DP-021](../../07-registro/02-decisiones-pendientes.md#dp-021). Si se adopta, requiere ADR (Constitución III, V y VI).
> **Fecha:** 2026-09-30 · **Fuentes:** documentación oficial (docs.typesafe.ai: introducción, confianza, modelos, *jaggedness* de jev-1.13, legal), typesafe.ai, artículos de lanzamiento (MarkTechPost, guía práctica en DEV). Cifras de rendimiento **autodeclaradas** por TypeSafe; sin reproducción independiente todavía.

## 1. Qué es Jev

| Aspecto | Dato |
|---|---|
| Tipo | "System One model": **no genera texto**; recibe un estado (texto/JSON) y preguntas tipadas, y devuelve **decisiones tipadas con probabilidades** |
| Preguntas | `Choice` (elegir entre ≤ 255 opciones), `Score` (nivel en escala ordenada de 2–10), `Noul` (probabilidad sí/no) |
| Salida | valor + distribución de probabilidades + `confidence` (derivada de la forma de la distribución) |
| Latencia / precio | 70–500 ms; USD 0,042 por millón de tokens de entrada, salida gratis |
| Límites | 64k tokens por petición (32k estado + pregunta más larga); 40 req/s; solo texto |
| Idioma | "English is the primary training language"; otros idiomas con **menor precisión** |
| Versión | `jev-1.13.0`; se puede fijar versión |
| Despliegue | Solo API en la nube; **sin pesos publicados ni opción *self-hosted*** |
| Datos | Política de no entrenar con datos de clientes; **retención cero solo para clientes enterprise** (DPA) |
| Disponibilidad | **Early access con lista de espera** (lanzado el 2026-09-15) |
| SDK | Python (`typesafe-sdk`) y JS/TS (`@typesafe-ai/sdk`) |

Limitaciones documentadas por el propio fabricante (jev-1.13): lee literal (negaciones, alcance); **no cuenta** de forma fiable; mal con **representaciones numéricas y códigos**; **lee las fechas como texto** (no las ordena ni compara); pierde precisión con estado irrelevante grande; vulnerable a contenido adversarial; sin garantías de consistencia entre preguntas; la documentación no dice si la salida es **determinista** ni publica métricas de calibración.

## 2. Filosofía: encaja muy bien

Jev y Rosetta comparten la misma idea: **decisiones con confianza explícita en lugar de texto libre**, y **los pesos los pone el código, no el modelo** (patrón *composite scoring* de TypeSafe ≈ el motor de evidencia de Rosetta; *confidence-gated routing* ≈ los niveles Confirmada/Alta/Inferida/Hipótesis/Desconocida). Conceptualmente es la herramienta de IA más alineada con Rosetta que existe hoy.

## 3. Encaje por área

| Área de Rosetta | ¿Encaja? | Por qué |
|---|---|---|
| **Puntaje y niveles del motor** (E02, MVP) | ❌ No | El motor debe ser **determinista y auditable** (Constitución IV, ADR-0005); Jev es un servicio externo sin garantía de determinismo ni calibración publicada |
| **Contención, perfilado, conteos, rangos** (ROS-17, 123) | ❌ No | Son cálculos exactos; Jev "no cuenta" y es débil con números. Lo hace el código |
| **Fechas AAAAMMDD, códigos crípticos** (`FEPRO`, `PGCOD`) | ❌ No | Justo sus puntos débiles (fechas como texto, códigos/abreviaturas) |
| **Descripciones** (RN-22, ROS-31) | ❌ No | Jev no genera texto |
| **Emparejar documentación/etiquetas de UI con columnas** (ROS-19, fuente "Etiquetas de aplicación" de EC-003) | ✅ Sí, Fase 2 | Es su caso ideal: `Choice` entre columnas candidatas (patrón *entity alignment* de su documentación). Aportaría **evidencia** nueva, citada |
| **Detección de PII** (ROS-85, RN-26) | 🟡 Posible, Fase 2 | `Noul` "¿esta columna contiene datos personales?" a partir de **metadatos** (nombre, tipo, patrón), sin enviar valores |
| **Verificar la redacción de un LLM** (RN-23, Fase 2) | ✅ Sí, Fase 2 | Patrón *double-checking citations*: comprobar que cada frase del LLM está sustentada por la evidencia. Refuerza "el LLM no inventa" |
| **Clasificar consultas de logs** (ROS-18) | 🟡 Posible, Fase 2 | Clasificación de alto volumen (lectura/escritura, dominio funcional) |
| **Severidad de hallazgos** (ROS-58) | 🟡 Débil | Mejor reglas; podría usarse como sugerencia |
| **Cola por impacto** (ROS-36) | ❌ No | Es un cálculo exacto (número de columnas que desbloquea) |

## 4. Riesgos y bloqueos

1. **Privacidad (bloqueante para clientes bancarios):** enviar nombres de tablas/columnas y, peor, valores de muestras a una API de terceros en EE. UU. choca con la Constitución V. Mitigación: solo metadatos, *opt-in* por proyecto, DPA con retención cero (hoy solo enterprise).
2. **Determinismo y auditoría:** una respuesta de Jev debe tratarse como **evidencia** guardada (valor, probabilidades, versión del modelo, fecha), nunca recalcularse en caliente. Así el motor sigue siendo reproducible.
3. **Idioma:** los esquemas y textos son en español; el modelo rinde mejor en inglés.
4. **Madurez:** early access con lista de espera, 2 semanas en el mercado, benchmarks autodeclarados.
5. **Dependencia de proveedor:** sin opción autoalojada; si cambia precio o disponibilidad, la fuente de evidencia desaparece (debe ser siempre opcional).

## 5. Recomendación

- **MVP: no usar Jev.** No resuelve nada del MVP que el código no haga mejor, y viola principios (determinismo, datos a terceros) sin beneficio.
- **Fase 2: piloto acotado** como **fuente de evidencia opcional** `MODEL_JUDGMENT` (nueva clase de independencia `MODEL`):
  - peso ≤ 0,40 (igual que el nombre de columna) — nunca decide por sí solo;
  - solo metadatos, nunca valores de muestras; activable por proyecto;
  - respuesta almacenada con `model`, probabilidades y cita (reproducible);
  - usos del piloto: emparejar documentación/etiquetas con columnas y verificar la redacción del LLM.
- **Criterio de éxito del piloto:** con el esquema de referencia (MOV0010 y tablas relacionadas), ¿sube la proporción de columnas que llegan a "Inferida" sin aumentar los rechazos humanos? Medir con y sin Jev.
- **Antes del piloto:** pedir acceso (lista de espera), revisar DPA y retención cero, probar precisión en español.

Si se aprueba: ADR-0007, cambios en RN-09 (peso), [06-motor-de-evidencia.md §3](../06-motor-de-evidencia.md) (nuevo `kind`), [02-stack-y-servicios.md §4](../02-stack-y-servicios.md) (servicio nuevo) y constitución (ya prevé el caso en III y V).
