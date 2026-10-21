"""Modelo accounts.User — specs/002-autenticacion-oauth/data-model.md (accounts_user).

ROS-180 · FR-005 (una cuenta por identidad), FR-006 (se reconoce por auth0_sub),
FR-008 (correo único sin distinguir mayúsculas).
"""

import uuid

import pytest
from django.db import IntegrityError, transaction

pytestmark = [
    pytest.mark.django_db,
    pytest.mark.story("ROS-89"),
]


def _user_model():
    from apps.accounts.models import User

    return User


def _field(name):
    return _user_model()._meta.get_field(name)


@pytest.mark.fr("002:FR-005")
def test_user_is_created_by_auth0_sub_with_unusable_password():
    user_model = _user_model()

    user = user_model.objects.create_user(
        auth0_sub="google-oauth2|1001", email="ana@example.test", full_name="Ana Prueba"
    )

    assert user.auth0_sub == "google-oauth2|1001"
    assert user_model.USERNAME_FIELD == "auth0_sub"
    assert user.has_usable_password() is False
    assert isinstance(user.id, uuid.UUID)
    assert user.is_active is True
    assert user.is_staff is False
    assert user.onboarding_completed_at is None
    assert user.last_login_at is None
    assert user.avatar_url is None


@pytest.mark.fr("002:FR-006")
def test_auth0_sub_is_unique():
    user_model = _user_model()
    user_model.objects.create_user(
        auth0_sub="google-oauth2|1", email="a@example.test", full_name="A"
    )

    with pytest.raises(IntegrityError), transaction.atomic():
        user_model.objects.create_user(
            auth0_sub="google-oauth2|1", email="b@example.test", full_name="B"
        )


@pytest.mark.fr("002:FR-008")
def test_email_is_unique_ignoring_case():
    user_model = _user_model()
    user_model.objects.create_user(auth0_sub="google-oauth2|1", email="Ana@x.test", full_name="Ana")

    with pytest.raises(IntegrityError), transaction.atomic():
        user_model.objects.create_user(
            auth0_sub="windowslive|2", email="ana@x.test", full_name="Ana"
        )


@pytest.mark.fr("002:FR-005")
def test_auth0_sub_and_email_cannot_be_empty():
    user_model = _user_model()

    with pytest.raises(IntegrityError), transaction.atomic():
        user_model.objects.create(auth0_sub="", email="c@example.test", full_name="C")
    with pytest.raises(IntegrityError), transaction.atomic():
        user_model.objects.create(auth0_sub="google-oauth2|3", email="", full_name="C")


@pytest.mark.fr("002:FR-005")
def test_inherited_last_login_field_does_not_exist():
    names = {field.name for field in _user_model()._meta.get_fields()}

    assert "last_login" not in names
    assert "last_login_at" in names


@pytest.mark.fr("002:FR-005")
def test_fields_match_the_data_model():
    expected = {
        "auth0_sub": (255, False),
        "email": (254, False),
        "full_name": (200, False),
        "avatar_url": (500, True),
    }
    for name, (max_length, null) in expected.items():
        field = _field(name)
        assert field.max_length == max_length, name
        assert field.null is null, name

    assert _field("is_active").default is True
    assert _field("is_staff").default is False
    assert _field("onboarding_completed_at").null is True
    assert _field("last_login_at").null is True
    assert _field("id").default is uuid.uuid4
    assert _user_model()._meta.db_table == "accounts_user"


@pytest.mark.fr("002:FR-005")
def test_manager_has_no_superuser_creation():
    assert not hasattr(_user_model().objects, "create_superuser")
