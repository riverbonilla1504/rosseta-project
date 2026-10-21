"""El esquema generado coincide con contracts/accounts-api.yaml (T038, T096; RNF-34)."""

from pathlib import Path

import pytest
import yaml
from drf_spectacular.generators import SchemaGenerator

pytestmark = [pytest.mark.story("ROS-89"), pytest.mark.fr("002:FR-013")]

CONTRACT = (
    Path(__file__).resolve().parents[3]
    / "specs"
    / "002-autenticacion-oauth"
    / "contracts"
    / "accounts-api.yaml"
)


@pytest.fixture(scope="module")
def generated():
    return SchemaGenerator().get_schema(request=None, public=True)


@pytest.fixture(scope="module")
def contract():
    return yaml.safe_load(CONTRACT.read_text(encoding="utf-8"))


@pytest.mark.parametrize(
    ("path", "method", "operation_id"),
    [("/api/me", "get", "getMe"), ("/api/me/onboarding/complete", "post", "completeOnboarding")],
)
def test_operations_match_the_contract(generated, contract, path, method, operation_id):
    assert contract["paths"][path][method]["operationId"] == operation_id
    operation = generated["paths"][path][method]
    assert operation["operationId"] == operation_id
    assert {"bearerAuth": []} in operation["security"]
    assert operation["responses"]["200"]["content"]["application/json"]["schema"]["$ref"].endswith(
        "/Me"
    )


def test_me_schema_has_the_contract_fields(generated, contract):
    expected = contract["components"]["schemas"]["Me"]
    actual = generated["components"]["schemas"]["Me"]

    assert set(actual["properties"]) == set(expected["properties"])
    assert set(actual["required"]) == set(expected["required"])
    assert actual["properties"]["avatar_url"].get("nullable") is True


def test_bearer_auth_scheme_matches(generated, contract):
    expected = contract["components"]["securitySchemes"]["bearerAuth"]
    actual = generated["components"]["securitySchemes"]["bearerAuth"]

    assert (actual["type"], actual["scheme"], actual["bearerFormat"]) == (
        expected["type"],
        expected["scheme"],
        expected["bearerFormat"],
    )
