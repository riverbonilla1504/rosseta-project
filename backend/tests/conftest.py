"""Configuración común de pytest.

Marcadores de trazabilidad obligatorios (docs/06-calidad/01-estrategia-de-pruebas.md §2):
    @pytest.mark.story("ROS-27")
    @pytest.mark.fr("005:FR-006")
"""

import pytest


@pytest.fixture
def api_tokens(settings):
    """Hace que la API acepte los tokens de tests/support/tokens.py (sin red hacia el tenant)."""
    from unittest.mock import patch

    from apps.accounts.jwks import JWKSClient
    from tests.support import tokens

    settings.AUTH0_ISSUER = tokens.ISSUER
    settings.AUTH0_AUDIENCE = tokens.AUDIENCE
    client = JWKSClient("https://tenant.example.test/.well-known/jwks.json", fetcher=tokens.jwks)
    with patch("apps.accounts.authentication.get_jwks_client", return_value=client):
        yield tokens
