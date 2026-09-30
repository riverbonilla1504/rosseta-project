# Frontend (Next.js)

> Estructura y convenciones de `frontend/`. Diseño visual: [05-diseno/](../05-diseno/01-sistema-de-diseno-nocturne.md). Contrato de datos: [05-api.md](05-api.md).

## 1. Estructura de carpetas

```text
frontend/
├── package.json · pnpm-lock.yaml · tsconfig.json (strict) · next.config.ts
├── vitest.config.ts · playwright.config.ts · eslint.config.mjs
├── src/
│   ├── app/                              # App Router
│   │   ├── layout.tsx                    # <html lang="es">, fuentes, tokens, QueryClientProvider
│   │   ├── (public)/
│   │   │   ├── login/page.tsx            # botones Google / Microsoft
│   │   │   └── auth/error/page.tsx       # error de OAuth legible
│   │   ├── (app)/                        # rutas protegidas (middleware.ts)
│   │   │   ├── layout.tsx                # barra superior: marca, navegación, insignias
│   │   │   ├── onboarding/page.tsx
│   │   │   ├── projects/page.tsx         # listado y creación de proyectos
│   │   │   └── p/[projectId]/
│   │   │       ├── page.tsx              # Panorama
│   │   │       ├── review/page.tsx       # Revisión (?column=<uuid>)
│   │   │       ├── catalog/page.tsx      # Catálogo: lista de tablas
│   │   │       ├── catalog/[tableId]/page.tsx   # tabla columna por columna (?column=<uuid>)
│   │   │       ├── sources/page.tsx      # Fuentes: subir DDL/CSV, estado, cobertura
│   │   │       └── conventions/page.tsx  # Convenciones de nombres
│   │   └── api/ … (no se usa: el proxy se hace con rewrites)
│   ├── design-system/                    # Nocturne: tokens.css + componentes base y de dominio
│   │   ├── tokens.css
│   │   ├── components/                   # Button, Input, Card, Table, Badge, Tabs…
│   │   └── domain/                       # ConfidenceChip, EvidenceCard, QueueList, ConflictNotice…
│   ├── features/                         # lógica por pantalla (hooks + componentes propios)
│   │   ├── auth/ · projects/ · sources/ · review/ · catalog/ · panorama/ · conventions/
│   ├── lib/
│   │   ├── api/client.ts                 # openapi-fetch + manejo de 401 → refresh
│   │   ├── api/schema.d.ts               # GENERADO desde OpenAPI (no editar)
│   │   ├── query-keys.ts                 # claves de TanStack Query centralizadas
│   │   ├── identifiers.ts                # formato único de identificadores (RN-17, ROS-166)
│   │   └── confidence.ts                 # etiquetas y orden de los 5 niveles (única fuente en el cliente)
│   └── middleware.ts                     # redirige a /login si no hay cookie de sesión
└── tests/
    ├── unit/                             # Vitest + Testing Library
    └── e2e/                              # Playwright + axe
```

## 2. Navegación del MVP

| Pestaña | Ruta | Historias | En el prototipo |
|---|---|---|---|
| Panorama | `/p/{id}` | ROS-37…40 | Sí |
| Revisión | `/p/{id}/review` | ROS-42…48 | Sí |
| Catálogo | `/p/{id}/catalog` | ROS-50…55 | Sí |
| Fuentes | `/p/{id}/sources` | ROS-16, 17, 22 | **No** (necesaria para cargar archivos) |
| Hallazgos | — | Fase 2 | Sí |
| Generador | — | Fase 2 | Sí |

`[NECESITA ACLARACIÓN]` si Hallazgos y Generador se muestran deshabilitados ("Próximamente") u ocultos en el MVP, y si Convenciones es pestaña o sección de Fuentes: [DP-017](../07-registro/02-decisiones-pendientes.md). **Por defecto:** ocultos; Convenciones como sección dentro de Fuentes.

Barra superior (del prototipo): marca "Rosetta · MOTOR DE EVIDENCIA", pestañas, insignia del proyecto (en el prototipo `CORE_PRD · sqlserver`; en el MVP: `nombre del proyecto · dialecto`), insignia "solo lectura" e indicador de redacción ("redacción por reglas" en el MVP; ver [04-contenido-y-redaccion.md](../05-diseno/04-contenido-y-redaccion.md)).

