"""Fábricas del catálogo con datos sintéticos (RNF-38)."""

import factory
from django.utils import timezone

from tests.factories.projects import ProjectFactory


class TableFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "catalog.Table"

    project = factory.SubFactory(ProjectFactory)
    schema_name = "dbo"
    name = factory.Sequence(lambda n: f"TAB{n:04d}")


class ColumnFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "catalog.Column"

    table = factory.SubFactory(TableFactory)
    project = factory.SelfAttribute("table.project")
    name = factory.Sequence(lambda n: f"COL{n:04d}")
    name_normalized = factory.LazyAttribute(lambda column: column.name.upper())
    ordinal = factory.Sequence(lambda n: n + 1)
    data_type = "varchar(10)"
    data_type_normalized = "varchar(10)"


class ColumnInterpretationFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "catalog.ColumnInterpretation"

    column = factory.SubFactory(ColumnFactory)
    project = factory.SelfAttribute("column.project")
    level = "UNKNOWN"
    origin = "ENGINE"
    engine_version = "fixture"
    computed_at = factory.LazyFunction(timezone.now)


class ColumnProfileFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "catalog.ColumnProfile"

    column = factory.SubFactory(ColumnFactory)
    source = factory.SubFactory(
        "tests.factories.sources.SourceFactory",
        project=factory.SelfAttribute("..column.project"),
        kind="DATA_SAMPLE",
    )
    row_count = 100
    null_count = 0
    null_ratio = 0
    distinct_count = 100
    computed_at = factory.LazyFunction(timezone.now)
