"""Configuración común.

Ver docs/03-arquitectura/03-backend.md y docs/03-arquitectura/08-infraestructura-y-entornos.md.
"""

from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parent.parent.parent

env = environ.Env()
environ.Env.read_env(BASE_DIR.parent / ".env", overwrite=False)

SECRET_KEY = env("DJANGO_SECRET_KEY")
DEBUG = False
ALLOWED_HOSTS: list[str] = env.list("ALLOWED_HOSTS", default=[])
CSRF_TRUSTED_ORIGINS: list[str] = env.list("CSRF_TRUSTED_ORIGINS", default=[])
FRONTEND_URL = env("FRONTEND_URL", default="http://localhost:3000")

# Sin django.contrib.auth, admin, sessions ni messages: con Auth0 (ADR-0007) no hay
# sesiones de servidor ni contraseñas, y la consola administrativa no se expone (DP-024,
# opción A). Ver specs/002-autenticacion-oauth/research.md R-04.
INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.staticfiles",
    "rest_framework",
    "drf_spectacular",
    "apps.core",
    "apps.accounts",
    "apps.projects",
    "apps.catalog",
    "apps.sources",
    "apps.evidence",
    "apps.review",
]

AUTH_USER_MODEL = "accounts.User"

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "apps.core.middleware.JsonContentSecurityPolicyMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {"context_processors": ["django.template.context_processors.request"]},
    }
]

DATABASES = {"default": env.db("DATABASE_URL")}
DATABASES["default"]["ATOMIC_REQUESTS"] = False
DATABASES["default"]["CONN_MAX_AGE"] = env.int("DB_CONN_MAX_AGE", default=60)

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

LANGUAGE_CODE = "es-co"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# --- Redis / Celery (ADR-0003) ---
REDIS_URL = env("REDIS_URL", default="redis://localhost:6379/0")
CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = REDIS_URL
CELERY_TASK_ACKS_LATE = True
CELERY_TASK_REJECT_ON_WORKER_LOST = True
CELERY_WORKER_PREFETCH_MULTIPLIER = 1
CELERY_TASK_ALWAYS_EAGER = False

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": REDIS_URL,
    }
}

# --- DRF (docs/03-arquitectura/05-api.md) ---
REST_FRAMEWORK = {
    # Access token de Auth0 que añade el proxy BFF de Next.js (ADR-0007, feature 002).
    "DEFAULT_AUTHENTICATION_CLASSES": ["apps.accounts.authentication.Auth0JWTAuthentication"],
    # Denegar por defecto (FR-012): las únicas rutas públicas lo declaran de forma explícita.
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    "UNAUTHENTICATED_USER": None,
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_PARSER_CLASSES": [
        "rest_framework.parsers.JSONParser",
        "rest_framework.parsers.MultiPartParser",
    ],
    "DEFAULT_PAGINATION_CLASS": "apps.core.pagination.StandardPagination",
    "PAGE_SIZE": 50,
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "EXCEPTION_HANDLER": "apps.core.exceptions.api_exception_handler",
}

# --- Auth0 (ADR-0007; specs/002-autenticacion-oauth/contracts/auth-flow.md §8) ---
AUTH0_DOMAIN = env("AUTH0_DOMAIN", default="")
AUTH0_AUDIENCE = env("AUTH0_AUDIENCE", default="")
# Solo pruebas y E2E pueden sobreescribir emisor y JWKS; producción exige https (prod.py).
AUTH0_ISSUER = env("AUTH0_ISSUER", default=f"https://{AUTH0_DOMAIN}/")
AUTH0_JWKS_URL = env("AUTH0_JWKS_URL", default=f"https://{AUTH0_DOMAIN}/.well-known/jwks.json")
AUTH0_CLAIMS_NAMESPACE = "https://rosetta/"

SPECTACULAR_SETTINGS = {
    "TITLE": "Rosetta API",
    "DESCRIPTION": "Contrato en docs/03-arquitectura/05-api.md",
    "VERSION": "0.1.0",
    "SERVE_INCLUDE_SCHEMA": False,
}

# --- Seguridad común (docs/03-arquitectura/07-seguridad-y-autenticacion.md §5) ---
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"

# --- Logs a stdout sin tokens ni datos personales (FR-033, RNF-06; 07-seguridad §7) ---
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "filters": {"redact": {"()": "apps.accounts.logging.RedactFilter"}},
    "formatters": {
        "plain": {"format": "%(asctime)s %(levelname)s %(name)s %(message)s"},
        # Eventos de seguridad con campos cerrados (research R-11).
        "security": {
            "format": "%(asctime)s %(levelname)s %(name)s event=%(event)s reason=%(reason)s "
            "user_id=%(user_id)s path=%(path)s"
        },
    },
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "plain", "filters": ["redact"]},
        "security": {
            "class": "logging.StreamHandler",
            "formatter": "security",
            "filters": ["redact"],
        },
    },
    "loggers": {
        "rosetta.security": {"handlers": ["security"], "level": "INFO", "propagate": False},
    },
    "root": {"handlers": ["console"], "level": env("LOG_LEVEL", default="INFO")},
}
