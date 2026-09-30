# Rosetta — Documentación (fuente de verdad)

> **Esta carpeta es la fuente única de verdad del proyecto Rosetta.**
> Si algo no está aquí, no está decidido. Si el código, Jira o Notion dicen algo distinto a lo que dice esta carpeta, **esta carpeta gana** y lo demás se corrige.

Rosetta es una herramienta que **descifra esquemas de bases de datos heredadas** (columnas crípticas como `MOV0010.CTANRO`, `IMPTE`, `FEPRO`) y los traduce a un **catálogo de datos confiable y auditable**, apoyándose en un **motor de evidencia** con niveles de confianza y validación humana. Se construye con **Spec-Driven Development (SDD)** usando **GitHub Spec Kit**, con **Django + PostgreSQL** en el backend y **Next.js** en el frontend.

---

## Cómo leer esta documentación

| Si eres… | Empieza por |
|---|---|
| Alguien nuevo en el proyecto | [01-producto/01-vision.md](01-producto/01-vision.md) → [00-metodologia/03-flujo-de-trabajo.md](00-metodologia/03-flujo-de-trabajo.md) |
| Un agente de IA al que se le delega trabajo | [00-metodologia/07-delegacion-a-ia.md](00-metodologia/07-delegacion-a-ia.md) (obligatorio) |
| Quien va a cambiar un requisito | [00-metodologia/04-sincronizacion.md](00-metodologia/04-sincronizacion.md) |
| Quien va a escribir código | [03-arquitectura/](03-arquitectura/) + [06-calidad/](06-calidad/) + la spec de la feature en `specs/` |
| Quien va a probar / hacer QA | [06-calidad/01-estrategia-de-pruebas.md](06-calidad/01-estrategia-de-pruebas.md) |
| Quien encontró un error | [07-registro/01-errores-conocidos.md](07-registro/01-errores-conocidos.md) |

---

## Mapa de la carpeta

```text
docs/
├── README.md                              ← este archivo (índice)
│
├── 00-metodologia/                        ← CÓMO trabajamos
│   ├── 01-sdd.md                          Spec-Driven Development: principios, vibe coding, spec drift
│   ├── 02-spec-kit.md                     Cómo usamos GitHub Spec Kit (comandos, carpetas, ciclo)
│   ├── 03-flujo-de-trabajo.md             El ciclo completo: idea → docs → spec → Jira → código → verificación
│   ├── 04-sincronizacion.md               ⭐ Reglas de sincronización docs ↔ specs ↔ Jira ↔ código
│   ├── 05-trazabilidad-y-convenciones.md  IDs, ramas, commits, PRs, etiquetas
│   ├── 06-verificacion.md                 Cómo se comprueba que lo que se dijo que se hizo, se hizo
│   ├── 07-delegacion-a-ia.md              Reglas y plantillas para delegar trabajo a agentes de IA
│   └── 08-constitucion.md                 Borrador de la constitución (irá a .specify/memory/)
│
├── 01-producto/                           ← QUÉ y POR QUÉ
│   ├── 01-vision.md                       Problema, usuarios, propuesta de valor, las 8 preguntas SDD
│   ├── 02-usuarios-y-roles.md             Personas y roles
│   ├── 03-alcance-y-no-objetivos.md       Qué entra, qué NO entra (non-goals)
│   ├── 04-glosario.md                     Lenguaje del dominio
│   └── 05-roadmap-y-sprints.md            Fases 1–4 y plan de 5 sprints del MVP
│
├── 02-requisitos/                         ← QUÉ debe hacer el sistema
│   ├── 01-epicas.md                       15 épicas (ROS-1 … ROS-15)
│   ├── 02-historias-de-usuario.md         106 historias (ROS-16…119, 191, 192) con criterios
│   ├── 03-tareas-mvp.md                   71 tareas técnicas del MVP (ROS-120 … ROS-190)
│   ├── 04-reglas-de-negocio.md            Reglas del motor de evidencia, niveles, propagación
│   └── 05-requisitos-no-funcionales.md    Seguridad, rendimiento, accesibilidad, auditabilidad
│
├── 03-arquitectura/                       ← CÓMO se construye
│   ├── 01-vision-general.md               Contexto, contenedores, flujo de datos
│   ├── 02-stack-y-servicios.md            Django, PostgreSQL, Next.js y servicios adicionales necesarios
│   ├── 03-backend.md                      Apps Django, capas, convenciones
│   ├── 04-frontend.md                     Next.js: rutas, estado, estructura
│   ├── 05-api.md                          Contrato REST del MVP
│   ├── 06-motor-de-evidencia.md           Algoritmo de puntuación, niveles, conflictos, propagación
│   ├── 07-seguridad-y-autenticacion.md    OAuth + PKCE, sesiones, aislamiento, cifrado
│   ├── 08-infraestructura-y-entornos.md   Docker, entornos, CI/CD
│   ├── adr/                               Registro de decisiones de arquitectura (ADR)
│   └── evaluaciones/                      Evaluaciones de tecnologías candidatas (p. ej. Jev)
│
├── 04-datos/                              ← LOS DATOS
│   ├── 01-modelo-de-datos.md              Diagrama entidad-relación
│   ├── 02-diccionario-de-datos.md         Cada tabla y columna de Rosetta
│   └── 03-datos-de-referencia.md          Caso de ejemplo (MOV0010) y semillas
│
├── 05-diseno/                             ← EL ESTILO
│   ├── 01-sistema-de-diseno-nocturne.md   Tokens: color, tipografía, espaciado
│   ├── 02-componentes.md                  Componentes de la UI
│   ├── 03-pantallas.md                    Las 5 pantallas del prototipo, al detalle
│   └── 04-contenido-y-redaccion.md        Tono, microcopy, modo sin LLM
│
├── 06-calidad/                            ← QA
│   ├── 01-estrategia-de-pruebas.md        Pirámide de pruebas, herramientas, cobertura, CI
│   ├── 02-definicion-de-listo-y-terminado.md  DoR y DoD
│   └── 03-matriz-de-trazabilidad.md       Historia ↔ spec ↔ prueba ↔ código
│
├── 07-registro/                           ← LO QUE PASA
│   ├── 01-errores-conocidos.md            ⭐ Errores, limitaciones e inconsistencias conocidas
│   ├── 02-decisiones-pendientes.md        Preguntas abiertas (gaps)
│   ├── 03-registro-de-sincronizacion.md   Bitácora de cada cambio propagado
│   └── 04-changelog.md                    Historial de cambios de esta documentación
│
└── plantillas/                            ← plantillas reutilizables
    ├── cambio-de-documentacion.md
    ├── error-conocido.md
    ├── historia-de-usuario.md
    ├── adr.md
    └── pull-request.md
```

