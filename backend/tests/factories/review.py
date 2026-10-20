"""Fábricas de acciones de revisión con datos sintéticos (RNF-38)."""

import factory

from tests.factories.catalog import ColumnFactory


class ReviewActionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "review.ReviewAction"

    column = factory.SubFactory(ColumnFactory)
    project = factory.SelfAttribute("column.project")
    actor = factory.SelfAttribute("project.owner")
    action = "CONFIRM"
    before = factory.LazyFunction(lambda: {"level": "INFERRED"})
    after = factory.LazyFunction(lambda: {"level": "CONFIRMED"})
    engine_version = "fixture"
