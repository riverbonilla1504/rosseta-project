# Datos de referencia

> Datos **exactos** que muestra el prototipo final (capturas de Panorama y Catálogo, 2026-09). Sirven para tres cosas:
> 1. **Calibrar el motor** (ROS-132): los niveles deben coincidir.
> 2. **Semillas** de desarrollo y demo (`make seed`, ROS-176).
> 3. **Pruebas de aceptación** y E2E con datos realistas.
>
> Todo es **sintético** (el prototipo es ficticio). Nunca se usan datos reales de clientes (Constitución V).

## 1. Proyecto de ejemplo

| Dato | Valor en el prototipo |
|---|---|
| Base | `CORE_PRD` · SQL Server |
| Tamaño | 918 tablas · 18.442 columnas · 4,1 TB |
| Estado | "Ninguna clave foránea declarada, ningún comentario en el catálogo" |
| Última corrida | "hace 14 minutos, incremental" |

## 2. Tabla `MOV0010` — Movimientos de cuenta

"412.043.221 filas · 11 columnas · sin claves foráneas declaradas".

| # | Columna | Tipo | Nombre de negocio | Descripción (texto del prototipo) | Nivel | Conf. |
|---|---|---|---|---|---|---|
| 1 | `PGCOD` | smallint | Entidad | Código de entidad. Valor constante 1 en el 100% de las filas: multiempresa nunca activado. | Alta · sin validar | 0,91 |
| 2 | `SUCCOD` | smallint | Sucursal | Sucursal donde se originó el movimiento. Referencia implícita a SUC0001.SUCCOD, contención 1,000. | Confirmada | 0,93 |
| 3 | `MONCOD` | char(3) | Moneda | Código ISO 4217 de la moneda del movimiento. COP 91,2% · USD 6,1% · EUR 1,4%. Referencia a MON0001. | Confirmada | 0,94 |
| 4 | `PAPEL` | int | Producto | Probablemente el tipo de producto financiero. Contención 0,94 con PAP0001.PAPCOD, pero el catálogo no trae columna descriptiva y ninguna etiqueta de interfaz lo nombra. | Inferida | 0,71 |
| 5 | `CTANRO` | decimal(9,0) | Número de cuenta | Cuenta afectada. Contención 0,998 con CTA0001.CTANRO; 812.400 huérfanos, todos anteriores a 2011. | Alta · sin validar | 0,90 |
| 6 | `FEPRO` | int | Fecha de proceso | Fecha codificada como entero AAAAMMDD. Rango 19980102–20260829, sin centinelas. | Alta · sin validar | 0,96 |
| 7 | `IMPTE` | decimal(17,2) | Valor del movimiento | Monto en la moneda de MONCOD. Log-normal, mediana 84.500, 0,3% en cero. | Alta · sin validar | 0,92 |
| 8 | `ESTREG` | char(1) | Estado del registro | A = activo (96,1%) · E = eliminado lógico (3,8%) · P = pendiente (0,1%). Enum sin catálogo. | Alta · sin validar | 0,89 |
| 9 | `USRALT` | char(8) | Usuario (sin precisar) | Identificador de usuario, marcado como PII. Ninguna fuente distingue si es quien creó el registro o quien lo modificó por última vez: el alias dice sólo "Usuario" y no hay tabla de usuarios en esta base. | Hipótesis | 0,48 |
| 10 | `FEALT` | datetime | Fecha de alta | Timestamp de auditoría de creación del registro. Monótono creciente respecto al identificador. | Confirmada | 0,94 |
| 11 | `RESERV3` | varchar(20) | — | Desconocido. 100% NULL en 412M filas, sin referencias en consultas ni en el repositorio. | Desconocido | – |

**Lecturas que el motor debe reproducir** (pruebas parametrizadas, ROS-132/133/135/137):
- Puntaje ≥ 0,85 sin validar → **Alta · sin validar** (PGCOD 0,91; CTANRO 0,90; FEPRO 0,96; IMPTE 0,92; ESTREG 0,89).
- Las confirmadas tienen puntaje del motor (0,93; 0,94; 0,94) pero su nivel viene de la **acción humana**.
- **PAPEL** 0,71 → Inferida: contención 0,94 (no 0,998) y "dos valores fuera del catálogo".
- **USRALT** 0,48 → Hipótesis: el motor **no afirma** alta vs. modificación.
- **RESERV3** → Desconocido, sin nombre de negocio ("—") y confianza "–".
- Al confirmar en Revisión, PGCOD, CTANRO, FEPRO, IMPTE y ESTREG pasan de "Alta · sin validar" a "Confirmada" en el Catálogo (RN-18).

> ⚠️ Varias descripciones dependen de fuentes **fuera del MVP** ("sin referencias en consultas ni en el repositorio" → logs y código; "ninguna etiqueta de interfaz" → etiquetas de aplicación). En el MVP las plantillas deben omitir afirmaciones sobre fuentes que no se cargaron ([EC-003](../07-registro/01-errores-conocidos.md)). Ejemplo MVP para RESERV3: "Desconocido. 100% NULL en la muestra; sin evidencia en las fuentes cargadas."

## 3. Otras tablas mencionadas

