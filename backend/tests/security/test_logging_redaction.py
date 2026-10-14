"""Registros sin credenciales ni datos personales (FR-033, SC-008; research R-11)."""

import logging
import re

import pytest
from rest_framework.test import APIClient

pytestmark = [pytest.mark.story("ROS-93"), pytest.mark.fr("002:FR-033")]

JWT = "eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIxMjMifQ.c2lnbmF0dXJlLXZhbHVl"
JWT_PATTERN = re.compile(r"eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*")
EMAIL_PATTERN = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")


def redact(record):
    from apps.accounts.logging import RedactFilter

    RedactFilter().filter(record)
    return record


def make_record(msg, args=(), exc_info=None):
    return logging.LogRecord("x", logging.WARNING, __file__, 1, msg, args, exc_info)


def test_masks_jwt_and_email_in_the_message():
    record = redact(make_record(f"token {JWT} de ana@example.test"))

    rendered = record.getMessage()
    assert not JWT_PATTERN.search(rendered)
    assert not EMAIL_PATTERN.search(rendered)


def test_masks_jwt_and_email_in_the_arguments():
    record = redact(make_record("token %s de %s", (JWT, "ana@example.test")))

    rendered = record.getMessage()
    assert not JWT_PATTERN.search(rendered)
    assert not EMAIL_PATTERN.search(rendered)


def test_masks_jwt_and_email_in_exception_text():
    try:
        raise ValueError(f"boom {JWT} ana@example.test")
    except ValueError:
        import sys

        record = redact(make_record("fallo", exc_info=sys.exc_info()))

    formatted = logging.Formatter().format(record)
    assert not JWT_PATTERN.search(formatted)
    assert not EMAIL_PATTERN.search(formatted)


def test_filter_is_attached_to_every_handler():
    from django.conf import settings

    handlers = settings.LOGGING["handlers"]
    assert handlers
    for name, handler in handlers.items():
        assert "redact" in handler.get("filters", []), name
    assert settings.LOGGING["filters"]["redact"]["()"] == "apps.accounts.logging.RedactFilter"
    assert "rosetta.security" in settings.LOGGING["loggers"]


@pytest.mark.django_db
def test_full_authenticated_flow_logs_no_jwt_nor_email(api_tokens, caplog):
    from apps.accounts.logging import RedactFilter

    from tests.factories.accounts import UserFactory

    UserFactory(auth0_sub="google-oauth2|otro", email="choque@example.test")
    handler_filter = RedactFilter()
    caplog.handler.addFilter(handler_filter)
    client = APIClient()
    with caplog.at_level(logging.DEBUG):
        client.get("/api/me", **api_tokens.bearer(sub="google-oauth2|flujo"))
        client.get(
            "/api/me", **api_tokens.bearer(sub="google-oauth2|flujo", email="choque@example.test")
        )
        client.get(
            "/api/me", **api_tokens.bearer(sub="windowslive|nuevo", email="choque@example.test")
        )
        client.post("/api/me/onboarding/complete", **api_tokens.bearer(sub="google-oauth2|flujo"))
        logging.getLogger("django.request").warning("Forbidden %s", api_tokens.access_token())
    caplog.handler.removeFilter(handler_filter)

    text = caplog.text
    assert caplog.records, "el flujo debería dejar al menos un registro"
    assert not JWT_PATTERN.search(text)
    assert not EMAIL_PATTERN.search(text)


def test_security_events_only_carry_closed_fields(caplog):
    from apps.accounts.services import log_security_event

    with caplog.at_level(logging.WARNING, logger="rosetta.security"):
        log_security_event("access_denied", "account_disabled", user_id="u1", path="/api/me")

    record = caplog.records[-1]
    standard = set(logging.makeLogRecord({}).__dict__) | {"message", "asctime"}
    assert set(record.__dict__) - standard == {"event", "reason", "user_id", "path"}
