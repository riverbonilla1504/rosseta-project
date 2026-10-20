"""Proyecto — docs/04-datos/02-diccionario-de-datos.md (projects_project, CD-013).

Implementa FR-001, FR-004 y FR-010 de specs/003-proyectos-y-nucleo-de-datos (ROS-172) y el
aislamiento por propietario en el QuerySet (FR-014, regla B4).
"""

from typing import Any

from django.conf import settings
from django.db import models
from django.db.models.functions import Lower

from apps.core.models import TimeStampedModel, UUIDModel


class Dialect(models.TextChoices):
    """Dialectos SQL del MVP (DP-019). Las etiquetas de la interfaz viven en el frontend."""

    TSQL = "tsql", "SQL Server"
    ORACLE = "oracle", "Oracle"
    POSTGRES = "postgres", "PostgreSQL"


class ProjectQuerySet(models.QuerySet["Project"]):
    def for_user(self, user: Any) -> "ProjectQuerySet":
        return self.filter(owner=user)

    def active(self) -> "ProjectQuerySet":
        return self.filter(archived_at__isnull=True)


class Project(UUIDModel, TimeStampedModel):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="projects"
    )
    # Reservado para multi-tenant (ADR-0004); siempre nulo en el MVP.
    organization_id = models.UUIDField(null=True, blank=True)
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True, default="")
    source_dialect = models.CharField(max_length=20, choices=Dialect.choices)
    archived_at = models.DateTimeField(null=True, blank=True)
    last_activity_at = models.DateTimeField()

    objects = ProjectQuerySet.as_manager()

    class Meta:
        db_table = "projects_project"
        constraints = [
            models.CheckConstraint(
                condition=models.Q(source_dialect__in=Dialect.values),
                name="projects_project_source_dialect_valid",
            ),
            models.UniqueConstraint(
                Lower("name"),
                "owner",
                condition=models.Q(archived_at__isnull=True),
                name="uniq_active_project_name_per_owner",
            ),
        ]
        indexes = [
            models.Index(fields=["owner", "-last_activity_at"], name="projects_owner_activity_idx"),
        ]

    def __str__(self) -> str:
        return str(self.id)

    @property
    def archived(self) -> bool:
        return self.archived_at is not None

    def save(self, *args: Any, **kwargs: Any) -> None:
        # Al crear, la última actividad es la fecha de creación (diccionario, CD-013).
        if self._state.adding and self.last_activity_at is None:
            self.last_activity_at = self.created_at
        super().save(*args, **kwargs)
