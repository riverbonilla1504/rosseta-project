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


# --- Feature 003: contracts/projects-api.yaml (T062, ROS-173) -------------------------------

PROJECTS_CONTRACT = (
    Path(__file__).resolve().parents[3]
    / "specs"
    / "003-proyectos-y-nucleo-de-datos"
    / "contracts"
    / "projects-api.yaml"
)
PROJECT_OPERATIONS = [
    ("/api/projects", "get", "listProjects", "200"),
    ("/api/projects", "post", "createProject", "201"),
    ("/api/projects/{project_id}", "get", "getProject", "200"),
    ("/api/projects/{project_id}", "patch", "updateProject", "200"),
    ("/api/projects/{project_id}/state", "get", "getProjectState", "200"),
]


@pytest.fixture(scope="module")
def projects_contract():
    return yaml.safe_load(PROJECTS_CONTRACT.read_text(encoding="utf-8"))


def resolve(document, node):
    """Sigue los $ref locales (#/components/…) hasta el esquema."""
    while "$ref" in node:
        *_, kind, name = node["$ref"].split("/")
        node = document["components"][kind][name]
    if "allOf" in node and len(node["allOf"]) == 1:
        return resolve(document, node["allOf"][0])
    return node


def shape(document, node):
    """Forma comparable: propiedades, obligatorias, enums y anidados (sin descripciones)."""
    node = resolve(document, node)
    if node.get("type") == "array" or "items" in node:
        return ["array", shape(document, node["items"])]
    if "properties" in node:
        return {
            "required": sorted(node.get("required", [])),
            "properties": {
                name: shape(document, child) for name, child in sorted(node["properties"].items())
            },
        }
    if "enum" in node:
        return ("enum", tuple(sorted(value for value in node["enum"] if value is not None)))
    return node.get("type", "object")


def success_schema(document, path, method, code):
    content = document["paths"][path][method]["responses"][code]["content"]
    return content["application/json"]["schema"]


@pytest.mark.story("ROS-78")
@pytest.mark.fr("003:FR-005")
@pytest.mark.parametrize(("path", "method", "operation_id", "code"), PROJECT_OPERATIONS)
def test_project_operations_match_the_contract(
    generated, projects_contract, path, method, operation_id, code
):
    expected = projects_contract["paths"][path][method]
    actual = generated["paths"][path][method]

    assert expected["operationId"] == actual["operationId"] == operation_id
    assert {"bearerAuth": []} in actual["security"]
    assert shape(generated, success_schema(generated, path, method, code)) == shape(
        projects_contract, success_schema(projects_contract, path, method, code)
    )


@pytest.mark.story("ROS-78")
@pytest.mark.fr("003:FR-001")
@pytest.mark.parametrize(
    ("path", "method"),
    [("/api/projects", "post"), ("/api/projects/{project_id}", "patch")],
)
def test_project_request_bodies_have_the_contract_fields(
    generated, projects_contract, path, method
):
    def fields(document):
        body = document["paths"][path][method]["requestBody"]["content"]["application/json"]
        return set(resolve(document, body["schema"])["properties"])

    assert fields(generated) == fields(projects_contract)


@pytest.mark.story("ROS-78")
@pytest.mark.fr("003:FR-005")
def test_list_and_path_parameters_match_the_contract(generated, projects_contract):
    def parameters(document, path, method):
        operation = document["paths"][path][method]
        listed = operation.get("parameters", []) + document["paths"][path].get("parameters", [])
        return {
            (p["name"], p["in"], resolve(document, p["schema"]).get("type"))
            for p in (resolve(document, item) for item in listed)
        }

    assert parameters(generated, "/api/projects", "get") == parameters(
        projects_contract, "/api/projects", "get"
    )
    for method in ("get", "patch"):
        assert parameters(generated, "/api/projects/{project_id}", method) == {
            ("project_id", "path", "string")
        }


@pytest.mark.story("ROS-89")
@pytest.mark.fr("002:FR-013")
def test_the_schema_is_generated_without_warnings_or_errors(tmp_path):
    """EC-025: HealthView hacía fallar la generación del esquema ("unable to guess serializer")."""
    from django.core.management import call_command

    call_command("spectacular", "--fail-on-warn", "--validate", "--file", str(tmp_path / "s.yaml"))
