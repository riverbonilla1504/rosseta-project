"""Mensajes al usuario de accounts (regla B8 de docs/03-arquitectura/03-backend.md).

Son los mensajes de la API. La interfaz muestra sus propios textos por código
(frontend/src/features/auth/copy.ts). Todos son PROVISIONALES hasta DP-025.
"""

# PROVISIONAL (DP-025)
ACCOUNT_DISABLED = "Tu cuenta está desactivada."
# PROVISIONAL (DP-025)
ACCOUNT_EXISTS_OTHER_PROVIDER = (
    "Ya existe una cuenta con ese correo, creada con otro proveedor. "
    "Entra con el proveedor que usaste al registrarte."
)
# PROVISIONAL (DP-025)
EMAIL_MISSING = (
    "Tu proveedor de acceso no compartió tu correo y lo necesitamos para crear tu cuenta."
)
# PROVISIONAL (DP-025)
EMAIL_NOT_VERIFIED = "Tu proveedor de acceso no confirma que tu correo esté verificado."

# Texto ya definido en docs/05-diseno/04-contenido-y-redaccion.md §5 (sesión vencida).
SESSION_EXPIRED = "Tu sesión terminó. Vuelve a iniciar sesión para continuar."
