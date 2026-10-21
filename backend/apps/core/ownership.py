"""Obtención de recursos con aislamiento por propietario — research R-03 de la feature 003.

Implementa FR-015 y FR-017 (ROS-178; RNF-03, 07-seguridad §4): las vistas obtienen objetos
solo con get_owned_or_404 sobre un QuerySet ya filtrado con for_user (regla B4).
"""

import logging
import uuid
from typing import Any

from django.core.exceptions import ObjectDoesNotExist
from django.db import models
from rest_framework.request import Request

from .exceptions import NotFound

security_log = logging.getLogger("rosetta.security")


def _as_uuid(value: Any) -> uuid.UUID | None:
    try:
        return uuid.UUID(str(value))
    except ValueError:
        return None


def get_owned_or_404[ModelT: models.Model](
    queryset: models.QuerySet[ModelT], pk: Any, request: Request
) -> ModelT:
    """Devuelve el objeto de la persona o lanza el 404 único.

    Un pk que no es un UUID da el mismo not_found (no 400) para no distinguir formatos. Solo si
    el objeto existe y es de otra persona se registra access_denied, con campos cerrados y sin
    datos personales; la comprobación extra ocurre solo en la rama de fallo.
    """
    resource_id = _as_uuid(pk)
    if resource_id is None:
        raise NotFound()
    try:
        return queryset.get(pk=resource_id)
    except ObjectDoesNotExist:
        if queryset.model._base_manager.filter(pk=resource_id).exists():
            user_id = getattr(getattr(request, "user", None), "pk", None)
            security_log.warning(
                "security_event",
                extra={
                    "event": "access_denied",
                    "reason": "not_owner",
                    "user_id": str(user_id) if user_id else None,
                    "path": request.path,
                    "resource_id": str(resource_id),
                },
            )
        raise NotFound() from None
