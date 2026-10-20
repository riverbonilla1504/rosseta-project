from django.urls import path

from .views import ProjectDetailView, ProjectListCreateView

urlpatterns = [
    path("projects", ProjectListCreateView.as_view(), name="projects"),
    # Texto (no uuid:): un identificador inválido también llega a la vista y da not_found.
    path("projects/<str:project_id>", ProjectDetailView.as_view(), name="project-detail"),
]
