"""Rutas raíz: /api/… (datos) y /auth/… (sesión, feature 002).

Ver docs/03-arquitectura/05-api.md.
"""

from django.conf import settings
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path("api/", include("apps.core.urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
]

if settings.DEBUG:
    urlpatterns += [
        path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="api-docs"),
    ]
