"""Suite de acceso cruzado — research R-04 de la feature 003 (ROS-178; RNF-03, 07-seguridad §4).

La lista de operaciones sale del esquema OpenAPI y se compara con CROSS_ACCESS_CASES: una
operación con parámetro de ruta sin caso hace fallar la suite (FR-018). Para cada caso, la
persona B pide el recurso de A y recibe el mismo 404 que con un UUID inventado, y nada de A
cambia (FR-014, FR-015). Las operaciones de lectura sin parámetro de ruta (listados, /api/me)
nunca devuelven datos de A. Cubre SC-001.
"""

import json
import re
import uuid

import pytest
from drf_spectacular.generators import SchemaGenerator
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.catalog.models import Column, ColumnInterpretation, ColumnProfile, Table
from apps.evidence.models import Conflict, Evidence
from apps.projects.models import Project
from apps.review.models import ReviewAction
from apps.sources.models import NamingRule, Source
from tests.factories.catalog import (
    ColumnFactory,
    ColumnInterpretationFactory,
    ColumnProfileFactory,
    TableFactory,
)
from tests.factories.evidence import ConflictFactory, EvidenceFactory
from tests.factories.projects import ProjectFactory
from tests.factories.review import ReviewActionFactory
from tests.factories.sources import NamingRuleFactory, SourceFactory
from tests.security.cross_access_cases import CROSS_ACCESS_CASES

pytestmark = [pytest.mark.django_db, pytest.mark.story("ROS-84")]

ANA = "google-oauth2|ana-cruzado"
BETO = "google-oauth2|beto-cruzado"
METHODS = {"get", "post", "put", "patch", "delete"}
PARAMETER = re.compile(r"\{(\w+)\}")
CLIENT_MODELS = [
    Project,
    Table,
    Column,
    ColumnInterpretation,
    ColumnProfile,
    Source,
    NamingRule,
    Evidence,
    Conflict,
    ReviewAction,
]


def schema_operations():
    schema = SchemaGenerator().get_schema(request=None, public=True)
    return {
        (method.upper(), path)
        for path, operations in schema["paths"].items()
        for method in operations
        if method in METHODS
    }


def auth(tokens, sub):
    return tokens.bearer(sub=sub, email=f"{sub.split('|')[1]}@example.test")


def person(tokens, sub):
    """La cuenta se crea en el primer acceso (feature 002)."""
    APIClient().get("/api/me", **auth(tokens, sub))
    return User.objects.get(auth0_sub=sub)


def seed_everything(owner):
    """Un proyecto activo con contenido en todas las tablas de cliente y otro archivado."""
    project = ProjectFactory(owner=owner, name="SECRETO_DE_ANA")
    table = TableFactory(project=project, name="MOVSECRETO")
    column = ColumnFactory(table=table, name="CTASECRETA", name_normalized="CTASECRETA")
    ColumnInterpretationFactory(column=column)
    ColumnProfileFactory(column=column)
    SourceFactory(project=project, original_filename="secreto.sql")
    NamingRuleFactory(project=project, pattern="SECR")
    EvidenceFactory(column=column)
    ConflictFactory(column=column)
    ReviewActionFactory(column=column)
    ProjectFactory(owner=owner, name="ARCHIVO_DE_ANA", archived_at=project.created_at)
    return project


def snapshot(owner):
    """Todas las filas de cliente de la persona, para comprobar que nada cambia."""
    return {
        model.__name__: sorted(
            (json.dumps(row, default=str, sort_keys=True) for row in model.objects.for_user(owner).values()),
        )
        for model in CLIENT_MODELS
    }


def call(client, method, path, body, headers):
    send = getattr(client, method.lower())
    if method == "GET":
        return send(path, **headers)
    return send(path, data=body, format="json", **headers)


def body_of(response):
    return response.status_code, response.json()


@pytest.mark.fr("003:FR-018")
def test_every_operation_with_a_path_parameter_has_a_registered_case():
    with_parameter = {(method, path) for method, path in schema_operations() if "{" in path}
    registered = {(case.method, case.path) for case in CROSS_ACCESS_CASES}

    assert with_parameter, "el esquema debería tener operaciones con parámetro de ruta"
    assert sorted(with_parameter - registered) == [], "operaciones sin caso de acceso cruzado"
    assert sorted(registered - with_parameter) == [], "casos de operaciones que ya no existen"


@pytest.mark.fr("003:FR-014")
@pytest.mark.fr("003:FR-015")
@pytest.mark.parametrize("case", CROSS_ACCESS_CASES, ids=lambda case: f"{case.method} {case.path}")
def test_person_b_gets_the_same_404_as_a_made_up_id_and_nothing_of_a_changes(api_tokens, case):
    ana, _beto = person(api_tokens, ANA), person(api_tokens, BETO)
    params = case.build(ana)
    before = snapshot(ana)
    as_beto = auth(api_tokens, BETO)
    client = APIClient()

    foreign = call(client, case.method, case.path.format(**params), case.body, as_beto)
    made_up = {name: str(uuid.uuid4()) for name in params}
    missing = call(client, case.method, case.path.format(**made_up), case.body, as_beto)
    invalid = {name: "no-es-un-uuid" for name in params}
    malformed = call(client, case.method, case.path.format(**invalid), case.body, as_beto)

    assert body_of(foreign) == body_of(missing) == body_of(malformed)
    assert foreign.status_code == 404
    assert foreign.json()["error"]["code"] == "not_found"
    assert snapshot(ana) == before


@pytest.mark.fr("003:FR-014")
def test_reads_without_a_path_parameter_never_show_anything_of_a(api_tokens):
    ana, _beto = person(api_tokens, ANA), person(api_tokens, BETO)
    project = seed_everything(ana)
    archived = Project.objects.for_user(ana).get(name="ARCHIVO_DE_ANA")
    markers = [
        str(project.id),
        str(archived.id),
        "SECRETO_DE_ANA",
        "ARCHIVO_DE_ANA",
        "MOVSECRETO",
        "CTASECRETA",
        "secreto.sql",
        ana.email,
        str(ana.id),
    ]
    reads = sorted(
        path for method, path in schema_operations() if method == "GET" and "{" not in path
    )
    client = APIClient()

    leaks = []
    for path in reads:
        for query in ("", "?archived=true"):
            response = client.get(path + query, **auth(api_tokens, BETO))
            text = response.content.decode()
            leaks += [(path + query, marker) for marker in markers if marker in text]

    assert "/api/projects" in reads
    assert leaks == []
