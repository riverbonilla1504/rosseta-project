# Usuarios y roles

## 1. Personas

### Analista de datos / de migración (usuario principal)
- **Contexto:** debe entender un esquema heredado para migrarlo, integrarlo o construir reportes.
- **Dolor:** pasa semanas preguntando qué significa cada columna; no puede confiar en suposiciones.
- **Qué hace en Rosetta:** carga fuentes, revisa la cola, confirma/edita/rechaza, consulta el catálogo, exporta.
- **Aparece en historias como:** "analista", "revisor", "revisor intensivo".

### Revisor experto del dominio
- **Contexto:** conoce el negocio (p. ej. un funcionario del core bancario) pero no el esquema completo.
- **Qué hace:** valida columnas en la pantalla de Revisión, sobre todo las de alto impacto.
- **Necesita:** evidencia clara, citas verificables, atajos de teclado para revisar rápido.

### Responsable de gobierno de datos / cumplimiento
- **Contexto:** debe demostrar ante auditoría qué significa cada dato y quién lo validó.
- **Qué hace:** usa el modo sin LLM, el rastro de evidencia y el registro de quién confirmó qué.
- **Aparece como:** "responsable de cumplimiento", "responsable de datos", "auditor".

### Líder técnico / de proyecto
- **Qué hace:** sigue el progreso (KPIs, cobertura), prioriza hallazgos, planifica la remediación.
- **Aparece como:** "líder".

### Personas de fases posteriores
- **Desarrollador / integrador** (Fase 4): consume el catálogo vía API o servidor MCP.
- **Administrador de empresa** (Fase 3): gestiona dominios permitidos, correos, usuarios, plan y pagos de su organización.
- **Super-administrador de plataforma** (Fase 3): gestiona todas las organizaciones y planes.

## 2. Roles del sistema

| Rol | Fase | Puede |
|---|---|---|
| **Usuario (propietario del proyecto)** | MVP | Todo dentro de sus propios proyectos: cargar fuentes, revisar, confirmar, editar, rechazar, exportar |
| Lector | Fase 3 (ROS-79) | Ver catálogo y evidencia; no confirma |
| Revisor | Fase 3 (ROS-79) | Revisar y confirmar |
| Administrador de proyecto | Fase 3 (ROS-79) | Gestionar miembros y permisos del proyecto |
| Administrador de empresa | Fase 3 (ROS-110) | Gestionar su organización |
| Super-administrador | Fase 3 (ROS-110) | Gestionar la plataforma |

> **Decisión MVP:** existe **un solo rol**: el usuario autenticado es propietario de sus proyectos y tiene todos los permisos sobre ellos. No hay proyectos compartidos. (Ver [03-alcance-y-no-objetivos.md](03-alcance-y-no-objetivos.md).)

## 3. Actores externos

| Actor | Relación |
|---|---|
| Proveedores OAuth (Google, Microsoft, Apple) | Autentican al usuario |
| Base de datos de origen del cliente | Fuente de esquema y muestras. En el MVP llega como **archivos** (DDL, CSV); la conexión directa es Fase 3 (ROS-24) |
| LLM (opcional) | Redacta descripciones a partir de evidencia; deshabilitable (modo sin LLM) |
