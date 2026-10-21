"""Formato único de error — docs/03-arquitectura/03-backend.md §6."""

import pytest
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


class _AccountDisabled(exceptions.APIException):
    status_code = 403
    error_code = "account_disabled"
    default_detail = "Cuenta desactivada."


@pytest.mark.story("ROS-89")
@pytest.mark.fr("002:FR-013")
def test_exception_with_own_code_keeps_it_instead_of_the_status_mapping():
    response = api_exception_handler(_AccountDisabled(), {})

    assert response is not None
    assert response.status_code == 403
    assert response.data["error"]["code"] == "account_disabled"
    assert response.data["error"]["message"] == "Cuenta desactivada."


@pytest.mark.story("ROS-89")
@pytest.mark.fr("002:FR-013")
@pytest.mark.parametrize(
    ("exc", "code"),
    [
        (exceptions.NotAuthenticated(), "session_expired"),
        (exceptions.AuthenticationFailed(), "session_expired"),
        (exceptions.PermissionDenied(), "forbidden"),
    ],
)
def test_exceptions_without_own_code_use_the_status_mapping(exc, code):
    response = api_exception_handler(exc, {})

    assert response is not None
    assert response.data["error"]["code"] == code


@pytest.mark.story("ROS-84")
@pytest.mark.fr("003:FR-015")
def test_not_found_has_its_own_code_and_a_fixed_message():
    from apps.core.exceptions import NotFound

    response = api_exception_handler(NotFound(), {})

    assert response is not None
    assert response.status_code == 404
    assert response.data["error"]["code"] == "not_found"
    assert response.data["error"]["message"]
    assert response.data["error"]["details"] == {}


@pytest.mark.story("ROS-78")
@pytest.mark.fr("003:FR-004")
def test_project_name_taken_is_a_400_with_the_name_detail():
    from apps.core.exceptions import ProjectNameTaken

    response = api_exception_handler(ProjectNameTaken(), {})

    assert response is not None
    assert response.status_code == 400
    assert response.data["error"]["code"] == "project_name_taken"
    assert list(response.data["error"]["details"]) == ["name"]


@pytest.mark.story("ROS-78")
@pytest.mark.fr("003:FR-013")
def test_project_archived_is_a_409():
    from apps.core.exceptions import ProjectArchived

    response = api_exception_handler(ProjectArchived(), {})

    assert response is not None
    assert response.status_code == 409
    assert response.data["error"]["code"] == "project_archived"
    assert response.data["error"]["details"] == {}
