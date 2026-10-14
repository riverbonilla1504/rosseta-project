"""Cliente JWKS del tenant con caché y límite de recargas forzadas.

Implementa la parte de FR-029 (ROS-93) que evita abusos: specs/002-autenticacion-oauth
research R-02. Caché en memoria por proceso (1 h); ante un `kid` desconocido se permite
como máximo una recarga forzada cada 60 s. Redis no entra en la ruta de autenticación.
"""

import json
import threading
import time
import urllib.request
from collections.abc import Callable
from functools import lru_cache
from typing import Any

from django.conf import settings
from jwt import PyJWK

CACHE_TTL_SECONDS = 3600  # valor técnico del plan (research R-02)
FORCED_REFRESH_INTERVAL_SECONDS = 60  # valor técnico del plan (research R-02)
MAX_KID_LENGTH = 128
FETCH_TIMEOUT_SECONDS = 5

Fetcher = Callable[[str], dict[str, Any]]


class UnknownSigningKeyError(Exception):
    """El token no trae un `kid` válido o la clave no está en el JWKS del tenant."""


def fetch_jwks(url: str) -> dict[str, Any]:
    if not url.startswith(("https://", "http://")):
        raise UnknownSigningKeyError("JWKS URL inválida")
    with urllib.request.urlopen(url, timeout=FETCH_TIMEOUT_SECONDS) as response:  # noqa: S310
        data: dict[str, Any] = json.load(response)
        return data


class JWKSClient:
    def __init__(
        self,
        url: str,
        *,
        fetcher: Fetcher = fetch_jwks,
        clock: Callable[[], float] = time.monotonic,
    ) -> None:
        self.url = url
        self._fetcher = fetcher
        self._clock = clock
        self._keys: dict[str, PyJWK] = {}
        self._loaded_at: float | None = None
        self._last_forced_refresh: float | None = None
        self._lock = threading.Lock()

    def get_signing_key(self, kid: Any) -> PyJWK:
        if not isinstance(kid, str) or not kid or len(kid) > MAX_KID_LENGTH:
            raise UnknownSigningKeyError("kid ausente o inválido")
        with self._lock:
            now = self._clock()
            if self._loaded_at is None or now - self._loaded_at >= CACHE_TTL_SECONDS:
                self._load(now)
            key = self._keys.get(kid)
            if key is None and self._may_force_refresh(now):
                self._last_forced_refresh = now
                self._load(now)
                key = self._keys.get(kid)
        if key is None:
            raise UnknownSigningKeyError("kid desconocido")
        return key

    def _may_force_refresh(self, now: float) -> bool:
        return (
            self._last_forced_refresh is None
            or now - self._last_forced_refresh >= FORCED_REFRESH_INTERVAL_SECONDS
        )

    def _load(self, now: float) -> None:
        data = self._fetcher(self.url)
        keys: dict[str, PyJWK] = {}
        for jwk in data.get("keys", []):
            if jwk.get("kty") == "RSA" and isinstance(jwk.get("kid"), str):
                keys[jwk["kid"]] = PyJWK(jwk, algorithm="RS256")
        self._keys = keys
        self._loaded_at = now


@lru_cache(maxsize=1)
def get_jwks_client() -> JWKSClient:
    """Un cliente por proceso, con la URL de los ajustes (AUTH0_JWKS_URL)."""
    return JWKSClient(settings.AUTH0_JWKS_URL)
