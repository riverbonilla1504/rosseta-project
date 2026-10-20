"""Siembra del caso de referencia CORE_DEMO — research R-12 de la feature 003 (ROS-176).

Implementa FR-027 (herramienta del equipo, no una función de la interfaz) y FR-024 (todo o nada)
a partir de la instantánea sintética tests/fixtures/core_demo_snapshot.json, que reproduce
docs/04-datos/03-datos-de-referencia.md §2, §3, §5 y §6. Es idempotente: si la persona ya tiene
un CORE_DEMO activo no hace nada. Los niveles son datos de prueba (engine_version = "fixture");
los CONFIRMED se apoyan en una ReviewAction, como exige el diccionario (Constitución III).

    python manage.py seed_reference_project --owner-sub "google-oauth2|…"
"""

import json
import re
from datetime import datetime
from decimal import Decimal
from pathlib import Path
from typing import Any

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.accounts.models import User
from apps.catalog.models import Column, ColumnInterpretation, Level, Origin, Table
from apps.projects.models import Project
from apps.projects.services import create_project
from apps.review.models import ActionKind, ReviewAction
from apps.sources.models import NamingRule, Source

SNAPSHOT = Path(settings.BASE_DIR) / "tests" / "fixtures" / "core_demo_snapshot.json"
ENGINE_VERSION = "fixture"
# Tipo con longitud, o con precisión y escala: varchar(20), decimal(9,0).
TYPE_PARAMETERS = re.compile(r"^(?P<base>\w+)\((?P<first>\d+)(?:,(?P<second>\d+))?\)$")
LENGTH_TYPES = {"char", "varchar", "nchar", "nvarchar"}


def type_parts(data_type: str) -> dict[str, int | None]:
    """type_length, type_precision y type_scale descompuestos del tipo (diccionario)."""
    parts: dict[str, int | None] = {"type_length": None, "type_precision": None, "type_scale": None}
    match = TYPE_PARAMETERS.match(data_type)
    if match is None:
        return parts
    first, second = int(match["first"]), match["second"]
    if match["base"] in LENGTH_TYPES:
        parts["type_length"] = first
    else:
        parts["type_precision"] = first
        parts["type_scale"] = int(second) if second is not None else None
    return parts


def _score(value: str | None) -> Decimal | None:
    return Decimal(value) if value is not None else None


@transaction.atomic
def seed(owner: User, snapshot: dict[str, Any]) -> tuple[Project, bool]:
    """Crea CORE_DEMO para la persona en una sola transacción; (proyecto, si se creó)."""
    spec = snapshot["project"]
    existing = Project.objects.for_user(owner).active().filter(name__iexact=spec["name"]).first()
    if existing is not None:
        return existing, False

    computed_at = datetime.fromisoformat(snapshot["computed_at"])
    project = create_project(owner, name=spec["name"], source_dialect=spec["source_dialect"])
    sources = [
        Source.objects.create(
            project=project,
            dialect=spec["source_dialect"],
            uploaded_by=owner,
            processed_at=computed_at,
            **source,
        )
        for source in snapshot["sources"]
    ]
    for rule in snapshot["naming_rules"]:
        NamingRule.objects.get_or_create(
            project=None,
            pattern=rule["pattern"],
            match_type=rule["match_type"],
            defaults={"meaning": rule["meaning"], "semantic_type": rule["semantic_type"]},
        )

    confirmations = {(item["table"], item["column"]) for item in snapshot["confirmations"]}
    for table_spec in snapshot["tables"]:
        table = Table.objects.create(
            project=project,
            name=table_spec["name"],
            business_name=table_spec["business_name"],
            row_count=table_spec["row_count"],
            column_count=len(table_spec["columns"]),
            first_source=sources[0] if sources else None,
        )
        for ordinal, column_spec in enumerate(table_spec["columns"], start=1):
            _seed_column(
                owner,
                table,
                ordinal,
                column_spec,
                confirmed=(table.name, column_spec["name"]) in confirmations,
                computed_at=computed_at,
            )
    return project, True


def _seed_column(
    owner: User,
    table: Table,
    ordinal: int,
    spec: dict[str, Any],
    *,
    confirmed: bool,
    computed_at: datetime,
) -> None:
    column = Column.objects.create(
        project=table.project,
        table=table,
        name=spec["name"],
        name_normalized=spec["name"].upper(),
        ordinal=ordinal,
        data_type=spec["data_type"],
        data_type_normalized=spec["data_type"].lower(),
        is_nullable=spec["is_nullable"],
        is_pii=spec["is_pii"],
        **type_parts(spec["data_type"].lower()),
    )
    interpretation: dict[str, Any] = {
        "business_name": spec["business_name"],
        "level": spec["level"],
        "score": _score(spec["score"]),
        "impact": spec["impact"],
        "origin": Origin.ENGINE,
    }
    if confirmed:
        # La acción humana registrada es lo que produce CONFIRMED (RN-02). Antes de ella, un
        # puntaje del motor ≥ 0,85 era "Alta · sin validar" (03-datos-de-referencia §2).
        action = ReviewAction.objects.create(
            project=table.project,
            column=column,
            actor=owner,
            action=ActionKind.CONFIRM,
            before={"level": Level.HIGH_UNVALIDATED, "business_name": spec["business_name"]},
            after={"level": Level.CONFIRMED, "business_name": spec["business_name"]},
            engine_version=ENGINE_VERSION,
        )
        interpretation.update(
            origin=Origin.HUMAN,
            confirmed_by_action=action,
            confirmed_by=owner,
            confirmed_at=computed_at,
        )
    ColumnInterpretation.objects.create(
        column=column,
        project=table.project,
        engine_version=ENGINE_VERSION,
        computed_at=computed_at,
        **interpretation,
    )


class Command(BaseCommand):
    help = "Siembra el proyecto de ejemplo CORE_DEMO (datos sintéticos) para una persona."

    def add_arguments(self, parser: Any) -> None:
        parser.add_argument("--owner-sub", required=True, help="auth0_sub de la persona")

    def handle(self, *args: Any, **options: Any) -> None:
        owner = User.objects.filter(auth0_sub=options["owner_sub"]).first()
        if owner is None:
            raise CommandError("No hay ninguna cuenta con ese identificador; entra antes una vez.")
        snapshot = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
        project, created = seed(owner, snapshot)
        verb = "creado" if created else "ya existía"
        self.stdout.write(f"CORE_DEMO {verb}: {project.id}")
