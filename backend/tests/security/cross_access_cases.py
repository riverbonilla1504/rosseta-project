"""Registro de casos de la suite de acceso cruzado (research R-04 de la feature 003; ROS-178).

Cada operación de la API con un parámetro de ruta necesita aquí un caso: el método, la ruta tal
como la publica el esquema OpenAPI, cómo construir el recurso de la persona A (devuelve los
valores de los parámetros de ruta) y el cuerpo que manda la persona B. Una operación nueva sin
caso hace fallar tests/security/test_cross_access.py (FR-018).
"""

from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True)
class CrossAccessCase:
    method: str
    path: str
    build: Callable[[Any], dict[str, str]]
    body: dict[str, Any] = field(default_factory=dict)


CROSS_ACCESS_CASES: list[CrossAccessCase] = []
