"""Lecturas de proyectos (regla B1: los selectors no escriben).

with_summary añade las cifras de ProjectSummary (contracts/projects-api.yaml) con subconsultas
para no multiplicar filas ni hacer consultas por proyecto. Feature 003, FR-005 (ROS-173).
get_project_state arma el estado al abrir el proyecto (FR-021, FR-022; ROS-177).
"""

from typing import Any

from django.db import models
from django.db.models.functions import Coalesce, Collate, Concat

from apps.catalog.models import Column, ColumnInterpretation, Level, Table
from apps.sources.models import Source

from .models import Project, ProjectQuerySet


def _count(queryset: models.QuerySet[models.Model]) -> Coalesce:
    counted = (
        queryset.filter(project=models.OuterRef("pk"))
        .order_by()
        .values("project")
        .annotate(total=models.Count("pk"))
        .values("total")
    )
    return Coalesce(models.Subquery(counted, output_field=models.IntegerField()), 0)


def with_summary(queryset: ProjectQuerySet) -> ProjectQuerySet:
    """table_count, column_count y confirmed_count (confirmadas directas + propagadas, DP-020)."""
    return queryset.annotate(
        table_count=_count(Table.objects.all()),
        column_count=_count(Column.objects.all()),
        confirmed_count=_count(ColumnInterpretation.objects.filter(level=Level.CONFIRMED)),
    )


def list_projects(user: object, *, archived: bool = False) -> ProjectQuerySet:
    """Proyectos de la persona para GET /api/projects (FR-005; ?archived=true, CD-013).

    Activos por defecto o solo los archivados; orden por última actividad, la más reciente
    primero, y luego id para que la paginación sea estable (05-api §3.10).
    """
    projects = Project.objects.for_user(user)
    projects = projects.filter(archived_at__isnull=not archived)
    return with_summary(projects).order_by("-last_activity_at", "id")


QUEUE_HEAD_SIZE = 50


def _current_level() -> Coalesce:
    """Nivel de la columna; sin interpretación cuenta como UNKNOWN."""
    return Coalesce("interpretation__level", models.Value(Level.UNKNOWN.value))


def get_project_state(project: Project) -> dict[str, Any]:
    """Estado resumido de GET /api/projects/{id}/state (05-api §3.10, research R-09).

    El proyecto llega ya con with_summary. Consultas fijas: cobertura por nivel, fuentes y cabeza
    de la cola; el número no depende del tamaño del proyecto. Orden total y determinista: dos
    lecturas sin cambios devuelven el mismo documento (RNF-16).
    """
    by_level = dict.fromkeys(Level.values, 0)
    counts = (
        Column.objects.filter(project=project)
        .order_by()
        .values(current_level=_current_level())
        .annotate(n=models.Count("id"))
    )
    for row in counts:
        by_level[row["current_level"]] = row["n"]

    sources = Source.objects.filter(project=project).order_by("created_at", "id")
    # Cola de 05-api §3.6: sin CONFIRMED; impacto desc, conflicto abierto desc, TABLA.COLUMNA asc
    # (con la intercalación "C" para que el desempate no dependa de la de la base).
    queue = (
        Column.objects.filter(project=project)
        # Excluye CONFIRMED y conserva las columnas sin interpretación (nivel nulo).
        .exclude(interpretation__level=Level.CONFIRMED)
        .annotate(
            current_level=_current_level(),
            identifier=Concat("table__name", models.Value("."), "name"),
            current_impact=Coalesce("interpretation__impact", 0),
            open_conflict=Coalesce("interpretation__has_open_conflict", False),
        )
        .order_by("-current_impact", "-open_conflict", Collate("identifier", "C"))
        .values("id", "identifier", "current_level", "current_impact", "open_conflict")
    )
    return {
        "project": project,
        "coverage": {"total_columns": sum(by_level.values()), "by_level": by_level},
        "sources": list(sources),
        "table_count": project.table_count,  # type: ignore[attr-defined]
        "queue_head": [
            {
                "column_id": row["id"],
                "identifier": row["identifier"],
                "level": row["current_level"],
                "impact": row["current_impact"],
                "has_open_conflict": row["open_conflict"],
            }
            for row in queue[:QUEUE_HEAD_SIZE]
        ],
    }
