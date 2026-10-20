"""Evidencia, conflictos y acciones de revisión — diccionario de datos y data-model.md.

FR-025: la evidencia no se edita (solo crear y borrar) y siempre lleva su cita (RN-10).
FR-023: las acciones humanas son inmutables en el modelo y en la base (trigger BEFORE
UPDATE OR DELETE). FR-026: columnas, tipos y restricciones del diccionario.
"""

import pytest
from django.db import DatabaseError, IntegrityError, connection, transaction
from django.db.models import ProtectedError
from django.utils import timezone

from apps.catalog.models import Column, Table
from apps.evidence.models import Conflict, Evidence
from apps.projects.models import Project
from apps.review.models import ReviewAction
from apps.sources.models import NamingRule
from tests.factories.accounts import UserFactory
from tests.support import schema
from tests.support.schema import Column as Col

pytestmark = [pytest.mark.django_db, pytest.mark.story("ROS-81")]

TS = "timestamp with time zone"


def varchar(length, nullable=False):
    return Col("character varying", length, None, None, nullable)


def plain(data_type, nullable=False):
    return Col(data_type, None, None, None, nullable)


@pytest.fixture
def graph():
    owner = UserFactory()
    project = Project.objects.create(owner=owner, name="CORE_DEMO", source_dialect="tsql")
    table = Table.objects.create(project=project, schema_name="dbo", name="MOV0010")
    column = Column.objects.create(
        project=project,
        table=table,
        name="IMPTE",
        name_normalized="IMPTE",
        ordinal=1,
        data_type="decimal(15,2)",
        data_type_normalized="decimal(15,2)",
    )
    return {"owner": owner, "project": project, "column": column}


def evidence(graph, **extra):
    values = {
        "project": graph["project"],
        "column": graph["column"],
        "kind": "NAME_CONVENTION",
        "independence_class": "NAME",
        "claim_field": "SEMANTIC_TYPE",
        "claim_value": "AMOUNT",
        "polarity": 1,
        "weight": "0.40",
        "strength": "1.000",
        "citation": {"source_kind": "NAMING_RULE", "locator": {"rule_id": "x"}, "excerpt": "IMPTE"},
    }
    values.update(extra)
    return Evidence.objects.create(**values)


def action(graph, **extra):
    values = {
        "project": graph["project"],
        "column": graph["column"],
        "actor": graph["owner"],
        "action": "CONFIRM",
        "before": {"level": "INFERRED"},
        "after": {"level": "CONFIRMED"},
        "engine_version": "fixture",
    }
    values.update(extra)
    return ReviewAction.objects.create(**values)


@pytest.mark.fr("003:FR-026")
def test_evidence_columns():
    assert schema.columns("evidence_evidence") == {
        "id": plain("uuid"),
        "project_id": plain("uuid"),
        "column_id": plain("uuid"),
        "source_id": plain("uuid", nullable=True),
        "naming_rule_id": plain("uuid", nullable=True),
        "review_action_id": plain("uuid", nullable=True),
        "kind": varchar(30),
        "independence_class": varchar(15),
        "claim_field": varchar(20),
        "claim_value": varchar(260, nullable=True),
        "polarity": Col("smallint", None, 16, 0, False),
        "weight": Col("numeric", None, 3, 2, False),
        "strength": Col("numeric", None, 4, 3, False),
        "citation": plain("jsonb"),
        "format_version": Col("smallint", None, 16, 0, False),
        "created_at": plain(TS),
    }
    assert schema.foreign_key("evidence_evidence", "naming_rule_id")[0] == "sources_naming_rule"
    assert schema.foreign_key("evidence_evidence", "review_action_id")[0] == (
        "review_review_action"
    )


@pytest.mark.fr("003:FR-026")
def test_conflict_columns_and_its_join_table():
    cols = schema.columns("evidence_conflict")

    expected = {
        "id": plain("uuid"),
        "project_id": plain("uuid"),
        "column_id": plain("uuid"),
        "claim_field": varchar(20),
        "values": plain("jsonb"),
        "status": varchar(10),
        "resolution": varchar(20, nullable=True),
        "resolution_note": plain("text", nullable=True),
        "resolved_by_id": plain("uuid", nullable=True),
        "detected_at": plain(TS),
        "resolved_at": plain(TS, nullable=True),
    }
    assert {k: v for k, v in cols.items() if k not in ("created_at", "updated_at")} == expected
    assert {"conflict_id", "evidence_id"} <= set(schema.columns("evidence_conflict_evidences"))


@pytest.mark.fr("003:FR-026")
def test_review_action_columns():
    assert schema.columns("review_review_action") == {
        "id": plain("uuid"),
        "project_id": plain("uuid"),
        "column_id": plain("uuid"),
        "actor_id": plain("uuid"),
        "action": varchar(12),
        "reason": plain("text", nullable=True),
        "before": plain("jsonb"),
        "after": plain("jsonb"),
        "propagated_count": Col("integer", None, 32, 0, False),
        "reverted_count": Col("integer", None, 32, 0, False),
        "engine_version": varchar(20),
        "created_at": plain(TS),
    }


