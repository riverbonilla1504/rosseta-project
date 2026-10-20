"""Mensajes de validación de proyectos en la API (regla B8 de docs/03-arquitectura/03-backend.md).

La interfaz muestra sus propios textos por campo (frontend/src/features/projects/copy.ts).
Son las propuestas de DP-028 y siguen PROVISIONALES hasta que se cierre por CD.
"""

# PROVISIONAL (DP-028)
NAME_REQUIRED = "Escribe un nombre para el proyecto."
# PROVISIONAL (DP-028)
NAME_TOO_LONG = "El nombre puede tener hasta 120 caracteres."
# PROVISIONAL (DP-028)
DIALECT_REQUIRED = "Elige el dialecto SQL de tu base."
# PROVISIONAL: DP-028 no lo propone; se añadirá a esa decisión. Solo lo ve quien llama a la API
# sin la interfaz.
FIELD_NOT_ALLOWED = "Campo no admitido."
