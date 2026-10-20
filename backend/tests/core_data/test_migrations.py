"""Migraciones reproducibles — FR-028 y SC-007 (RNF-20).

El almacenamiento se construye desde cero solo con las migraciones versionadas, y los modelos
no tienen cambios sin migración.
"""

from io import StringIO

import pytest
from django.core.management import call_command
from django.db import connection
from django.db.migrations.executor import MigrationExecutor

pytestmark = [pytest.mark.story("ROS-81"), pytest.mark.fr("003:FR-028")]

CORE_DATA_APPS = ("review", "evidence", "catalog", "sources", "projects")


@pytest.mark.django_db
def test_models_have_no_pending_migrations():
    out = StringIO()

    call_command("makemigrations", "--check", "--dry-run", stdout=out)

    assert "No changes detected" in out.getvalue()


@pytest.mark.django_db(transaction=True)
def test_core_data_migrations_go_down_to_zero_and_back_up():
    executor = MigrationExecutor(connection)
    leaves = executor.loader.graph.leaf_nodes()

    executor.migrate([(app, None) for app in CORE_DATA_APPS])
    tables = connection.introspection.table_names()
    assert not [name for name in tables if name.startswith(CORE_DATA_APPS)]

    executor = MigrationExecutor(connection)
    executor.migrate(leaves)
    tables = connection.introspection.table_names()
    for table in (
        "projects_project",
        "catalog_table",
        "catalog_column",
        "catalog_column_interpretation",
        "catalog_column_profile",
        "sources_source",
        "sources_naming_rule",
        "evidence_evidence",
        "evidence_conflict",
        "evidence_conflict_evidences",
        "review_review_action",
    ):
        assert table in tables
