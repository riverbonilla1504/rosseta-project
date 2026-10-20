"""Fábricas de projects con datos sintéticos (RNF-38; docs/04-datos/03-datos-de-referencia.md)."""

import factory

from tests.factories.accounts import UserFactory


class ProjectFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "projects.Project"

    owner = factory.SubFactory(UserFactory)
    name = factory.Sequence(lambda n: f"PROYECTO_{n}")
    source_dialect = "tsql"
