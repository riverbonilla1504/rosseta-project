"""Paginación estándar: ?page=1&page_size=50 (máx. 200). docs/03-arquitectura/05-api.md §1."""

from typing import Any

from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 200

    def get_paginated_response_schema(self, schema: dict[str, Any]) -> dict[str, Any]:
        # Las cuatro claves van siempre (next y previous pueden ser null), como en
        # specs/003-proyectos-y-nucleo-de-datos/contracts/projects-api.yaml.
        paginated = super().get_paginated_response_schema(schema)
        paginated["required"] = ["count", "next", "previous", "results"]
        return paginated
