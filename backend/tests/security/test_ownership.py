"""get_owned_or_404 — FR-015 y FR-017 (research R-03; 05-api §4 not_found, tras CD-013).

Un recurso ajeno, uno inexistente y un identificador que no es UUID dan el mismo 404 con el
mismo cuerpo. Solo el ajeno registra access_denied, con campos cerrados y sin datos personales.
"""

import logging
import uuid

import pytest
from rest_framework.test import APIRequestFactory

from apps.core.exceptions import api_exception_handler
from apps.core.ownership import get_owned_or_404
from apps.projects.models import Project
from tests.factories.projects import ProjectFactory

pytestmark = [pytest.mark.django_db, pytest.mark.story("ROS-84")]


def request_as(user, path="/api/projects/x"):
    request = APIRequestFactory().get(path)
    request.user = user
    return request


def not_found_response(user, pk, path="/api/projects/x"):
    from rest_framework.exceptions import APIException

    with pytest.raises(APIException) as excinfo:
        get_owned_or_404(Project.objects.for_user(user), pk, request_as(user, path))
    response = api_exception_handler(excinfo.value, {})
    assert response is not None
    return response.status_code, response.data


def security_events(caplog):
    return [record for record in caplog.records if record.name == "rosetta.security"]


@pytest.mark.fr("003:FR-015")
def test_own_resource_is_returned():
    project = ProjectFactory()

    found = get_owned_or_404(
        Project.objects.for_user(project.owner), str(project.id), request_as(project.owner)
    )

    assert found == project


@pytest.mark.fr("003:FR-015")
def test_foreign_missing_and_invalid_ids_get_the_same_404_body():
    project_a = ProjectFactory()
    person_b = ProjectFactory().owner

    foreign = not_found_response(person_b, str(project_a.id))
    missing = not_found_response(person_b, str(uuid.uuid4()))
    invalid = not_found_response(person_b, "no-es-un-uuid")

    assert foreign == missing == invalid
    status, body = foreign
    assert status == 404
    assert body["error"]["code"] == "not_found"
    assert body["error"]["details"] == {}
    assert set(body["error"]) == {"code", "message", "details"}


@pytest.mark.fr("003:FR-017")
def test_only_the_foreign_resource_logs_access_denied_with_closed_fields(caplog):
    project_a = ProjectFactory(name="CLIENTE_SECRETO")
    person_b = ProjectFactory().owner
    path = f"/api/projects/{project_a.id}"

    with caplog.at_level(logging.WARNING, logger="rosetta.security"):
        not_found_response(person_b, str(uuid.uuid4()), path="/api/projects/otro")
        not_found_response(person_b, "no-es-un-uuid", path="/api/projects/no-es-un-uuid")
        assert security_events(caplog) == []

        not_found_response(person_b, str(project_a.id), path=path)

    [record] = security_events(caplog)
    standard = set(logging.makeLogRecord({}).__dict__) | {"message", "asctime"}
    assert set(record.__dict__) - standard == {"event", "reason", "user_id", "path", "resource_id"}
    assert record.levelno == logging.WARNING
    assert record.event == "access_denied"
    assert record.reason == "not_owner"
    assert record.user_id == str(person_b.id)
    assert record.path == path
    assert record.resource_id == str(project_a.id)
    text = record.getMessage() + " ".join(str(value) for value in record.__dict__.values())
    assert "example.test" not in text
    assert "CLIENTE_SECRETO" not in text
    assert person_b.full_name not in text


@pytest.mark.fr("003:FR-017")
def test_security_formatter_prints_the_resource_id_and_still_formats_other_events():
    from django.conf import settings

    formatter_config = settings.LOGGING["formatters"]["security"]
    formatter = logging.Formatter(
        formatter_config["format"], defaults=formatter_config.get("defaults")
    )
    denied = logging.makeLogRecord(
        {
            "msg": "security_event",
            "event": "access_denied",
            "reason": "not_owner",
            "user_id": "u1",
            "path": "/api/projects/p1",
            "resource_id": "p1",
        }
    )
    account = logging.makeLogRecord(
        {
            "msg": "security_event",
            "event": "access_denied",
            "reason": "account_disabled",
            "user_id": "u1",
            "path": "/api/me",
        }
    )

    assert "resource_id=p1" in formatter.format(denied)
    assert "reason=account_disabled" in formatter.format(account)
