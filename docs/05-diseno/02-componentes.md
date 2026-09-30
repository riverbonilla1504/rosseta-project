# Componentes

> Biblioteca de componentes de Nocturne para Rosetta (ROS-75, tareas ROS-170 y ROS-171). Viven en `frontend/src/design-system/`. Cada componente tiene: propósito, props, estados, accesibilidad y pruebas mínimas. Ninguna pantalla crea un componente equivalente por su cuenta.

## 1. Componentes base (ROS-170)

| Componente | Propósito | Props clave | Estados | Accesibilidad |
|---|---|---|---|---|
| `Button` | Acción | `variant: "primary" \| "secondary" \| "ghost" \| "danger"`, `size`, `loading`, `disabled` | normal, hover, foco, activo, cargando, deshabilitado | `<button>` nativo; `aria-busy` al cargar |
| `LinkButton` | Enlace con apariencia de acción ("Abrir revisión →") | `href` | ídem | `<a>` nativo |
| `Input` / `Textarea` | Texto | `label`, `error`, `hint` | normal, foco, error, deshabilitado | `<label>` asociado; `aria-invalid`, `aria-describedby` |
| `Select` | Selección | `options`, `label` | | nativo |
| `FileDrop` | Subir archivo (DDL/CSV) | `accept`, `maxSizeMb`, `onFile` | vacío, arrastrando, archivo elegido, subiendo (%), error | Operable con teclado (botón "Elegir archivo") |
| `Card` | Contenedor con etiqueta de sección | `label` (MAYÚSCULAS), `aside` (texto a la derecha), `children` | | `<section aria-labelledby>` |
| `Table` | Tabla de datos | `columns`, `rows`, `rowKey`, `selectedKey`, `onRowClick`, `virtualized` | vacía, cargando (esqueleto), con fila seleccionada | `<table>` semántica, `aria-selected`, navegación con flechas |
| `Badge` | Insignia de metadatos | `tone: "neutral" \| "outline"`, `mono` | | texto |
| `ProgressBar` | Barra simple (fuentes) | `value`, `max`, `label` | | `role="progressbar"` + `aria-valuenow` |
| `StackedBar` | Barra de cobertura por niveles | `segments: {level, value}[]`, `total` | | `role="img"` + `aria-label` con los valores; la leyenda textual es obligatoria |
| `Stat` | Cifra grande + leyenda | `value`, `label`, `caption`, `marker` | | |
| `Tabs` / `TopNav` | Navegación principal | `items`, `active` | activo, hover, foco | `<nav>` + `aria-current="page"` |
| `Dialog` | Modal (rechazo con motivo, edición) | `title`, `onClose` | | foco atrapado, `Esc` cierra, retorna foco |
| `Toast` | Resultado de acción | `tone`, `message` | | `aria-live="polite"` |
| `Skeleton` / `EmptyState` / `ErrorState` | Estados de vista | `title`, `action` | | `EmptyState` siempre sugiere la siguiente acción (RNF-28) |
| `Kbd` | Tecla de atajo | `children` | | |

## 2. Componentes de dominio (ROS-171)

### `ConfidenceChip`
Muestra el nivel. **Único** componente autorizado para niveles (Constitución VII).

| Prop | Tipo |
|---|---|
| `level` | `"CONFIRMED" \| "HIGH_UNVALIDATED" \| "INFERRED" \| "HYPOTHESIS" \| "UNKNOWN"` |
| `size` | `"sm" \| "md"` |

Estilo por nivel en [01-sistema-de-diseno-nocturne.md §2.4](01-sistema-de-diseno-nocturne.md). Texto: "Confirmada", "Alta · sin validar", "Inferida", "Hipótesis", "Desconocido" (ver [04-contenido-y-redaccion.md](04-contenido-y-redaccion.md)). `title` con la definición del nivel. Prueba: *snapshot* de los 5 niveles + test de que "HIGH_UNVALIDATED" nunca renderiza el texto "Confirmada" (ROS-48).

### `ConfidenceScore`
Número de confianza con 2 decimales en formato es-CO (`0,91`); `UNKNOWN` → `–`. Monoespaciado, alineado a la derecha.

### `Identifier`
`MOV0010.CTANRO` en monoespaciada con formato único (`lib/identifiers.ts`). Props: `table`, `column`, `showTable`. Copiable con clic derecho/menú.

