"""Garantías de configuración (docs/03-arquitectura/07-seguridad-y-autenticacion.md §5)."""

import importlib

import pytest


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


def _load_prod(monkeypatch, **env):
    for key in ("AUTH0_ISSUER", "AUTH0_JWKS_URL"):
        monkeypatch.delenv(key, raising=False)
    monkeypatch.setenv("AUTH0_DOMAIN", "tenant.example.test")
    for key, value in env.items():
        monkeypatch.setenv(key, value)
    base = importlib.reload(importlib.import_module("config.settings.base"))
    prod = importlib.reload(importlib.import_module("config.settings.prod"))
    return base, prod


@pytest.fixture
def restore_settings_modules(monkeypatch):
    yield
    monkeypatch.undo()  # primero el entorno original; si no, prod volvería a fallar al recargar
    importlib.reload(importlib.import_module("config.settings.base"))
    importlib.reload(importlib.import_module("config.settings.prod"))


@pytest.mark.story("ROS-93")
@pytest.mark.fr("002:FR-029")
def test_prod_derives_https_issuer_and_jwks_from_the_domain(monkeypatch, restore_settings_modules):
    _base, prod = _load_prod(monkeypatch)

    assert prod.AUTH0_ISSUER == "https://tenant.example.test/"
    assert prod.AUTH0_JWKS_URL == "https://tenant.example.test/.well-known/jwks.json"
    assert prod.DEBUG is False


@pytest.mark.story("ROS-93")
@pytest.mark.fr("002:FR-032")
@pytest.mark.parametrize(
    "override",
    [
        {"AUTH0_ISSUER": "http://localhost:4010/"},
        {"AUTH0_JWKS_URL": "http://localhost:4010/jwks"},
        {"AUTH0_ISSUER": "https://otro.example.test/"},
    ],
)
def test_prod_rejects_test_overrides_and_non_https(monkeypatch, restore_settings_modules, override):
    from django.core.exceptions import ImproperlyConfigured

    with pytest.raises(ImproperlyConfigured):
        _load_prod(monkeypatch, **override)


@pytest.mark.story("ROS-84")
@pytest.mark.fr("003:FR-020")
def test_prod_forces_https_and_permanent_hsts():
    """07-seguridad §5: redirección a HTTPS y HSTS de un año con subdominios (feature 003)."""
    prod = importlib.import_module("config.settings.prod")

    assert prod.SECURE_SSL_REDIRECT is True
    assert prod.SECURE_HSTS_SECONDS == 31_536_000
    assert prod.SECURE_HSTS_INCLUDE_SUBDOMAINS is True
