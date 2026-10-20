"""Vistas transversales. GET /api/health (docs/03-arquitectura/05-api.md §2).

La respuesta se documenta con extend_schema para que el esquema OpenAPI se genere sin errores
(EC-025, resuelto en T062 de la feature 003); el comportamiento no cambia.
"""

import redis
from django.conf import settings
from django.db import connection
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView


def database_is_reachable() -> bool:
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        return True
    except Exception:  # noqa: BLE001 - cualquier fallo de conexión = no disponible
        return False


def redis_is_reachable() -> bool:
    try:
        return bool(redis.Redis.from_url(settings.REDIS_URL, socket_timeout=1).ping())
    except redis.RedisError:
        return False


_STATUS = ["ok", "error"]
HEALTH_RESPONSE = inline_serializer(
    "Health",
    fields={
        "status": serializers.ChoiceField(choices=_STATUS),
        "checks": inline_serializer(
            "HealthChecks",
            fields={
                "database": serializers.ChoiceField(choices=_STATUS),
                "redis": serializers.ChoiceField(choices=_STATUS),
            },
        ),
    },
)


class HealthView(APIView):
    """Salud del servicio: BD y Redis accesibles. Sin autenticación."""

    authentication_classes = ()
    permission_classes = ()

    @extend_schema(
        operation_id="getHealth",
        responses={200: HEALTH_RESPONSE, 503: HEALTH_RESPONSE},
        auth=[],
        tags=["operación"],
    )
    def get(self, request: Request) -> Response:
        checks = {
            "database": "ok" if database_is_reachable() else "error",
            "redis": "ok" if redis_is_reachable() else "error",
        }
        healthy = all(value == "ok" for value in checks.values())
        return Response(
            {"status": "ok" if healthy else "error", "checks": checks},
            status=200 if healthy else 503,
        )
