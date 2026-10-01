"""Paginación estándar: ?page=1&page_size=50 (máx. 200). docs/03-arquitectura/05-api.md §1."""

from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 200
