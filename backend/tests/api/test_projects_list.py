"""GET /api/projects — contracts/projects-api.yaml (tras CD-013) y 05-api §1 y §3.10.

FR-005: solo los proyectos activos propios (o, con ?archived=true, solo los archivados), con
las cifras de ProjectSummary, ordenados por last_activity_at desc y luego id, con la paginación
estándar y un número de consultas que no crece con el número de proyectos.
"""

from datetime import timedelta

import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import User
from tests.factories.catalog import ColumnFactory, ColumnInterpretationFactory, TableFactory
from tests.factories.projects import ProjectFactory
from tests.factories.review import ReviewActionFactory

pytestmark = [pytest.mark.story("ROS-78"), pytest.mark.fr("003:FR-005")]

ANA = "google-oauth2|ana"
BETO = "google-oauth2|beto"


def auth(tokens, sub=ANA):
    return tokens.bearer(sub=sub, email=f"{sub.split('|')[1]}@example.test")


def person(tokens, sub=ANA):
    """La cuenta se crea en el primer acceso (feature 002); se devuelve para sembrar."""
    APIClient().get("/api/me", **auth(tokens, sub))
    return User.objects.get(auth0_sub=sub)


def get(tokens, query="", sub=ANA):
    return APIClient().get(f"/api/projects{query}", **auth(tokens, sub))


def project(owner, name, minutes_ago=0, archived=False, **kwargs):
    activity = timezone.now() - timedelta(minutes=minutes_ago)
    return ProjectFactory(
        owner=owner,
        name=name,
        last_activity_at=activity,
        archived_at=activity if archived else None,
        **kwargs,
    )


@pytest.mark.django_db
def test_lists_only_my_active_projects(api_tokens):
    ana, beto = person(api_tokens), person(api_tokens, BETO)
    mine = project(ana, "CORE_PRD")
    project(ana, "VIEJO", archived=True)
    project(beto, "AJENO")

    response = get(api_tokens)

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"count", "next", "previous", "results"}
    assert body["count"] == 1
    assert [row["id"] for row in body["results"]] == [str(mine.id)]


@pytest.mark.django_db
def test_archived_true_lists_only_my_archived_projects(api_tokens):
    ana, beto = person(api_tokens), person(api_tokens, BETO)
    project(ana, "CORE_PRD")
    archived = project(ana, "VIEJO", archived=True)
    project(beto, "AJENO", archived=True)

    body = get(api_tokens, "?archived=true").json()

    assert [row["id"] for row in body["results"]] == [str(archived.id)]
    assert body["results"][0]["archived"] is True
    assert body["results"][0]["archived_at"] is not None


@pytest.mark.django_db
def test_archived_false_is_the_default_list(api_tokens):
    ana = person(api_tokens)
    active = project(ana, "CORE_PRD")
    project(ana, "VIEJO", archived=True)

    body = get(api_tokens, "?archived=false").json()

    assert [row["id"] for row in body["results"]] == [str(active.id)]


@pytest.mark.django_db
def test_without_projects_the_list_is_empty(api_tokens):
    person(api_tokens)

    body = get(api_tokens).json()

    assert body == {"count": 0, "next": None, "previous": None, "results": []}


@pytest.mark.django_db
def test_each_row_is_a_project_summary_with_its_figures(api_tokens):
    ana = person(api_tokens)
    core = project(ana, "CORE_PRD")
    project(ana, "VACIO", minutes_ago=5, source_dialect="oracle")
    table = TableFactory(project=core)
    TableFactory(project=core)
    columns = [ColumnFactory(table=table) for _ in range(4)]
    action = ReviewActionFactory(column=columns[0])
    ColumnInterpretationFactory(column=columns[0], level="CONFIRMED", confirmed_by_action=action)
    ColumnInterpretationFactory(column=columns[1], level="INFERRED")

    rows = {row["name"]: row for row in get(api_tokens).json()["results"]}

    detail = APIClient().get(f"/api/projects/{core.id}", **auth(api_tokens)).json()
    assert rows["CORE_PRD"] == detail
    assert (rows["CORE_PRD"]["table_count"], rows["CORE_PRD"]["column_count"]) == (2, 4)
    assert rows["CORE_PRD"]["confirmed_ratio"] == 0.25
    # Sin columnas no hay porcentaje que calcular (DP-020): null, no 0.
    assert (rows["VACIO"]["table_count"], rows["VACIO"]["column_count"]) == (0, 0)
    assert rows["VACIO"]["confirmed_ratio"] is None
    assert rows["VACIO"]["source_dialect"] == "oracle"


@pytest.mark.django_db
def test_order_is_last_activity_desc_then_id(api_tokens):
    ana = person(api_tokens)
    old = project(ana, "ANTIGUO", minutes_ago=60)
    recent = project(ana, "RECIENTE", minutes_ago=1)
    same_time = timezone.now() - timedelta(minutes=30)
    tied = [
        ProjectFactory(owner=ana, name=f"EMPATE_{n}", last_activity_at=same_time) for n in range(3)
    ]

    ids = [row["id"] for row in get(api_tokens).json()["results"]]

    tied_ids = sorted(str(item.id) for item in tied)
    assert ids == [str(recent.id), *tied_ids, str(old.id)]


@pytest.mark.django_db
def test_standard_pagination(api_tokens):
    ana = person(api_tokens)
    for n in range(3):
        project(ana, f"P{n}", minutes_ago=n)

    first = get(api_tokens, "?page_size=2").json()
    second = get(api_tokens, "?page_size=2&page=2").json()

    assert first["count"] == 3
    assert [row["name"] for row in first["results"]] == ["P0", "P1"]
    assert first["previous"] is None
    assert "page=2" in first["next"]
    assert [row["name"] for row in second["results"]] == ["P2"]
    assert second["next"] is None


@pytest.mark.django_db
def test_page_size_defaults_to_50_and_is_capped_at_200(api_tokens):
    ana = person(api_tokens)
    for n in range(201):
        project(ana, f"P{n:03d}", minutes_ago=n)

    assert len(get(api_tokens).json()["results"]) == 50
    assert len(get(api_tokens, "?page_size=500").json()["results"]) == 200


def _queries_for(tokens, sub, count):
    owner = person(tokens, sub)
    for n in range(count):
        item = project(owner, f"N{n}", minutes_ago=n)
        column = ColumnFactory(table=TableFactory(project=item))
        ColumnInterpretationFactory(column=column, level="INFERRED")
    with CaptureQueriesContext(connection) as queries:
        response = get(tokens, sub=sub)
    assert response.status_code == 200
    assert response.json()["count"] == count
    return len(queries)


@pytest.mark.django_db
def test_number_of_queries_does_not_grow_with_the_projects(api_tokens):
    with_one = _queries_for(api_tokens, ANA, 1)
    with_twenty = _queries_for(api_tokens, BETO, 20)

    assert with_twenty == with_one
