"""Registros y direcciones sin datos sensibles — FR-016 y FR-019 de la feature 003 (ROS-179).

Durante un recorrido completo (crear, listar, estado, renombrar, archivar y un acceso denegado)
los registros no contienen correos, nombres, credenciales ni nombres de tablas o columnas del
proyecto; toda ruta con recurso lo identifica solo con un UUID. Cubre SC-005.
"""

import logging
import re
import uuid

import pytest
from django.urls import URLPattern, URLResolver, get_resolver, resolve
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.projects.models import Project
from tests.factories.catalog import ColumnFactory, TableFactory
from tests.factories.sources import SourceFactory

pytestmark = [pytest.mark.django_db, pytest.mark.story("ROS-84")]

ANA = "google-oauth2|ana-sensible"
BETO = "windowslive|beto-sensible"
ANA_NAME = "Ana Sensible Prueba"
ANA_EMAIL = "ana.sensible@example.test"
EMAIL_PATTERN = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
JWT_PATTERN = re.compile(r"eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*")
ROUTE_PARAMETER = re.compile(r"<(?:\w+:)?(\w+)>")


def as_ana(tokens):
    return tokens.bearer(sub=ANA, email=ANA_EMAIL, name=ANA_NAME)


def as_beto(tokens):
    return tokens.bearer(sub=BETO, email="beto.sensible@example.test", name="Beto Sensible")


def journey(tokens):
    """El recorrido de SC-005; devuelve las rutas pedidas y los textos que no deben aparecer."""
    client = APIClient()
    paths = []

    def request(method, path, headers, body=None):
        paths.append(path)
        send = getattr(client, method)
        if body is None:
            return send(path, **headers)
        return send(path, data=body, format="json", **headers)

    assert request("get", "/api/me", as_ana(tokens)).status_code == 200
    created = request(
        "post",
        "/api/projects",
        as_ana(tokens),
        {"name": "BANCO_SENSIBLE", "source_dialect": "tsql"},
    )
    assert created.status_code == 201
    project_id = created.json()["id"]
    project = Project.objects.get(pk=project_id)
    table = TableFactory(project=project, name="MOVSENSIBLE")
    ColumnFactory(table=table, name="CTASENSIBLE", name_normalized="CTASENSIBLE")
    SourceFactory(project=project, original_filename="sensible.sql")

    assert request("get", "/api/projects", as_ana(tokens)).status_code == 200
    assert request("get", f"/api/projects/{project_id}", as_ana(tokens)).status_code == 200
    assert request("get", f"/api/projects/{project_id}/state", as_ana(tokens)).status_code == 200
    renamed = request(
        "patch", f"/api/projects/{project_id}", as_ana(tokens), {"name": "BANCO_RENOMBRADO"}
    )
    assert renamed.status_code == 200
    archived = request("patch", f"/api/projects/{project_id}", as_ana(tokens), {"archived": True})
    assert archived.status_code == 200
    assert request("get", "/api/projects?archived=true", as_ana(tokens)).status_code == 200

    assert request("get", "/api/me", as_beto(tokens)).status_code == 200
    denied = request("get", f"/api/projects/{project_id}", as_beto(tokens))
    assert denied.status_code == 404
    denied = request(
        "patch", f"/api/projects/{project_id}", as_beto(tokens), {"name": "BANCO_DE_BETO"}
    )
    assert denied.status_code == 404

    secrets = [
        ANA_EMAIL,
        ANA_NAME,
        "beto.sensible@example.test",
        "Beto Sensible",
        "BANCO_SENSIBLE",
        "BANCO_RENOMBRADO",
        "BANCO_DE_BETO",
        "MOVSENSIBLE",
        "CTASENSIBLE",
        "sensible.sql",
    ]
    return paths, secrets


def captured_text(caplog):
    """Mensaje, argumentos y campos extra de cada registro, como los vería un manejador."""
    standard = set(logging.makeLogRecord({}).__dict__) | {"message", "asctime"}
    lines = []
    for record in caplog.records:
        extras = {key: value for key, value in record.__dict__.items() if key not in standard}
        lines.append(f"{record.name} {record.getMessage()} {extras}")
    return "\n".join(lines)


@pytest.mark.fr("003:FR-019")
def test_a_full_journey_leaves_no_sensitive_data_in_the_logs(api_tokens, caplog):
    from apps.accounts.logging import RedactFilter

    redact = RedactFilter()
    caplog.handler.addFilter(redact)
    with caplog.at_level(logging.DEBUG):
        _paths, secrets = journey(api_tokens)
    caplog.handler.removeFilter(redact)

    text = captured_text(caplog)
    assert any(record.name == "rosetta.security" for record in caplog.records)
    assert [secret for secret in secrets if secret in text] == []
    assert not EMAIL_PATTERN.search(text)
    assert not JWT_PATTERN.search(text)
    assert User.objects.get(auth0_sub=ANA).full_name not in text


@pytest.mark.fr("003:FR-016")
@pytest.mark.fr("003:FR-019")
def test_every_route_identifies_resources_only_by_uuid(api_tokens):
    paths, secrets = journey(api_tokens)

    for path in paths:
        route = path.split("?")[0]
        values = resolve(route).kwargs.values()
        assert all(uuid.UUID(str(value)).version == 4 for value in values), path
        assert [secret for secret in secrets if secret in path] == [], path


@pytest.mark.fr("003:FR-016")
def test_route_parameters_are_resource_ids():
    def routes(patterns, prefix=""):
        for entry in patterns:
            if isinstance(entry, URLResolver):
                yield from routes(entry.url_patterns, prefix + str(entry.pattern))
            elif isinstance(entry, URLPattern):
                yield prefix + str(entry.pattern)

    parameters = {
        name
        for route in routes(get_resolver().url_patterns)
        for name in ROUTE_PARAMETER.findall(route)
    }

    assert parameters, "debería haber rutas con recurso"
    assert all(name.endswith("_id") for name in parameters), parameters
