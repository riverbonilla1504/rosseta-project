"""Fábricas de fuentes y reglas de nombres con datos sintéticos (RNF-38)."""

import factory

from tests.factories.projects import ProjectFactory


class SourceFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = "sources.Source"

    project = factory.SubFactory(ProjectFactory)
    kind = "SCHEMA_DDL"
    status = "READY"
    original_filename = factory.Sequence(lambda n: f"fuente{n}.sql")
    size_bytes = 100
    sha256 = factory.Sequence(lambda n: f"{n:064x}")
    uploaded_by = factory.SelfAttribute("project.owner")


class NamingRuleFactory(factory.django.DjangoModelFactory):
    """Regla global (project=None) salvo que se indique un proyecto."""

    class Meta:
        model = "sources.NamingRule"

    project = None
    pattern = factory.Sequence(lambda n: f"PAT{n}")
    match_type = "TOKEN"
    meaning = "significado"
