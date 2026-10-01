"""Formato único de error {"error": {code, message, details}}.

Ver docs/03-arquitectura/03-backend.md §6.
"""

from typing import Any

from rest_framework import exceptions, status
from rest_framework.response import Response
from rest_framework.views import exception_handler

_DEFAULT_CODES = {
    status.HTTP_400_BAD_REQUEST: "validation_error",
    status.HTTP_401_UNAUTHORIZED: "session_expired",
    status.HTTP_403_FORBIDDEN: "forbidden",
    status.HTTP_404_NOT_FOUND: "not_found",
    status.HTTP_405_METHOD_NOT_ALLOWED: "method_not_allowed",
    status.HTTP_413_REQUEST_ENTITY_TOO_LARGE: "file_too_large",
}


def api_exception_handler(exc: Exception, context: dict[str, Any]) -> Response | None:
    response = exception_handler(exc, context)
    if response is None:
        return None

    if isinstance(exc, exceptions.ValidationError):
        message, details = "Los datos enviados no son válidos.", response.data
    else:
        detail = response.data.get("detail", "") if isinstance(response.data, dict) else ""
        message, details = str(detail), {}

    code = None
    if not isinstance(exc, exceptions.ValidationError):
        code = getattr(exc, "default_code", None)
    response.data = {
        "error": {
            "code": _DEFAULT_CODES.get(response.status_code, code or "error"),
            "message": message,
            "details": details,
        }
    }
    return response
