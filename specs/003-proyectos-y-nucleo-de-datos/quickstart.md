# Quickstart: validar Proyectos y núcleo de datos

**Feature**: [spec.md](spec.md) · **Plan**: [plan.md](plan.md)

Guía para comprobar la feature de punta a punta. No repite contratos ni modelo: enlaza a [contracts/](contracts/) y [data-model.md](data-model.md).

## 1. Requisitos

- Entorno de la feature 002 funcionando (tenant de desarrollo de Auth0, `.env` y `frontend/.env.local`): ver [quickstart de la 002](../002-autenticacion-oauth/quickstart.md).
- `docker compose up -d db redis`; backend en `:8000` y frontend en `:3000` (README, *Desarrollo local*). En este equipo `uv` va como `python -m uv`.
- Dos cuentas de prueba (A y B), sintéticas.

## 2. Comprobaciones automáticas

```bash
cd backend && python -m uv run python manage.py migrate
cd backend && python -m uv run pytest --cov
cd backend && python -m uv run pytest tests/security -k cross_access
cd frontend && pnpm test:coverage
cd frontend && pnpm exec playwright test projects
```

Resultado esperado: todo en verde, cobertura backend ≥ 85 % y frontend ≥ 80 %; la suite de acceso cruzado lista **todas** las operaciones del esquema y ninguna queda sin caso (FR-018).

## 3. Migraciones desde cero y siembra (SC-007)

```bash
cd backend && python -m uv run python manage.py migrate projects zero
cd backend && python -m uv run python manage.py migrate
cd backend && python -m uv run python manage.py seed_reference_project --owner-sub "<sub de la cuenta A>"
cd backend && python -m uv run python manage.py seed_reference_project --owner-sub "<sub de la cuenta A>"
```

Esperado: la segunda siembra no duplica nada; `CORE_DEMO` tiene `MOV0010` con 11 columnas y los niveles de [03-datos-de-referencia §2](../../docs/04-datos/03-datos-de-referencia.md).

## 4. Escenarios manuales

| # | Escenario | Esperado | FR / SC |
|---|---|---|---|
| Q1 | Cuenta nueva: acceso → onboarding → crear "CORE_PRD" con "SQL Server" | Onboarding completado, llega a `/projects` y ve el proyecto | FR-001, FR-002 · SC-003 |
| Q2 | En `/projects`, crear "Ventas" con "Oracle" | Entra en el Panorama de "Ventas"; insignia `Ventas · oracle`; pestañas Panorama, Revisión, Catálogo y Fuentes | FR-001, FR-007, FR-008 |
| Q3 | Crear "core_prd" con otro activo "CORE_PRD" | Error de nombre repetido junto al campo; nada creado | FR-004 |
| Q4 | Nombre vacío, solo espacios, 121 caracteres, sin dialecto; doble clic en crear | Errores junto al campo; nunca dos proyectos | FR-003 |
| Q5 | Abrir `CORE_DEMO`, cerrar sesión, entrar desde otro navegador y abrirlo | Mismo estado (cobertura, fuentes, cola) | FR-021 · SC-002 |
| Q6 | Con `CORE_DEMO` abierto, cambiar a "Ventas" desde el selector con la red lenta (DevTools) | Ningún dato de `CORE_DEMO` aparece en "Ventas" | FR-009 · SC-004 |
| Q7 | Archivar "Ventas" estando dentro | Vuelve a `/projects`; "Ventas" solo aparece con el filtro de archivados | FR-010, FR-012 |
| Q8 | Abrir "Ventas" archivado; intentar renombrarlo | Se ve en solo lectura; no hay forma de modificarlo salvo desarchivar | FR-013 |
| Q9 | Crear otro "Ventas" activo y desarchivar el antiguo | Pide un nombre nuevo antes de desarchivar | FR-004, FR-013 |
| Q10 | Con la cuenta B, abrir `/p/<id de CORE_DEMO>` y pedir `/api/projects/<id>/state` | Pantalla y respuesta de "no encontrado", idénticas a las de un UUID inventado; evento `access_denied` en los registros sin correo ni nombre | FR-014, FR-015, FR-017 · SC-001 |
| Q11 | Revisar los registros y las direcciones de Q1–Q10 | Sin correos, nombres, tokens, valores de muestras ni contenidos de esquemas | FR-019 · SC-005 |
| Q12 | `/projects`, formulario y selector solo con teclado y con axe | Sin violaciones serias o críticas; foco visible y en orden | FR-029 · SC-008 |

Registrar los resultados en `evidence/quickstart-run.md` de esta feature.

## 5. Bloqueado por DP-015

HSTS y cifrado en reposo del entorno desplegado, gestión y rotación de llaves y la revisión de configuración de SC-009 se comprueban cuando exista el entorno (como T089 en la 002).
