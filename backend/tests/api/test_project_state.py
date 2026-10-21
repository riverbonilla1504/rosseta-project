"""GET /api/projects/{id}/state — contracts/projects-api.yaml (tras CD-013) y 05-api §3.10.

FR-022: el estado resumido llega de una vez (proyecto, cobertura, fuentes, tablas y cabeza de la
cola) con un número fijo de consultas. FR-021 y SC-002: dos lecturas, también con otra
credencial de la misma persona, devuelven el mismo documento y el catálogo guardado no cambia.
"""

from datetime import timedelta

import pytest
from django.core.management import call_command
from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.catalog.models import Column
from apps.projects.models import Project
from tests.factories.catalog import ColumnFactory, ColumnInterpretationFactory, TableFactory
from tests.factories.projects import ProjectFactory
from tests.factories.review import ReviewActionFactory
from tests.factories.sources import SourceFactory

pytestmark = [pytest.mark.django_db, pytest.mark.story("ROS-81")]

ANA = "google-oauth2|ana-estado"
LEVELS = {"CONFIRMED", "HIGH_UNVALIDATED", "INFERRED", "HYPOTHESIS", "UNKNOWN"}


def auth(tokens, **claims):
    return tokens.bearer(sub=ANA, email="ana-estado@example.test", **claims)


def person(tokens):
    APIClient().get("/api/me", **auth(tokens))
    return User.objects.get(auth0_sub=ANA)


def state(tokens, project_id, **claims):
    return APIClient().get(f"/api/projects/{project_id}/state", **auth(tokens, **claims))


def column(project, table, name, level="UNKNOWN", impact=0, conflict=False):
    col = ColumnFactory(table=table, name=name, name_normalized=name)
    if level == "CONFIRMED":
        action = ReviewActionFactory(column=col)
        ColumnInterpretationFactory(
            column=col, level=level, origin="HUMAN", confirmed_by_action=action, impact=impact
        )
    else:
        ColumnInterpretationFactory(
            column=col, level=level, impact=impact, has_open_conflict=conflict
        )
    return col


def saved_catalog(project):
    """Tablas, columnas e interpretaciones con su nivel tal como están guardadas (SC-002)."""
    return sorted(
        Column.objects.filter(project=project).values_list(
            "table__name", "name", "data_type", "interpretation__level", "interpretation__score"
        )
    )


@pytest.mark.fr("003:FR-022")
def test_state_of_an_empty_project_has_the_contract_shape(api_tokens):
    project = ProjectFactory(owner=person(api_tokens), name="VACIO")

    response = state(api_tokens, project.id)

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"project", "coverage", "sources", "table_count", "queue_head"}
    assert body["project"]["id"] == str(project.id)
    assert body["project"]["name"] == "VACIO"
    assert body["project"]["confirmed_ratio"] is None
    assert body["coverage"] == {"total_columns": 0, "by_level": dict.fromkeys(LEVELS, 0)}
    assert body["sources"] == []
    assert body["table_count"] == 0
    assert body["queue_head"] == []


@pytest.mark.fr("003:FR-022")
def test_coverage_counts_every_column_by_level(api_tokens):
    project = ProjectFactory(owner=person(api_tokens))
    table = TableFactory(project=project, name="MOV0010")
    for name, level in [("A", "CONFIRMED"), ("B", "INFERRED"), ("C", "INFERRED"), ("D", "UNKNOWN")]:
        column(project, table, name, level)
    TableFactory(project=project, name="VACIA")

    body = state(api_tokens, project.id).json()

    assert body["coverage"]["total_columns"] == 4
    assert body["coverage"]["by_level"] == {
        "CONFIRMED": 1,
        "HIGH_UNVALIDATED": 0,
        "INFERRED": 2,
        "HYPOTHESIS": 0,
        "UNKNOWN": 1,
    }
    assert sum(body["coverage"]["by_level"].values()) == body["coverage"]["total_columns"]
    assert body["table_count"] == 2
    assert body["project"]["table_count"] == 2
    assert body["project"]["column_count"] == 4


