"""Alta y reconocimiento del usuario a partir de los claims del access token.

specs/002-autenticacion-oauth: research R-03, data-model.md (reglas de alta),
contracts/auth-flow.md §6. Casos (a)…(m) de T015.
"""

import logging
from datetime import timedelta
from unittest.mock import patch

import pytest
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied

from tests.factories.accounts import UserFactory

pytestmark = pytest.mark.django_db

NS = "https://rosetta/"


def claims(sub="google-oauth2|1", email="ana@example.test", name="Ana Prueba", **extra):
    data = {"sub": sub, f"{NS}email_verified": True}
    if email is not None:
        data[f"{NS}email"] = email
    if name is not None:
        data[f"{NS}name"] = name
    data.update(extra)
    return data


def service():
    from apps.accounts import services

    return services


def user_model():
    from apps.accounts.models import User

    return User


def security_events(caplog):
    return [r for r in caplog.records if r.name == "rosetta.security"]


@pytest.mark.story("ROS-90")
@pytest.mark.fr("002:FR-005")
@pytest.mark.fr("002:FR-017")
def test_a_first_access_creates_account_with_pending_onboarding():
    user = service().get_or_create_from_claims(
        claims(**{f"{NS}picture": "https://lh3.example.test/a.png"})
    )

    assert user.auth0_sub == "google-oauth2|1"
    assert user.email == "ana@example.test"
    assert user.full_name == "Ana Prueba"
    assert user.avatar_url == "https://lh3.example.test/a.png"
    assert user.onboarding_completed_at is None
    assert user.has_usable_password() is False


@pytest.mark.story("ROS-90")
@pytest.mark.fr("002:FR-005")
@pytest.mark.fr("002:FR-006")
def test_b_same_sub_is_recognized_without_duplicates():
    first = service().get_or_create_from_claims(claims())
    second = service().get_or_create_from_claims(claims())

    assert first.id == second.id
    assert user_model().objects.count() == 1


@pytest.mark.story("ROS-90")
@pytest.mark.fr("002:FR-007")
def test_c_name_and_avatar_are_updated_only_when_they_change():
    user = service().get_or_create_from_claims(claims())
    untouched = service().get_or_create_from_claims(claims())
    assert untouched.updated_at == user.updated_at

    changed = service().get_or_create_from_claims(
        claims(name="Ana Nueva", **{f"{NS}picture": "https://lh3.example.test/b.png"})
    )

    assert changed.full_name == "Ana Nueva"
    assert changed.avatar_url == "https://lh3.example.test/b.png"
    assert changed.updated_at > user.updated_at


@pytest.mark.story("ROS-91")
@pytest.mark.fr("002:FR-005")
def test_d_concurrent_first_access_recovers_from_integrity_error():
    existing = UserFactory(auth0_sub="google-oauth2|1", email="ana@example.test")
    User = user_model()  # noqa: N806
    original_get = User.objects.get
    calls = {"n": 0}

    def get_missing_once(*args, **kwargs):
        calls["n"] += 1
        if calls["n"] == 1:
            raise User.DoesNotExist
        return original_get(*args, **kwargs)

    with patch.object(User.objects, "get", side_effect=get_missing_once):
        user = service().get_or_create_from_claims(claims())

    assert user.id == existing.id
    assert User.objects.count() == 1


@pytest.mark.story("ROS-90")
@pytest.mark.fr("002:FR-009")
@pytest.mark.fr("002:FR-008")
def test_e_new_sub_with_existing_email_is_rejected_and_creates_nothing():
    from apps.accounts.exceptions import AccountExistsOtherProvider

    UserFactory(auth0_sub="google-oauth2|1", email="Ana@Example.test")

    with pytest.raises(AccountExistsOtherProvider):
        service().get_or_create_from_claims(claims(sub="windowslive|2", email="ana@example.test"))

    assert user_model().objects.count() == 1


@pytest.mark.story("ROS-90")
@pytest.mark.fr("002:FR-010")
def test_f_known_sub_whose_new_email_collides_keeps_old_email_and_logs(caplog):
    own = UserFactory(auth0_sub="google-oauth2|1", email="ana@example.test")
    UserFactory(auth0_sub="windowslive|2", email="otro@example.test")

    with caplog.at_level(logging.WARNING, logger="rosetta.security"):
        user = service().get_or_create_from_claims(claims(email="OTRO@example.test"))

    assert user.id == own.id
    assert user.email == "ana@example.test"
    events = security_events(caplog)
    assert [e.event for e in events] == ["email_conflict"]
    assert events[0].user_id == str(own.id)
    for record in events:
        assert "example.test" not in record.getMessage()


