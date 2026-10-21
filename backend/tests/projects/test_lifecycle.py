"""Renombrar, archivar y desarchivar — research R-08 de la feature 003 (tras CD-013; ROS-173).

FR-010: el dialecto no cambia. FR-011: renombrar con las reglas de FR-001/FR-003/FR-004 y
cambiar la descripción. FR-012: archivar fija archived_at y conserva todo. FR-013: un archivado
es de solo lectura (ensure_project_writable) salvo desarchivar; con el nombre ocupado se pide
otro. FR-024: desarchivar con renombre es de todo o nada.
"""

from datetime import timedelta
from unittest.mock import patch

import pytest
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.core.exceptions import ProjectArchived, ProjectNameTaken
from apps.projects.models import Project
from apps.projects.services import (
    archive_project,
    ensure_project_writable,
    rename_project,
    unarchive_project,
)
from tests.factories.catalog import ColumnFactory, TableFactory
from tests.factories.projects import ProjectFactory

pytestmark = [pytest.mark.django_db, pytest.mark.story("ROS-78")]


def an_hour_ago():
    return timezone.now() - timedelta(hours=1)


def stale_project(**kwargs):
    return ProjectFactory(last_activity_at=an_hour_ago(), **kwargs)


def archived_project(**kwargs):
    return stale_project(archived_at=an_hour_ago(), **kwargs)


def reloaded(project):
    return Project.objects.get(pk=project.pk)


@pytest.mark.fr("003:FR-011")
def test_rename_trims_the_name_and_moves_the_last_activity():
    project = stale_project(name="CORE_PRD")
    before = project.last_activity_at

    rename_project(project, name="  CORE_PRD_2026  ")

    project = reloaded(project)
    assert project.name == "CORE_PRD_2026"
    assert project.last_activity_at > before


@pytest.mark.fr("003:FR-011")
@pytest.mark.parametrize("name", ["", "   ", "a" * 121, None])
def test_rename_rejects_an_invalid_name_without_changes(name):
    project = stale_project(name="CORE_PRD")

    with pytest.raises(ValidationError) as excinfo:
        rename_project(project, name=name)

    assert set(excinfo.value.detail) == {"name"}
    assert reloaded(project).name == "CORE_PRD"


@pytest.mark.fr("003:FR-004")
def test_rename_rejects_a_name_used_by_another_active_project_case_insensitive():
    project = stale_project(name="VENTAS")
    ProjectFactory(owner=project.owner, name="CORE_PRD")

    with pytest.raises(ProjectNameTaken):
        rename_project(project, name="core_prd")

    assert reloaded(project).name == "VENTAS"


@pytest.mark.fr("003:FR-004")
def test_rename_to_its_own_name_in_other_case_and_to_an_archived_name_is_allowed():
    project = stale_project(name="ventas")
    archived_project(owner=project.owner, name="HISTORICO")

    rename_project(project, name="VENTAS")
    rename_project(project, name="historico")

    assert reloaded(project).name == "historico"


@pytest.mark.fr("003:FR-011")
def test_change_the_description():
    project = stale_project(description="")

    rename_project(project, description="Base de movimientos")

    project = reloaded(project)
    assert project.description == "Base de movimientos"
    assert project.last_activity_at > an_hour_ago()


@pytest.mark.fr("003:FR-010")
def test_the_dialect_cannot_be_changed_by_the_services():
    project = stale_project(source_dialect="tsql")

    with pytest.raises(TypeError):
        rename_project(project, source_dialect="oracle")  # type: ignore[call-arg]

    assert reloaded(project).source_dialect == "tsql"


@pytest.mark.fr("003:FR-012")
def test_archive_sets_archived_at_moves_activity_and_keeps_the_content():
    project = stale_project()
    table = TableFactory(project=project)
    ColumnFactory(table=table)
    before = project.last_activity_at

    archive_project(project)

    project = reloaded(project)
    assert project.archived_at is not None
    assert project.last_activity_at > before
    assert project.tables.count() == 1
    assert project.columns.count() == 1


@pytest.mark.fr("003:FR-013")
def test_an_archived_project_rejects_every_change_except_unarchiving():
    project = archived_project(name="VIEJO")

    with pytest.raises(ProjectArchived):
        ensure_project_writable(project)
    with pytest.raises(ProjectArchived):
        rename_project(project, name="NUEVO")
    with pytest.raises(ProjectArchived):
        rename_project(project, description="x")
    with pytest.raises(ProjectArchived):
        archive_project(project)

    assert reloaded(project).name == "VIEJO"
    ensure_project_writable(stale_project())  # un activo admite cambios


@pytest.mark.fr("003:FR-013")
def test_unarchive_with_a_free_name_reactivates_it():
    project = archived_project(name="VIEJO")
    before = project.last_activity_at

    unarchive_project(project)

    project = reloaded(project)
    assert project.archived_at is None
    assert project.name == "VIEJO"
    assert project.last_activity_at > before


@pytest.mark.fr("003:FR-013")
@pytest.mark.fr("003:FR-004")
def test_unarchive_with_a_taken_name_is_name_taken_and_changes_nothing():
    project = archived_project(name="VENTAS")
    ProjectFactory(owner=project.owner, name="ventas")

    with pytest.raises(ProjectNameTaken):
        unarchive_project(project)

    assert reloaded(project).archived_at is not None


@pytest.mark.fr("003:FR-013")
def test_unarchive_with_a_new_name_renames_and_reactivates():
    project = archived_project(name="VENTAS")
    ProjectFactory(owner=project.owner, name="VENTAS")

    unarchive_project(project, name=" VENTAS_2025 ")

    project = reloaded(project)
    assert (project.name, project.archived_at) == ("VENTAS_2025", None)


@pytest.mark.fr("003:FR-013")
def test_unarchive_with_an_invalid_new_name_changes_nothing():
    project = archived_project(name="VENTAS")

    with pytest.raises(ValidationError):
        unarchive_project(project, name="  ")

    assert reloaded(project).archived_at is not None


@pytest.mark.story("ROS-81")
@pytest.mark.fr("003:FR-024")
def test_unarchive_with_rename_is_all_or_nothing():
    project = archived_project(name="VENTAS")

    with (
        patch("apps.projects.services.touch_activity", side_effect=RuntimeError("fallo")),
        pytest.raises(RuntimeError),
    ):
        unarchive_project(project, name="VENTAS_2025")

    project = reloaded(project)
    assert project.name == "VENTAS"
    assert project.archived_at is not None
