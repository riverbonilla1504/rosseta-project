"""Services de proyectos — create_project y touch_activity (research R-05, R-07; data-model.md).

FR-001: nombre recortado de 1 a 120 caracteres y dialecto obligatorio; la persona es la
propietaria; descripción vacía; última actividad = creación. FR-003: lo inválido no crea nada.
FR-004: nombre único entre los activos sin distinguir mayúsculas (los archivados no cuentan).
"""

from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.core.exceptions import ProjectNameTaken
from apps.projects.models import Project
from apps.projects.services import create_project, touch_activity
from tests.factories.accounts import UserFactory
from tests.factories.projects import ProjectFactory

pytestmark = [pytest.mark.django_db, pytest.mark.story("ROS-78")]


@pytest.mark.fr("003:FR-001")
def test_creates_an_active_project_owned_by_the_person():
    owner = UserFactory()

    project = create_project(owner, name="  CORE_PRD  ", source_dialect="oracle")

    project.refresh_from_db()
    assert project.owner == owner
    assert project.name == "CORE_PRD"
    assert project.source_dialect == "oracle"
    assert project.description == ""
    assert project.archived_at is None
    assert project.last_activity_at == project.created_at


@pytest.mark.fr("003:FR-001")
def test_accepts_a_name_of_exactly_120_characters_after_trimming():
    project = create_project(UserFactory(), name=f" {'a' * 120} ", source_dialect="tsql")

    assert len(project.name) == 120


@pytest.mark.fr("003:FR-003")
@pytest.mark.parametrize("name", ["", "   ", "a" * 121, None])
def test_rejects_an_invalid_name_without_creating_anything(name):
    with pytest.raises(ValidationError) as excinfo:
        create_project(UserFactory(), name=name, source_dialect="tsql")

    assert set(excinfo.value.detail) == {"name"}
    assert not Project.objects.exists()


@pytest.mark.fr("003:FR-003")
@pytest.mark.parametrize("dialect", [None, "", "mysql", "TSQL"])
def test_rejects_a_missing_or_unknown_dialect(dialect):
    with pytest.raises(ValidationError) as excinfo:
        create_project(UserFactory(), name="CORE_PRD", source_dialect=dialect)

    assert set(excinfo.value.detail) == {"source_dialect"}
    assert not Project.objects.exists()


@pytest.mark.fr("003:FR-003")
def test_reports_every_invalid_field_at_once():
    with pytest.raises(ValidationError) as excinfo:
        create_project(UserFactory(), name=" ", source_dialect=None)

    assert set(excinfo.value.detail) == {"name", "source_dialect"}


@pytest.mark.fr("003:FR-004")
def test_rejects_a_name_already_used_by_an_active_project_case_insensitive():
    owner = UserFactory()
    create_project(owner, name="core_prd", source_dialect="tsql")

    with pytest.raises(ProjectNameTaken):
        create_project(owner, name=" CORE_PRD ", source_dialect="oracle")

    assert Project.objects.count() == 1


@pytest.mark.fr("003:FR-004")
def test_archived_projects_and_other_people_do_not_count_for_uniqueness():
    owner = UserFactory()
    ProjectFactory(owner=owner, name="CORE_PRD", archived_at=timezone.now())
    ProjectFactory(name="CORE_PRD")

    project = create_project(owner, name="CORE_PRD", source_dialect="tsql")

    assert project.archived_at is None


@pytest.mark.fr("003:FR-004")
def test_a_race_on_the_unique_constraint_is_reported_as_name_taken(monkeypatch):
    """Si otra petición creó el mismo nombre entre la comprobación y la escritura."""
    owner = UserFactory()
    ProjectFactory(owner=owner, name="CORE_PRD")
    from apps.projects import services

    monkeypatch.setattr(services, "_name_taken", lambda *_args: False)

    with pytest.raises(ProjectNameTaken):
        create_project(owner, name="core_prd", source_dialect="tsql")

    assert Project.objects.count() == 1


@pytest.mark.fr("003:FR-005")
def test_touch_activity_moves_last_activity_forward():
    project = ProjectFactory()
    before = project.last_activity_at

    touch_activity(project, at=before + timedelta(minutes=5))

    project.refresh_from_db()
    assert project.last_activity_at == before + timedelta(minutes=5)