@pytest.mark.fr("003:FR-026")
def test_evidence_enums_are_checked_in_the_database():
    checks = " ".join(schema.check_definitions("evidence_evidence"))

    for value in (
        "NAME_CONVENTION",
        "DDL_TYPE",
        "DDL_CONSTRAINT",
        "DDL_DECLARED_FK",
        "PROFILE_PATTERN",
        "PROFILE_EMPTY",
        "CONTAINMENT",
        "HUMAN_REJECTION",
        "HUMAN_EDIT",
        "NAME",
        "DDL",
        "PROFILE",
        "HUMAN",
        "BUSINESS_NAME",
        "SEMANTIC_TYPE",
        "REFERENCES",
        "NO_INFORMATION",
    ):
        assert value in checks


@pytest.mark.fr("003:FR-025")
def test_evidence_can_be_created_and_deleted(graph):
    created = evidence(graph)
    assert created.format_version == 1

    created.delete()
    assert not Evidence.objects.exists()


@pytest.mark.fr("003:FR-025")
def test_saving_an_existing_evidence_is_rejected(graph):
    created = evidence(graph)
    created.strength = "0.500"

    with pytest.raises(ValueError, match="no se edita"):
        created.save()

    created.refresh_from_db()
    assert str(created.strength) == "1.000"


@pytest.mark.fr("003:FR-025")
@pytest.mark.parametrize("citation", [None, {}])
def test_evidence_requires_a_citation(graph, citation):
    with pytest.raises((IntegrityError, ValueError)), transaction.atomic():
        evidence(graph, citation=citation)

    assert not Evidence.objects.exists()


@pytest.mark.fr("003:FR-025")
def test_deleting_the_naming_rule_cascades_to_its_evidence(graph):
    naming_rule = NamingRule.objects.create(
        project=graph["project"], pattern="IMPTE", match_type="TOKEN", meaning="importe"
    )
    evidence(graph, naming_rule=naming_rule)

    naming_rule.delete()

    assert not Evidence.objects.exists()


@pytest.mark.fr("003:FR-026")
def test_conflict_links_several_evidences(graph):
    first, second = evidence(graph), evidence(graph, claim_value="CODE")
    conflict = Conflict.objects.create(
        project=graph["project"],
        column=graph["column"],
        claim_field="SEMANTIC_TYPE",
        values=[{"value": "AMOUNT"}, {"value": "CODE"}],
        status="OPEN",
        detected_at=timezone.now(),
    )
    conflict.evidences.set([first, second])

    assert set(conflict.evidences.all()) == {first, second}
    with pytest.raises(IntegrityError), transaction.atomic():
        Conflict.objects.create(
            project=graph["project"],
            column=graph["column"],
            claim_field="SEMANTIC_TYPE",
            values=[],
            status="CLOSED",
            detected_at=timezone.now(),
        )


@pytest.mark.fr("003:FR-023")
def test_review_action_cannot_be_updated_from_the_model(graph):
    created = action(graph)
    created.reason = "otro"

    with pytest.raises(ValueError, match="inmutable"):
        created.save()


@pytest.mark.fr("003:FR-023")
def test_review_action_cannot_be_deleted_from_the_model(graph):
    created = action(graph)

    with pytest.raises(ValueError, match="inmutable"):
        created.delete()


@pytest.mark.fr("003:FR-023")
def test_review_action_cannot_be_updated_with_sql(graph):
    created = action(graph)

    with (
        pytest.raises(DatabaseError, match="inmutable"),
        transaction.atomic(),
        connection.cursor() as cursor,
    ):
        cursor.execute("update review_review_action set reason = 'x' where id = %s", [created.id])


@pytest.mark.fr("003:FR-023")
def test_review_action_cannot_be_deleted_with_sql(graph):
    created = action(graph)

    with (
        pytest.raises(DatabaseError, match="inmutable"),
        transaction.atomic(),
        connection.cursor() as cursor,
    ):
        cursor.execute("delete from review_review_action where id = %s", [created.id])

    assert ReviewAction.objects.filter(id=created.id).exists()


@pytest.mark.fr("003:FR-023")
def test_queryset_update_and_delete_are_blocked_by_the_trigger(graph):
    action(graph)

    with pytest.raises(DatabaseError, match="inmutable"), transaction.atomic():
        ReviewAction.objects.update(reason="x")
    with pytest.raises(DatabaseError, match="inmutable"), transaction.atomic():
        ReviewAction.objects.all()._raw_delete(using="default")


@pytest.mark.fr("003:FR-023")
def test_reject_requires_a_reason(graph):
    with pytest.raises(IntegrityError), transaction.atomic():
        action(graph, action="REJECT", reason=None)
    with pytest.raises(IntegrityError), transaction.atomic():
        action(graph, action="REJECT", reason="")

    assert action(graph, action="REJECT", reason="No es un importe").reason


@pytest.mark.fr("003:FR-023")
def test_review_action_kind_is_checked(graph):
    for kind in ("CONFIRM", "EDIT", "REVERT"):
        action(graph, action=kind)

    with pytest.raises(IntegrityError), transaction.atomic():
        action(graph, action="DELETE")


@pytest.mark.fr("003:FR-023")
def test_actor_is_protected(graph):
    action(graph)

    with pytest.raises(ProtectedError):
        graph["owner"].delete()
