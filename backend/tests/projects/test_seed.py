"""Siembra del caso de referencia — research R-12 de la feature 003 (ROS-176).

FR-027: seed_reference_project crea CORE_DEMO (tsql) con MOV0010 y sus 11 columnas, nombres de
negocio y niveles de docs/04-datos/03-datos-de-referencia.md §2, las tablas de §3, tablas extra
que repiten PGCOD, CTANRO y PETDOC (§5, 38/21/6), las reglas globales de §6 y las tres
confirmaciones humanas (SUCCOD, MONCOD, FEALT). FR-024: es atómica. SC-006 y SC-007: reejecutarla
no duplica y el resultado es el mismo en cada ejecución.
"""

from unittest.mock import patch

import pytest
from django.core.management import CommandError, call_command

from apps.catalog.models import Column, ColumnInterpretation, Table
from apps.projects.models import Project
from apps.review.models import ReviewAction
from apps.sources.models import NamingRule, Source
from tests.factories.accounts import UserFactory

pytestmark = [pytest.mark.django_db, pytest.mark.story("ROS-81")]

# 03-datos-de-referencia §2: columna, tipo, nombre de negocio y nivel (Alta · sin validar =
# HIGH_UNVALIDATED). RESERV3 no tiene nombre de negocio ("—").
MOV0010 = [
    ("PGCOD", "smallint", "Entidad", "HIGH_UNVALIDATED"),
    ("SUCCOD", "smallint", "Sucursal", "CONFIRMED"),
    ("MONCOD", "char(3)", "Moneda", "CONFIRMED"),
    ("PAPEL", "int", "Producto", "INFERRED"),
    ("CTANRO", "decimal(9,0)", "Número de cuenta", "HIGH_UNVALIDATED"),
    ("FEPRO", "int", "Fecha de proceso", "HIGH_UNVALIDATED"),
    ("IMPTE", "decimal(17,2)", "Valor del movimiento", "HIGH_UNVALIDATED"),
    ("ESTREG", "char(1)", "Estado del registro", "HIGH_UNVALIDATED"),
    ("USRALT", "char(8)", "Usuario (sin precisar)", "HYPOTHESIS"),
    ("FEALT", "datetime", "Fecha de alta", "CONFIRMED"),
    ("RESERV3", "varchar(20)", None, "UNKNOWN"),
]
REFERENCE_TABLES = {"CTA0001", "CLI0001", "PAR0012", "SUC0001", "MON0001", "PAP0001"}
# §6: patrón, tipo de coincidencia y tipo semántico ("—" = sin tipo).
GLOBAL_RULES = {
    ("FE", "PREFIX", "DATE"),
    ("IMPTE", "TOKEN", "AMOUNT"),
    ("NRO", "TOKEN", "IDENTIFIER"),
    ("COD", "SUFFIX", "CODE"),
    ("CTA", "TOKEN", None),
    ("SUC", "PREFIX", None),
    ("MON", "PREFIX", None),
    ("CLI", "PREFIX", None),
    ("USR", "PREFIX", "USER"),
    ("EST", "PREFIX", "ENUM"),
    ("ALT", "SUFFIX", None),
    ("PRO", "SUFFIX", None),
    ("DOC", "SUFFIX", None),
    ("RESERV", "PREFIX", None),
}


def seed(owner):
    call_command("seed_reference_project", owner_sub=owner.auth0_sub)
    return Project.objects.for_user(owner).get(name="CORE_DEMO")


def catalog_of(project):
    """Contenido del proyecto sin identificadores ni fechas, para comparar ejecuciones."""
    columns = Column.objects.filter(project=project).select_related("table", "interpretation")
    return {
        "tables": sorted(Table.objects.filter(project=project).values_list("name", "column_count")),
        "columns": sorted(
            (
                c.table.name,
                c.ordinal,
                c.name,
                c.data_type,
                c.is_nullable,
                c.is_pii,
                c.interpretation.business_name,
                c.interpretation.level,
                str(c.interpretation.score),
                c.interpretation.impact,
            )
            for c in columns
        ),
        "sources": sorted(Source.objects.filter(project=project).values_list("kind", "status")),
        "actions": sorted(
            ReviewAction.objects.filter(project=project).values_list("column__name", "action")
        ),
    }


def global_rules():
    return set(
        NamingRule.objects.filter(project__isnull=True).values_list(
            "pattern", "match_type", "semantic_type"
        )
    )


