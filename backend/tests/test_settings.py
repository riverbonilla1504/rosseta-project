"""Garantías de configuración (docs/03-arquitectura/07-seguridad-y-autenticacion.md §5)."""

import importlib


def test_prod_settings_never_enable_debug():
    prod = importlib.import_module("config.settings.prod")

    assert prod.DEBUG is False
    assert prod.SECURE_SSL_REDIRECT is True
    assert prod.SECURE_HSTS_SECONDS >= 31_536_000
    assert prod.CSRF_COOKIE_SECURE is True


def test_security_headers_are_configured_for_all_environments():
    base = importlib.import_module("config.settings.base")

    assert base.X_FRAME_OPTIONS == "DENY"
    assert base.SECURE_CONTENT_TYPE_NOSNIFF is True
