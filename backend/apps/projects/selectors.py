"""Lecturas de proyectos (regla B1: los selectors no escriben).

with_summary añade las cifras de ProjectSummary (contracts/projects-api.yaml) con subconsultas
para no multiplicar filas ni hacer consultas por proyecto. Feature 003, FR-005 (ROS-173).
"""

from django.db import models
from django.db.models.functions import Coalesce

from apps.catalog.models import Column, ColumnInterpretation, Level, Table

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
