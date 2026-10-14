"""Cliente JWKS con caché y límite de recargas forzadas (research R-02).

ROS-93 · FR-029: solo claves del emisor de Rosetta; un `kid` desconocido no debe poder
provocar una petición al proveedor por cada solicitud.
"""

import json

import pytest
from cryptography.hazmat.primitives.asymmetric import rsa
from jwt.algorithms import RSAAlgorithm

pytestmark = [pytest.mark.story("ROS-93"), pytest.mark.fr("002:FR-029")]


def make_jwk(kid):
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    jwk = json.loads(RSAAlgorithm.to_jwk(key.public_key()))
    jwk.update({"kid": kid, "use": "sig", "alg": "RS256"})
    return jwk


class FakeJWKS:
    def __init__(self, *kids):
        self.keys = [make_jwk(kid) for kid in kids]
        self.calls = 0

    def __call__(self, url):
        self.calls += 1
        return {"keys": list(self.keys)}


class FakeClock:
    def __init__(self):
        self.now = 1000.0

    def __call__(self):
        return self.now


def make_client(fetcher, clock):
    from apps.accounts.jwks import JWKSClient

    return JWKSClient(
        "https://tenant.example.test/.well-known/jwks.json", fetcher=fetcher, clock=clock
    )


def unknown_key_error():
    from apps.accounts.jwks import UnknownSigningKeyError

    return UnknownSigningKeyError


def test_known_kid_does_not_touch_the_network_after_first_load():
    fetcher, clock = FakeJWKS("k1"), FakeClock()
    client = make_client(fetcher, clock)

    for _ in range(5):
        assert client.get_signing_key("k1") is not None

    assert fetcher.calls == 1


def test_random_unknown_kids_cause_at_most_one_forced_refresh_per_60_seconds():
    fetcher, clock = FakeJWKS("k1"), FakeClock()
    client = make_client(fetcher, clock)
    client.get_signing_key("k1")

    for i in range(50):
        with pytest.raises(unknown_key_error()):
            client.get_signing_key(f"random-{i}")
        clock.now += 1  # 50 segundos en total: sigue dentro del límite

    assert fetcher.calls == 2  # carga inicial + una sola recarga forzada


def test_another_forced_refresh_is_allowed_after_the_limit():
    fetcher, clock = FakeJWKS("k1"), FakeClock()
    client = make_client(fetcher, clock)
    client.get_signing_key("k1")
    with pytest.raises(unknown_key_error()):
        client.get_signing_key("nope")

    clock.now += 61
    with pytest.raises(unknown_key_error()):
        client.get_signing_key("nope-again")

    assert fetcher.calls == 3


def test_rotated_key_is_obtained_with_a_single_reload():
    fetcher, clock = FakeJWKS("k1"), FakeClock()
    client = make_client(fetcher, clock)
    client.get_signing_key("k1")

    fetcher.keys.append(make_jwk("k2"))
    assert client.get_signing_key("k2") is not None

    assert fetcher.calls == 2


def test_cache_expires_after_one_hour():
    fetcher, clock = FakeJWKS("k1"), FakeClock()
    client = make_client(fetcher, clock)
    client.get_signing_key("k1")

    clock.now += 3601
    client.get_signing_key("k1")

    assert fetcher.calls == 2


@pytest.mark.parametrize("kid", [None, "", 123, "x" * 200])
def test_kid_is_required_and_bounded_before_looking_up_keys(kid):
    fetcher, clock = FakeJWKS("k1"), FakeClock()
    client = make_client(fetcher, clock)

    with pytest.raises(unknown_key_error()):
        client.get_signing_key(kid)

    assert fetcher.calls == 0
