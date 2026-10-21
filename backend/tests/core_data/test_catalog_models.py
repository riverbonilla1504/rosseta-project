"""Catálogo — docs/04-datos/02-diccionario-de-datos.md (catalog_*), sin desviaciones (FR-026).

Columnas, tipos y nulabilidad de las cuatro tablas; CHECK de RN-02 (CONFIRMED ⇔ acción);
perfil único por (columna, fuente); interpretación 1:1; cascadas desde proyecto y tabla.
"""

import pytest
from django.db import IntegrityError, transaction
from django.utils import timezone

from apps.catalog.models import Column, ColumnInterpretation, ColumnProfile, Table
from apps.projects.models import Project
from apps.review.models import ReviewAction
from apps.sources.models import Source
from tests.factories.accounts import UserFactory
from tests.support import schema
from tests.support.schema import Column as Col

pytestmark = [
    pytest.mark.django_db,
    pytest.mark.story("ROS-81"),
    pytest.mark.fr("003:FR-026"),
]

TS = "timestamp with time zone"
VARCHAR = "character varying"


def varchar(length, nullable=False):
    return Col(VARCHAR, length, None, None, nullable)


def plain(data_type, nullable=False):
    return Col(data_type, None, None, None, nullable)


def numeric(precision, scale, nullable=False):
    return Col("numeric", None, precision, scale, nullable)


def integer(nullable=False):
    return Col("integer", None, 32, 0, nullable)


def bigint(nullable=False):
    return Col("bigint", None, 64, 0, nullable)


@pytest.fixture
def graph():
    owner = UserFactory()
    project = Project.objects.create(owner=owner, name="CORE_DEMO", source_dialect="tsql")
    table = Table.objects.create(project=project, schema_name="dbo", name="MOV0010")
    column = Column.objects.create(
        project=project,
        table=table,
        name="CTANRO",
        name_normalized="CTANRO",
        ordinal=1,
        data_type="decimal(9,0)",
        data_type_normalized="decimal(9,0)",
    )
    source = Source.objects.create(
        project=project,
        kind="DATA_SAMPLE",
        status="READY",
        original_filename="mov0010.csv",
        size_bytes=10,
        sha256="a" * 64,
        uploaded_by=owner,
    )
    return {"owner": owner, "project": project, "table": table, "column": column, "source": source}


def interpretation(graph, **extra):
    values = {
        "column": graph["column"],
        "project": graph["project"],
        "description": "",
        "level": "UNKNOWN",
        "score_breakdown": [],
        "origin": "ENGINE",
        "impact": 0,
        "engine_version": "fixture",
        "computed_at": timezone.now(),
    }
    values.update(extra)
    return ColumnInterpretation.objects.create(**values)


def test_catalog_table_columns():
    assert schema.columns("catalog_table") == {
        "id": plain("uuid"),
        "project_id": plain("uuid"),
        "schema_name": varchar(128),
        "name": varchar(128),
        "business_name": varchar(200, nullable=True),
        "row_count": bigint(nullable=True),
        "column_count": integer(),
        "has_declared_fks": plain("boolean"),
        "first_source_id": plain("uuid", nullable=True),
        "created_at": plain(TS),
        "updated_at": plain(TS),
    }
    assert schema.foreign_key("catalog_table", "project_id")[0] == "projects_project"
    assert schema.foreign_key("catalog_table", "first_source_id")[0] == "sources_source"


def test_catalog_column_columns():
    assert schema.columns("catalog_column") == {
        "id": plain("uuid"),
        "project_id": plain("uuid"),
        "table_id": plain("uuid"),
        "name": varchar(128),
        "name_normalized": varchar(128),
        "ordinal": integer(),
        "data_type": varchar(60),
        "data_type_normalized": varchar(60),
        "type_length": integer(nullable=True),
        "type_precision": integer(nullable=True),
        "type_scale": integer(nullable=True),
        "is_nullable": plain("boolean"),
        "is_primary_key": plain("boolean"),
        "is_unique": plain("boolean"),
        "declared_fk_target": varchar(260, nullable=True),
        "default_expression": varchar(200, nullable=True),
        "is_pii": plain("boolean"),
        "created_at": plain(TS),
        "updated_at": plain(TS),
    }
    assert schema.foreign_key("catalog_column", "table_id")[0] == "catalog_table"


