"""Rutas raíz: /api/… (datos) y /auth/… (sesión, feature 002).

Ver docs/03-arquitectura/05-api.md.
"""

from django.conf import settings
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework.permissions import AllowAny

urlpatterns = [
    path("api/", include("apps.core.urls")),
    path("api/", include("apps.accounts.urls")),
    # Pública de forma explícita (FR-012): descripción del contrato, sin autenticación.
    path(
        "api/schema/",
        SpectacularAPIView.as_view(authentication_classes=[], permission_classes=[AllowAny]),
        name="schema",
    ),
]

if settings.DEBUG:
    urlpatterns += [
        path(
            "api/docs/",
            SpectacularSwaggerView.as_view(
                url_name="schema", authentication_classes=[], permission_classes=[AllowAny]
            ),
            name="api-docs",
        ),
    ]
