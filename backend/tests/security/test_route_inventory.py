"""Inventario de rutas: toda ruta no pública rechaza la petición anónima (FR-012, SC-003).

PUBLIC_ROUTES es la lista mantenida de excepciones (spec 002, FR-012 y SC-003). Una ruta nueva
queda incluida en la comprobación sin tocar esta lista.
"""

import re
from unittest.mock import patch

import pytest
from django.urls import URLPattern, URLResolver, get_resolver
from rest_framework.test import APIClient

pytestmark = [
    pytest.mark.django_db,
    pytest.mark.urls("tests.security.probe_urls"),
    pytest.mark.story("ROS-89"),
    pytest.mark.fr("002:FR-012"),
]

# Únicas rutas públicas (FR-012). /api/docs/ solo existe con DEBUG.
PUBLIC_ROUTES = {"/api/health", "/api/schema/"}
SAMPLE = {"uuid": "00000000-0000-0000-0000-000000000000", "int": "1", "str": "x", "slug": "x"}


def _iter_routes(patterns, prefix=""):
    for entry in patterns:
        if isinstance(entry, URLResolver):
            yield from _iter_routes(entry.url_patterns, prefix + str(entry.pattern))
        elif isinstance(entry, URLPattern):
            yield prefix + str(entry.pattern)


def _concrete(route):
    route = re.sub(r"<(?:(\w+):)?\w+>", lambda m: SAMPLE.get(m.group(1) or "str", "x"), route)
    return "/" + route.lstrip("^").rstrip("$")


def all_routes():
    return sorted({_concrete(r) for r in _iter_routes(get_resolver().url_patterns)})


def test_inventory_contains_the_known_routes():
    routes = all_routes()

    assert "/api/me" in routes
    assert "/api/health" in routes
    assert "/api/probe-default-permissions" in routes


def test_every_non_public_route_rejects_anonymous_requests_with_401():
    client = APIClient()
    failures = []
    for route in all_routes():
        if route in PUBLIC_ROUTES:
            continue
        response = client.get(route)
        body = (
            response.json()
            if response.get("content-type", "").startswith("application/json")
            else {}
        )
        if response.status_code != 401 or body.get("error", {}).get("code") != "session_expired":
            failures.append((route, response.status_code))

    assert failures == []


def test_public_routes_answer_without_credentials():
    client = APIClient()
    with patch("apps.core.views.redis_is_reachable", return_value=True):
        assert client.get("/api/health").status_code == 200
    assert client.get("/api/schema/").status_code == 200
