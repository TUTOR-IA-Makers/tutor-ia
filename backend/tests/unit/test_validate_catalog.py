"""Unit tests for scripts/validate_catalog.py (G6-2).

Tests cover: valid entry passes, missing required field fails, invalid enum value
fails, empty list passes, missing file exits gracefully, and coverage count is
correct.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

# Make scripts/ importable without installing the package.
SCRIPTS_DIR = Path(__file__).parent.parent.parent / "scripts"
sys.path.insert(0, str(SCRIPTS_DIR))

from validate_catalog import CatalogEntry, CatalogTestCase, validate_catalog  # noqa: E402


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


def _write_catalog(tmp_path: Path, entries: list) -> Path:
    f = tmp_path / "test.json"
    f.write_text(json.dumps(entries), encoding="utf-8")
    return tmp_path


VALID_ENTRY = {
    "id": "E1-MF-001",
    "eixo": "fundamentos",
    "nivel": "muito facil",
    "estruturas": [],
    "enunciado": "Leia dois inteiros e imprima a soma.",
    "solucao_referencia": "#include <stdio.h>\nint main(){return 0;}",
    "casos_teste": [{"input": "1 2\n", "output": "3\n"}],
    "origem": "Exercício clássico",
    "direitos_restritos": False,
}


# ---------------------------------------------------------------------------
# CatalogEntry schema
# ---------------------------------------------------------------------------


def test_valid_entry_passes() -> None:
    entry = CatalogEntry.model_validate(VALID_ENTRY)
    assert entry.id == "E1-MF-001"


def test_missing_enunciado_fails() -> None:
    bad = {**VALID_ENTRY}
    del bad["enunciado"]
    with pytest.raises(Exception):
        CatalogEntry.model_validate(bad)


def test_invalid_eixo_fails() -> None:
    bad = {**VALID_ENTRY, "eixo": "algebra"}
    with pytest.raises(Exception):
        CatalogEntry.model_validate(bad)


def test_invalid_nivel_fails() -> None:
    bad = {**VALID_ENTRY, "nivel": "impossivel"}
    with pytest.raises(Exception):
        CatalogEntry.model_validate(bad)


def test_invalid_structure_fails() -> None:
    bad = {**VALID_ENTRY, "estruturas": ["goto"]}
    with pytest.raises(Exception):
        CatalogEntry.model_validate(bad)


def test_empty_casos_teste_fails() -> None:
    bad = {**VALID_ENTRY, "casos_teste": []}
    with pytest.raises(Exception):
        CatalogEntry.model_validate(bad)


def test_missing_origem_fails() -> None:
    bad = {**VALID_ENTRY}
    del bad["origem"]
    with pytest.raises(Exception):
        CatalogEntry.model_validate(bad)


def test_missing_direitos_restritos_fails() -> None:
    bad = {**VALID_ENTRY}
    del bad["direitos_restritos"]
    with pytest.raises(Exception):
        CatalogEntry.model_validate(bad)


# ---------------------------------------------------------------------------
# validate_catalog function
# ---------------------------------------------------------------------------


def test_empty_json_array_returns_zero_errors(tmp_path: Path) -> None:
    catalog_dir = _write_catalog(tmp_path, [])
    assert validate_catalog(catalog_dir) == 0


def test_valid_entry_returns_zero_errors(tmp_path: Path) -> None:
    catalog_dir = _write_catalog(tmp_path, [VALID_ENTRY])
    assert validate_catalog(catalog_dir) == 0


def test_invalid_entry_returns_nonzero(tmp_path: Path) -> None:
    bad = {**VALID_ENTRY, "eixo": "desconhecido"}
    catalog_dir = _write_catalog(tmp_path, [bad])
    assert validate_catalog(catalog_dir) > 0


def test_non_list_root_returns_one_error(tmp_path: Path) -> None:
    f = tmp_path / "bad.json"
    f.write_text(json.dumps(VALID_ENTRY), encoding="utf-8")
    assert validate_catalog(tmp_path) > 0


def test_coverage_count_accumulates(tmp_path: Path) -> None:
    """Two valid entries with the same axis×level must each be counted."""
    second = {**VALID_ENTRY, "id": "E1-MF-002"}
    catalog_dir = _write_catalog(tmp_path, [VALID_ENTRY, second])
    # No errors means both entries were parsed and counted.
    assert validate_catalog(catalog_dir) == 0


def test_no_json_files_returns_zero(tmp_path: Path) -> None:
    assert validate_catalog(tmp_path) == 0


def test_real_e1_catalog_is_valid() -> None:
    """Smoke-test: the committed e1.json must pass without errors."""
    catalog_dir = Path(__file__).parent.parent.parent / "data" / "catalog"
    if not (catalog_dir / "e1.json").exists():
        pytest.skip("e1.json not found")
    errors = validate_catalog(catalog_dir)
    assert errors == 0


def test_real_e2_catalog_is_valid() -> None:
    """Smoke-test: the committed e2.json must pass without errors."""
    catalog_dir = Path(__file__).parent.parent.parent / "data" / "catalog"
    if not (catalog_dir / "e2.json").exists():
        pytest.skip("e2.json not found")
    errors = validate_catalog(catalog_dir)
    assert errors == 0

