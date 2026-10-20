"""Mensajes de validación de proyectos en la API (regla B8 de docs/03-arquitectura/03-backend.md).

La interfaz muestra sus propios textos por campo (frontend/src/features/projects/copy.ts).
Son los de docs/05-diseno/04-contenido-y-redaccion.md §5 (DP-028 decidida por CD-015), salvo
FIELD_NOT_ALLOWED, que DP-028 no recoge.
"""

NAME_REQUIRED = "Escribe un nombre para el proyecto."
NAME_TOO_LONG = "El nombre puede tener hasta 120 caracteres."
DIALECT_REQUIRED = "Elige el dialecto SQL de tu base."
# PROVISIONAL: DP-028 (ya decidida) no lo recoge; queda propuesto para una DP nueva. Solo lo ve
# quien llama a la API sin la interfaz.
FIELD_NOT_ALLOWED = "Campo no admitido."
