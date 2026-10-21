"""Modelos base del núcleo de datos — specs/003-proyectos-y-nucleo-de-datos/data-model.md.

Convenciones del diccionario de datos: id UUID v4 generado por la aplicación y created_at /
updated_at en UTC (research R-02). Se comprueban con un modelo concreto temporal.
"""

import uuid
from datetime import UTC

import pytest
from django.db import connection, models
from django.test.utils import isolate_apps

from apps.core.models import TimeStampedModel, UUIDModel

pytestmark = [pytest.mark.story("ROS-81"), pytest.mark.fr("003:FR-026")]


@pytest.fixture
def sample_model(db):
    with isolate_apps("apps.core"):

        class Sample(UUIDModel, TimeStampedModel):
            label = models.CharField(max_length=10)

            class Meta:
                app_label = "core"
                db_table = "core_test_sample"

        with connection.schema_editor() as editor:
            editor.create_model(Sample)
        yield Sample


def test_base_models_are_abstract():
    assert UUIDModel._meta.abstract
    assert TimeStampedModel._meta.abstract


def test_uuid_model_generates_a_v4_id_in_the_application(sample_model):
    instance = sample_model(label="a")

    # Antes de guardar: el id lo genera la aplicación, no la base.
    assert isinstance(instance.id, uuid.UUID)
    assert instance.id.version == 4
    assert sample_model._meta.pk.name == "id"
    assert sample_model._meta.get_field("id").editable is False


def test_uuid_model_ids_are_not_sequential(sample_model):
    ids = {sample_model.objects.create(label=str(n)).id for n in range(5)}

    assert len(ids) == 5
    assert all(value.version == 4 for value in ids)


def test_timestamped_model_fills_created_and_updated_in_utc(sample_model):
    instance = sample_model.objects.create(label="a")
    instance.refresh_from_db()

    assert instance.created_at.utcoffset() == UTC.utcoffset(None)
    assert instance.updated_at >= instance.created_at

    first_update = instance.updated_at
    instance.label = "b"
    instance.save()
    instance.refresh_from_db()

    assert instance.updated_at > first_update
    assert instance.created_at <= first_update