## 3. Estado y datos

| Tipo de estado | Dónde vive | Ejemplo |
|---|---|---|
| Datos del servidor | **TanStack Query** | catálogo, cola, cobertura, ficha de columna |
| Estado de UI efímero | **Zustand** (un store por feature) | ítem seleccionado de la cola, panel de rastro abierto |
| Estado en la URL | `searchParams` | columna seleccionada (`?column=`), filtros |
| Sesión | Cookies httpOnly (el JS no las lee) | access/refresh |

**Estado compartido (RN-18, ROS-55, ROS-167).** Tras cualquier mutación de revisión (`confirm`, `reject`, `edit`) el cliente:
1. aplica la respuesta del servidor a la consulta de la columna (`setQueryData`),
2. invalida `queue`, `catalog(tableId)`, `coverage`, `findings`, `projectState`.

No hay actualizaciones optimistas del **nivel**: el nivel siempre viene del servidor (el cliente no sabe calcular la propagación). Sí puede mostrarse un estado "guardando…".

**Claves de consulta** centralizadas en `lib/query-keys.ts`:

```ts
export const qk = {
  project: (id: string) => ["project", id] as const,
  queue: (id: string, f?: QueueFilters) => ["project", id, "queue", f] as const,
  coverage: (id: string) => ["project", id, "coverage"] as const,
  tables: (id: string) => ["project", id, "tables"] as const,
  columns: (tableId: string) => ["table", tableId, "columns"] as const,
  column: (columnId: string) => ["column", columnId] as const,
  sources: (id: string) => ["project", id, "sources"] as const,
};
```

## 4. Comunicación con el backend

- El navegador **solo habla con el origen de Next.js**. `next.config.ts` reescribe `/api/:path*` y `/auth/:path*` al backend (`BACKEND_INTERNAL_URL`). Así las cookies son de primer origen y no hace falta CORS ([ADR-0006](adr/ADR-0006-autenticacion-oauth-jwt-cookies.md)).
- Cliente tipado: `openapi-fetch` con los tipos de `schema.d.ts` generados por `pnpm api:types` (lee `/api/schema/`). CI falla si los tipos generados difieren de los versionados.
- Ante `401`, el cliente llama una vez a `POST /auth/refresh` y reintenta; si vuelve a fallar, redirige a `/login`.
- Los componentes de servidor (RSC) se usan solo para el *shell* y páginas públicas; las pantallas de datos son componentes de cliente con TanStack Query (necesitan interactividad, teclado y caché compartida).

## 5. Atajos de teclado (ROS-47, ROS-160)

| Tecla | Acción | Dónde |
|---|---|---|
| `J` | Siguiente ítem de la cola | Revisión |
| `K` | Ítem anterior | Revisión |
| `A` | Aceptar (Confirmar) | Revisión |
| `E` | Editar significado | Revisión |
| `R` | Rechazar (pide motivo) | Revisión |
| `?` | Mostrar ayuda de atajos | Revisión |
| `Esc` | Cerrar diálogo / cancelar edición | Global |

- Se ignoran si el foco está en `input`, `textarea`, `select` o `[contenteditable]`.
- Implementados en un hook `useReviewShortcuts()` con un solo listener.
- Visibles: leyenda en la ficha + ayuda con `?`.

## 6. Convenciones

- Componentes en `PascalCase.tsx` con su `Component.module.css` al lado; hooks `useAlgo.ts`.
- **Prohibido** usar colores, tamaños o sombras literales en CSS: solo `var(--token)` (Constitución VII). Un lint (`stylelint` con regla de valores permitidos o revisión en PR) lo verifica.
- Textos de interfaz en español en `features/*/copy.ts` (no dispersos en JSX) para revisión de redacción.
- Identificadores de esquema (`MOV0010.CTANRO`) se renderizan **siempre** con `<Identifier>` (fuente monoespaciada, formato de `lib/identifiers.ts`).
- Niveles de confianza **siempre** con `<ConfidenceChip level=…>`; nunca texto suelto.
- Accesibilidad: roles ARIA en tablas y listas, `aria-live="polite"` para resultados de confirmación ("Se desbloquearon 210 columnas"), foco visible.
- Estados obligatorios en toda vista de datos: **cargando**, **vacío** (con siguiente acción), **error** (con reintentar).
