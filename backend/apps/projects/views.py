"""Vistas de proyectos (contracts/projects-api.yaml de la feature 003). ROS-173.

POST /api/projects: FR-001, FR-003 y FR-004. GET /api/projects/{id}: FR-001 y FR-015 (lo
ajeno, lo inexistente y un identificador inválido responden el mismo not_found).
"""

from typing import Any

from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.ownership import get_owned_or_404

from .models import Project
from .selectors import with_summary
from .serializers import ProjectCreateSerializer, ProjectSummarySerializer
from .services import create_project

PROJECT_ID = OpenApiParameter(
    "project_id", OpenApiTypes.STR, OpenApiParameter.PATH, description="UUID del proyecto."
)


def _summary(user: Any, project_id: Any) -> Project:
    return with_summary(Project.objects.for_user(user)).get(pk=project_id)


class ProjectListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="createProject",
        request=ProjectCreateSerializer,
        responses={201: ProjectSummarySerializer},
        tags=["proyectos"],
    )
    def post(self, request: Request) -> Response:
        serializer = ProjectCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        project = create_project(
            request.user,
            name=serializer.validated_data.get("name"),
            source_dialect=serializer.validated_data.get("source_dialect"),
        )
        data = ProjectSummarySerializer(_summary(request.user, project.pk)).data
        return Response(data, status=status.HTTP_201_CREATED)


class ProjectDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="getProject",
        parameters=[PROJECT_ID],
        responses=ProjectSummarySerializer,
        tags=["proyectos"],
    )
    def get(self, request: Request, project_id: str) -> Response:
        project = get_owned_or_404(
            with_summary(Project.objects.for_user(request.user)), project_id, request
        )
        return Response(ProjectSummarySerializer(project).data)
