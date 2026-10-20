"""Fuentes y reglas de nombres — docs/04-datos/02-diccionario-de-datos.md (sources_*), FR-026.

Enums de tipo y estado; peso de las reglas ≤ 0,40 (Constitución III); regla global con
project_id nulo; único (coalesce(project_id, 'global'), pattern, match_type).
"""

from decimal import Decimal

import pytest
from django.db import IntegrityError, transaction

from apps.projects.models import Project
from apps.sources.models import NamingRule, Source
from tests.factories.accounts import UserFactory
from tests.support import schema
from tests.support.schema import Column as Col

pytestmark = [
    pytest.mark.django_db,
    pytest.mark.story("ROS-81"),
    pytest.mark.fr("003:FR-026"),
]

TS = "timestamp with time zone"


def varchar(length, nullable=False):
    return Col("character varying", length, None, None, nullable)


def plain(data_type, nullable=False):
    return Col(data_type, None, None, None, nullable)


@pytest.fixture
def owner():
    return UserFactory()


@pytest.fixture
def project(owner):
    return Project.objects.create(owner=owner, name="CORE_DEMO", source_dialect="tsql")


def source(project, owner, **extra):
    values = {
        "project": project,
        "kind": "SCHEMA_DDL",
        "status": "PENDING",
        "original_filename": "core.sql",
        "size_bytes": 100,
        "sha256": "b" * 64,
        "uploaded_by": owner,
    }
    values.update(extra)
    return Source.objects.create(**values)


def rule(project=None, **extra):
    values = {"project": project, "pattern": "IMPTE", "match_type": "TOKEN", "meaning": "importe"}
    values.update(extra)
    return NamingRule.objects.create(**values)


def test_source_columns():
    assert schema.columns("sources_source") == {
        "id": plain("uuid"),
        "project_id": plain("uuid"),
        "kind": varchar(20),
        "status": varchar(12),
        "original_filename": varchar(255),
        "storage_path": varchar(500, nullable=True),
        "size_bytes": Col("bigint", None, 64, 0, False),
        "sha256": Col("character", 64, None, None, False),
        "dialect": varchar(20, nullable=True),
        "target_table_id": plain("uuid", nullable=True),
        "encoding": varchar(20, nullable=True),
        "delimiter": varchar(4, nullable=True),
        "stats": plain("jsonb"),
        "error_message": plain("text", nullable=True),
        "evidence_count": Col("integer", None, 32, 0, False),
        "uploaded_by_id": plain("uuid"),
        "processed_at": plain(TS, nullable=True),
        "created_at": plain(TS),
        "updated_at": plain(TS),
    }
    assert schema.foreign_key("sources_source", "target_table_id")[0] == "catalog_table"
    assert schema.foreign_key("sources_source", "uploaded_by_id")[0] == "accounts_user"


def test_naming_rule_columns():
    assert schema.columns("sources_naming_rule") == {
        "id": plain("uuid"),
        "project_id": plain("uuid", nullable=True),
        "pattern": varchar(60),
        "match_type": varchar(10),
        "meaning": varchar(120),
        "semantic_type": varchar(30, nullable=True),
        "weight": Col("numeric", None, 3, 2, False),
        "is_active": plain("boolean"),
        "created_by_id": plain("uuid", nullable=True),
        "created_at": plain(TS),
        "updated_at": plain(TS),
    }


@pytest.mark.parametrize("kind", ["SCHEMA_DDL", "DATA_SAMPLE"])
def test_source_kind_accepts_the_mvp_values(project, owner, kind):
    assert source(project, owner, kind=kind, sha256=kind[0] * 64).kind == kind


def test_source_kind_rejects_other_values(project, owner):
    with pytest.raises(IntegrityError), transaction.atomic():
        source(project, owner, kind="QUERY_LOG")


@pytest.mark.parametrize("status", ["PENDING", "PROCESSING", "READY", "FAILED"])
def test_source_status_accepts_its_values(project, owner, status):
    assert source(project, owner, status=status, sha256=status[0] * 64).status == status


def test_source_status_rejects_other_values(project, owner):
    with pytest.raises(IntegrityError), transaction.atomic():
        source(project, owner, status="DONE")


def test_source_is_unique_per_project_kind_and_hash(project, owner):
    source(project, owner)

    with pytest.raises(IntegrityError), transaction.atomic():
        source(project, owner)


def test_source_defaults(project, owner):
    created = source(project, owner)
    created.refresh_from_db()

    assert created.stats == {}
    assert created.evidence_count == 0


def test_naming_rule_weight_defaults_to_the_maximum(project):
    assert rule(project).weight == Decimal("0.40")


def test_naming_rule_weight_above_040_is_rejected_by_the_database(project):
    with pytest.raises(IntegrityError), transaction.atomic():
        rule(project, weight=Decimal("0.41"))


def test_naming_rule_match_type_is_checked(project):
    for match_type in ("PREFIX", "SUFFIX", "TOKEN", "EXACT", "REGEX"):
        rule(project, match_type=match_type)

    with pytest.raises(IntegrityError), transaction.atomic():
        rule(project, pattern="X", match_type="CONTAINS")


def test_global_rule_has_no_project():
    assert rule().project_id is None


def test_global_rules_are_unique_by_pattern_and_match_type():
    rule()

    with pytest.raises(IntegrityError), transaction.atomic():
        rule()


def test_project_rule_is_unique_within_the_project_but_may_repeat_a_global(project, owner):
    rule()
    rule(project)
    rule(Project.objects.create(owner=owner, name="OTRO", source_dialect="oracle"))

    with pytest.raises(IntegrityError), transaction.atomic():
        rule(project)


def test_deleting_the_project_cascades_to_sources_and_project_rules(project, owner):
    source(project, owner)
    rule(project)
    rule()

    project.delete()

    assert not Source.objects.exists()
    assert list(NamingRule.objects.values_list("project_id", flat=True)) == [None]
