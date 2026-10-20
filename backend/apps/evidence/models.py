"""Evidencia normalizada y conflictos — diccionario de datos (evidence_*).

Implementa FR-025 y FR-026 de specs/003-proyectos-y-nucleo-de-datos (ROS-175): la evidencia
no se edita (se borra y se regenera) y siempre lleva su cita (RN-10, Constitución III).
"""

from typing import Any

from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel, UUIDModel, enum_check

EVIDENCE_FORMAT_VERSION = 1


class EvidenceKind(models.TextChoices):
    NAME_CONVENTION = "NAME_CONVENTION"
    DDL_TYPE = "DDL_TYPE"
    DDL_CONSTRAINT = "DDL_CONSTRAINT"
    DDL_DECLARED_FK = "DDL_DECLARED_FK"
    PROFILE_PATTERN = "PROFILE_PATTERN"
    PROFILE_EMPTY = "PROFILE_EMPTY"
    CONTAINMENT = "CONTAINMENT"
    HUMAN_REJECTION = "HUMAN_REJECTION"
    HUMAN_EDIT = "HUMAN_EDIT"


class IndependenceClass(models.TextChoices):
    NAME = "NAME"
    DDL = "DDL"
    PROFILE = "PROFILE"
    CONTAINMENT = "CONTAINMENT"
    HUMAN = "HUMAN"


class ClaimField(models.TextChoices):
    BUSINESS_NAME = "BUSINESS_NAME"
    SEMANTIC_TYPE = "SEMANTIC_TYPE"
    REFERENCES = "REFERENCES"
    NO_INFORMATION = "NO_INFORMATION"


class ConflictStatus(models.TextChoices):
    OPEN = "OPEN"
    RESOLVED = "RESOLVED"


class ConflictResolution(models.TextChoices):
    HUMAN = "HUMAN"
    RECOMPUTE = "RECOMPUTE"
    REJECTION = "REJECTION"


class Evidence(UUIDModel):
    """Contrato versionado (format_version). Solo created_at: la evidencia no se edita."""

    project = models.ForeignKey(
        "projects.Project", on_delete=models.CASCADE, related_name="evidences"
    )
    column = models.ForeignKey("catalog.Column", on_delete=models.CASCADE, related_name="evidences")
    source = models.ForeignKey(
        "sources.Source", on_delete=models.CASCADE, null=True, blank=True, related_name="evidences"
    )
    naming_rule = models.ForeignKey(
        "sources.NamingRule",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="evidences",
    )
    review_action = models.ForeignKey(
        "review.ReviewAction",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="evidences",
    )
    kind = models.CharField(max_length=30, choices=EvidenceKind.choices)
    independence_class = models.CharField(max_length=15, choices=IndependenceClass.choices)
    claim_field = models.CharField(max_length=20, choices=ClaimField.choices)
    claim_value = models.CharField(max_length=260, null=True, blank=True)  # noqa: DJ001
    polarity = models.SmallIntegerField()
    weight = models.DecimalField(max_digits=3, decimal_places=2)
    strength = models.DecimalField(max_digits=4, decimal_places=3)
    citation = models.JSONField()
    format_version = models.SmallIntegerField(default=EVIDENCE_FORMAT_VERSION)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "evidence_evidence"
        constraints = [
            enum_check("kind", EvidenceKind, "evidence_evidence_kind_valid"),
            enum_check(
                "independence_class", IndependenceClass, "evidence_evidence_independence_valid"
            ),
            enum_check("claim_field", ClaimField, "evidence_evidence_claim_field_valid"),
        ]

    def __str__(self) -> str:
        return str(self.id)

    def save(self, *args: Any, **kwargs: Any) -> None:
        if not self._state.adding:
            raise ValueError("La evidencia no se edita: se borra y se vuelve a generar (FR-025).")
        if not self.citation:
            raise ValueError("Toda evidencia lleva su cita (RN-10).")
        super().save(*args, **kwargs)


class Conflict(UUIDModel, TimeStampedModel):
    project = models.ForeignKey(
        "projects.Project", on_delete=models.CASCADE, related_name="conflicts"
    )
    column = models.ForeignKey("catalog.Column", on_delete=models.CASCADE, related_name="conflicts")
    claim_field = models.CharField(max_length=20, choices=ClaimField.choices)
    values = models.JSONField(default=list)
    status = models.CharField(
        max_length=10, choices=ConflictStatus.choices, default=ConflictStatus.OPEN
    )
    resolution = models.CharField(  # noqa: DJ001
        max_length=20, choices=ConflictResolution.choices, null=True, blank=True
    )
    resolution_note = models.TextField(null=True, blank=True)  # noqa: DJ001
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="+",
    )
    detected_at = models.DateTimeField()
    resolved_at = models.DateTimeField(null=True, blank=True)
    evidences = models.ManyToManyField(
        Evidence, related_name="conflicts", db_table="evidence_conflict_evidences"
    )

    class Meta:
        db_table = "evidence_conflict"
        constraints = [
            enum_check("claim_field", ClaimField, "evidence_conflict_claim_field_valid"),
            enum_check("status", ConflictStatus, "evidence_conflict_status_valid"),
            enum_check(
                "resolution",
                ConflictResolution,
                "evidence_conflict_resolution_valid",
                nullable=True,
            ),
        ]

    def __str__(self) -> str:
        return str(self.id)
