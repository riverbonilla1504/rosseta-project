"""Catálogo del esquema del cliente — docs/04-datos/02-diccionario-de-datos.md (catalog_*).

Implementa FR-026 de specs/003-proyectos-y-nucleo-de-datos (ROS-175) tal como el diccionario,
más el índice de la cola de data-model.md. Esta feature solo crea los modelos: la ingesta
(004) y el motor (005) los rellenan.
"""

from django.conf import settings
from django.db import models

from apps.core.models import OwnedQuerySet, TimeStampedModel, UUIDModel, enum_check


class Level(models.TextChoices):
    CONFIRMED = "CONFIRMED"
    HIGH_UNVALIDATED = "HIGH_UNVALIDATED"
    INFERRED = "INFERRED"
    HYPOTHESIS = "HYPOTHESIS"
    UNKNOWN = "UNKNOWN"


class Origin(models.TextChoices):
    ENGINE = "ENGINE"
    HUMAN = "HUMAN"
    PROPAGATION = "PROPAGATION"
    HUMAN_EDIT = "HUMAN_EDIT"


class SemanticType(models.TextChoices):
    DATE = "DATE"
    TIMESTAMP = "TIMESTAMP"
    AMOUNT = "AMOUNT"
    CODE = "CODE"
    IDENTIFIER = "IDENTIFIER"
    FLAG = "FLAG"
    ENUM = "ENUM"
    TEXT = "TEXT"
    USER = "USER"
    CONSTANT = "CONSTANT"


class DetectedPattern(models.TextChoices):
    DATE_YYYYMMDD = "DATE_YYYYMMDD"
    AMOUNT = "AMOUNT"
    CODE = "CODE"
    ENUM = "ENUM"
    FLAG = "FLAG"
    CONSTANT = "CONSTANT"
    EMPTY = "EMPTY"
    FREE_TEXT = "FREE_TEXT"


class Table(UUIDModel, TimeStampedModel):
    project = models.ForeignKey("projects.Project", on_delete=models.CASCADE, related_name="tables")
    schema_name = models.CharField(max_length=128, blank=True)
    name = models.CharField(max_length=128)
    business_name = models.CharField(max_length=200, null=True, blank=True)  # noqa: DJ001
    row_count = models.BigIntegerField(null=True, blank=True)
    column_count = models.IntegerField(default=0)
    has_declared_fks = models.BooleanField(default=False)
    first_source = models.ForeignKey(
        "sources.Source", on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )

    objects = OwnedQuerySet.as_manager()

    class Meta:
        db_table = "catalog_table"

    def __str__(self) -> str:
        return str(self.id)


class Column(UUIDModel, TimeStampedModel):
    # Desnormalizado para consultas por proyecto (propagación, cola).
    project = models.ForeignKey(
        "projects.Project", on_delete=models.CASCADE, related_name="columns"
    )
    table = models.ForeignKey(Table, on_delete=models.CASCADE, related_name="columns")
    name = models.CharField(max_length=128)
    name_normalized = models.CharField(max_length=128)
    ordinal = models.IntegerField()
    data_type = models.CharField(max_length=60)
    data_type_normalized = models.CharField(max_length=60)
    type_length = models.IntegerField(null=True, blank=True)
    type_precision = models.IntegerField(null=True, blank=True)
    type_scale = models.IntegerField(null=True, blank=True)
    is_nullable = models.BooleanField(default=True)
    is_primary_key = models.BooleanField(default=False)
    is_unique = models.BooleanField(default=False)
    declared_fk_target = models.CharField(max_length=260, null=True, blank=True)  # noqa: DJ001
    default_expression = models.CharField(max_length=200, null=True, blank=True)  # noqa: DJ001
    is_pii = models.BooleanField(default=False)

    objects = OwnedQuerySet.as_manager()

    class Meta:
        db_table = "catalog_column"

    def __str__(self) -> str:
        return str(self.id)