def test_catalog_column_interpretation_columns():
    cols = schema.columns("catalog_column_interpretation")

    expected = {
        "id": plain("uuid"),
        "column_id": plain("uuid"),
        "project_id": plain("uuid"),
        "business_name": varchar(200, nullable=True),
        "description": plain("text"),
        "semantic_type": varchar(30, nullable=True),
        "references_column_id": plain("uuid", nullable=True),
        "level": varchar(20),
        "score": numeric(4, 3, nullable=True),
        "score_breakdown": plain("jsonb"),
        "origin": varchar(12),
        "confirmed_by_action_id": plain("uuid", nullable=True),
        "confirmed_by_id": plain("uuid", nullable=True),
        "confirmed_at": plain(TS, nullable=True),
        "has_open_conflict": plain("boolean"),
        "impact": integer(),
        "engine_version": varchar(20),
        "computed_at": plain(TS),
        "updated_at": plain(TS),
    }
    # created_at: convención común (data-model.md, "Convenciones").
    assert {k: v for k, v in cols.items() if k != "created_at"} == expected
    assert schema.foreign_key("catalog_column_interpretation", "confirmed_by_action_id")[0] == (
        "review_review_action"
    )
    assert schema.foreign_key("catalog_column_interpretation", "references_column_id")[0] == (
        "catalog_column"
    )


def test_catalog_column_profile_columns():
    cols = schema.columns("catalog_column_profile")

    expected = {
        "id": plain("uuid"),
        "column_id": plain("uuid"),
        "source_id": plain("uuid"),
        "row_count": bigint(),
        "null_count": bigint(),
        "null_ratio": numeric(6, 5),
        "distinct_count": bigint(),
        "min_value": varchar(200, nullable=True),
        "max_value": varchar(200, nullable=True),
        "top_values": plain("jsonb"),
        "histogram": plain("jsonb", nullable=True),
        "detected_pattern": varchar(30, nullable=True),
        "out_of_catalog_count": bigint(nullable=True),
        "stats": plain("jsonb"),
        "computed_at": plain(TS),
    }
    assert {k: v for k, v in cols.items() if k not in ("created_at", "updated_at")} == expected


def test_enums_are_checked_in_the_database():
    checks = " ".join(schema.check_definitions("catalog_column_interpretation"))

    for value in ("CONFIRMED", "HIGH_UNVALIDATED", "INFERRED", "HYPOTHESIS", "UNKNOWN"):
        assert value in checks
    for value in ("ENGINE", "HUMAN", "PROPAGATION", "HUMAN_EDIT"):
        assert value in checks


def test_confirmed_level_requires_a_review_action(graph):
    with pytest.raises(IntegrityError), transaction.atomic():
        interpretation(graph, level="CONFIRMED")


def test_review_action_is_only_allowed_with_confirmed_level(graph):
    action = ReviewAction.objects.create(
        project=graph["project"],
        column=graph["column"],
        actor=graph["owner"],
        action="CONFIRM",
        before={},
        after={},
        engine_version="fixture",
    )

    with pytest.raises(IntegrityError), transaction.atomic():
        interpretation(graph, level="INFERRED", confirmed_by_action=action)

    confirmed = interpretation(graph, level="CONFIRMED", confirmed_by_action=action)
    assert confirmed.level == "CONFIRMED"


def test_interpretation_is_one_to_one_with_the_column(graph):
    interpretation(graph)

    with pytest.raises(IntegrityError), transaction.atomic():
        interpretation(graph)


def test_profile_is_unique_per_column_and_source(graph):
    values = {
        "column": graph["column"],
        "source": graph["source"],
        "row_count": 10,
        "null_count": 0,
        "null_ratio": 0,
        "distinct_count": 10,
        "top_values": [],
        "stats": {},
        "computed_at": timezone.now(),
    }
    ColumnProfile.objects.create(**values)

    with pytest.raises(IntegrityError), transaction.atomic():
        ColumnProfile.objects.create(**values)


def test_deleting_the_table_cascades_to_columns_and_their_children(graph):
    interpretation(graph)

    graph["table"].delete()

    assert not Column.objects.exists()
    assert not ColumnInterpretation.objects.exists()


def test_deleting_the_project_cascades_to_the_catalog(graph):
    graph["project"].delete()

    assert not Table.objects.exists()
    assert not Column.objects.exists()


def test_deleting_the_source_cascades_to_profiles_but_not_to_tables(graph):
    graph["table"].first_source = graph["source"]
    graph["table"].save()
    ColumnProfile.objects.create(
        column=graph["column"],
        source=graph["source"],
        row_count=1,
        null_count=0,
        null_ratio=0,
        distinct_count=1,
        top_values=[],
        stats={},
        computed_at=timezone.now(),
    )

    graph["source"].delete()

    assert not ColumnProfile.objects.exists()
    graph["table"].refresh_from_db()
    assert graph["table"].first_source is None


def test_priority_queue_index_exists():
    indexes = " ".join(schema.index_definitions("catalog_column_interpretation")).lower()

    assert "(project_id, level, impact desc)" in indexes
