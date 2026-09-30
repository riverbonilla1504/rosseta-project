# Sistema de diseño Nocturne

> Fundaciones visuales de Rosetta (épica E10, historias ROS-74/75, tareas ROS-168…171). Toda la UI usa **solo** estos tokens (Constitución VII).
>
> ⚠️ **Origen de los valores.** Los archivos originales del sistema de diseño (`_ds/nocturne-…/readme.md`, `styles.css`) **no se pudieron leer** desde Claude Design ([EC-001](../07-registro/01-errores-conocidos.md)). Los colores de este documento se **midieron sobre capturas** del prototipo (color dominante por región, con compresión JPEG y antialiasing): son **aproximados (±6 por canal)**. La tarea ROS-168 debe reemplazarlos por los valores exactos del `styles.css` original en cuanto se obtenga, mediante un CD. Tipografías y escalas son **observación visual**, igualmente a confirmar.

## 1. Carácter

- **Oscuro, sobrio, técnico.** Fondo azul noche casi negro, superficies apenas más claras, acento **lavanda/violeta**.
- **Densidad de información alta pero respirada:** tablas con filas generosas, tarjetas con mucho margen interno.
- **Datos en monoespaciada** (identificadores, tipos, cifras de cola y fuentes); **texto en sans-serif**.
- **Etiquetas de sección** en mayúsculas pequeñas con tracking amplio y color de acento tenue ("COBERTURA DEL ESQUEMA").
- La confianza se expresa con **intensidad del acento**: más lleno = más confirmado; neutro gris = incierto.

## 2. Color (tokens)

### 2.1 Superficies y bordes

| Token | Valor observado | Uso |
|---|---|---|
| `--nx-bg` | `#161825` | Fondo de página |
| `--nx-surface` | `#232532` | Tarjetas, contenedor de tabla |
| `--nx-surface-raised` | `#2d2e42` | Fila resaltada / seleccionada, hover |
| `--nx-border` | `#292b38` | Borde de tarjetas, separadores de fila |
| `--nx-border-strong` | `#3b3b59` | Borde de botones secundarios |
| `--nx-badge-bg` | `#3c3c48` | Insignia neutra (proyecto · motor) |

### 2.2 Texto

| Token | Valor observado | Uso |
|---|---|---|
| `--nx-text` | `#eaeaf6` | Títulos, cifras grandes, texto principal |
| `--nx-text-strong-mono` | `#ded8de` | Identificadores de columna en tablas |
| `--nx-text-secondary` | `#848490` | Subtítulos, descripciones secundarias |
| `--nx-text-muted` | `#8a8a96` | Leyendas pequeñas bajo cifras |
| `--nx-text-header` | `#9c9ca8` | Encabezados de tabla |
| `--nx-text-mono-muted` | `#848a96` | Tipos de dato en tablas |

### 2.3 Acento

| Token | Valor observado | Uso |
|---|---|---|
| `--nx-accent` | `#9284d9` | Acento principal (barra de confirmadas) |
| `--nx-accent-strong` | `#8a7eba` | Texto de botón primario con contorno |
| `--nx-accent-link` | `#7872a2` | Enlaces ("Abrir revisión →") |
| `--nx-accent-nav` | `#7e7e9c` → objetivo lavanda | Pestaña activa de la navegación |
| `--nx-accent-label` | `#6c6c90` | Etiquetas de sección en mayúsculas |
| `--nx-accent-soft` | `#c6ccea` | Cifras de impacto en la cola |
| `--nx-accent-outline` | `#787896` | Borde de la insignia "solo lectura" |

### 2.4 Niveles de confianza

| Nivel | Chip | Token de relleno | Token de texto/borde | Barra de cobertura |
|---|---|---|---|---|
| Confirmada | **Relleno de acento** | `--nx-level-confirmed-bg: #42366c` | `--nx-level-confirmed-fg: #ccc6f0` | `#9284d9` |
| Alta · sin validar | **Solo contorno** (sin relleno) | `transparent` | `--nx-level-high-border: #726ca2` (texto igual) | *(no aparece en la barra: [EC-012](../07-registro/01-errores-conocidos.md))* |
| Inferida | **Relleno tenue** | `--nx-level-inferred-bg: #3c3c5a` | `--nx-text` | `#5c5192` |
| Hipótesis | **Neutro** | `--nx-level-hypothesis-bg: #3c3c48` | `--nx-text` | `#5b5d6c` |
| Desconocida | **Neutro** | `--nx-level-unknown-bg: #3c3c48` | `--nx-text-secondary` | `#3f414e` |

Regla del prototipo: *"relleno de acento = confirmada, contorno = alta sin validar, relleno tenue = inferida, neutro = hipótesis"*. El chip **siempre lleva texto** (nunca solo color: RNF-26).

### 2.5 Semánticos (no observados, propuestos)

El prototipo capturado no muestra rojos/ámbar. Para avisos de conflicto y errores se proponen (a validar con el `styles.css` real):

