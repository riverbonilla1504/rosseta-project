"""Lista de comprobación del tenant de desarrollo (FR-035, SC-010; quickstart.md §3).

Comprueba que evidence/tenant-config-dev.md existe, tiene las filas C1…C16 con Resultado
(✅, ❌ o N/A), Fecha (AAAA-MM-DD) y Revisó, y ninguna es ❌. NO sustituye la revisión humana
ni la verificación independiente. Es roja hasta T074. Se ejecuta en el host o en CI: dentro
del contenedor no existe specs/ (el compose no lo monta).
"""

import re
from pathlib import Path

import pytest

pytestmark = [pytest.mark.story("ROS-93"), pytest.mark.fr("002:FR-035")]

EVIDENCE = (
    Path(__file__).resolve().parents[3]
    / "specs"
    / "002-autenticacion-oauth"
    / "evidence"
    / "tenant-config-dev.md"
)
EXPECTED_ROWS = [f"C{n}" for n in range(1, 17)]
VALID_RESULTS = {"✅", "❌", "N/A"}
DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def _rows() -> dict[str, list[str]]:
    rows = {}
    for line in EVIDENCE.read_text(encoding="utf-8").splitlines():
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if cells and re.fullmatch(r"C\d{1,2}", cells[0]):
            rows[cells[0]] = cells
    return rows


def test_evidence_file_exists():
    assert EVIDENCE.is_file(), f"Falta {EVIDENCE}"


def test_every_check_c1_to_c16_is_present():
    assert sorted(_rows(), key=lambda c: int(c[1:])) == EXPECTED_ROWS


@pytest.mark.parametrize("check", EXPECTED_ROWS)
def test_each_check_has_result_date_and_reviewer_and_none_failed(check):
    cells = _rows()[check]
    # Columnas: #, Comprobación, Resultado, Fecha, Revisó, Notas
    result, date, reviewer = cells[2], cells[3], cells[4]
    assert result in VALID_RESULTS, f"{check}: resultado '{result}'"
    assert DATE.match(date), f"{check}: fecha '{date}'"
    assert reviewer, f"{check}: falta quién revisó"
    assert result != "❌", f"{check}: comprobación fallida"
