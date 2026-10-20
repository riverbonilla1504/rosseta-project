"""Formato único de error {"error": {code, message, details}}.

Ver docs/03-arquitectura/03-backend.md §6.
"""

from typing import Any

from rest_framework import exceptions, status
from rest_framework.response import Response
from rest_framework.views import exception_handler

from . import messages

_DEFAULT_CODES = {
    status.HTTP_400_BAD_REQUEST: "validation_error",
    status.HTTP_401_UNAUTHORIZED: "session_expired",
    status.HTTP_403_FORBIDDEN: "forbidden",
    status.HTTP_404_NOT_FOUND: "not_found",
    status.HTTP_405_METHOD_NOT_ALLOWED: "method_not_allowed",
    status.HTTP_413_REQUEST_ENTITY_TOO_LARGE: "file_too_large",
}


class NotFound(exceptions.NotFound):
    """404 único para lo inexistente, lo ajeno y un identificador inválido (05-api §4, FR-015)."""

    error_code = "not_found"
    default_detail = messages.NOT_FOUND


class ProjectNameTaken(exceptions.ValidationError):
    """400 con details.name: nombre repetido entre los proyectos activos (05-api §4, FR-004)."""

    error_code = "project_name_taken"

    def __init__(self) -> None:
        super().__init__({"name": [messages.PROJECT_NAME_TAKEN]})


class ProjectArchived(exceptions.APIException):
    """409: el proyecto archivado es de solo lectura; solo admite desarchivar (05-api §4)."""

    status_code = status.HTTP_409_CONFLICT
    error_code = "project_archived"
    default_detail = messages.PROJECT_ARCHIVED


def api_exception_handler(exc: Exception, context: dict[str, Any]) -> Response | None:
    response = exception_handler(exc, context)
    if response is None:
        return None

    if isinstance(exc, exceptions.ValidationError):
        message, details = "Los datos enviados no son válidos.", response.data
    else:
        detail = response.data.get("detail", "") if isinstance(response.data, dict) else ""
        message, details = str(detail), {}

    # Un código propio de la excepción (atributo error_code) tiene prioridad sobre el mapeo
    # por estado HTTP: si no, 403 account_disabled saldría como "forbidden" (FR-011, FR-013).
    own_code = getattr(exc, "error_code", None)
    code = None
    if not isinstance(exc, exceptions.ValidationError):
        code = getattr(exc, "default_code", None)
    response.data = {
        "error": {
            "code": own_code or _DEFAULT_CODES.get(response.status_code, code or "error"),
            "message": message,
            "details": details,
        }
    }
    return response