@pytest.mark.story("ROS-89")
@pytest.mark.fr("002:FR-011")
def test_g_disabled_account_is_rejected_on_every_call():
    from apps.accounts.exceptions import AccountDisabled

    UserFactory(auth0_sub="google-oauth2|1", email="ana@example.test", is_active=False)

    for _ in range(2):
        with pytest.raises(AccountDisabled):
            service().get_or_create_from_claims(claims())


@pytest.mark.story("ROS-90")
@pytest.mark.fr("002:FR-005")
def test_h_first_access_without_email_claim_is_rejected():
    from apps.accounts.exceptions import EmailMissing

    with pytest.raises(EmailMissing):
        service().get_or_create_from_claims(claims(email=None))

    assert user_model().objects.count() == 0


@pytest.mark.story("ROS-90")
@pytest.mark.fr("002:FR-005")
def test_i_last_login_at_is_updated_at_most_once_per_hour():
    user = service().get_or_create_from_claims(claims())
    assert user.last_login_at is not None

    recent = timezone.now() - timedelta(minutes=10)
    user_model().objects.filter(pk=user.pk).update(last_login_at=recent)
    assert service().get_or_create_from_claims(claims()).last_login_at == recent

    old = timezone.now() - timedelta(hours=2)
    user_model().objects.filter(pk=user.pk).update(last_login_at=old)
    assert service().get_or_create_from_claims(claims()).last_login_at > old


@pytest.mark.story("ROS-90")
@pytest.mark.fr("002:FR-007")
@pytest.mark.parametrize(
    "picture",
    ["https://lh3.example.test/" + "a" * 500, "javascript:alert(1)", "ftp://example.test/a.png"],
)
def test_j_long_name_is_truncated_and_invalid_avatar_is_discarded(picture):
    user = service().get_or_create_from_claims(claims(name="N" * 250, **{f"{NS}picture": picture}))

    assert user.full_name == "N" * 200
    assert user.avatar_url is None


@pytest.mark.story("ROS-93")
@pytest.mark.fr("002:FR-004")
@pytest.mark.parametrize("verified", [None, False, "true", 1])
def test_k_email_not_verified_claim_is_rejected_without_changes(verified):
    from apps.accounts.exceptions import EmailNotVerified

    existing = UserFactory(auth0_sub="google-oauth2|1", full_name="Ana")
    data = claims(name="Cambiado")
    if verified is None:
        del data[f"{NS}email_verified"]
    else:
        data[f"{NS}email_verified"] = verified

    with pytest.raises(EmailNotVerified):
        service().get_or_create_from_claims(data)
    with pytest.raises(EmailNotVerified):
        service().get_or_create_from_claims({**data, "sub": "windowslive|9"})

    existing.refresh_from_db()
    assert existing.full_name == "Ana"
    assert user_model().objects.count() == 1


@pytest.mark.story("ROS-91")
@pytest.mark.fr("002:FR-005")
def test_l_first_access_without_name_fails_closed_while_dp023_is_open():
    from apps.accounts.exceptions import AccountDisabled

    with pytest.raises(PermissionDenied) as excinfo:
        service().get_or_create_from_claims(claims(name=None))

    assert not isinstance(excinfo.value, AccountDisabled)
    assert getattr(excinfo.value, "error_code", None) is None
    assert excinfo.value.status_code == 403
    assert user_model().objects.count() == 0


@pytest.mark.story("ROS-93")
@pytest.mark.fr("002:FR-033")
def test_m_each_rejection_emits_a_closed_security_event_without_personal_data(caplog):
    from rest_framework import exceptions

    UserFactory(auth0_sub="google-oauth2|1", email="ana@example.test")
    UserFactory(auth0_sub="google-oauth2|2", email="off@example.test", is_active=False)
    cases = [
        (claims(sub="windowslive|3", email="ana@example.test"), "account_exists_other_provider"),
        (claims(sub="google-oauth2|2", email="off@example.test"), "account_disabled"),
        (claims(sub="windowslive|4", email=None), "email_missing"),
        ({**claims(), f"{NS}email_verified": False}, "email_not_verified"),
    ]

    with caplog.at_level(logging.WARNING, logger="rosetta.security"):
        for data, _reason in cases:
            with pytest.raises(exceptions.APIException):
                service().get_or_create_from_claims(data, path="/api/me")

    events = security_events(caplog)
    assert [(e.event, e.reason) for e in events] == [
        ("access_denied", reason) for _data, reason in cases
    ]
    for record in events:
        assert record.path == "/api/me"
        assert "example.test" not in record.getMessage()
        assert "Ana" not in record.getMessage()
        extra = (
            set(record.__dict__) - set(logging.makeLogRecord({}).__dict__) - {"message", "asctime"}
        )
        assert extra <= {"event", "reason", "user_id", "path"}
