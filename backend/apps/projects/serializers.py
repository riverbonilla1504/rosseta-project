"""Serializadores de proyectos (contracts/projects-api.yaml de la feature 003).

Las reglas de los campos viven en services.create_project; la entrada solo fija la forma (y
rechaza campos que no admite la operación) para no repetirlas aquí.
"""

from typing import Any

from rest_framework import serializers

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
