"""CSP para las respuestas JSON de la API (07-seguridad §5; FR-034, ROS-190).

El resto de cabeceras (nosniff, X-Frame-Options, Referrer-Policy, HSTS en producción) las
pone Django con los ajustes de seguridad. Sin dependencias nuevas (Constitución VI).
"""

from collections.abc import Callable

from django.http import HttpRequest, HttpResponse

API_CSP = "default-src 'none'; frame-ancestors 'none'"


class JsonContentSecurityPolicyMiddleware:
    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        response = self.get_response(request)
        response.headers.setdefault("Content-Security-Policy", API_CSP)
        return response
