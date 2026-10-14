# Specification Quality Checklist: Inicio de sesión con Google y Microsoft

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-09-30
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

Validación del 2026-09-30, una iteración (los fallos de contenido encontrados se corrigieron en la misma pasada).

### Elementos que no pasan (esperado: hay 3 marcadores abiertos)

> **Actualización 2026-10-01 (`/speckit-clarify`):** los tres marcadores quedaron resueltos y los tres ítems pasan (13/16 → 16/16); ver `Clarifications` en `spec.md`. Esta sección se conserva como registro de la validación inicial.

Tres `[NEEDS CLARIFICATION]` siguen en la spec, dentro del máximo de 3. Por la metodología (`07-delegacion-a-ia.md` §3.3) los resuelve `/speckit-clarify`, no esta fase:

| Marcador | Pregunta | Recomendación |
|---|---|---|
| FR-001 | ¿"Cuenta de Microsoft" incluye cuentas de trabajo o institucionales además de las personales? | A decidir con el responsable: las cuentas de trabajo consumen la única conexión empresarial del plan gratuito (ADR-0007) y los clientes objetivo son bancos. |
| FR-010 | Un cambio de correo en el proveedor choca con el de otra cuenta: ¿se rechaza el acceso o se conserva el correo anterior y se deja entrar? | Conservar el correo anterior, dejar entrar y registrar el evento sin datos personales: la cuenta se identifica por la identidad del proveedor, no por el correo, así que no hay riesgo de suplantación y se evita bloquear a una persona legítima. |
| FR-020 | El paso "subir DDL" del onboarding (ROS-186) depende de la ingesta de la feature 004 (Sprint 2). ¿Se omite hasta la 004, se muestra solo "saltar", o se adelanta la carga? | Omitir el paso 2 hasta la 004 y completar el onboarding al crear el proyecto; requiere un CD que reformule la actividad de ROS-186. |

Por esos marcadores:

- "Requirements are testable and unambiguous" no pasa: FR-010 y FR-020 están incompletos hasta clarificar y FR-001 tiene un alcance sin cerrar.
- "All functional requirements have clear acceptance criteria" no pasa por los mismos FR-001, FR-010 y FR-020. Los otros 37 FR se verificaron uno a uno (revisión manual, los escenarios no citan IDs de FR) contra un escenario de aceptación, un caso límite o un criterio de éxito; FR-003, FR-006, FR-034 y FR-040 no tenían ninguno y se añadieron escenarios. FR-008 se cubre solo con un caso límite y SC-002, sin escenario propio.

### Verificaciones mecánicas realizadas

- 40 FR; los 40 llevan clave `ROS-…` (ninguno sin clave).
- 10 SC; ninguno menciona tecnología.
- La primera línea de `spec.md` lista ROS-89…93.
- Existe la sección "Fuera de alcance".
- Cero referencias a FR inexistentes; cero placeholders de plantilla sin reemplazar.
- Búsqueda de términos de tecnología: solo aparecen en rutas de enlaces y en el nombre de la rama.

### Huecos de `docs/` detectados (no se resuelven aquí; ver resumen de cierre)

- Textos de UI sin definir: frase de valor, nota de privacidad, bienvenida, errores de correo ya registrado con otro proveedor, correo no verificado y cuenta desactivada.
- Nombre ausente en la respuesta del proveedor: el diccionario de datos lo exige no nulo y no dice qué hacer.
- Duración de la sesión (14 y 30 días) marcada "provisional" sin un DP asociado.
- Acceso de administración interna: `[PENDIENTE] definir en 002` en el diccionario de datos, sin historia ni DP.
