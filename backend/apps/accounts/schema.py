"""Esquema OpenAPI de la autenticación (contracts/accounts-api.yaml, bearerAuth)."""

from typing import Any

from drf_spectacular.extensions import OpenApiAuthenticationExtension


class Auth0JWTAuthenticationScheme(OpenApiAuthenticationExtension):
    target_class = "apps.accounts.authentication.Auth0JWTAuthentication"
    name = "bearerAuth"

    def get_security_definition(self, auto_schema: Any) -> dict[str, str]:
        return {"type": "http", "scheme": "bearer", "bearerFormat": "JWT"}
