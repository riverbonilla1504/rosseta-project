"""Emisión de access tokens de prueba firmados con una clave RSA generada aquí (sin red).

Se usa con el fixture `api_tokens` de tests/conftest.py. Datos sintéticos (RNF-38).
"""

import json
import time
from typing import Any

import jwt
from cryptography.hazmat.primitives.asymmetric import rsa
from jwt.algorithms import RSAAlgorithm

ISSUER = "https://tenant.example.test/"
AUDIENCE = "https://api.rosetta.local"
KID = "tests-kid"
NS = "https://rosetta/"

_PRIVATE_KEY = rsa.generate_private_key(public_exponent=65537, key_size=2048)


def jwks(_url: str) -> dict[str, Any]:
    jwk = json.loads(RSAAlgorithm.to_jwk(_PRIVATE_KEY.public_key()))
    jwk.update({"kid": KID, "use": "sig", "alg": "RS256"})
    return {"keys": [jwk]}


def access_token(
    sub: str = "google-oauth2|tests",
    email: str | None = "persona@example.test",
    name: str | None = "Persona de Prueba",
    picture: str | None = None,
    email_verified: bool | None = True,
    **extra: Any,
) -> str:
    now = int(time.time())
    claims: dict[str, Any] = {
        "iss": ISSUER,
        "aud": AUDIENCE,
        "sub": sub,
        "iat": now,
        "exp": now + 900,
        f"{NS}email": email,
        f"{NS}name": name,
        f"{NS}picture": picture,
        f"{NS}email_verified": email_verified,
        **extra,
    }
    payload = {key: value for key, value in claims.items() if value is not None}
    return jwt.encode(payload, _PRIVATE_KEY, algorithm="RS256", headers={"kid": KID})


def bearer(**claims: Any) -> dict[str, str]:
    """Cabecera para APIClient: client.get(url, **bearer(sub=...))."""
    return {"HTTP_AUTHORIZATION": f"Bearer {access_token(**claims)}"}
