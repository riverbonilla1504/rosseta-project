"""POST /api/projects y GET /api/projects/{id} — contracts/projects-api.yaml (tras CD-013).

FR-001 (crear con nombre y dialecto), FR-003 (errores por campo; un envío no crea dos) y
FR-004 (project_name_taken); el detalle de lo ajeno responde not_found (FR-015).
"""

import threading
import uuid

import pytest
from django.db import connection
from rest_framework.test import APIClient

from apps.projects.models import Project
from tests.factories.catalog import ColumnFactory, ColumnInterpretationFactory, TableFactory
from tests.factories.review import ReviewActionFactory

pytestmark = [pytest.mark.story("ROS-78")]

SUMMARY_FIELDS = {
    "id",
    "name",
    "description",
    "source_dialect",
    "archived",
    "archived_at",
    "created_at",
    "last_activity_at",
    "table_count",
    "column_count",
    "confirmed_ratio",
}


def auth(tokens, sub="google-oauth2|ana"):
    """Credencial de una persona sintética con su propio correo (FR-009 de la 002)."""
    return tokens.bearer(sub=sub, email=f"{sub.split('|')[1]}@example.test")


def post(tokens, payload, sub="google-oauth2|ana"):
    return APIClient().post("/api/projects", payload, format="json", **auth(tokens, sub))


@pytest.mark.django_db
@pytest.mark.fr("003:FR-001")
def test_create_returns_201_with_the_project_summary(api_tokens):
    response = post(api_tokens, {"name": "  CORE_PRD ", "source_dialect": "tsql"})

    assert response.status_code == 201
    body = response.json()
    assert set(body) == SUMMARY_FIELDS
    uuid.UUID(body["id"], version=4)
    assert body["name"] == "CORE_PRD"
    assert body["description"] == ""
    assert body["source_dialect"] == "tsql"
    assert body["archived"] is False
    assert body["archived_at"] is None
    assert body["last_activity_at"] == body["created_at"]
    assert (body["table_count"], body["column_count"], body["confirmed_ratio"]) == (0, 0, None)
    project = Project.objects.get(id=body["id"])
    assert project.owner.auth0_sub == "google-oauth2|ana"


@pytest.mark.django_db
@pytest.mark.fr("003:FR-003")
@pytest.mark.parametrize(
    ("payload", "fields"),
    [
        ({"name": "", "source_dialect": "tsql"}, {"name"}),
        ({"name": "   ", "source_dialect": "tsql"}, {"name"}),
        ({"name": "a" * 121, "source_dialect": "tsql"}, {"name"}),
        ({"source_dialect": "tsql"}, {"name"}),
        ({"name": "CORE_PRD"}, {"source_dialect"}),
        ({"name": "CORE_PRD", "source_dialect": "mysql"}, {"source_dialect"}),
        ({"name": "", "source_dialect": ""}, {"name", "source_dialect"}),
    ],
)
def test_invalid_input_is_a_400_validation_error_by_field(api_tokens, payload, fields):
    response = post(api_tokens, payload)

    assert response.status_code == 400
    error = response.json()["error"]
    assert error["code"] == "validation_error"
    assert set(error["details"]) == fields
    assert not Project.objects.exists()


@pytest.mark.django_db
@pytest.mark.fr("003:FR-003")
@pytest.mark.parametrize("extra", [{"description": "x"}, {"owner": "otro"}, {"archived": True}])
def test_unknown_fields_are_rejected(api_tokens, extra):
    response = post(api_tokens, {"name": "CORE_PRD", "source_dialect": "tsql", **extra})

    assert response.status_code == 400
    error = response.json()["error"]
    assert error["code"] == "validation_error"
    assert set(error["details"]) == set(extra)
    assert not Project.objects.exists()


@pytest.mark.django_db
@pytest.mark.fr("003:FR-004")
def test_repeated_active_name_is_project_name_taken(api_tokens):
    post(api_tokens, {"name": "core_prd", "source_dialect": "tsql"})

    response = post(api_tokens, {"name": "CORE_PRD", "source_dialect": "oracle"})

    assert response.status_code == 400
    error = response.json()["error"]
    assert error["code"] == "project_name_taken"
    assert set(error["details"]) == {"name"}
    assert Project.objects.count() == 1


@pytest.mark.django_db
@pytest.mark.fr("003:FR-004")
def test_same_name_for_another_person_is_allowed(api_tokens):
    post(api_tokens, {"name": "CORE_PRD", "source_dialect": "tsql"}, sub="google-oauth2|ana")

    response = post(
        api_tokens, {"name": "CORE_PRD", "source_dialect": "tsql"}, sub="google-oauth2|beto"
    )

    assert response.status_code == 201


@pytest.mark.django_db(transaction=True)
@pytest.mark.fr("003:FR-003")
def test_two_simultaneous_requests_with_the_same_name_create_a_single_project(api_tokens):
    # La cuenta ya existe: la carrera es solo la del proyecto.
    APIClient().get("/api/me", **auth(api_tokens))
    barrier = threading.Barrier(2)
    results: list[tuple[int, str | None]] = []

    def create():
        try:
            barrier.wait()
            response = post(api_tokens, {"name": "CORE_PRD", "source_dialect": "tsql"})
            code = response.json().get("error", {}).get("code")
            results.append((response.status_code, code))
        finally:
            connection.close()

    threads = [threading.Thread(target=create) for _ in range(2)]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()

    assert sorted(results, key=lambda result: result[0]) == [
        (201, None),
        (400, "project_name_taken"),
    ]
    assert Project.objects.count() == 1


@pytest.mark.django_db
@pytest.mark.fr("003:FR-001")
def test_get_detail_of_an_own_project(api_tokens):
    created = post(api_tokens, {"name": "CORE_PRD", "source_dialect": "postgres"}).json()

    response = APIClient().get(f"/api/projects/{created['id']}", **auth(api_tokens))

    assert response.status_code == 200
    assert response.json() == created


@pytest.mark.django_db
@pytest.mark.fr("003:FR-005")
def test_detail_counts_tables_columns_and_confirmed_ratio(api_tokens):
    created = post(api_tokens, {"name": "CORE_PRD", "source_dialect": "tsql"}).json()
    project = Project.objects.get(id=created["id"])
    table = TableFactory(project=project)
    TableFactory(project=project)
    columns = [ColumnFactory(table=table) for _ in range(4)]
    action = ReviewActionFactory(column=columns[0])
    ColumnInterpretationFactory(column=columns[0], level="CONFIRMED", confirmed_by_action=action)
    ColumnInterpretationFactory(column=columns[1], level="INFERRED")

    body = APIClient().get(f"/api/projects/{project.id}", **auth(api_tokens)).json()

    assert (body["table_count"], body["column_count"], body["confirmed_ratio"]) == (2, 4, 0.25)


@pytest.mark.django_db
@pytest.mark.fr("003:FR-015")
@pytest.mark.parametrize("kind", ["ajeno", "inexistente", "invalido"])
def test_detail_of_a_foreign_missing_or_invalid_project_is_the_same_404(api_tokens, kind):
    created = post(api_tokens, {"name": "CORE_PRD", "source_dialect": "tsql"}).json()
    project_id = {
        "ajeno": created["id"],
        "inexistente": str(uuid.uuid4()),
        "invalido": "no-es-un-uuid",
    }[kind]

    response = APIClient().get(
        f"/api/projects/{project_id}", **auth(api_tokens, "google-oauth2|beto")
    )

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"
    assert response.json()["error"]["details"] == {}
