"""Fuentes de evidencia y convenciones de nombres — diccionario de datos (sources_*).

Implementa FR-026 de specs/003-proyectos-y-nucleo-de-datos (ROS-175). El peso de una regla
de nombres no supera 0,40 (Constitución III, CHECK en la base).
"""

from decimal import Decimal
from typing import Any

from django.conf import settings
from django.db import models
from django.db.models.functions import Cast, Coalesce

from apps.catalog.models import SemanticType
from apps.core.models import OwnedQuerySet, TimeStampedModel, UUIDModel, enum_check
from apps.projects.models import Dialect

MAX_NAMING_RULE_WEIGHT = Decimal("0.40")


class SourceKind(models.TextChoices):
    SCHEMA_DDL = "SCHEMA_DDL"
    DATA_SAMPLE = "DATA_SAMPLE"


class SourceStatus(models.TextChoices):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    READY = "READY"
    FAILED = "FAILED"


class MatchType(models.TextChoices):
    PREFIX = "PREFIX"
    SUFFIX = "SUFFIX"
    TOKEN = "TOKEN"  # noqa: S105  tipo de coincidencia, no una credencial
    EXACT = "EXACT"
    REGEX = "REGEX"


class FixedCharField(models.CharField):
    """char(n) de PostgreSQL (el diccionario fija sha256 como char(64))."""

    def db_type(self, connection: Any) -> str:
        return f"char({self.max_length})"


class Source(UUIDModel, TimeStampedModel):
    project = models.ForeignKey(
        "projects.Project", on_delete=models.CASCADE, related_name="sources"
    )
    kind = models.CharField(max_length=20, choices=SourceKind.choices)
    status = models.CharField(
        max_length=12, choices=SourceStatus.choices, default=SourceStatus.PENDING
    )
    original_filename = models.CharField(max_length=255)
    storage_path = models.CharField(max_length=500, null=True, blank=True)  # noqa: DJ001
    size_bytes = models.BigIntegerField()
    sha256 = FixedCharField(max_length=64)
    dialect = models.CharField(  # noqa: DJ001
        max_length=20, choices=Dialect.choices, null=True, blank=True
    )
    target_table = models.ForeignKey(
        "catalog.Table", on_delete=models.SET_NULL, null=True, blank=True, related_name="samples"
    )
    encoding = models.CharField(max_length=20, null=True, blank=True)  # noqa: DJ001
    delimiter = models.CharField(max_length=4, null=True, blank=True)  # noqa: DJ001
    stats = models.JSONField(default=dict)
    error_message = models.TextField(null=True, blank=True)  # noqa: DJ001
    evidence_count = models.IntegerField(default=0)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="+"
    )
    processed_at = models.DateTimeField(null=True, blank=True)

    objects = OwnedQuerySet.as_manager()

    class Meta:
        db_table = "sources_source"
        constraints = [
            enum_check("kind", SourceKind, "sources_source_kind_valid"),
            enum_check("status", SourceStatus, "sources_source_status_valid"),
            enum_check("dialect", Dialect, "sources_source_dialect_valid", nullable=True),
            # Idempotencia de la carga.
            models.UniqueConstraint(
                fields=["project", "kind", "sha256"], name="sources_source_project_kind_sha_unique"
            ),
        ]

    def __str__(self) -> str:
        return str(self.id)


class NamingRuleQuerySet(OwnedQuerySet):
    def for_user(self, user: Any) -> "NamingRuleQuerySet":
        """Las del proyecto de la persona más las globales (estas, de solo lectura)."""
        if user is None or not getattr(user, "is_authenticated", False):
            return self.none()
        return self.filter(models.Q(project__owner=user) | models.Q(project__isnull=True))


class NamingRule(UUIDModel, TimeStampedModel):
    """Convención de nombres (ROS-21, ROS-126). project nulo = regla global de solo lectura."""

    project = models.ForeignKey(
        "projects.Project",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="naming_rules",
    )
    pattern = models.CharField(max_length=60)
    match_type = models.CharField(max_length=10, choices=MatchType.choices)
    meaning = models.CharField(max_length=120)
    semantic_type = models.CharField(  # noqa: DJ001
        max_length=30, choices=SemanticType.choices, null=True, blank=True
    )
    weight = models.DecimalField(max_digits=3, decimal_places=2, default=MAX_NAMING_RULE_WEIGHT)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="+",
    )

    objects = NamingRuleQuerySet.as_manager()

    class Meta:
        db_table = "sources_naming_rule"
        constraints = [
            enum_check("match_type", MatchType, "sources_naming_rule_match_type_valid"),
            enum_check(
                "semantic_type",
                SemanticType,
                "sources_naming_rule_semantic_type_valid",
                nullable=True,
            ),
            models.CheckConstraint(
                condition=models.Q(weight__lte=MAX_NAMING_RULE_WEIGHT),
                name="sources_naming_rule_weight_max_040",
            ),
            # Único (coalesce(project_id, 'global'), pattern, match_type): el uuid se compara
            # como texto para poder unirlo con el literal 'global'.
            models.UniqueConstraint(
                Coalesce(Cast("project", models.TextField()), models.Value("global")),
                "pattern",
                "match_type",
                name="sources_naming_rule_scope_pattern_unique",
            ),
        ]

    def __str__(self) -> str:
        return str(self.id)
