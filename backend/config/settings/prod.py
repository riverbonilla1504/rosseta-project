from django.core.exceptions import ImproperlyConfigured

from .base import *  # noqa: F403
from .base import AUTH0_DOMAIN, AUTH0_ISSUER, AUTH0_JWKS_URL

DEBUG = False  # tests/test_settings.py verifica que prod no pueda activar DEBUG

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31_536_000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_SECURE = True

# --- Auth0 en producción (FR-029, FR-032; ROS-189) ---
# Emisor y JWKS salen siempre del dominio con https. AUTH0_ISSUER y AUTH0_JWKS_URL solo se
# admiten fuera de producción (proveedor simulado de E2E): aquí cualquier otro valor falla al
# cargar la configuración.
_EXPECTED_ISSUER = f"https://{AUTH0_DOMAIN}/"
_EXPECTED_JWKS_URL = f"https://{AUTH0_DOMAIN}/.well-known/jwks.json"
if (AUTH0_ISSUER, AUTH0_JWKS_URL) != (_EXPECTED_ISSUER, _EXPECTED_JWKS_URL):
    raise ImproperlyConfigured(
        "En producción AUTH0_ISSUER y AUTH0_JWKS_URL no se sobreescriben y usan https."
    )
