"""Autenticación de la API con el access token de Auth0 (ADR-0007).

Implementa FR-029 (ROS-93): solo tokens RS256 del emisor del tenant, para la audiencia de
Rosetta API, vigentes, con `kid` conocido y los claims obligatorios (research R-01). Todo
rechazo responde 401 `session_expired` con `WWW-Authenticate: Bearer` y sin datos internos
(FR-013). Después delega en get_or_create_from_claims (FR-004, FR-005, FR-011).
"""

from typing import Any

import jwt
from django.conf import settings
from rest_framework.authentication import BaseAuthentication, get_authorization_header
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.request import Request

from . import messages
from .jwks import UnknownSigningKeyError, get_jwks_client
from .models import User
from .services import get_or_create_from_claims

ALGORITHMS = ["RS256"]
REQUIRED_CLAIMS = ["exp", "iat", "iss", "aud", "sub"]
LEEWAY_SECONDS = 10  # tolerancia de reloj, valor técnico del plan (research R-01)


class Auth0JWTAuthentication(BaseAuthentication):
    keyword = b"bearer"

    def authenticate(self, request: Request) -> tuple[User, dict[str, Any]] | None:
        parts = get_authorization_header(request).split()
        if not parts or parts[0].lower() != self.keyword:
            return None
        if len(parts) != 2:
            raise AuthenticationFailed(messages.SESSION_EXPIRED)

        payload = self._decode(parts[1])
        user = get_or_create_from_claims(payload, path=request.path)
        return user, payload

    def authenticate_header(self, request: Request) -> str:
        # Con esta cabecera DRF responde 401 (no 403) cuando falta o falla la credencial.
        return "Bearer"

    def _decode(self, raw: bytes) -> dict[str, Any]:
        try:
            token = raw.decode("ascii")
            header = jwt.get_unverified_header(token)
            if header.get("alg") not in ALGORITHMS:
                raise AuthenticationFailed(messages.SESSION_EXPIRED)
            signing_key = get_jwks_client().get_signing_key(header.get("kid"))
            payload: dict[str, Any] = jwt.decode(
                token,
                signing_key.key,
                algorithms=ALGORITHMS,
                audience=settings.AUTH0_AUDIENCE,
                issuer=settings.AUTH0_ISSUER,
                leeway=LEEWAY_SECONDS,
                options={"require": REQUIRED_CLAIMS},
            )
        except (jwt.PyJWTError, UnknownSigningKeyError, UnicodeDecodeError, OSError) as exc:
            # El motivo nunca se devuelve al cliente (FR-013).
            raise AuthenticationFailed(messages.SESSION_EXPIRED) from exc
        return payload