| Tabla | Papel en el ejemplo |
|---|---|
| `CTA0001` | Cuentas; `CTA0001.CTANRO` es la referencia de `MOV0010.CTANRO` |
| `CLI0001` | Clientes |
| `PAR0012` | Parámetros |
| `SUC0001` | Sucursales; `SUC0001.SUCCOD` |
| `MON0001` | Monedas |
| `PAP0001` | Productos; `PAP0001.PAPCOD` |

Convención única de identificadores: `TABLA.COLUMNA` en mayúsculas tal como el origen (RN-17).

## 4. Panorama

| Bloque | Dato |
|---|---|
| Cobertura del esquema (de 18.442 columnas) | **Confirmadas 4.120** "validadas por una persona" · **Inferidas 7.980** "≥2 fuentes de acuerdo" · **Hipótesis 2.913** "revisar antes de usar" · **Desconocidas 3.429** "sin evidencia: no se inventa" |
| Trabajo humano | **34** validaciones confirmadas. "Cada confirmación se propaga a todas las tablas donde la misma columna aparece con el mismo tipo. Hasta ahora esas decisiones documentaron **3.810** columnas." |
| Tiempos | 22 min al primer hallazgo · 1,8 h perfilado incremental |
| Acciones | "Informe de hallazgos" · "Continuar revisión" |

Comprobación: 4.120 + 7.980 + 2.913 + 3.429 = **18.442** ✔.
⚠️ La barra no tiene segmento "Alta · sin validar" y 3.810 ≠ 4.120: ver [EC-012](../07-registro/01-errores-conocidos.md).

### Fuentes de evidencia recolectadas

| Fuente | Cantidad mostrada | En el MVP |
|---|---|---|
| Perfilado de datos | 18.442 (columnas) | Sí (ROS-17) |
| Catálogos embebidos | 31 tablas | Sí: contención entre muestras (DP-001) |
| Logs de consulta | 5.000 consultas | No (ROS-18, Fase 2) |
| Vistas y procedimientos | 1.284 objetos | No — Fase 2 ([ROS-191](../02-requisitos/02-historias-de-usuario.md#ros-191)) |
| Etiquetas de aplicación | 2.109 campos | No — Fase 2 ([ROS-192](../02-requisitos/02-historias-de-usuario.md#ros-192)) |
| Nombre de columna | peso 0,40 | Sí (ROS-21) |

Texto al pie: "El nombre de la columna es la fuente de menor peso, deliberadamente: 0,40 contra 0,90 de una contención con catálogo."

### Cola priorizada por impacto

| Columna | Tipo | Pista | Columnas que desbloquea |
|---|---|---|---|
| `PGCOD` | smallint NOT NULL | codigo entidad | 380 |
| `CTANRO` | decimal(9,0) NOT NULL | numero cuenta | 210 |
| `PETDOC` | smallint NOT NULL | tipo documento identidad | 60 |

## 5. Semillas de desarrollo (`make seed`)

La semilla crea, para el usuario de desarrollo:
1. Proyecto `CORE_DEMO` (dialecto `tsql`).
2. Un DDL sintético `tests/fixtures/core_demo.sql` con: `MOV0010` (las 11 columnas de §2), `CTA0001`, `CLI0001`, `PAR0012`, `SUC0001`, `MON0001`, `PAP0001`, y **tablas extra generadas** que repiten `PGCOD`, `CTANRO` y `PETDOC` con el mismo tipo para que la propagación tenga destinos (proporciones reducidas: p. ej. 38/21/6 en lugar de 380/210/60).
3. Muestras CSV sintéticas (10.000 filas) de `MOV0010`, `CTA0001`, `SUC0001`, `MON0001`, `PAP0001` generadas con semilla fija para reproducir: contención `CTANRO` ≈ 0,998, `PAPEL` ≈ 0,94 con 2 valores fuera, `RESERV3` 100 % NULL, `ESTREG` 96,1/3,8/0,1 %, `MONCOD` COP/USD/EUR 91,2/6,1/1,4 %.
4. Reglas de nomenclatura globales (§6).
5. Tres confirmaciones humanas previas (SUCCOD, MONCOD, FEALT) para que el catálogo muestre la mezcla del prototipo.

Generador de muestras: `backend/tests/fixtures/generate_core_demo.py` (determinista, `random.Random(42)`).

## 6. Reglas de nomenclatura globales (semilla)

Del backlog (ROS-126): `FE`→fecha, `IMPTE`→importe, `NRO`→número. Resto *propuesto* a partir del prototipo (a validar con el primer esquema real):

| Patrón | Tipo de coincidencia | Significado | Tipo semántico |
|---|---|---|---|
| `FE` | PREFIX | fecha | DATE |
| `IMPTE` | TOKEN | importe | AMOUNT |
| `NRO` | TOKEN | número | IDENTIFIER |
| `COD` | SUFFIX | código | CODE |
| `CTA` | TOKEN | cuenta | — |
| `SUC` | PREFIX | sucursal | — |
| `MON` | PREFIX | moneda | — |
| `CLI` | PREFIX | cliente | — |
| `USR` | PREFIX | usuario | USER |
| `EST` | PREFIX | estado | ENUM |
| `ALT` | SUFFIX | alta | — |
| `PRO` | SUFFIX | proceso | — |
| `DOC` | SUFFIX | documento | — |
| `RESERV` | PREFIX | reservado | — |

> `RESERV` → "reservado" es **solo nombre** (peso ≤ 0,40): nunca basta para salir de Desconocida si el perfil es `EMPTY` (regla 2 del motor).
