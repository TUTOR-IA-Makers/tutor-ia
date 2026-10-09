"""Validator for the reference catalog (G6-2).

Loads every JSON file under data/catalog/, validates each entry against
CatalogEntry (which re-uses the closed enumerations from domain.py) and prints
a coverage matrix by axis × level.

Exit 0  → all entries valid.
Exit 1  → one or more validation errors (fails make check).
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Resolve project root so the script works regardless of cwd.
# ---------------------------------------------------------------------------
ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT / "src"))

from pydantic import BaseModel, Field, ValidationError  # noqa: E402

from codeexpert.domain import CStructure, ContentAxis, Difficulty  # noqa: E402


# ---------------------------------------------------------------------------
# Schema
# ---------------------------------------------------------------------------


class CatalogTestCase(BaseModel):
    input: str
    output: str


class CatalogEntry(BaseModel):
    """One catalogued question.

    Fields mirror the acceptance criteria of G6-2:
    - enunciado, solucao_referencia, casos_teste → complete question body
    - eixo, nivel, estruturas → full classification per G6-1 taxonomy
    - origem, direitos_restritos → provenance and rights
    """

    id: str = Field(..., description="Unique ID, e.g. E1-MF-001")
    eixo: ContentAxis
    nivel: Difficulty
    estruturas: list[CStructure] = Field(default_factory=list)
    enunciado: str = Field(..., min_length=10)
    solucao_referencia: str = Field(..., min_length=10)
    casos_teste: list[CatalogTestCase] = Field(..., min_length=1)
    origem: str = Field(..., min_length=3)
    direitos_restritos: bool


# ---------------------------------------------------------------------------
# Validation logic
# ---------------------------------------------------------------------------


def validate_catalog(catalog_dir: Path) -> int:
    """Validate all JSON files in *catalog_dir*.

    Returns the number of invalid entries (0 = success).
    """
    files = sorted(catalog_dir.glob("*.json"))
    if not files:
        print(f"[validate_catalog] No JSON files found in {catalog_dir}.")
        return 0

    errors_total = 0
    counts: dict[str, int] = {}

    for path in files:
        raw = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(raw, list):
            print(f"ERROR  {path.name}: root must be a JSON array.")
            errors_total += 1
            continue

        for item in raw:
            entry_id = item.get("id", "<sem id>")
            try:
                entry = CatalogEntry.model_validate(item)
                key = f"{entry.eixo.value} × {entry.nivel.value}"
                counts[key] = counts.get(key, 0) + 1
            except ValidationError as exc:
                errors_total += 1
                for e in exc.errors():
                    field = ".".join(str(x) for x in e["loc"])
                    print(f"ERROR  {path.name} [{entry_id}] {field}: {e['msg']}")

    # Coverage matrix
    print("\n── Cobertura por eixo × nível ──────────────────────────────────")
    for key in sorted(counts):
        mark = "✓" if counts[key] >= 8 else f"! ({counts[key]}/8)"
        print(f"  {key}: {counts[key]:3d}  {mark}")
    print("────────────────────────────────────────────────────────────────\n")

    return errors_total


def main() -> None:
    catalog_dir = ROOT / "data" / "catalog"
    if not catalog_dir.exists():
        print(f"ERROR  data/catalog/ not found at {catalog_dir}.")
        sys.exit(1)

    n_errors = validate_catalog(catalog_dir)
    if n_errors:
        print(f"validate_catalog: {n_errors} erro(s) encontrado(s). Corrija antes de abrir o PR.")
        sys.exit(1)
    else:
        print("validate_catalog: todos os registros são válidos.")


if __name__ == "__main__":
    main()

