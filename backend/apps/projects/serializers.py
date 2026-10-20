"""Serializadores de proyectos (contracts/projects-api.yaml de la feature 003).

Las reglas de los campos viven en services.create_project; la entrada solo fija la forma (y
rechaza campos que no admite la operación) para no repetirlas aquí.
"""

from typing import Any

from rest_framework import serializers

from apps.catalog.models import Level
from apps.sources.models import Source

from . import messages
from .models import Project


class ProjectCreateSerializer(serializers.Serializer[Any]):
    name = serializers.CharField(
        required=False, allow_null=True, allow_blank=True, trim_whitespace=False
    )
    source_dialect = serializers.CharField(
        required=False, allow_null=True, allow_blank=True, trim_whitespace=False
    )

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        unknown = sorted(set(self.initial_data) - set(self.fields))
        if unknown:
            raise serializers.ValidationError(
                {field: [messages.FIELD_NOT_ALLOWED] for field in unknown}
            )
        return attrs


class ProjectListQuerySerializer(serializers.Serializer[Any]):
    """Parámetros de GET /api/projects además de la paginación (contracts/projects-api.yaml)."""

    archived = serializers.BooleanField(required=False, default=False)


class ProjectSummarySerializer(serializers.ModelSerializer[Project]):
    """Proyecto con las cifras de la lista (requiere selectors.with_summary)."""

    archived = serializers.BooleanField(read_only=True)
    table_count = serializers.IntegerField(read_only=True)
    column_count = serializers.IntegerField(read_only=True)
    confirmed_ratio = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "description",
            "source_dialect",
            "archived",
            "archived_at",
            "created_at",
            "last_activity_at",
            "table_count",
            "column_count",
            "confirmed_ratio",
        ]
        read_only_fields = fields

    def get_confirmed_ratio(self, project: Any) -> float | None:
        """Confirmadas / columnas; null sin columnas (DP-020; el texto lo decide la interfaz)."""
        if not project.column_count:
            return None
        return float(project.confirmed_count) / float(project.column_count)


class LevelCountSerializer(serializers.Serializer[Any]):
    """Las cinco claves de nivel, siempre presentes (contracts/projects-api.yaml)."""

    CONFIRMED = serializers.IntegerField(min_value=0)
    HIGH_UNVALIDATED = serializers.IntegerField(min_value=0)
    INFERRED = serializers.IntegerField(min_value=0)
    HYPOTHESIS = serializers.IntegerField(min_value=0)
    UNKNOWN = serializers.IntegerField(min_value=0)


class CoverageSerializer(serializers.Serializer[Any]):
    total_columns = serializers.IntegerField(min_value=0)
    by_level = LevelCountSerializer()


class StateSourceSerializer(serializers.ModelSerializer[Source]):
    class Meta:
        model = Source
        fields = ["id", "kind", "status", "original_filename", "created_at"]
        read_only_fields = fields


class QueueRowSerializer(serializers.Serializer[Any]):
    column_id = serializers.UUIDField()
    identifier = serializers.CharField(help_text="TABLA.COLUMNA tal como el origen (RN-17)")
    level = serializers.ChoiceField(choices=Level.choices)
    impact = serializers.IntegerField(min_value=0)
    has_open_conflict = serializers.BooleanField()


class ProjectStateSerializer(serializers.Serializer[Any]):
    """Estado al abrir el proyecto (05-api §3.10; requiere selectors.get_project_state)."""

    project = ProjectSummarySerializer()
    coverage = CoverageSerializer()
    sources = StateSourceSerializer(many=True)
    table_count = serializers.IntegerField(min_value=0)
    queue_head = QueueRowSerializer(many=True)