---

## Jerarquía de las fuentes de verdad

Cuando dos lugares dicen cosas distintas, manda el de arriba:

```text
1. Constitución            .specify/memory/constitution.md  (v1.0.0)
2. Documentación           docs/                            ← ESTA CARPETA
3. Especificaciones        specs/NNN-feature/               (spec.md, plan.md, tasks.md…)
4. Jira                    proyecto ROS                     (espejo de ejecución)
5. Código y pruebas        backend/, frontend/              (implementación)
   ─────────────────────────────────────────────────────────
   Notion                  archivo histórico, congelado     (ver 00-metodologia/04-sincronizacion.md)
```

**Los cambios solo bajan.** Nunca se cambia el comportamiento del sistema editando primero Jira o el código. El detalle completo está en [00-metodologia/04-sincronizacion.md](00-metodologia/04-sincronizacion.md).

---

## Enlaces del proyecto

| Recurso | Enlace | Rol |
|---|---|---|
| Jira — proyecto Rosetta (`ROS`) | https://fermentai.atlassian.net/browse/ROS-1 | Ejecución y seguimiento |
| Notion — Product Backlog | https://app.notion.com/p/3d66e542ba0b81ba923bcb0ffcf9a974 | Archivo histórico (congelado) |
| Prototipo (Claude Design) | https://claude.ai/design/p/7d43369f-9bc9-4c13-9acd-c5c801ed24ab?file=Rosetta.dc.html | Referencia visual |
| Spec Kit | https://github.com/github/spec-kit | Framework SDD |

---

## Estado de la documentación

- **Versión:** 1.1.0 — Fase 0.5: Spec Kit, constitución 1.0.0, esqueletos (2026-09-30). Ver [changelog](07-registro/04-changelog.md).
- **Fase actual del proyecto:** Fase 0.5 — preparación (casi terminada). La siguiente fase es especificar la feature 001 con `/speckit-specify` (ver [01-producto/05-roadmap-y-sprints.md](01-producto/05-roadmap-y-sprints.md)).
- **Huecos conocidos de esta documentación:** listados en [07-registro/01-errores-conocidos.md](07-registro/01-errores-conocidos.md) y [07-registro/02-decisiones-pendientes.md](07-registro/02-decisiones-pendientes.md). Nada se ha inventado: donde falta información, está marcado como `[PENDIENTE]` o `[NECESITA ACLARACIÓN]`.
