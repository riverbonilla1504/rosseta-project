"""Aplicación Celery (ADR-0003). Las tareas viven en apps/<app>/tasks.py."""

import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

app = Celery("rosetta")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()
