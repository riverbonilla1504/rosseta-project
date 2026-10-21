"""Modelos base abstractos — docs/03-arquitectura/03-backend.md §3 y diccionario de datos.

Convenciones comunes a todas las tablas: id UUID v4 generado por la aplicación (RNF-04) y
created_at / updated_at en UTC (USE_TZ). Feature 003, research R-02 (ROS-175).
"""

import uuid
from typing import Any, Self

from django.db import models
from django.utils import timezone


class OwnedQuerySet(models.QuerySet[Any]):
    """Aislamiento por propietario en el QuerySet (regla B4; FR-014 de la feature 003).

    Cada modelo de cliente declara owner_path, el camino hasta el propietario del proyecto.
    Sin persona (None o anónima) no devuelve nada.
    """

    owner_path = "project__owner"

    def for_user(self, user: Any) -> Self:
        if user is None or not getattr(user, "is_authenticated", False):
            return self.none()
        return self.filter(**{self.owner_path: user})


class UUIDModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Meta:
        abstract = True


def enum_check(
    field: str, choices: type[models.TextChoices], name: str, *, nullable: bool = False
) -> models.CheckConstraint:
    """CHECK de un enum guardado como varchar (convención del diccionario de datos)."""
    condition = models.Q(**{f"{field}__in": choices.values})
    if nullable:
        condition |= models.Q(**{f"{field}__isnull": True})
    return models.CheckConstraint(condition=condition, name=name)


class TimeStampedModel(models.Model):
    # default (no auto_now_add): el valor existe desde que se instancia el modelo, para que
    # otros campos puedan copiarlo en el mismo INSERT (Project.last_activity_at = created_at).
    created_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
