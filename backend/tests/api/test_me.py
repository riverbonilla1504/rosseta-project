"""GET /api/me — specs/002-autenticacion-oauth/contracts/accounts-api.yaml (getMe)."""

import pytest
from rest_framework.test import APIClient

pytestmark = pytest.mark.django_db

ME_FIELDS = {"id", "email", "full_name", "avatar_url", "onboarding_completed"}


@pytest.mark.story("ROS-90")
@pytest.mark.fr("002:FR-005")
def test_first_access_creates_the_account_with_pending_onboarding(api_tokens):
    response = APIClient().get("/api/me", **api_tokens.bearer(sub="google-oauth2|ana"))

    assert response.status_code == 200
    body = response.json()
    assert set(body) == ME_FIELDS
    assert body["email"] == "persona@example.test"
    assert body["full_name"] == "Persona de Prueba"
    assert body["avatar_url"] is None
    assert body["onboarding_completed"] is False


@pytest.mark.story("ROS-90")
@pytest.mark.fr("002:FR-005")
def test_second_access_returns_the_same_account(api_tokens):
    first = APIClient().get("/api/me", **api_tokens.bearer(sub="google-oauth2|ana")).json()
    second = APIClient().get("/api/me", **api_tokens.bearer(sub="google-oauth2|ana")).json()

    assert first["id"] == second["id"]


@pytest.mark.story("ROS-90")
@pytest.mark.fr("002:FR-007")
def test_updated_name_and_avatar_are_reflected(api_tokens):
    APIClient().get("/api/me", **api_tokens.bearer(sub="google-oauth2|ana"))

    body = (
        APIClient()
        .get(
            "/api/me",
            **api_tokens.bearer(
                sub="google-oauth2|ana",
                name="Ana Nueva",
                picture="https://lh3.example.test/ana.png",
            ),
        )
        .json()
    )

    assert body["full_name"] == "Ana Nueva"
    assert body["avatar_url"] == "https://lh3.example.test/ana.png"


@pytest.mark.story("ROS-89")
@pytest.mark.fr("002:FR-013")
def test_without_credential_is_401(api_tokens):
    response = APIClient().get("/api/me")

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "session_expired"


@pytest.mark.story("ROS-89")
@pytest.mark.fr("002:FR-016")
def test_each_person_only_sees_their_own_account(api_tokens):
    a = APIClient().get(
        "/api/me", **api_tokens.bearer(sub="google-oauth2|a", email="a@example.test", name="A")
    )
    b = APIClient().get(
        "/api/me", **api_tokens.bearer(sub="windowslive|b", email="b@example.test", name="B")
    )

    assert a.json()["email"] == "a@example.test"
    assert b.json()["email"] == "b@example.test"
    assert a.json()["id"] != b.json()["id"]