@pytest.mark.fr("003:FR-022")
def test_queue_head_excludes_confirmed_and_follows_the_queue_order(api_tokens):
    project = ProjectFactory(owner=person(api_tokens))
    mov, cta = (
        TableFactory(project=project, name="MOV0010"),
        TableFactory(project=project, name="CTA0001"),
    )
    column(project, mov, "SUCCOD", "CONFIRMED", impact=99)
    column(project, mov, "PGCOD", "HIGH_UNVALIDATED", impact=38)
    column(project, mov, "PAPEL", "INFERRED", impact=5)
    column(project, cta, "TIPO", "HYPOTHESIS", impact=5, conflict=True)
    column(project, mov, "ZETA", "UNKNOWN", impact=5)
    column(project, cta, "ALFA", "UNKNOWN", impact=5)

    head = state(api_tokens, project.id).json()["queue_head"]

    assert [row["identifier"] for row in head] == [
        "MOV0010.PGCOD",
        "CTA0001.TIPO",  # mismo impacto: primero el conflicto abierto
        "CTA0001.ALFA",  # luego TABLA.COLUMNA ascendente
        "MOV0010.PAPEL",
        "MOV0010.ZETA",
    ]
    assert set(head[0]) == {"column_id", "identifier", "level", "impact", "has_open_conflict"}
    assert head[0]["level"] == "HIGH_UNVALIDATED"
    assert head[0]["impact"] == 38
    assert head[1]["has_open_conflict"] is True
    assert "CONFIRMED" not in {row["level"] for row in head}


@pytest.mark.fr("003:FR-022")
def test_queue_head_has_at_most_fifty_rows(api_tokens):
    project = ProjectFactory(owner=person(api_tokens))
    table = TableFactory(project=project, name="T")
    for index in range(55):
        column(project, table, f"C{index:02d}", "INFERRED", impact=index)

    head = state(api_tokens, project.id).json()["queue_head"]

    assert len(head) == 50
    assert head[0]["identifier"] == "T.C54"


@pytest.mark.fr("003:FR-022")
def test_sources_are_listed_by_creation(api_tokens):
    project = ProjectFactory(owner=person(api_tokens))
    now = timezone.now()
    later = SourceFactory(project=project, original_filename="b.csv", kind="DATA_SAMPLE")
    first = SourceFactory(project=project, original_filename="a.sql", status="PROCESSING")
    type(later).objects.filter(pk=later.pk).update(created_at=now)
    type(first).objects.filter(pk=first.pk).update(created_at=now - timedelta(minutes=5))

    sources = state(api_tokens, project.id).json()["sources"]

    assert [source["original_filename"] for source in sources] == ["a.sql", "b.csv"]
    assert sources[0] == {
        "id": str(first.id),
        "kind": "SCHEMA_DDL",
        "status": "PROCESSING",
        "original_filename": "a.sql",
        "created_at": sources[0]["created_at"],
    }


@pytest.mark.fr("003:FR-021")
def test_reopening_returns_the_same_state_and_the_saved_catalog_is_unchanged(api_tokens):
    owner = person(api_tokens)
    call_command("seed_reference_project", owner_sub=owner.auth0_sub)
    project = Project.objects.for_user(owner).get(name="CORE_DEMO")
    catalog_before = saved_catalog(project)

    first = state(api_tokens, project.id)
    again = state(api_tokens, project.id)
    # Otra sesión de la misma persona: otra credencial, el mismo sub.
    other_session = state(api_tokens, project.id, name="Ana en otro navegador")

    assert first.status_code == 200
    assert first.json() == again.json() == other_session.json()
    assert saved_catalog(project) == catalog_before
    body = first.json()
    assert body["queue_head"][0]["identifier"] == "MOV0010.PGCOD"
    assert body["coverage"]["by_level"]["CONFIRMED"] == 3
    assert [source["kind"] for source in body["sources"]] == ["SCHEMA_DDL"]


@pytest.mark.fr("003:FR-022")
def test_the_number_of_queries_does_not_grow_with_the_project(api_tokens):
    owner = person(api_tokens)
    small = ProjectFactory(owner=owner)
    column(small, TableFactory(project=small), "A")
    big = ProjectFactory(owner=owner)
    for _ in range(5):
        table = TableFactory(project=big)
        SourceFactory(project=big)
        for c in range(8):
            column(big, table, f"C{c}", "INFERRED", impact=c)

    def queries(project):
        with CaptureQueriesContext(connection) as captured:
            assert state(api_tokens, project.id).status_code == 200
        return len(captured)

    assert queries(big) == queries(small)
