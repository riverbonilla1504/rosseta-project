# Estrategia de pruebas (QA)

> Cómo se prueba Rosetta y qué debe pasar para que algo se considere hecho. Complementa [06-verificacion.md](../00-metodologia/06-verificacion.md) (verificación de que lo declarado se hizo) con el **cómo técnico** de las pruebas.
> Regla madre (Constitución II): **prueba primero, verla fallar, luego implementar.**

## 1. Pirámide

```text
                 ▲  E2E (Playwright + axe)          ~10–20 flujos críticos
                ▲▲▲ Contrato (OpenAPI ↔ tipos TS)    1 job de CI
              ▲▲▲▲▲ Integración / API (pytest + PostgreSQL real)   cada endpoint y service
          ▲▲▲▲▲▲▲▲▲ Unitarias (motor puro, utilidades, componentes) la mayoría
```

| Nivel | Qué cubre | Herramientas | Dónde |
|---|---|---|---|
| **Unitarias — motor** | `evidence_engine`: puntaje, niveles, conflictos, propagación, impacto, plantillas | pytest + **hypothesis** | `backend/tests/engine/` |
| **Unitarias — backend** | Parseo DDL (sqlglot), perfilador, adaptadores de evidencia, utilidades | pytest | `backend/tests/unit/` |
| **Integración / API** | Endpoints, services, transacciones, permisos, tareas Celery (modo eager) | pytest-django, `APIClient`, factory_boy, **PostgreSQL 16 real** | `backend/tests/api/` |
| **Seguridad** | Acceso cruzado, tokens maliciosos, cabeceras, logs sin PII | pytest | `backend/tests/security/` |
| **Unitarias — frontend** | Componentes Nocturne, hooks (atajos, sesión), formateo es-CO | Vitest + Testing Library | `frontend/tests/unit/` |
| **Contrato** | OpenAPI generado = versionado; tipos TS compilan | drf-spectacular, openapi-typescript, `tsc` | CI job `contract` |
| **E2E** | Flujos de usuario reales contra el stack completo | Playwright + @axe-core/playwright | `frontend/tests/e2e/` |
| **Rendimiento** | p95 de RNF-10…13 con el esquema grande sintético | pytest-benchmark / script `locust` ligero | `backend/tests/perf/` (manual por sprint) |
| **Accesibilidad** | WCAG 2.1 AA automatizable | axe en E2E + revisión manual con teclado y lector de pantalla | E2E + checklist QA |

## 2. Reglas de las pruebas

1. **Trazabilidad obligatoria.** Toda prueba que cubre un requisito lleva marcadores:
   ```python
   @pytest.mark.story("ROS-27")
   @pytest.mark.fr("005:FR-006")
   def test_reserv3_empty_column_is_unknown(): ...
   ```
   ```ts
   test("[ROS-48][007:FR-010] pendiente nunca se muestra como Confirmada", ...)
   ```
   `tools/check_traceability.py` falla si un `FR` de una spec activa no tiene al menos una prueba.
2. **Nombres que describen comportamiento**: `test_confirm_propagates_to_same_name_and_type`, no `test_confirm_2`.
3. **Estructura AAA** (preparar, actuar, afirmar); una razón de fallo por prueba.
4. **Sin mocks de base de datos** (Constitución II). Sí se simulan: Auth0 (tokens firmados con claves RSA de prueba y JWKS simulado), almacenamiento S3 (`moto` o disco), reloj (`time-machine`).
5. **Datos sintéticos** con factory_boy y los fixtures de [03-datos-de-referencia.md](../04-datos/03-datos-de-referencia.md). Prohibidos datos reales.
6. **Deterministas**: semillas fijas, sin dependencia del orden de ejecución (`pytest-randomly` activado para detectarlo), sin `sleep`.
7. **Prohibido** desactivar, marcar `skip`/`xfail` o debilitar una prueba para que CI pase sin un error conocido registrado (`EC-NNN`) y aprobación en el PR.
8. **Prueba roja primero**: el PR muestra un commit `test(...)` con la prueba fallando antes del commit `feat(...)` (verificado en la revisión, ver [06-verificacion.md](../00-metodologia/06-verificacion.md)).

## 3. Cobertura mínima (gate de CI)

| Ámbito | Mínimo | Medida |
|---|---|---|
| Backend global | **85 %** líneas + ramas | `pytest --cov=apps --cov=evidence_engine --cov-branch` |
| `evidence_engine` | **95 %** | ídem, reporte separado |
| Frontend | **80 %** líneas | `vitest --coverage` |
| Regla adicional | La cobertura **no baja** respecto a `main` | comparación en CI |

La cobertura es un mínimo, no el objetivo: un FR sin prueba de comportamiento no está cubierto aunque la línea se ejecute.

## 4. Pruebas obligatorias por feature del MVP