class ColumnInterpretation(UUIDModel, TimeStampedModel):
    """Conclusión vigente sobre una columna (1:1)."""

    column = models.OneToOneField(Column, on_delete=models.CASCADE, related_name="interpretation")
    project = models.ForeignKey(
        "projects.Project", on_delete=models.CASCADE, related_name="interpretations"
    )
    business_name = models.CharField(max_length=200, null=True, blank=True)  # noqa: DJ001
    description = models.TextField(blank=True, default="")
    semantic_type = models.CharField(  # noqa: DJ001
        max_length=30, choices=SemanticType.choices, null=True, blank=True
    )
    references_column = models.ForeignKey(
        Column, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    level = models.CharField(max_length=20, choices=Level.choices)
    score = models.DecimalField(max_digits=4, decimal_places=3, null=True, blank=True)
    score_breakdown = models.JSONField(default=list)
    origin = models.CharField(max_length=12, choices=Origin.choices)
    confirmed_by_action = models.ForeignKey(
        "review.ReviewAction", on_delete=models.PROTECT, null=True, blank=True, related_name="+"
    )
    confirmed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="+",
    )
    confirmed_at = models.DateTimeField(null=True, blank=True)
    has_open_conflict = models.BooleanField(default=False)
    impact = models.IntegerField(default=0)
    engine_version = models.CharField(max_length=20)
    computed_at = models.DateTimeField()

    objects = OwnedQuerySet.as_manager()

    class Meta:
        db_table = "catalog_column_interpretation"
        constraints = [
            enum_check("level", Level, "catalog_interpretation_level_valid"),
            enum_check("origin", Origin, "catalog_interpretation_origin_valid"),
            enum_check(
                "semantic_type",
                SemanticType,
                "catalog_interpretation_semantic_type_valid",
                nullable=True,
            ),
            # RN-02: solo una acción humana registrada produce CONFIRMED (Constitución III).
            models.CheckConstraint(
                condition=(
                    models.Q(level=Level.CONFIRMED, confirmed_by_action__isnull=False)
                    | (
                        ~models.Q(level=Level.CONFIRMED)
                        & models.Q(confirmed_by_action__isnull=True)
                    )
                ),
                name="catalog_interpretation_confirmed_iff_action",
            ),
        ]
        indexes = [
            models.Index(fields=["project", "level", "-impact"], name="catalog_interp_queue_idx"),
        ]

    def __str__(self) -> str:
        return str(self.id)


class ProfileQuerySet(OwnedQuerySet):
    # El perfil no tiene project_id en el diccionario: el propietario se alcanza por la columna.
    owner_path = "column__project__owner"


class ColumnProfile(UUIDModel, TimeStampedModel):
    """Perfil de una columna calculado desde una muestra (ROS-123)."""

    column = models.ForeignKey(Column, on_delete=models.CASCADE, related_name="profiles")
    source = models.ForeignKey("sources.Source", on_delete=models.CASCADE, related_name="profiles")
    row_count = models.BigIntegerField()
    null_count = models.BigIntegerField()
    null_ratio = models.DecimalField(max_digits=6, decimal_places=5)
    distinct_count = models.BigIntegerField()
    min_value = models.CharField(max_length=200, null=True, blank=True)  # noqa: DJ001
    max_value = models.CharField(max_length=200, null=True, blank=True)  # noqa: DJ001
    top_values = models.JSONField(default=list)
    histogram = models.JSONField(null=True, blank=True)
    detected_pattern = models.CharField(  # noqa: DJ001
        max_length=30, choices=DetectedPattern.choices, null=True, blank=True
    )
    out_of_catalog_count = models.BigIntegerField(null=True, blank=True)
    stats = models.JSONField(default=dict)
    computed_at = models.DateTimeField()

    objects = ProfileQuerySet.as_manager()

    class Meta:
        db_table = "catalog_column_profile"
        constraints = [
            models.UniqueConstraint(
                fields=["column", "source"], name="catalog_profile_column_source_unique"
            ),
            enum_check(
                "detected_pattern",
                DetectedPattern,
                "catalog_profile_detected_pattern_valid",
                nullable=True,
            ),
        ]

    def __str__(self) -> str:
        return str(self.id)
