"""Materialise data/catalog/questions/ from data/catalog/index/ (G6-2).

`index/` is the single source of truth: one JSON file per axis x level, edited by
hand. `questions/` is derived from it so each solution can be compiled and each
test case read on its own, and it is committed so a reviewer can open a question
without running anything. Never edit `questions/` directly: change `index/` and
run this script. `validate_catalog.py` fails when the two disagree.

    python scripts/build_catalog.py
"""

from __future__ import annotations

import json
import os
import shutil
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
CATALOG_DIR = Path(os.environ.get("CATALOG_DIR_OVERRIDE", REPO_ROOT / "data" / "catalog"))
INDEX_DIR = CATALOG_DIR / "index"
QUESTIONS_DIR = CATALOG_DIR / "questions"


def load_index(index_dir: Path) -> list[tuple[Path, dict]]:
    """Every index file under `index_dir`, parsed, in a stable order."""
    files = sorted(index_dir.glob("*/*.json"))
    return [(path, json.loads(path.read_text(encoding="utf-8"))) for path in files]


def write_index(path: Path, data: dict) -> None:
    """Write an index file in the format it is kept in, so diffs stay minimal."""
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def render_meta(question: dict) -> str:
    """meta.yaml for one question. Hand-written so no YAML dependency is needed."""
    lines = [
        f'id: "{question["id"]}"',
        f'eixo: "{question["eixo"]}"',
        f'nivel: "{question["nivel"]}"',
    ]
    if question["estruturas"]:
        lines.append("estruturas:")
        lines.extend(f'  - "{name}"' for name in question["estruturas"])
    else:
        lines.append("estruturas: []")
    lines.append(f'origem: "{question["origem"]}"')
    lines.append(f"direitos_restritos: {str(question['direitos_restritos']).lower()}")
    return "\n".join(lines) + "\n"


def materialize(index: list[tuple[Path, dict]], questions_dir: Path) -> int:
    """Rewrite `questions_dir` from scratch so a deleted question or case leaves no file behind."""
    if questions_dir.exists():
        shutil.rmtree(questions_dir)

    total = 0
    for _path, data in index:
        for q in data["questoes"]:
            q_dir = questions_dir / q["eixo"].lower() / q["id"]
            (q_dir / "entradas").mkdir(parents=True)
            (q_dir / "saidas").mkdir()
            _write(q_dir / "enunciado.md", q["enunciado"])
            _write(q_dir / "solucao.c", q["solucao_referencia"])
            _write(q_dir / "meta.yaml", render_meta(q))
            for number, case in enumerate(q["casos_teste"], start=1):
                _write(q_dir / "entradas" / f"{number:02d}.in", case["entrada"])
                _write(q_dir / "saidas" / f"{number:02d}.out", case["saida"])
            total += 1
    return total


def _write(path: Path, text: str) -> None:
    # newline="" keeps "\n" as "\n" on Windows, so the files match the index byte for byte.
    with path.open("w", encoding="utf-8", newline="") as f:
        f.write(text)


def main() -> int:
    if not INDEX_DIR.is_dir():
        print(f"[ERRO] Diretório {INDEX_DIR} não encontrado.")
        return 1
    total = materialize(load_index(INDEX_DIR), QUESTIONS_DIR)
    print(f"Materialização concluída: {total} questão(ões) gerada(s) em {QUESTIONS_DIR}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
