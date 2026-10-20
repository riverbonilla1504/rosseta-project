"""Services de proyectos (regla B1 de docs/03-arquitectura/03-backend.md).

Implementa FR-001, FR-003 y FR-004 (create_project), FR-005 (touch_activity) y FR-010…FR-013
(rename_project, archive_project, unarchive_project y la guarda ensure_project_writable) de
specs/003-proyectos-y-nucleo-de-datos (ROS-173), según research R-05, R-07 y R-08.
"""

from datetime import datetime
from typing import Any

from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.core.exceptions import ProjectArchived, ProjectNameTaken

from . import messages
from .models import Dialect, Project

NAME_MAX_LENGTH = 120
# Distingue "no se envió el campo" de un valor nulo.
UNSET: Any = object()


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


def ensure_project_writable(project: Project) -> None:
    """Guarda de solo lectura (FR-013, research R-08): un archivado no admite cambios.

    La usan todos los services que escriben en el proyecto o en su contenido, también los de
    las features siguientes; desarchivar es la única excepción.
    """
    if project.archived:
        raise ProjectArchived()


@transaction.atomic
def rename_project(project: Project, *, name: Any = UNSET, description: Any = UNSET) -> Project:
    """Cambia el nombre (reglas de FR-001, FR-003 y FR-004) y/o la descripción (FR-011)."""
    ensure_project_writable(project)
    fields = []
    if name is not UNSET:
        try:
            clean_name = _clean_name(name)
        except ValueError as exc:
            raise ValidationError({"name": [str(exc)]}) from None
        if _name_taken(project.owner, clean_name, exclude_id=project.id):
            raise ProjectNameTaken()
        project.name = clean_name
        fields.append("name")
    if description is not UNSET:
        # La forma (texto, no nulo) la valida el serializer de PATCH; aquí no hay más reglas.
        project.description = description
        fields.append("description")
    if fields:
        _save_guarding_name(project, fields)
        touch_activity(project)
    return project


@transaction.atomic
def archive_project(project: Project) -> Project:
    """Archiva sin borrar nada (FR-012): sale de la lista y del selector."""
    ensure_project_writable(project)
    project.archived_at = timezone.now()
    project.save(update_fields=["archived_at", "updated_at"])
    touch_activity(project)
    return project


@transaction.atomic
def unarchive_project(project: Project, *, name: Any = UNSET) -> Project:
    """Desarchiva, con un nombre nuevo opcional; todo o nada (FR-013, FR-024).

    Si el nombre (el actual o el nuevo) choca con un proyecto activo, project_name_taken y no
    cambia nada: la interfaz pide otro nombre y reenvía.
    """
    if not project.archived:
        return project
    if name is not UNSET:
        try:
            project.name = _clean_name(name)
        except ValueError as exc:
            raise ValidationError({"name": [str(exc)]}) from None
    if _name_taken(project.owner, project.name, exclude_id=project.id):
        raise ProjectNameTaken()
    project.archived_at = None
    _save_guarding_name(project, ["name", "archived_at"])
    touch_activity(project)
    return project


def _save_guarding_name(project: Project, fields: list[str]) -> None:
    """Guarda; si otra petición ocupó el nombre a la vez, la única parcial lo rechaza (R-05)."""
    try:
        with transaction.atomic():
            project.save(update_fields=[*fields, "updated_at"])
    except IntegrityError:
        raise ProjectNameTaken() from None


@transaction.atomic
def update_project(
    project: Project, *, name: Any = UNSET, description: Any = UNSET, archived: Any = UNSET
) -> Project:
    """PATCH /api/projects/{id} (05-api §3.10): reparte en los services de arriba, todo o nada.

    Sobre un archivado solo se admite {"archived": false} con un name opcional; cualquier otro
    cambio responde project_archived (FR-013).
    """
    if project.archived:
        if archived is False and description is UNSET:
            return unarchive_project(project, name=name)
        raise ProjectArchived()
    if name is not UNSET or description is not UNSET:
        rename_project(project, name=name, description=description)
    if archived is True:
        archive_project(project)
    return project
