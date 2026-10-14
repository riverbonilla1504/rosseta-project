"""Cabeceras de seguridad del backend (07-seguridad §5; FR-034, RNF-09)."""

import importlib
from unittest.mock import patch

import pytest
from rest_framework.test import APIClient

pytestmark = [pytest.mark.story("ROS-93"), pytest.mark.fr("002:FR-034")]


@pytest.mark.django_db
@pytest.mark.parametrize("path", ["/api/health", "/api/me"])
def test_json_responses_carry_the_security_headers(path):
    with patch("apps.core.views.redis_is_reachable", return_value=True):
        response = APIClient().get(path)

    assert response["Content-Security-Policy"] == "default-src 'none'; frame-ancestors 'none'"
    assert response["X-Frame-Options"] == "DENY"
    assert response["X-Content-Type-Options"] == "nosniff"
    assert response["Referrer-Policy"] == "strict-origin-when-cross-origin"


def test_production_configuration_enables_hsts_for_a_year():
    prod = importlib.import_module("config.settings.prod")

    assert prod.SECURE_HSTS_SECONDS >= 31_536_000
    assert prod.SECURE_HSTS_INCLUDE_SUBDOMAINS is True


def test_csp_middleware_is_registered():
    from django.conf import settings

    assert "apps.core.middleware.JsonContentSecurityPolicyMiddleware" in settings.MIDDLEWARE
