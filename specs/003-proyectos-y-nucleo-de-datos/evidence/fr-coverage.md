# Cobertura de FR de la feature 003 (T064, ROS-178)

**Fecha:** 2026-10-19 · **Rama:** `003-proyectos-y-nucleo-de-datos`

Cada FR-001…FR-029 de [spec.md](../spec.md) con las pruebas que llevan su marcador (`@pytest.mark.fr("003:FR-###")` en Python; `[003:FR-###]` en el título de las pruebas de TypeScript). Generada buscando los marcadores en `backend/tests/` y `frontend/tests/`.

| FR | Pruebas | Estado |
|---|---|---|
| FR-001 | `backend/tests/api/test_openapi_contract.py`<br>`backend/tests/api/test_projects_create.py`<br>`backend/tests/projects/test_models.py`<br>`backend/tests/projects/test_services.py`<br>`frontend/tests/e2e/projects-navigation.spec.ts`<br>`frontend/tests/unit/project-form.test.tsx`<br>`frontend/tests/unit/project-list.test.tsx` | ✅ |
| FR-002 | `frontend/tests/e2e/onboarding.spec.ts`<br>`frontend/tests/unit/project-form.test.tsx` | ✅ |
| FR-003 | `backend/tests/api/test_projects_create.py`<br>`backend/tests/projects/test_services.py`<br>`frontend/tests/unit/project-form.test.tsx` | ✅ |
| FR-004 | `backend/tests/api/test_projects_create.py`<br>`backend/tests/api/test_projects_update.py`<br>`backend/tests/projects/test_lifecycle.py`<br>`backend/tests/projects/test_models.py`<br>`backend/tests/projects/test_services.py`<br>`backend/tests/test_exceptions.py`<br>`frontend/tests/e2e/projects-archive.spec.ts`<br>`frontend/tests/unit/archive-controls.test.tsx`<br>`frontend/tests/unit/project-form.test.tsx` | ✅ |
| FR-005 | `backend/tests/api/test_openapi_contract.py`<br>`backend/tests/api/test_projects_create.py`<br>`backend/tests/api/test_projects_list.py`<br>`backend/tests/projects/test_services.py`<br>`frontend/tests/unit/project-list.test.tsx` | ✅ |
| FR-006 | `frontend/tests/unit/project-list.test.tsx` | ✅ |
| FR-007 | `frontend/tests/e2e/projects-navigation.spec.ts`<br>`frontend/tests/unit/project-not-found.test.tsx`<br>`frontend/tests/unit/project-tabs.test.tsx` | ✅ |
| FR-008 | `frontend/tests/e2e/projects-navigation.spec.ts`<br>`frontend/tests/unit/project-switcher.test.tsx` | ✅ |
| FR-009 | `frontend/tests/e2e/projects-navigation.spec.ts`<br>`frontend/tests/unit/project-switcher.test.tsx`<br>`frontend/tests/unit/query-provider.test.tsx` | ✅ |
| FR-010 | `backend/tests/api/test_projects_update.py`<br>`backend/tests/projects/test_lifecycle.py`<br>`backend/tests/projects/test_models.py`<br>`frontend/tests/e2e/projects-archive.spec.ts`<br>`frontend/tests/unit/archive-controls.test.tsx` | ✅ |
| FR-011 | `backend/tests/api/test_projects_update.py`<br>`backend/tests/projects/test_lifecycle.py`<br>`frontend/tests/unit/archive-controls.test.tsx` | ✅ |
| FR-012 | `backend/tests/api/test_projects_update.py`<br>`backend/tests/projects/test_lifecycle.py`<br>`frontend/tests/e2e/projects-archive.spec.ts`<br>`frontend/tests/unit/archive-controls.test.tsx` | ✅ |
| FR-013 | `backend/tests/api/test_projects_update.py`<br>`backend/tests/projects/test_lifecycle.py`<br>`backend/tests/test_exceptions.py`<br>`frontend/tests/e2e/projects-archive.spec.ts`<br>`frontend/tests/unit/archive-controls.test.tsx` | ✅ |
| FR-014 | `backend/tests/core_data/test_for_user.py`<br>`backend/tests/security/test_cross_access.py`<br>`frontend/tests/e2e/cross-access.spec.ts` | ✅ |
| FR-015 | `backend/tests/api/test_projects_create.py`<br>`backend/tests/api/test_projects_update.py`<br>`backend/tests/security/test_cross_access.py`<br>`backend/tests/security/test_ownership.py`<br>`backend/tests/test_exceptions.py`<br>`frontend/tests/e2e/cross-access.spec.ts`<br>`frontend/tests/unit/project-not-found.test.tsx` | ✅ |
| FR-016 | `backend/tests/security/test_no_sensitive_data.py` | ✅ |
| FR-017 | `backend/tests/security/test_ownership.py` | ✅ |
| FR-018 | `backend/tests/security/test_cross_access.py` | ✅ |
| FR-019 | `backend/tests/security/test_no_sensitive_data.py` | ✅ |
| FR-020 | `backend/tests/test_settings.py` | ✅ |
| FR-021 | `backend/tests/api/test_project_state.py`<br>`frontend/tests/e2e/project-reopen.spec.ts` | ✅ |
| FR-022 | `backend/tests/api/test_project_state.py`<br>`frontend/tests/unit/project-state.test.tsx` | ✅ |
| FR-023 | `backend/tests/core_data/test_evidence_review_models.py` | ✅ |
| FR-024 | `backend/tests/projects/test_lifecycle.py`<br>`backend/tests/projects/test_seed.py` | ✅ |
| FR-025 | `backend/tests/core_data/test_evidence_review_models.py` | ✅ |
| FR-026 | `backend/tests/core_data/test_base_models.py`<br>`backend/tests/core_data/test_catalog_models.py`<br>`backend/tests/core_data/test_evidence_review_models.py`<br>`backend/tests/core_data/test_sources_models.py` | ✅ |
| FR-027 | `backend/tests/projects/test_seed.py` | ✅ |
| FR-028 | `backend/tests/core_data/test_migrations.py` | ✅ |
| FR-029 | `frontend/tests/e2e/projects-a11y.spec.ts`<br>`frontend/tests/unit/project-form.test.tsx` | ✅ |

**Sin prueba:** ninguno.

Notas:
- **FR-020** cubre la parte que no depende del proveedor (HSTS y redirección a HTTPS en `prod.py`). El cifrado en reposo, las llaves y la revisión del entorno desplegado (SC-009) esperan a T045, ⛔ [DP-015](../../../docs/07-registro/02-decisiones-pendientes.md#dp-015); la configuración está en [security-config.md](security-config.md).
- **FR-026** se comprueba además columna a columna en [model-vs-dictionary.md](model-vs-dictionary.md) (una diferencia, EC-027 propuesto).
- **SC-003** (E2E-01) lo cubre `frontend/tests/e2e/onboarding.spec.ts` (T052 y T087 de la 002).
