from .base import *  # noqa: F403

DEBUG = True
ALLOWED_HOSTS = ["localhost", "127.0.0.1", "backend", "0.0.0.0"]  # noqa: S104
CSRF_TRUSTED_ORIGINS = ["http://localhost:3000"]
