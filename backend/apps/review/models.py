"""Registro inmutable de acciones humanas — diccionario de datos (review_review_action).

Implementa FR-023 y FR-026 de specs/003-proyectos-y-nucleo-de-datos (ROS-175; RN-14, RNF-22,
Constitución IV): save() y delete() impiden modificar una acción y un trigger BEFORE UPDATE
OR DELETE lo garantiza también en la base (migración 0002_immutable_trigger).
"""

from typing import Any

from django.conf import settings
from django.db import models

from apps.core.models import UUIDModel, enum_check


class ActionKind(models.TextChoices):
    CONFIRM = "CONFIRM"
    EDIT = "EDIT"
    REJECT = "REJECT"
    REVERT = "REVERT"


class ReviewAction(UUIDModel):
    """Sin updated_at: una acción no cambia nunca."""

    project = models.ForeignKey(
        "projects.Project", on_delete=models.CASCADE, related_name="review_actions"
    )
    column = models.ForeignKey(
        "catalog.Column", on_delete=models.CASCADE, related_name="review_actions"
    )
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="+")
    action = models.CharField(max_length=12, choices=ActionKind.choices)
    reason = models.TextField(null=True, blank=True)  # noqa: DJ001
    before = models.JSONField()
    after = models.JSONField()
    propagated_count = models.IntegerField(default=0)
    reverted_count = models.IntegerField(default=0)
    engine_version = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "review_review_action"
        constraints = [
            enum_check("action", ActionKind, "review_action_kind_valid"),
            models.CheckConstraint(
                condition=~models.Q(action=ActionKind.REJECT)
                | (models.Q(reason__isnull=False) & ~models.Q(reason="")),
                name="review_action_reject_requires_reason",
            ),
        ]

    def __str__(self) -> str:
        return str(self.id)

    def save(self, *args: Any, **kwargs: Any) -> None:
        if not self._state.adding:
            raise ValueError("Una acción de revisión es inmutable (FR-023).")
        super().save(*args, **kwargs)

    def delete(self, *args: Any, **kwargs: Any) -> tuple[int, dict[str, int]]:
        raise ValueError("Una acción de revisión es inmutable (FR-023).")