### `DataType`
Tipo con nulabilidad: `decimal(9,0) NOT NULL`, monoespaciado, color apagado.

### `QueueItem` / `QueueList`
Ítem de la cola: `Identifier` + `DataType` + pista del nombre + cifra de impacto a la derecha ("380 / columnas que desbloquea"). En Revisión, lista vertical con ítem activo resaltado y navegación J/K. Props: `items`, `activeId`, `onSelect`. `role="listbox"`, `aria-activedescendant`.

### `EvidenceCard` (ficha de evidencia)
Bloque central de Revisión (ROS-42, ROS-151). Secciones en este orden (jerarquía definida en ROS-151):
1. Encabezado: `Identifier`, `DataType`, `ConfidenceChip`, `ConfidenceScore`.
2. **Afirmación propuesta:** nombre de negocio + descripción.
3. `ConflictNotice` (si hay).
4. **Evidencias** (`CitationItem` por evidencia, ordenadas por aporte).
5. **Perfil** (`ProfileSummary`).
6. **Efecto de propagación** (`PropagationPreview`).
7. **Acciones** (`ReviewActions`).

### `CitationItem`
Una evidencia: tipo de fuente, afirmación, peso y fuerza, extracto; botón "Ver en la fuente" que resuelve la cita (`GET /api/evidence/{id}/citation`). Si la fuente fue eliminada: "Fuente eliminada" en gris (la evidencia ya no cuenta).

### `ScoreBreakdown`
Lista del aporte de cada fuente y "qué falta para subir de nivel". MVP: expandible dentro de la ficha (la UI completa es ROS-35, Fase 2).

### `ProfileSummary` (ROS-43, ROS-154)
Filas, % nulos, distintos, mín./máx., patrón detectado, top valores con barra, valores fuera de catálogo resaltados. Variante compacta para el Catálogo ("PERFIL").

### `PropagationPreview` (ROS-44, ROS-156)
"Confirmar desbloqueará **210** columnas" + muestra de identificadores + "excluidas por conflicto: N". Se actualiza si cambia la evidencia.

### `ConflictNotice` (ROS-45, ROS-157)
Aviso con `--nx-warning`, ícono + texto (no solo color): "Las fuentes no coinciden sobre el nombre de negocio" + lista de valores y fuentes + "Resuélvelo antes de confirmar". `role="alert"` solo al aparecer.

### `ReviewActions` (ROS-46, ROS-159)
Botones **Confirmar (A)**, **Editar (E)**, **Rechazar (R)** con `Kbd`. Rechazar abre `Dialog` con motivo obligatorio. Tras confirmar: `Toast` "Confirmada · se desbloquearon 210 columnas" y avance automático al siguiente ítem.

### `EvidenceTrail` (ROS-52, ROS-165)
Panel "RASTRO DE EVIDENCIA · MOV0010.FEPRO" del Catálogo: lista de fuentes que sustentan el significado con enlace a sus citas y explicación del nivel.

### `SourceRow` / `SourcesPanel` (ROS-22, ROS-129; ROS-38, ROS-148)
Nombre de la fuente + barra + cantidad en mono ("5.000 consultas", "peso 0,40"). En el panel completo: estado (`PENDING/PROCESSING/READY/FAILED`), fecha, nº de evidencias y acción eliminar.

### `CoverageCard` (ROS-37, ROS-147)
`StackedBar` + cuatro/cinco `Stat` con marcador de color, etiqueta en mayúsculas, cifra y definición del nivel. Clic en un nivel → Catálogo filtrado.

### `HumanWorkCard`
"TRABAJO HUMANO": cifra de validaciones, texto explicativo de la propagación, métricas de tiempo.

### `FindingsSummary` (ROS-40, ROS-150)
Conteo de hallazgos abiertos del MVP (conflictos abiertos + desconocidas) con enlace.

## 3. Reglas

- Cada componente de dominio tiene prueba unitaria (Vitest + Testing Library) y aparece en al menos un E2E.
- Sin valores de estilo literales: solo tokens.
- Componentes sin lógica de negocio: reciben datos ya calculados por el backend.
- Nombres de props en inglés; textos visibles desde `copy.ts`.
