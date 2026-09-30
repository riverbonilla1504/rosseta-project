# Matriz de trazabilidad

> Une cada historia del MVP con su feature, spec, tareas, reglas, pruebas y código. **Se actualiza en cada PR** que cierra una tarea (DoD) y se audita al final de cada sprint ([04-sincronizacion.md](../00-metodologia/04-sincronizacion.md)).
> Cadena: **Historia (ROS-n) → Feature `specs/NNN-*` → FR-### → Tarea (ROS-n) → T### → Prueba (marcadores) → PR → Jira *Listo***.
>
> Columnas *FR*, *Pruebas* y *PR* se rellenan cuando exista la spec y el código (hoy: `—`). La herramienta `tools/check_traceability.py` (Fase 0.5) generará automáticamente las columnas de pruebas a partir de los marcadores `@pytest.mark.story` / `[ROS-n]`.

## Estado

| Símbolo | Significado |
|---|---|
| ⬜ | Sin empezar (solo documentada) |
| 🟨 | Spec escrita |
| 🟦 | En implementación |
| 🟩 | Hecha y verificada (acta) |

## Historias del MVP (38)

| Historia | Título | Feature | Tareas | Reglas | RNF | E2E | FR | Pruebas | PR | Estado |
|---|---|---|---|---|---|---|---|---|---|---|
| [ROS-74](../02-requisitos/02-historias-de-usuario.md#ros-74) | Fundaciones del sistema de diseño Nocturne | 001 | 168, 169 | — | RNF-24, 27 | 10 | — | — | — | ⬜ |
| [ROS-75](../02-requisitos/02-historias-de-usuario.md#ros-75) | Biblioteca de componentes (chips, fichas, tablas, cola) | 001 | 170, 171 | — | — | 10 | — | — | — | ⬜ |
| [ROS-89](../02-requisitos/02-historias-de-usuario.md#ros-89) | Autenticación de usuarios | 002 | 180, 181 | — | RNF-03 | 01 | — | — | — | ⬜ |
| [ROS-90](../02-requisitos/02-historias-de-usuario.md#ros-90) | Inicio de sesión con OAuth (Google, Microsoft, Apple) | 002 | 182, 183, 184 | — | — | 01 | — | — | — | ⬜ |
| [ROS-91](../02-requisitos/02-historias-de-usuario.md#ros-91) | Registro y onboarding de cuenta nueva | 002 | 185, 186 | — | — | 01 | — | — | — | ⬜ |
| [ROS-92](../02-requisitos/02-historias-de-usuario.md#ros-92) | Gestión de sesión y tokens (refresh, expiración, cierre) | 002 | 187, 188 | — | RNF-08 | 08 | — | — | — | ⬜ |
| [ROS-93](../02-requisitos/02-historias-de-usuario.md#ros-93) | Seguridad del flujo OAuth (PKCE, state, redirect URIs) | 002 | 189, 190 | — | RNF-05…07, 09 | — | — | — | — | ⬜ |
| [ROS-78](../02-requisitos/02-historias-de-usuario.md#ros-78) | Múltiples proyectos/bases por usuario | 003 | 172, 173, 174 | RN-24 | — | 01 | — | — | — | ⬜ |
| [ROS-81](../02-requisitos/02-historias-de-usuario.md#ros-81) | Persistir catálogo, evidencia y confirmaciones | 003 | 175, 176, 177 | — | RNF-16, 20 | — | — | — | — | ⬜ |
| [ROS-84](../02-requisitos/02-historias-de-usuario.md#ros-84) | Seguridad de datos y control de acceso | 003 | 178, 179 | RN-24, RN-25 | RNF-01…04 | 09 | — | — | — | ⬜ |
| [ROS-16](../02-requisitos/02-historias-de-usuario.md#ros-16) | Importar esquema / DDL de la base de datos | 004 | 120, 121, 122 | RN-19 | RNF-19 | 02 | — | — | — | ⬜ |
| [ROS-17](../02-requisitos/02-historias-de-usuario.md#ros-17) | Cargar datos de muestra para perfilado | 004 | 123, 124, 125 | — | RNF-12 | 03 | — | — | — | ⬜ |
| [ROS-21](../02-requisitos/02-historias-de-usuario.md#ros-21) | Definir catálogo de convenciones de nombres | 004 | 126, 127 | RN-21 | — | — | — | — | — | ⬜ |
| [ROS-22](../02-requisitos/02-historias-de-usuario.md#ros-22) | Panel de fuentes recolectadas con estado y cobertura | 004 | 128, 129 | RN-10, RN-20 | — | — | — | — | — | ⬜ |
| [ROS-23](../02-requisitos/02-historias-de-usuario.md#ros-23) | Normalizar toda la evidencia a un formato común | 004 | 130, 131 | RN-10 | — | — | — | — | — | ⬜ |
| [ROS-25](../02-requisitos/02-historias-de-usuario.md#ros-25) | Modelo de puntuación ponderada de evidencia | 005 | 132, 133, 134 | RN-08, RN-09 | RNF-21 | — | — | — | — | ⬜ |
| [ROS-26](../02-requisitos/02-historias-de-usuario.md#ros-26) | Asignar niveles de confianza (5 niveles) | 005 | 135, 136 | RN-01…05 | — | — | — | — | — | ⬜ |
| [ROS-27](../02-requisitos/02-historias-de-usuario.md#ros-27) | Declarar "Desconocida" en lugar de inventar | 005 | 137 | RN-06 | — | — | — | — | — | ⬜ |
| [ROS-28](../02-requisitos/02-historias-de-usuario.md#ros-28) | Detección de conflictos entre fuentes | 005 | 138, 139 | RN-07 | — | 07 | — | — | — | ⬜ |
| [ROS-29](../02-requisitos/02-historias-de-usuario.md#ros-29) | Propagación de confirmaciones con contadores reales | 005 | 140, 141 | RN-12 | RNF-13, 17, 18 | 04 | — | — | — | ⬜ |
| [ROS-33](../02-requisitos/02-historias-de-usuario.md#ros-33) | Trazabilidad: cada aserción enlaza a su evidencia | 005 | 142, 143 | RN-10, RN-11 | RNF-23 | — | — | — | — | ⬜ |
| [ROS-36](../02-requisitos/02-historias-de-usuario.md#ros-36) | Cola priorizada por impacto | 006 | 144, 145 | RN-15 | — | — | — | — | — | ⬜ |
| [ROS-42](../02-requisitos/02-historias-de-usuario.md#ros-42) | Ficha de evidencia por columna con citas verificables | 007 | 151, 152, 153 | — | RNF-11 | — | — | — | — | ⬜ |
| [ROS-43](../02-requisitos/02-historias-de-usuario.md#ros-43) | Perfil de datos (distribución, nulos, valores fuera de catálogo) | 007 | 154 | — | — | 03 | — | — | — | ⬜ |
| [ROS-44](../02-requisitos/02-historias-de-usuario.md#ros-44) | Previsualización del efecto de propagación al confirmar | 007 | 155, 156 | RN-13 | — | — | — | — | — | ⬜ |
| [ROS-45](../02-requisitos/02-historias-de-usuario.md#ros-45) | Avisos de conflicto en la ficha | 007 | 157 | RN-07 | — | 07 | — | — | — | ⬜ |
| [ROS-46](../02-requisitos/02-historias-de-usuario.md#ros-46) | Acciones Confirmar / Editar / Rechazar | 007 | 158, 159 | RN-14 | RNF-22 | 04, 05 | — | — | — | ⬜ |
| [ROS-47](../02-requisitos/02-historias-de-usuario.md#ros-47) | Atajos de teclado (J/K, A, E, R) | 007 | 160 | — | RNF-25 | 04, 06 | — | — | — | ⬜ |
| [ROS-48](../02-requisitos/02-historias-de-usuario.md#ros-48) | Diferenciar "Alta · sin validar" de "Confirmada" | 007 | 161 | RN-02 | — | — | — | — | — | ⬜ |
| [ROS-50](../02-requisitos/02-historias-de-usuario.md#ros-50) | Vista tabla-por-tabla y columna-por-columna | 008 | 162, 163 | — | RNF-10, 15 | 02 | — | — | — | ⬜ |
| [ROS-51](../02-requisitos/02-historias-de-usuario.md#ros-51) | Chips de confianza diferenciados | 008 | 164 | — | RNF-26 | — | — | — | — | ⬜ |
| [ROS-52](../02-requisitos/02-historias-de-usuario.md#ros-52) | Rastro de evidencia por columna | 008 | 165 | — | — | — | — | — | — | ⬜ |
| [ROS-54](../02-requisitos/02-historias-de-usuario.md#ros-54) | Convención única de nombres en toda la app | 008 | 166 | RN-17 | — | — | — | — | — | ⬜ |
| [ROS-55](../02-requisitos/02-historias-de-usuario.md#ros-55) | Estado compartido entre catálogo, cola y revisión | 008 | 167 | RN-18 | — | 04 | — | — | — | ⬜ |
| [ROS-37](../02-requisitos/02-historias-de-usuario.md#ros-37) | Dashboard de cobertura por nivel de confianza | 009 | 146, 147 | RN-01 | — | 04 | — | — | — | ⬜ |
| [ROS-38](../02-requisitos/02-historias-de-usuario.md#ros-38) | Widget de fuentes recolectadas | 009 | 148 | — | — | — | — | — | — | ⬜ |
| [ROS-39](../02-requisitos/02-historias-de-usuario.md#ros-39) | Cola por impacto en el panorama | 009 | 149 | RN-15 | — | 04 | — | — | — | ⬜ |
| [ROS-40](../02-requisitos/02-historias-de-usuario.md#ros-40) | Resumen de hallazgos abiertos | 009 | 150 | RN-16 | — | — | — | — | — | ⬜ |

## Reglas de negocio → historias

| Regla | Historias | Prueba clave esperada |
|---|---|---|
| RN-01…05 niveles | ROS-26 | Frontera de cada umbral |
| RN-02 Confirmada solo humana | ROS-26, 48 | Propiedad "el motor nunca devuelve CONFIRMED"; CHECK de BD |
| RN-06 Desconocida | ROS-27 | RESERV3 |
| RN-07 conflicto limita | ROS-28, 45 | Evidencia contradictoria |
| RN-08/09 puntaje ponderado | ROS-25 | Determinismo, nombre ≤ 0,40 |
| RN-10 sin cita no hay afirmación | ROS-33 | Interpretación > Hipótesis sin cita = imposible |
| RN-12 propagación | ROS-29 | Mismo nombre y tipo; reversible |
| RN-13 previsualización = realidad | ROS-44 | preview.count == confirm.unlocked_count |
| RN-14 auditoría | ROS-46 | ReviewAction inmutable |
| RN-15 cola | ROS-36, 39 | Orden y desempates |
| RN-17 nombres únicos | ROS-54 | Identificador igual en todas las vistas (E2E) |
| RN-18 estado compartido | ROS-55 | E2E-04 |
| RN-19 idempotencia | ROS-16 | Reimportar mismo DDL |
| RN-20 eliminar fuente | ROS-22 | Evidencia retirada + recálculo |
| RN-21 convenciones | ROS-21 | Editar regla recalcula |
| RN-24 aislamiento | ROS-78, 84 | Acceso cruzado 100 % |

## Features → specs

| Feature | Carpeta | Historias | Sprint | Spec | Plan | Tasks | Analyze | Converge |
|---|---|---|---|---|---|---|---|---|
| 001 | `specs/001-design-system-nocturne/` | ROS-74, 75 | 1 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 002 | `specs/002-autenticacion-oauth/` | ROS-89…93 | 1 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 003 | `specs/003-proyectos-y-nucleo-de-datos/` | ROS-78, 81, 84 | 1 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 004 | `specs/004-ingesta-de-fuentes/` | ROS-16, 17, 21, 22, 23 | 2 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 005 | `specs/005-motor-de-evidencia/` | ROS-25…29, 33 | 3 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 006 | `specs/006-cola-priorizada/` | ROS-36 | 3 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 007 | `specs/007-revision-humana/` | ROS-42…48 | 4 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 008 | `specs/008-catalogo/` | ROS-50, 51, 52, 54, 55 | 5 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 009 | `specs/009-panorama/` | ROS-37…40 | 5 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
