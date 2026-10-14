"""URLconf de prueba: las rutas reales más una vista sin permisos explícitos (T043)."""

from django.urls import include, path
from rest_framework.response import Response
from rest_framework.views import APIView


class ProbeWithoutExplicitPermissions(APIView):
    """Vista nueva que olvida declarar permisos: debe quedar protegida por defecto (FR-012)."""

    def get(self, request):
        return Response({"leak": True})


urlpatterns = [
    path("", include("config.urls")),
    path("api/probe-default-permissions", ProbeWithoutExplicitPermissions.as_view()),
]
