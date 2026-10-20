"""projects_project — docs/04-datos/02-diccionario-de-datos.md (tras CD-013) y data-model.md.

FR-001 (nombre y dialecto obligatorios), FR-004 (nombre único entre activos sin distinguir
mayúsculas, D2) y FR-010 (dialecto de una lista cerrada). Datos sintéticos.
"""

import pytest
from django.db import IntegrityError, transaction
from django.db.models import ProtectedError
from django.utils import timezone

from apps.projects.models import Project
from tests.factories.accounts import UserFactory
from tests.support import schema

pytestmark = [pytest.mark.django_db, pytest.mark.story("ROS-78")]

TABLE = "projects_project"


def make(owner, name="CORE_PRD", dialect="tsql", **extra):
    return Project.objects.create(owner=owner, name=name, source_dialect=dialect, **extra)


@pytest.mark.fr("003:FR-001")
def test_columns_match_the_data_dictionary():
    cols = schema.columns(TABLE)

    assert set(cols) == {
        "id",
        "owner_id",
        "organization_id",
        "name",
        "description",
        "source_dialect",
        "archived_at",
        "last_activity_at",
        "created_at",
        "updated_at",
    }
    assert cols["id"] == schema.Column("uuid", None, None, None, False)
    assert cols["owner_id"].data_type == "uuid" and not cols["owner_id"].nullable
    assert cols["organization_id"] == schema.Column("uuid", None, None, None, True)
    assert cols["name"] == schema.Column("character varying", 120, None, None, False)
    assert cols["description"] == schema.Column("text", None, None, None, False)
    assert cols["source_dialect"] == schema.Column("character varying", 20, None, None, False)
    for name in ("archived_at",):
        assert cols[name].data_type == "timestamp with time zone" and cols[name].nullable
    for name in ("last_activity_at", "created_at", "updated_at"):
        assert cols[name].data_type == "timestamp with time zone" and not cols[name].nullable
    assert schema.foreign_key(TABLE, "owner_id")[0] == "accounts_user"


@pytest.mark.fr("003:FR-001")
def test_defaults_on_create():
    project = make(UserFactory())
    project.refresh_from_db()

    assert project.description == ""
    assert project.organization_id is None
    assert project.archived_at is None
    assert project.last_activity_at == project.created_at


@pytest.mark.fr("003:FR-010")
def test_source_dialect_is_a_closed_list_checked_in_the_database():
    owner = UserFactory()
    for dialect in ("tsql", "oracle", "postgres"):
        make(owner, name=f"p-{dialect}", dialect=dialect)

    with pytest.raises(IntegrityError), transaction.atomic():
        make(owner, name="otro", dialect="mysql")


@pytest.mark.fr("003:FR-001")
def test_owner_is_protected():
    owner = UserFactory()
    make(owner)

    with pytest.raises(ProtectedError):
        owner.delete()


@pytest.mark.fr("003:FR-004")
def test_name_is_unique_among_active_projects_case_insensitive():
    owner = UserFactory()
    make(owner, name="core_prd")

    with pytest.raises(IntegrityError), transaction.atomic():
        make(owner, name="CORE_PRD")


@pytest.mark.fr("003:FR-004")
def test_same_name_is_allowed_when_archived_or_owned_by_someone_else():
    owner = UserFactory()
    make(owner, name="core_prd", archived_at=timezone.now())

    make(owner, name="CORE_PRD")
    make(UserFactory(), name="CORE_PRD")

    assert Project.objects.filter(name__iexact="core_prd").count() == 3


@pytest.mark.fr("003:FR-004")
def test_partial_unique_constraint_and_activity_index_exist():
    indexes = " ".join(schema.index_definitions(TABLE)).lower()

    assert "unique index" in indexes
    assert "lower((name)::text)" in indexes
    assert "where (archived_at is null)" in indexes
    assert "(owner_id, last_activity_at desc)" in indexes
