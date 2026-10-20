"""Vistas de proyectos (contracts/projects-api.yaml de la feature 003). ROS-173.

GET /api/projects: FR-005 (paginación de 05-api §1, cifras sin consultas por proyecto).
POST /api/projects: FR-001, FR-003 y FR-004. GET /api/projects/{id}: FR-001 y FR-015 (lo
ajeno, lo inexistente y un identificador inválido responden el mismo not_found).
PATCH /api/projects/{id}: FR-010…FR-013 (renombrar, descripción, archivar y desarchivar).
GET /api/projects/{id}/state: FR-021 y FR-022 (ROS-177).
"""

from typing import Any

from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import exceptions, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.ownership import get_owned_or_404
from apps.core.pagination import StandardPagination

from .models import Project
from .selectors import get_project_state, list_projects, with_summary
from .serializers import (
    ProjectCreateSerializer,
    ProjectListQuerySerializer,
    ProjectStateSerializer,
    ProjectSummarySerializer,
    ProjectUpdateSerializer,
)
from .services import create_project, update_project

PROJECT_ID = OpenApiParameter(
    "project_id", OpenApiTypes.STR, OpenApiParameter.PATH, description="UUID del proyecto."
)


def _summary(user: Any, project_id: Any) -> Project:
    return with_summary(Project.objects.for_user(user)).get(pk=project_id)


class ProjectListCreateView(APIView):
    permission_classes = [IsAuthenticated]
    # Declarada en la vista para que el esquema OpenAPI documente la paginación de la lista.
    pagination_class = StandardPagination

    @extend_schema(
        operation_id="listProjects",
        parameters=[ProjectListQuerySerializer],
        responses=ProjectSummarySerializer(many=True),
        tags=["proyectos"],
    )
    def get(self, request: Request) -> Response:
        query = ProjectListQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        projects = list_projects(request.user, archived=query.validated_data["archived"])
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(projects, request, view=self)
        return paginator.get_paginated_response(ProjectSummarySerializer(page, many=True).data)

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

    @extend_schema(
        operation_id="updateProject",
        parameters=[PROJECT_ID],
        request=ProjectUpdateSerializer,
        responses=ProjectSummarySerializer,
        tags=["proyectos"],
    )
    def patch(self, request: Request, project_id: str) -> Response:
        project = get_owned_or_404(Project.objects.for_user(request.user), project_id, request)
        if not request.data:
            # minProperties: 1 del contrato; sin texto propio, el mensaje genérico de validación.
            raise exceptions.ValidationError({})
        serializer = ProjectUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        update_project(project, **serializer.validated_data)
        return Response(ProjectSummarySerializer(_summary(request.user, project.pk)).data)


class ProjectStateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="getProjectState",
        parameters=[PROJECT_ID],
        responses=ProjectStateSerializer,
        tags=["proyectos"],
    )
    def get(self, request: Request, project_id: str) -> Response:
        project = get_owned_or_404(
            with_summary(Project.objects.for_user(request.user)), project_id, request
        )
        return Response(ProjectStateSerializer(get_project_state(project)).data)