@pytest.mark.fr("003:FR-027")
def test_seeds_core_demo_with_mov0010_as_in_the_reference_data():
    owner = UserFactory()

    project = seed(owner)

    assert project.source_dialect == "tsql"
    assert project.owner == owner
    mov = Table.objects.get(project=project, name="MOV0010")
    columns = mov.columns.order_by("ordinal").select_related("interpretation")
    assert [
        (c.name, c.data_type, c.interpretation.business_name, c.interpretation.level)
        for c in columns
    ] == MOV0010
    assert mov.column_count == 11
    assert Column.objects.get(table=mov, name="USRALT").is_pii is True
    assert set(
        ColumnInterpretation.objects.filter(project=project).values_list(
            "engine_version", flat=True
        )
    ) == {"fixture"}
    assert Column.objects.filter(project=project, interpretation__isnull=True).count() == 0


@pytest.mark.fr("003:FR-027")
def test_seeds_the_reference_tables_and_the_extra_tables_that_repeat_columns():
    project = seed(UserFactory())

    names = set(Table.objects.filter(project=project).values_list("name", flat=True))
    assert REFERENCE_TABLES | {"MOV0010"} <= names

    def tables_with(column, data_type):
        return Column.objects.filter(
            project=project, name=column, data_type=data_type, is_nullable=False
        ).count()

    # El origen más 38/21/6 destinos con el mismo nombre y tipo (§5, proporciones reducidas).
    assert tables_with("PGCOD", "smallint") == 1 + 38
    assert tables_with("CTANRO", "decimal(9,0)") == 2 + 21  # MOV0010, CTA0001 y las extra
    assert tables_with("PETDOC", "smallint") == 1 + 6
    impact = dict(
        ColumnInterpretation.objects.filter(
            column__table__name__in=["MOV0010", "CLI0001"], impact__gt=0
        ).values_list("column__name", "impact")
    )
    assert impact == {"PGCOD": 38, "CTANRO": 21, "PETDOC": 6}
    [ddl] = Source.objects.filter(project=project)
    assert (ddl.kind, ddl.status) == ("SCHEMA_DDL", "READY")


@pytest.mark.fr("003:FR-027")
def test_seeds_the_global_naming_rules():
    seed(UserFactory())

    assert global_rules() == GLOBAL_RULES
    assert set(
        NamingRule.objects.filter(project__isnull=True).values_list("weight", flat=True)
    ) == {NamingRule._meta.get_field("weight").default}


@pytest.mark.fr("003:FR-027")
def test_seeds_three_human_confirmations_that_back_the_confirmed_levels():
    owner = UserFactory()
    project = seed(owner)

    actions = ReviewAction.objects.filter(project=project).select_related("column")
    assert sorted((a.column.name, a.action) for a in actions) == [
        ("FEALT", "CONFIRM"),
        ("MONCOD", "CONFIRM"),
        ("SUCCOD", "CONFIRM"),
    ]
    for action in actions:
        interpretation = action.column.interpretation
        assert action.actor == owner
        assert action.after["level"] == "CONFIRMED"
        assert interpretation.level == "CONFIRMED"
        assert interpretation.confirmed_by_action == action
        assert interpretation.confirmed_by == owner
        assert interpretation.origin == "HUMAN"
    assert ColumnInterpretation.objects.filter(project=project, level="CONFIRMED").count() == 3


@pytest.mark.fr("003:FR-027")
def test_running_it_again_does_not_duplicate_anything():
    owner = UserFactory()
    project = seed(owner)
    before = catalog_of(project)

    again = seed(owner)

    assert again == project
    assert Project.objects.for_user(owner).count() == 1
    assert catalog_of(again) == before
    assert len(global_rules()) == len(GLOBAL_RULES)


@pytest.mark.fr("003:FR-027")
def test_every_run_produces_the_same_catalog():
    first = catalog_of(seed(UserFactory()))
    second = catalog_of(seed(UserFactory()))

    assert first == second
    assert len(first["columns"]) == Column.objects.count() // 2


@pytest.mark.fr("003:FR-024")
def test_a_failure_halfway_leaves_nothing_behind():
    owner = UserFactory()

    with (
        patch.object(ReviewAction, "save", side_effect=RuntimeError("fallo inyectado")),
        pytest.raises(RuntimeError),
    ):
        call_command("seed_reference_project", owner_sub=owner.auth0_sub)

    assert Project.objects.count() == 0
    assert Table.objects.count() == 0
    assert Column.objects.count() == 0
    assert NamingRule.objects.count() == 0


@pytest.mark.fr("003:FR-027")
def test_an_unknown_owner_is_rejected_without_creating_anything():
    with pytest.raises(CommandError):
        call_command("seed_reference_project", owner_sub="google-oauth2|nadie")

    assert Project.objects.count() == 0
