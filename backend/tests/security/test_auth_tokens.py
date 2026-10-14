"""Validación del access token de Auth0 en la API (research R-01, contracts/auth-flow.md §6).

ROS-93 · FR-029 y SC-004 (casos maliciosos), FR-004 (email_verified en el backend);
ROS-89 · FR-011 (cuenta desactivada) y FR-013 (formato de error sin datos internos).
Claves RSA generadas en la prueba; sin red hacia el tenant real.
"""

import base64
import hashlib
import hmac
import json
import time
from unittest.mock import patch

import jwt
import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from jwt.algorithms import RSAAlgorithm
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.test import APIRequestFactory
from rest_framework.views import APIView

pytestmark = pytest.mark.django_db

ISSUER = "https://tenant.example.test/"
AUDIENCE = "https://api.rosetta.local"
KID = "test-kid"
NS = "https://rosetta/"

PRIVATE_KEY = rsa.generate_private_key(public_exponent=65537, key_size=2048)
OTHER_KEY = rsa.generate_private_key(public_exponent=65537, key_size=2048)
PUBLIC_PEM = PRIVATE_KEY.public_key().public_bytes(
    serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo
)


def _jwks(url):
    jwk = json.loads(RSAAlgorithm.to_jwk(PRIVATE_KEY.public_key()))
    jwk.update({"kid": KID, "use": "sig", "alg": "RS256"})
    return {"keys": [jwk]}


def _authentication_class():
    from apps.accounts.authentication import Auth0JWTAuthentication

    return Auth0JWTAuthentication


class ProtectedView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"user": str(request.user.id)})


@pytest.fixture(autouse=True)
def auth_settings(settings):
    from apps.accounts.jwks import JWKSClient

    settings.AUTH0_ISSUER = ISSUER
    settings.AUTH0_AUDIENCE = AUDIENCE
    client = JWKSClient("https://tenant.example.test/.well-known/jwks.json", fetcher=_jwks)
    with patch("apps.accounts.authentication.get_jwks_client", return_value=client):
        yield


def claims(**overrides):
    now = int(time.time())
    data = {
        "iss": ISSUER,
        "aud": AUDIENCE,
        "sub": "google-oauth2|42",
        "iat": now,
        "exp": now + 900,
        f"{NS}email": "ana@example.test",
        f"{NS}name": "Ana Prueba",
        f"{NS}email_verified": True,
    }
    data.update(overrides)
    return {k: v for k, v in data.items() if v is not None}


def token(payload=None, key=PRIVATE_KEY, headers=None):
    return jwt.encode(
        payload or claims(), key, algorithm="RS256", headers={"kid": KID, **(headers or {})}
    )


def _b64(data):
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def hs256_with_public_key():
    header = _b64(json.dumps({"alg": "HS256", "typ": "JWT", "kid": KID}).encode())
    body = _b64(json.dumps(claims()).encode())
    signature = hmac.new(PUBLIC_PEM, f"{header}.{body}".encode(), hashlib.sha256).digest()
    return f"{header}.{body}.{_b64(signature)}"


def unsigned_token():
    header = _b64(json.dumps({"alg": "none", "typ": "JWT", "kid": KID}).encode())
    body = _b64(json.dumps(claims()).encode())
    return f"{header}.{body}."


def tampered_token():
    header, body, signature = token().split(".")
    forged = _b64(json.dumps(claims(sub="google-oauth2|attacker")).encode())
    return f"{header}.{forged}.{signature}"


def call(authorization=None):
    view = ProtectedView.as_view(authentication_classes=[_authentication_class()])
    headers = {"HTTP_AUTHORIZATION": authorization} if authorization else {}
    response = view(APIRequestFactory().get("/api/protected", **headers))
    response.render()
    return response


def assert_rejected_without_internal_data(response):
    assert response.status_code == 401
    assert response["WWW-Authenticate"].startswith("Bearer")
    body = response.json()
    assert set(body) == {"error"}
    assert body["error"]["code"] == "session_expired"
    assert body["error"]["details"] == {}
    lowered = body["error"]["message"].lower()
    for internal in ("signature", "kid", "audience", "issuer", "expired", "decode", "alg"):
        assert internal not in lowered


@pytest.mark.story("ROS-93")
@pytest.mark.fr("002:FR-029")
def test_valid_token_is_accepted_and_creates_the_local_user():
    response = call(f"Bearer {token()}")

    assert response.status_code == 200
    assert response.json()["user"]


@pytest.mark.story("ROS-89")
@pytest.mark.fr("002:FR-013")
@pytest.mark.parametrize("authorization", [None, "Basic dXNlcjpwYXNz", "Bearer", "Bearer a b"])
def test_missing_or_malformed_credential_is_401(authorization):
    assert_rejected_without_internal_data(call(authorization))


@pytest.mark.story("ROS-93")
@pytest.mark.fr("002:FR-029")
@pytest.mark.parametrize(
    "make_token",
    [
        pytest.param(lambda: token(claims(exp=int(time.time()) - 60)), id="vencido"),
        pytest.param(
            lambda: token(claims(aud="https://otra-api.example.test")), id="otra-audiencia"
        ),
        pytest.param(lambda: token(claims(iss="https://otro.example.test/")), id="otro-emisor"),
        pytest.param(tampered_token, id="firma-alterada"),
        pytest.param(unsigned_token, id="alg-none"),
        pytest.param(hs256_with_public_key, id="hs256-con-clave-publica"),
        pytest.param(
            lambda: token(key=OTHER_KEY, headers={"kid": "desconocido"}), id="kid-desconocido"
        ),
        pytest.param(lambda: token(key=OTHER_KEY), id="clave-desconocida"),
        pytest.param(lambda: jwt.encode(claims(), PRIVATE_KEY, algorithm="RS256"), id="sin-kid"),
        pytest.param(lambda: token(claims(sub=None)), id="sin-sub"),
        pytest.param(lambda: token(claims(exp=None)), id="sin-exp"),
    ],
)
def test_malicious_or_invalid_tokens_are_401_without_internal_data(make_token):
    assert_rejected_without_internal_data(call(f"Bearer {make_token()}"))


@pytest.mark.story("ROS-93")
@pytest.mark.fr("002:FR-004")
@pytest.mark.parametrize("verified", [None, False])
def test_token_without_email_verified_true_is_403(verified):
    response = call(f"Bearer {token(claims(**{f'{NS}email_verified': verified}))}")

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "email_not_verified"


@pytest.mark.story("ROS-89")
@pytest.mark.fr("002:FR-011")
def test_disabled_account_with_valid_token_is_403_on_next_request():
    from apps.accounts.models import User

    bearer = f"Bearer {token()}"
    assert call(bearer).status_code == 200
    User.objects.filter(auth0_sub="google-oauth2|42").update(is_active=False)

    response = call(bearer)

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "account_disabled"