| Token | Propuesta | Uso |
|---|---|---|
| `--nx-warning` | `#d9a54a` | Aviso de conflicto |
| `--nx-danger` | `#e0736f` | Error, rechazo |
| `--nx-success` | `#6fbf8f` | Confirmación exitosa (toast) |

### 2.6 Contraste (WCAG 2.1 AA, RNF-24)

ROS-168 debe verificar **cada par** texto/fondo. Pares críticos observados (valores aproximados):
- `--nx-text` sobre `--nx-bg`: ≈ 15:1 ✔
- `--nx-text-secondary` (#848490) sobre `--nx-surface` (#232532): ≈ 4,4:1 — **al límite** para texto normal; si se confirma < 4,5 hay que aclararlo.
- `--nx-accent-label` (#6c6c90) sobre `--nx-surface`: ≈ 3,2:1 — **no cumple** para texto pequeño. Mitigación propuesta: aclarar a ≥ `#8a8ab0` o usarlo solo en texto ≥ 18,66 px negrita. Registrado en [EC-020](../07-registro/01-errores-conocidos.md).

## 3. Tipografía

| Token | Valor propuesto | Observado en |
|---|---|---|
| `--nx-font-sans` | `"Inter", system-ui, sans-serif` | Todo el texto (forma compatible con Inter; confirmar) |
| `--nx-font-mono` | `"JetBrains Mono", ui-monospace, "SF Mono", monospace` | Identificadores (`MOV0010`), tipos, cifras de fuentes, insignia de proyecto |

| Estilo | Tamaño / peso aprox. | Uso |
|---|---|---|
| `display` | 40 px / 600 | Título de pantalla ("Modelo semántico reconstruido") |
| `title-mono` | 32 px / 500 mono | Título de tabla (`MOV0010`) |
| `kpi` | 28 px / 400 | Cifras de cobertura (4.120) |
| `kpi-xl` | 44 px / 400 | "34" validaciones |
| `body` | 14–15 px / 400 | Texto y descripciones |
| `body-strong` | 15 px / 500 | Nombre de negocio en tabla |
| `label` | 11 px / 500, MAYÚSCULAS, `letter-spacing: .08em` | Etiquetas de sección y encabezados de tabla |
| `caption` | 12 px / 400 | Leyendas bajo cifras |
| `mono-sm` | 12 px / 400 mono | Tipos y cantidades |

Números con formato **es-CO**: punto de miles y coma decimal (`18.442`, `0,91`, `4,1 TB`).

## 4. Espaciado, radios, sombras

| Token | Valor propuesto | Observación |
|---|---|---|
| `--nx-space-1…8` | 4, 8, 12, 16, 20, 24, 32, 48 px | Escala de 4 |
| Margen interno de tarjeta | 16–20 px | Tarjetas del Panorama |
| Separación entre tarjetas | 16 px | |
| Ancho máximo del contenido | ~1280 px | El contenido deja margen a la derecha en 1536 px |
| `--nx-radius-sm` | 4 px | Chips, insignias |
| `--nx-radius-md` | 6 px | Botones |
| `--nx-radius-lg` | 8 px | Tarjetas, contenedor de tabla |
| `--nx-shadow` | ninguna | El prototipo separa superficies por color y borde, no por sombra |
| Barra de progreso | alto 8 px, radio completo | Barra de cobertura y barras de fuentes |

## 5. Iconografía y movimiento

- El prototipo casi no usa íconos: marcadores cuadrados de color en la leyenda de cobertura, flecha `→` en enlaces. Mantener esa sobriedad; si se necesitan íconos, un solo set lineal (propuesta: Lucide) con ADR menor en la feature 001.
- Transiciones cortas (120–160 ms) en hover/foco; sin animaciones decorativas. Respetar `prefers-reduced-motion`.

## 6. Tema

Solo **tema oscuro** (el sistema se llama Nocturne). Tema claro: fuera de alcance. Los tokens se declaran en `:root` de `frontend/src/design-system/tokens.css`.

## 7. Entregable de ROS-168 / ROS-169

```css
/* frontend/src/design-system/tokens.css — valores provisionales; reemplazar por styles.css original (EC-001) */
:root {
  --nx-bg: #161825;
  --nx-surface: #232532;
  --nx-surface-raised: #2d2e42;
  --nx-border: #292b38;
  --nx-border-strong: #3b3b59;
  --nx-text: #eaeaf6;
  --nx-text-secondary: #848490;
  --nx-accent: #9284d9;
  --nx-level-confirmed-bg: #42366c;
  --nx-level-confirmed-fg: #ccc6f0;
  --nx-level-high-border: #726ca2;
  --nx-level-inferred-bg: #3c3c5a;
  --nx-level-hypothesis-bg: #3c3c48;
  --nx-level-unknown-bg: #3c3c48;
  --nx-font-sans: "Inter", system-ui, sans-serif;
  --nx-font-mono: "JetBrains Mono", ui-monospace, monospace;
  /* … resto de tokens de este documento … */
}
```
