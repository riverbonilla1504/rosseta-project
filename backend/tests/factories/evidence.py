"""Fábricas de evidencia y conflictos con datos sintéticos (RNF-38)."""

import factory
from django.utils import timezone

from tests.factories.catalog import ColumnFactory


class EvidenceFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "evidence.Evidence"

    column = factory.SubFactory(ColumnFactory)
    project = factory.SelfAttribute("column.project")
    kind = "DDL_TYPE"
    independence_class = "DDL"
    claim_field = "SEMANTIC_TYPE"
    claim_value = "CODE"
    polarity = 1
    weight = "0.30"
    strength = "1.000"
    citation = factory.LazyAttribute(
        lambda evidence: {
            "source_kind": "SCHEMA_DDL",
            "locator": {"file": "core.sql", "line": 1},
            "excerpt": evidence.column.name,
        }
    )


class ConflictFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "evidence.Conflict"

    column = factory.SubFactory(ColumnFactory)
    project = factory.SelfAttribute("column.project")
    claim_field = "SEMANTIC_TYPE"
    status = "OPEN"
    detected_at = factory.LazyFunction(timezone.now)
