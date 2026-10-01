"""Vistas transversales. GET /api/health (docs/03-arquitectura/05-api.md §2)."""

import redis
from django.conf import settings
from django.db import connection
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


class HealthView(APIView):
    """Salud del servicio: BD y Redis accesibles. Sin autenticación."""

    authentication_classes = ()
    permission_classes = ()

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
