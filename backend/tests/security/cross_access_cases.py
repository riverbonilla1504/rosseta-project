"""Registro de casos de la suite de acceso cruzado (research R-04 de la feature 003; ROS-178).

Cada operación de la API con un parámetro de ruta necesita aquí un caso: el método, la ruta tal
como la publica el esquema OpenAPI, cómo construir el recurso de la persona A (devuelve los
valores de los parámetros de ruta) y el cuerpo que manda la persona B. Una operación nueva sin
caso hace fallar tests/security/test_cross_access.py (FR-018).
"""

from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any

from apps.projects.models import Project
from tests.factories.catalog import (
    ColumnFactory,
    ColumnInterpretationFactory,
    ColumnProfileFactory,
    TableFactory,
)
from tests.factories.evidence import ConflictFactory, EvidenceFactory
from tests.factories.projects import ProjectFactory
from tests.factories.review import ReviewActionFactory
from tests.factories.sources import NamingRuleFactory, SourceFactory


@dataclass(frozen=True)
class CrossAccessCase:
    method: str
    path: str
    build: Callable[[Any], dict[str, str]]
    body: dict[str, Any] = field(default_factory=dict)


def seed_everything(owner: Any) -> Project:
    """Un proyecto activo con contenido en todas las tablas de cliente y otro archivado."""
    project = ProjectFactory(owner=owner, name="SECRETO_DE_ANA")
    table = TableFactory(project=project, name="MOVSECRETO")
    column = ColumnFactory(table=table, name="CTASECRETA", name_normalized="CTASECRETA")
    ColumnInterpretationFactory(column=column)
    ColumnProfileFactory(column=column)
    SourceFactory(project=project, original_filename="secreto.sql")
    NamingRuleFactory(project=project, pattern="SECR")
    EvidenceFactory(column=column)
    ConflictFactory(column=column)
    ReviewActionFactory(column=column)
    ProjectFactory(owner=owner, name="ARCHIVO_DE_ANA", archived_at=project.created_at)
    return project


def project_of(owner: Any) -> dict[str, str]:
    return {"project_id": str(seed_everything(owner).id)}


CROSS_ACCESS_CASES: list[CrossAccessCase] = [
    CrossAccessCase("GET", "/api/projects/{project_id}", project_of),
]
