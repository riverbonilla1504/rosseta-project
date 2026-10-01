"""GET /api/health — docs/03-arquitectura/05-api.md §2 y 08-infraestructura-y-entornos.md §7."""

from unittest.mock import patch

import pytest
from rest_framework.test import APIClient


@pytest.mark.django_db
def test_health_reports_ok_when_database_and_redis_are_reachable():
    with patch("apps.core.views.redis_is_reachable", return_value=True):
        response = APIClient().get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "checks": {"database": "ok", "redis": "ok"}}


@pytest.mark.django_db
def test_health_returns_503_when_redis_is_down():
    with patch("apps.core.views.redis_is_reachable", return_value=False):
        response = APIClient().get("/api/health")

    assert response.status_code == 503
    assert response.json()["checks"]["redis"] == "error"


@pytest.mark.django_db
def test_unknown_route_returns_404():
    response = APIClient().get("/api/does-not-exist")

    assert response.status_code == 404


@pytest.mark.django_db
def test_health_returns_503_when_database_is_down():
    with (
        patch("apps.core.views.connection.cursor", side_effect=Exception("db down")),
        patch("apps.core.views.redis_is_reachable", return_value=True),
    ):
        response = APIClient().get("/api/health")

    assert response.status_code == 503
    assert response.json()["checks"]["database"] == "error"


def test_redis_check_is_false_when_server_is_unreachable(settings):
    from apps.core.views import redis_is_reachable

    settings.REDIS_URL = "redis://127.0.0.1:1/0"

    assert redis_is_reachable() is False


def test_method_not_allowed_uses_standard_error_format():
    response = APIClient().post("/api/health")

    assert response.status_code == 405
    assert response.json()["error"]["code"] == "method_not_allowed"
    assert set(response.json()["error"]) == {"code", "message", "details"}
