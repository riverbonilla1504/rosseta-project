# Visión del producto

## 1. En una frase

**Rosetta reconstruye el modelo semántico de una base de datos heredada** — qué significa cada tabla y cada columna, y cómo se relacionan — a partir de **evidencia verificable**, con **niveles de confianza honestos** y **validación humana**, sin inventar nada.

El nombre viene de la piedra de Rosetta: descifrar un lenguaje (el esquema críptico) a partir de evidencia cruzada.

## 2. El problema

Las organizaciones (especialmente banca y sector financiero) operan bases de datos de décadas con:

- Nombres crípticos: `MOV0010`, `CTANRO`, `IMPTE`, `FEPRO`, `ESTREG`, `PGCOD`, `RESERV3`.
- **Ninguna clave foránea declarada** y **ningún comentario** en el catálogo.
- Miles de tablas y decenas de miles de columnas. Ejemplo del prototipo: *918 tablas · 18.442 columnas · 4,1 TB* en `CORE_PRD` (SQL Server).
- Conocimiento repartido en la cabeza de personas, en código de aplicaciones, en consultas y en vistas.

Consecuencias: migraciones y modernizaciones lentas y riesgosas, informes con errores, incapacidad de cumplir auditorías de gobierno de datos, y dependencia de unas pocas personas.

**Por qué las soluciones actuales fallan:**

- Documentar a mano: lento, se desactualiza, sin evidencia.
- Adivinar por el nombre de la columna (incluido "preguntarle a un LLM"): produce explicaciones plausibles pero falsas, presentadas con la misma seguridad que las verdaderas.

## 3. La propuesta

Un **motor de evidencia** que combina varias fuentes, pondera cada una y **solo afirma lo que puede sostener**:

| Principio | Cómo se ve en el producto |
|---|---|
| **El motor de evidencia manda** | El significado de una columna sale de datos, uso y contexto; el nombre es la fuente de **menor peso** (0,40 frente a 0,90 de una contención con catálogo) |
| **Honestidad** | Cinco niveles: Confirmada · Alta sin validar · Inferida · Hipótesis · Desconocida. Si no hay evidencia, se declara *Desconocida*: "sin evidencia: no se inventa" |
| **Verificable** | Toda afirmación trae citas que llevan al dato original |
| **Humano en el circuito** | Solo una persona puede "Confirmar". Confirmar una columna **propaga** la decisión a todas las tablas donde la misma columna aparece con el mismo tipo |
| **Eficiencia** | Una **cola priorizada por impacto** muestra primero lo que más columnas desbloquea (p. ej. confirmar `PGCOD` desbloquea 380 columnas) |
| **Auditable** | Un **modo sin LLM** produce toda la redacción con reglas deterministas: "la versión que aprobaría un banco" |

Resultado del prototipo como referencia de valor: **34 validaciones humanas documentaron 3.810 columnas**; primer hallazgo a los **22 min**; perfilado incremental en **1,8 h**.

## 4. Para quién

Ver [02-usuarios-y-roles.md](02-usuarios-y-roles.md). En resumen: analistas de datos y de migración (usuario principal), responsables de gobierno/cumplimiento de datos, y líderes técnicos.

## 5. Las 5 funcionalidades principales (MVP)

1. **Ingesta de fuentes** — cargar el esquema (DDL) y muestras de datos; normalizar todo a evidencia.
2. **Motor de evidencia** — puntuar, asignar niveles, detectar conflictos, propagar confirmaciones, priorizar la cola.
3. **Revisión humana** — ficha de evidencia con citas, perfil de datos y efecto de propagación; confirmar/editar/rechazar con teclado.
4. **Catálogo** — diccionario tabla por tabla y columna por columna, con rastro de evidencia y nivel.
5. **Panorama** — cobertura por nivel, fuentes recolectadas, cola por impacto, hallazgos abiertos.

Más adelante: hallazgos (informe de calidad), generador de datos sintéticos, grafo/ERD, servidor MCP, administración y monetización B2B. Ver [05-roadmap-y-sprints.md](05-roadmap-y-sprints.md).

## 6. Cómo sabremos que funciona (criterios de éxito del producto)

| Métrica | Objetivo MVP | Fuente |
|---|---|---|
| Tiempo al primer hallazgo útil tras cargar un esquema | < 30 min | Prototipo: 22 min |
| Columnas documentadas por cada validación humana | ≥ 50 en esquemas con columnas repetidas | Prototipo: 3.810 / 34 ≈ 112 |
| Afirmaciones "Confirmada" sin acción humana registrada | **0** (invariante) | Constitución III |
| Afirmaciones por encima de "Hipótesis" sin cita | **0** (invariante) | RN-10 |
| Reproducibilidad: misma evidencia → mismo puntaje | 100 % | Constitución IV |

> `[PENDIENTE]` Los objetivos cuantitativos (salvo los invariantes) se validan con usuarios en el primer piloto ([DP-018](../07-registro/02-decisiones-pendientes.md)).

## 7. Origen del producto

- El prototipo final se construyó en **Claude Design** fusionando dos documentos de concepto (≈1.000 y ≈500 líneas) en un solo prototipo de cinco pantallas con el sistema de diseño **Nocturne**. Esos documentos de origen **no están disponibles** en el repositorio ([EC-001](../07-registro/01-errores-conocidos.md)).
- El backlog (15 épicas, 104 historias, 71 tareas) se derivó de ese prototipo y se cargó en Notion y luego en Jira. En CD-003 se añadieron ROS-191 y ROS-192 (106 historias).
- Una nota antigua en Notion sobre una "app de clonación RFID" es **otra idea, no relacionada** con Rosetta.
