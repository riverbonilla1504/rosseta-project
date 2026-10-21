"""Aislamiento en el QuerySet — FR-014 (RN-24; regla B4 de docs/03-arquitectura/03-backend.md).

Para cada modelo con datos de cliente, for_user(A) nunca devuelve filas de B. La lista de
modelos sale de las apps del núcleo de datos: un modelo nuevo sin caso hace fallar la prueba.
Las reglas de nombres globales (project nulo) se ven, en solo lectura, desde todo proyecto.
"""

import pytest
from django.apps import apps

from apps.sources.models import NamingRule
from tests.factories.catalog import (
    ColumnFactory,
    ColumnInterpretationFactory,
    ColumnProfileFactory,
)
from tests.factories.evidence import ConflictFactory, EvidenceFactory
from tests.factories.projects import ProjectFactory
from tests.factories.review import ReviewActionFactory
from tests.factories.sources import NamingRuleFactory, SourceFactory

pytestmark = [pytest.mark.django_db, pytest.mark.story("ROS-84"), pytest.mark.fr("003:FR-014")]

CLIENT_APPS = ("projects", "catalog", "sources", "evidence", "review")


def build_project_graph():
    """Un proyecto con una fila de cada modelo de cliente."""
    project = ProjectFactory()
    column = ColumnFactory(table__project=project)
    ColumnInterpretationFactory(column=column)
    ColumnProfileFactory(column=column)
    SourceFactory(project=project)
    NamingRuleFactory(project=project)
    evidence = EvidenceFactory(column=column)
    ConflictFactory(column=column).evidences.add(evidence)
    ReviewActionFactory(column=column)
    return project


def client_models():
    return [model for label in CLIENT_APPS for model in apps.get_app_config(label).get_models()]


def owner_of(row):
    if hasattr(row, "owner_id"):
        return row.owner_id
    project = getattr(row, "project", None)
    if project is None and hasattr(row, "column"):
        project = row.column.project
    return project.owner_id if project is not None else None


def test_every_client_model_exposes_for_user():
    missing = [
        model.__name__ for model in client_models() if not hasattr(model.objects, "for_user")
    ]

    assert missing == []


@pytest.mark.parametrize("model", client_models(), ids=lambda model: model.__name__)
def test_for_user_never_returns_rows_of_another_person(model):
    project_a = build_project_graph()
    project_b = build_project_graph()
    NamingRuleFactory()  # global

    rows_a = list(model.objects.for_user(project_a.owner))
    rows_b = list(model.objects.for_user(project_b.owner))

    assert rows_a, f"{model.__name__}: A debe ver sus propias filas"
    assert {owner_of(row) for row in rows_a} <= {project_a.owner_id, None}
    assert {owner_of(row) for row in rows_b} <= {project_b.owner_id, None}
    assert not {row.pk for row in rows_a} & {row.pk for row in rows_b} - {
        rule.pk for rule in NamingRule.objects.filter(project__isnull=True)
    }


def test_naming_rules_for_user_are_own_project_rules_plus_globals():
    project_a = build_project_graph()
    build_project_graph()
    global_rule = NamingRuleFactory()

    visible = set(NamingRule.objects.for_user(project_a.owner))

    assert visible == set(NamingRule.objects.filter(project=project_a)) | {global_rule}


def test_for_user_without_a_person_returns_nothing():
    build_project_graph()

    for model in client_models():
        assert not model.objects.for_user(None).exists(), model.__name__
