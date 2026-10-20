"""PATCH /api/projects/{id} — contracts/projects-api.yaml (tras CD-013) y 05-api §3.10.

Admite name, description y archived; source_dialect y cualquier otro campo → 400. Sobre un
archivado solo {"archived": false} con un name opcional; lo demás → 409 project_archived. Al
desarchivar con el nombre ocupado → 400 project_name_taken sin cambios. FR-010…FR-013.
"""

from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.projects.models import Project
from tests.factories.projects import ProjectFactory

pytestmark = [pytest.mark.django_db, pytest.mark.story("ROS-78")]

ANA = "google-oauth2|ana-patch"


def auth(tokens):
    return tokens.bearer(sub=ANA, email="ana-patch@example.test")


def person(tokens):
    APIClient().get("/api/me", **auth(tokens))
    return User.objects.get(auth0_sub=ANA)


def patch_project(tokens, project_id, body):
    return APIClient().patch(
        f"/api/projects/{project_id}", data=body, format="json", **auth(tokens)
    )


def archived(owner, name):
    return ProjectFactory(owner=owner, name=name, archived_at=timezone.now() - timedelta(hours=1))


def error(response):
    return response.status_code, response.json()["error"]["code"]


@pytest.mark.fr("003:FR-011")
def test_rename_and_change_description_return_the_summary(api_tokens):
    project = ProjectFactory(owner=person(api_tokens), name="CORE_PRD")

    response = patch_project(
        api_tokens, project.id, {"name": " CORE_2026 ", "description": "Movimientos"}
    )

    assert response.status_code == 200
    body = response.json()
    assert (body["id"], body["name"], body["description"]) == (
        str(project.id),
        "CORE_2026",
        "Movimientos",
    )
    assert {"table_count", "column_count", "confirmed_ratio", "last_activity_at"} <= set(body)


@pytest.mark.fr("003:FR-011")
def test_an_invalid_name_is_a_validation_error_by_field(api_tokens):
    project = ProjectFactory(owner=person(api_tokens), name="CORE_PRD")

    response = patch_project(api_tokens, project.id, {"name": "a" * 121})

    assert error(response) == (400, "validation_error")
    assert set(response.json()["error"]["details"]) == {"name"}


@pytest.mark.fr("003:FR-004")
def test_renaming_to_an_active_name_is_project_name_taken(api_tokens):
    owner = person(api_tokens)
    project = ProjectFactory(owner=owner, name="VENTAS")
    ProjectFactory(owner=owner, name="CORE_PRD")

    response = patch_project(api_tokens, project.id, {"name": "core_prd"})

    assert error(response) == (400, "project_name_taken")
    assert set(response.json()["error"]["details"]) == {"name"}


@pytest.mark.fr("003:FR-010")
@pytest.mark.parametrize("body", [{"source_dialect": "oracle"}, {"owner": "x"}, {}])
def test_the_dialect_other_fields_and_an_empty_body_are_rejected(api_tokens, body):
    project = ProjectFactory(owner=person(api_tokens), source_dialect="tsql")

    response = patch_project(api_tokens, project.id, body)

    assert error(response) == (400, "validation_error")
    assert set(response.json()["error"]["details"]) == set(body)
    assert Project.objects.get(pk=project.pk).source_dialect == "tsql"


@pytest.mark.fr("003:FR-012")
def test_archive(api_tokens):
    project = ProjectFactory(owner=person(api_tokens))

    response = patch_project(api_tokens, project.id, {"archived": True})

    assert response.status_code == 200
    assert response.json()["archived"] is True
    assert response.json()["archived_at"] is not None


@pytest.mark.fr("003:FR-013")
@pytest.mark.parametrize(
    "body",
    [
        {"name": "NUEVO"},
        {"description": "x"},
        {"archived": True},
        {"archived": False, "description": "x"},
    ],
)
def test_an_archived_project_only_accepts_unarchiving(api_tokens, body):
    project = archived(person(api_tokens), "VIEJO")

    response = patch_project(api_tokens, project.id, body)

    assert error(response) == (409, "project_archived")
    project = Project.objects.get(pk=project.pk)
    assert (project.name, project.description, project.archived_at is not None) == (
        "VIEJO",
        "",
        True,
    )


@pytest.mark.fr("003:FR-013")
def test_unarchive(api_tokens):
    project = archived(person(api_tokens), "VIEJO")

    response = patch_project(api_tokens, project.id, {"archived": False})

    assert response.status_code == 200
    assert (response.json()["archived"], response.json()["archived_at"]) == (False, None)


@pytest.mark.fr("003:FR-013")
@pytest.mark.fr("003:FR-004")
def test_unarchive_with_a_taken_name_then_with_a_new_name(api_tokens):
    owner = person(api_tokens)
    project = archived(owner, "VENTAS")
    ProjectFactory(owner=owner, name="ventas")

    taken = patch_project(api_tokens, project.id, {"archived": False})
    renamed = patch_project(api_tokens, project.id, {"archived": False, "name": "VENTAS_2025"})

    assert error(taken) == (400, "project_name_taken")
    assert renamed.status_code == 200
    assert (renamed.json()["name"], renamed.json()["archived"]) == ("VENTAS_2025", False)


@pytest.mark.fr("003:FR-015")
def test_patch_on_a_missing_project_is_not_found(api_tokens):
    person(api_tokens)

    response = patch_project(api_tokens, "00000000-0000-4000-8000-000000000000", {"name": "X"})

    assert error(response) == (404, "not_found")
