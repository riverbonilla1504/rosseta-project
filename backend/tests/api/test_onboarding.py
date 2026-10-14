"""POST /api/me/onboarding/complete — contracts/accounts-api.yaml (completeOnboarding)."""

import pytest
from rest_framework.test import APIClient

pytestmark = pytest.mark.django_db

URL = "/api/me/onboarding/complete"


def user_model():
    from apps.accounts.models import User

    return User


@pytest.mark.story("ROS-91")
@pytest.mark.fr("002:FR-017")
def test_complete_marks_onboarding_as_completed(api_tokens):
    client = APIClient()

    response = client.post(URL, **api_tokens.bearer(sub="google-oauth2|ob1"))

    assert response.status_code == 200
    assert response.json()["onboarding_completed"] is True
    me = client.get("/api/me", **api_tokens.bearer(sub="google-oauth2|ob1")).json()
    assert me["onboarding_completed"] is True


@pytest.mark.story("ROS-91")
@pytest.mark.fr("002:FR-021")
def test_complete_is_idempotent_and_keeps_the_first_date(api_tokens):
    client = APIClient()
    client.post(URL, **api_tokens.bearer(sub="google-oauth2|ob2"))
    first = user_model().objects.get(auth0_sub="google-oauth2|ob2").onboarding_completed_at

    second = client.post(URL, **api_tokens.bearer(sub="google-oauth2|ob2"))

    assert second.status_code == 200
    assert second.json()["onboarding_completed"] is True
    assert user_model().objects.get(auth0_sub="google-oauth2|ob2").onboarding_completed_at == first


@pytest.mark.story("ROS-91")
@pytest.mark.fr("002:FR-021")
def test_onboarding_never_goes_back_to_pending(api_tokens):
    client = APIClient()
    client.post(URL, **api_tokens.bearer(sub="google-oauth2|ob3"))

    for _ in range(2):
        me = client.get("/api/me", **api_tokens.bearer(sub="google-oauth2|ob3")).json()
        assert me["onboarding_completed"] is True


@pytest.mark.story("ROS-91")
@pytest.mark.fr("002:FR-017")
def test_complete_without_credential_is_401(api_tokens):
    response = APIClient().post(URL)

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "session_expired"


@pytest.mark.story("ROS-91")
@pytest.mark.fr("002:FR-017")
def test_complete_with_disabled_account_is_403(api_tokens):
    from tests.factories.accounts import UserFactory

    UserFactory(auth0_sub="google-oauth2|ob4", email="ob4@example.test", is_active=False)

    response = APIClient().post(
        URL, **api_tokens.bearer(sub="google-oauth2|ob4", email="ob4@example.test")
    )

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "account_disabled"
