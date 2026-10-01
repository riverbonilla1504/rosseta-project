"""Formato único de error — docs/03-arquitectura/03-backend.md §6."""

from rest_framework import exceptions

from apps.core.exceptions import api_exception_handler


def test_validation_errors_are_wrapped_with_field_details():
    response = api_exception_handler(exceptions.ValidationError({"name": ["Requerido."]}), {})

    assert response is not None
    assert response.status_code == 400
    assert response.data == {
        "error": {
            "code": "validation_error",
            "message": "Los datos enviados no son válidos.",
            "details": {"name": ["Requerido."]},
        }
    }


def test_not_found_is_wrapped_without_details():
    response = api_exception_handler(exceptions.NotFound(), {})

    assert response is not None
    assert response.data["error"]["code"] == "not_found"
    assert response.data["error"]["details"] == {}


def test_non_api_exceptions_are_left_to_django():
    assert api_exception_handler(ValueError("boom"), {}) is None
