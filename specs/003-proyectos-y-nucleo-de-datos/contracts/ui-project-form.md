# Contrato de interfaz: formulario de creación de proyecto

**Feature**: 003 (lo provee) · **Consumidores**: `/projects` (003) y `/onboarding` (002, T055) · FR-001…FR-004, FR-029 de la 003; FR-019 de la 002

Un solo componente, `features/projects/ProjectForm.tsx`. El onboarding no duplica reglas ni textos (FR-002).

## Entradas y salidas

| Prop | Tipo | Uso |
|---|---|---|
| `onCreated` | `(project: ProjectSummary) => void \| Promise<void>` | Lo llama tras un `201`. `/projects` navega a `/p/{id}` (aclaración de la spec); el onboarding llama a `POST /api/me/onboarding/complete` y navega a `/projects` (002, FR-018) |
| `submitLabel?` | `string` | Opcional; por defecto el texto de `copy.ts` (provisional, DP-028) |

`ProjectSummary` es el esquema de [projects-api.yaml](projects-api.yaml).

## Comportamiento

| Situación | Comportamiento |
|---|---|
| Campos | Nombre (texto) y dialecto (selector con exactamente "SQL Server", "Oracle", "PostgreSQL" → `tsql`, `oracle`, `postgres`; sin opción preseleccionada) |
| Validación local | Nombre vacío tras recortar, > 120 caracteres o sin dialecto: no envía; error junto al campo, anunciado a lectores de pantalla, foco en el primer campo con error |
| Envío | Un solo envío en curso: el botón queda deshabilitado hasta la respuesta (FR-003) |
| `400 validation_error` / `project_name_taken` | Error junto al campo indicado en `details`; lo escrito se conserva |
| `401` | Lo resuelve `apiFetch` (002, FR-026): acceso con aviso y regreso |
| `5xx` / red | Error genérico de [04-contenido §5](../../../docs/05-diseno/04-contenido-y-redaccion.md) ("Algo salió mal y no se guardó ningún cambio. Intenta de nuevo."); lo escrito se conserva; no reintenta solo |
| Accesibilidad | Etiquetas asociadas, orden del foco igual al visual, foco visible, sin `--nx-text-secondary` ni `--nx-text-muted` sobre `--nx-surface` (EC-024) |

## Textos

Definidos en `docs/`: etiquetas de los dialectos (DP-019) y el error genérico. Provisionales hasta **DP-028**: etiquetas de los campos, botón, errores de validación y de nombre repetido.
