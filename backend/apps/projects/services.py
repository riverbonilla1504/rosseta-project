"""Services de proyectos (regla B1 de docs/03-arquitectura/03-backend.md).

Implementa FR-001, FR-003 y FR-004 (create_project) y FR-005 (touch_activity) de
specs/003-proyectos-y-nucleo-de-datos (ROS-173), según research R-05 y R-07.
"""

from datetime import datetime
from typing import Any

from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.core.exceptions import ProjectNameTaken

from . import messages
from .models import Dialect, Project

NAME_MAX_LENGTH = 120


def _clean_name(value: Any) -> str:
    """Recorta el nombre; lanza la lista de errores del campo si no es válido."""
    name = value.strip() if isinstance(value, str) else ""
    if not name:
        raise ValueError(messages.NAME_REQUIRED)
    if len(name) > NAME_MAX_LENGTH:
        raise ValueError(messages.NAME_TOO_LONG)
    return name


def _name_taken(owner: Any, name: str, exclude_id: Any = None) -> bool:
    """Choque con un proyecto activo de la misma persona, sin distinguir mayúsculas (FR-004)."""
    clash = Project.objects.for_user(owner).active().filter(name__iexact=name)
    if exclude_id is not None:
        clash = clash.exclude(id=exclude_id)
    return clash.exists()


def create_project(owner: Any, name: Any, source_dialect: Any) -> Project:
    """Crea un proyecto activo, sin fuentes y con la descripción vacía (FR-001).

    Valida todos los campos a la vez (FR-003). La comprobación previa da el error claro y la
    restricción única parcial es la garantía: si dos peticiones compiten, el IntegrityError se
    traduce al mismo project_name_taken (research R-05).
    """
    errors: dict[str, list[str]] = {}
    try:
        clean_name = _clean_name(name)
    except ValueError as exc:
        errors["name"] = [str(exc)]
    if source_dialect not in Dialect.values:
        errors["source_dialect"] = [messages.DIALECT_REQUIRED]
    if errors:
        raise ValidationError(errors)

    if _name_taken(owner, clean_name):
        raise ProjectNameTaken()
    try:
        with transaction.atomic():
            return Project.objects.create(
                owner=owner, name=clean_name, source_dialect=source_dialect
            )
    except IntegrityError:
        raise ProjectNameTaken() from None


def touch_activity(project: Project, at: datetime | None = None) -> None:
    """Marca la última actividad del proyecto (research R-07).

    Se llama dentro de la transacción de cada cambio del proyecto o de su contenido; leer o
    abrir el proyecto no la toca.
    """
    project.last_activity_at = at or timezone.now()
    project.save(update_fields=["last_activity_at", "updated_at"])