| Feature | Pruebas que no pueden faltar |
|---|---|
| **001 Nocturne** | Snapshot de los 5 `ConfidenceChip`; "HIGH_UNVALIDATED no dice Confirmada"; contraste AA de pares de tokens (script que calcula ratios desde `tokens.css`); foco visible (axe) |
| **002 OAuth (Auth0)** | Validación del token en Django con claves RSA de prueba: válido, expirado, `aud`/`iss` erróneos, firma alterada, `alg: none`, `kid` desconocido; alta del usuario en el primer acceso sin duplicar; URL de `/auth/login` con `code_challenge` S256 y `state`; proxy BFF añade Bearer, no expone el token y rechaza mutaciones de otro origen; logout invalida la sesión; cookies con flags correctos; logs sin tokens/correos; E2E de login con proveedor simulado (usuario de prueba del tenant de desarrollo) |
| **003 Proyectos y núcleo** | CRUD; acceso cruzado 100 % endpoints; UUID en rutas; migraciones desde cero; estado igual tras cerrar/reabrir (RNF-16); CHECK de BD `CONFIRMED ⇔ confirmed_by_action` |
| **004 Ingesta** | DDL T-SQL/Oracle/Postgres de ejemplo → tablas/columnas/tipos/PK/FK/índices sin pérdida; reimportar idempotente; CSV con `;` y `latin-1`; archivo grande → segundo plano; cabeceras sin coincidencia; eliminar fuente → evidencia retirada y recálculo; regla editada → recálculo; peso de regla > 0,40 rechazado |
| **005 Motor** | Propiedades (determinismo, monotonía, rango, "solo nombre ≤ 0,40", "nunca CONFIRMED"); 11 casos de MOV0010 con su nivel; RESERV3 = UNKNOWN; conflicto limita nivel; sin cita no supera Hipótesis; desglose suma coherente |
| **006 Cola** | Orden por impacto con desempates; excluye confirmadas; se recalcula tras confirmar/rechazar; paginación estable |
| **007 Revisión** | Confirmar propaga y devuelve conteo = previsualización (RN-13); dos confirmaciones concurrentes sin corrupción (hilos + `transaction=True`); rechazo sin motivo = 400; rechazo revierte propagación; `ReviewAction` no editable/borrable (API, ORM y trigger); atajos J/K/A/E/R y no interfieren en inputs (E2E) |
| **008 Catálogo** | Lista y detalle; 1.000 columnas p95 < 500 ms (RNF-10); virtualización; confirmar en Revisión cambia la fila (E2E, RN-18); identificadores idénticos entre pantallas |
| **009 Panorama** | Suma por nivel = total (ROS-146); caché invalida al confirmar; clic en nivel → catálogo filtrado; estados vacío/carga/error |

## 5. Flujos E2E críticos (Playwright)

| # | Flujo | Historias |
|---|---|---|
| E2E-01 | Login con proveedor simulado → onboarding → crear proyecto | ROS-89…91, 78 |
| E2E-02 | Subir DDL → esperar procesamiento → ver tablas en Catálogo | ROS-16, 50 |
| E2E-03 | Subir muestra de MOV0010 → ver perfil en la ficha | ROS-17, 43 |
| E2E-04 | Panorama → "Continuar revisión" → confirmar con `A` → toast con conteo → Catálogo muestra "Confirmada" → Panorama suma | ROS-39, 46, 47, 29, 55, 37 |
| E2E-05 | Rechazar con `R` + motivo → nivel baja → no vuelve a proponerse | ROS-46 |
| E2E-06 | Recorrer toda la cola con `J`/`K` sin ratón | ROS-47, RNF-25 |
| E2E-07 | Columna con conflicto: aviso visible, previsualización excluye | ROS-45, 28 |
| E2E-08 | Logout → rutas protegidas redirigen a login | ROS-92 |
| E2E-09 | Usuario B no ve proyecto de A (404) | ROS-84 |
| E2E-10 | axe sin violaciones *serious/critical* en las 5 pantallas del MVP | RNF-24 |

## 6. QA manual por sprint

Al cierre de cada sprint, QA ejecuta sobre **staging**:
1. Los criterios de aceptación de cada historia cerrada (uno por uno, con evidencia: captura o video corto).
2. Checklist de accesibilidad manual: navegación completa por teclado, lector de pantalla (NVDA) en Revisión y Catálogo, zoom 200 %.
3. Prueba exploratoria de 30 min enfocada en la feature del sprint.
4. Resultado en el acta de verificación y comentario en Jira ([06-verificacion.md](../00-metodologia/06-verificacion.md)). Los fallos se registran como tipo **Error** en Jira y, si no se corrigen en el sprint, como `EC-NNN` en [01-errores-conocidos.md](../07-registro/01-errores-conocidos.md).

## 7. Gestión de defectos

| Severidad | Definición | Respuesta |
|---|---|---|
| **S1 · Crítico** | Pérdida/corrupción de datos, fuga entre usuarios, "Confirmada" sin humano, caída | Bloquea la entrega; se corrige antes que cualquier otra cosa |
| **S2 · Alto** | Funcionalidad del MVP inutilizable sin alternativa | Se corrige en el sprint |
| **S3 · Medio** | Funciona con alternativa o degrada la experiencia | Se planifica |
| **S4 · Bajo** | Cosmético | Backlog |

Ciclo del error (con el flujo SDD de bugs): `fix/ROS-NNN-slug` → prueba que reproduce (roja) → corrección → verde → verificación (`verified`/`partial`/`failed`) → cierre en Jira con evidencia. Ver [03-flujo-de-trabajo.md](../00-metodologia/03-flujo-de-trabajo.md).
