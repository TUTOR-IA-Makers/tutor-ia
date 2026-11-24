"""scripts/validate_catalog.py and scripts/build_catalog.py (G6-2).

The validator is the gate for the reference catalog, so the tests pin what it
must reject — above all a recorded output that differs from what the solution
prints, which is how model-predicted outputs got into the first draft of #32.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

from tests.conftest import requires_gcc

REPO_ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(REPO_ROOT / "scripts"))

import build_catalog  # noqa: E402
import validate_catalog  # noqa: E402

ECHO_SUM = '#include <stdio.h>\nint main(void){int a,b;scanf("%d %d",&a,&b);printf("%d\\n",a+b);}\n'


def _question(qid: str = "E1-MF-001", saida: str = "3\n", **overrides: object) -> dict:
    axis, level, _ = qid.split("-")
    question = {
        "id": qid,
        "eixo": axis,
        "nivel": level,
        "estruturas": [],
        "origem": "Autoria própria",
        "direitos_restritos": False,
        "path": f"questions/{axis.lower()}/{qid}",
        "enunciado": "Leia dois inteiros e imprima a soma.",
        "solucao_referencia": ECHO_SUM,
        "casos_teste": [{"entrada": "1 2\n", "saida": saida}],
    }
    question.update(overrides)
    return question


def _index(tmp_path: Path, questions: list[dict], axis: str = "E1", level: str = "MF"):
    """One index file holding `questions`, as load_index() would return it."""
    path = tmp_path / "index" / axis.lower() / f"{axis.lower()}_{level}.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    data = {"eixo": axis, "nivel": level, "total": len(questions), "questoes": questions}
    build_catalog.write_index(path, data)
    return build_catalog.load_index(tmp_path / "index")


@pytest.fixture
def one_combination(monkeypatch: pytest.MonkeyPatch) -> None:
    """Shrink the required grid to E1 x MF with one question, so tests stay small."""
    monkeypatch.setattr(validate_catalog, "AXES", ("E1",))
    monkeypatch.setattr(validate_catalog, "LEVELS", ("MF",))
    monkeypatch.setattr(validate_catalog, "REQUIRED_COVERAGE", 1)


@pytest.fixture
def catalog_dir(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    """Point both scripts at a scratch catalog instead of data/catalog/."""
    monkeypatch.setattr(build_catalog, "INDEX_DIR", tmp_path / "index")
    monkeypatch.setattr(build_catalog, "QUESTIONS_DIR", tmp_path / "questions")
    return tmp_path


# ── schema ────────────────────────────────────────────────────────────────────


def test_well_formed_index_has_no_schema_errors(tmp_path: Path, one_combination: None) -> None:
    assert validate_catalog.check_schema(_index(tmp_path, [_question()])) == []


@pytest.mark.parametrize(
    ("overrides", "expected"),
    [
        ({"direitos_restritos": None}, "'direitos_restritos' ausente"),
        ({"estruturas": ["laco"]}, "fora do vocabulário"),
        ({"eixo": "E2"}, "eixo/nível diferentes"),
        ({"path": "questions/e1/outra"}, "'path' deve ser"),
        ({"origem": "  "}, "'origem' vazia"),
        ({"casos_teste": []}, "nenhum caso de teste"),
        ({"casos_teste": [{"entrada": "1\n"}]}, "precisa de 'entrada' e 'saida'"),
    ],
)
def test_schema_rejects_malformed_question(
    tmp_path: Path, one_combination: None, overrides: dict, expected: str
) -> None:
    errors = validate_catalog.check_schema(_index(tmp_path, [_question(**overrides)]))
    assert any(expected in e for e in errors), errors


def test_schema_rejects_duplicate_ids_and_wrong_total(
    tmp_path: Path, one_combination: None
) -> None:
    index = _index(tmp_path, [_question(), _question()])
    index[0][1]["total"] = 5
    errors = validate_catalog.check_schema(index)
    assert any("id duplicado: E1-MF-001" in e for e in errors)
    assert any("'total' = 5" in e for e in errors)


def test_schema_requires_an_index_file_per_combination(tmp_path: Path) -> None:
    errors = validate_catalog.check_schema(_index(tmp_path, [_question()]))
    assert any("index/e2/e2_MD.json" in e for e in errors)


# ── outputs ───────────────────────────────────────────────────────────────────


@requires_gcc
def test_matching_output_passes(tmp_path: Path) -> None:
    index = _index(tmp_path, [_question(saida="3\n")])
    assert validate_catalog.check_outputs(index, regenerate=False) == []


@requires_gcc
def test_recorded_output_that_differs_from_execution_fails(tmp_path: Path) -> None:
    index = _index(tmp_path, [_question(saida="4\n")])
    errors = validate_catalog.check_outputs(index, regenerate=False)
    assert len(errors) == 1
    assert "E1-MF-001 caso 01: saída registrada difere" in errors[0]
    assert index[0][1]["questoes"][0]["casos_teste"][0]["saida"] == "4\n", "check must not write"


@requires_gcc
def test_regenerate_records_what_the_solution_prints(tmp_path: Path) -> None:
    index = _index(tmp_path, [_question(saida="")])
    assert validate_catalog.check_outputs(index, regenerate=True) == []
    assert index[0][1]["questoes"][0]["casos_teste"][0]["saida"] == "3\n"


@requires_gcc
def test_solution_that_does_not_compile_fails(tmp_path: Path) -> None:
    index = _index(tmp_path, [_question(solucao_referencia="int main(void) { erro }")])
    errors = validate_catalog.check_outputs(index, regenerate=False)
    assert "não compila" in errors[0]


@requires_gcc
def test_solution_using_the_maths_library_links(tmp_path: Path) -> None:
    source = (
        "#include <stdio.h>\n#include <math.h>\n"
        'int main(void){double x;scanf("%lf",&x);printf("%.1f\\n",sqrt(x));}\n'
    )
    question = _question(solucao_referencia=source)
    question["casos_teste"] = [{"entrada": "9\n", "saida": "3.0\n"}]
    assert validate_catalog.check_outputs(_index(tmp_path, [question]), regenerate=False) == []


@requires_gcc
def test_solution_that_crashes_fails(tmp_path: Path) -> None:
    index = _index(tmp_path, [_question(solucao_referencia="int main(void) { return 3; }")])
    errors = validate_catalog.check_outputs(index, regenerate=False)
    assert "execução falhou (exit 3" in errors[0]


# ── questions/ in sync with index/ ────────────────────────────────────────────


def test_materialized_tree_in_sync_passes(tmp_path: Path) -> None:
    index = _index(tmp_path, [_question()])
    build_catalog.materialize(index, tmp_path / "questions")
    assert validate_catalog.check_materialized(index, tmp_path / "questions") == []


def test_hand_edited_output_in_questions_fails(tmp_path: Path) -> None:
    index = _index(tmp_path, [_question()])
    build_catalog.materialize(index, tmp_path / "questions")
    (tmp_path / "questions/e1/E1-MF-001/saidas/01.out").write_text("999\n", encoding="utf-8")
    errors = validate_catalog.check_materialized(index, tmp_path / "questions")
    assert "questions/e1/E1-MF-001/saidas/01.out: difere de index/" in errors


def test_stray_file_in_questions_fails(tmp_path: Path) -> None:
    index = _index(tmp_path, [_question()])
    build_catalog.materialize(index, tmp_path / "questions")
    (tmp_path / "questions/e1/E1-MF-001/exec_temp").write_bytes(b"\x7fELF")
    errors = validate_catalog.check_materialized(index, tmp_path / "questions")
    assert "questions/e1/E1-MF-001/exec_temp: não existe em index/" in errors


def test_materialize_removes_cases_deleted_from_the_index(tmp_path: Path) -> None:
    question = _question()
    question["casos_teste"].append({"entrada": "2 2\n", "saida": "4\n"})
    build_catalog.materialize(_index(tmp_path, [question]), tmp_path / "questions")
    build_catalog.materialize(_index(tmp_path, [_question()]), tmp_path / "questions")
    assert not (tmp_path / "questions/e1/E1-MF-001/entradas/02.in").exists()


def test_meta_yaml_lists_structures_and_rights() -> None:
    meta = build_catalog.render_meta(_question(estruturas=["if", "else"], direitos_restritos=True))
    assert '  - "if"\n  - "else"\n' in meta
    assert meta.endswith("direitos_restritos: true\n")


# ── coverage ──────────────────────────────────────────────────────────────────


def _level(n: int) -> list[dict]:
    return [_question(f"E1-MF-{i:03d}") for i in range(1, n + 1)]


def test_coverage_below_eight_fails(tmp_path: Path) -> None:
    report, errors = validate_catalog.coverage(_index(tmp_path, _level(7)))
    assert "  E1 MF: 7/8 FALHOU" in report
    assert "cobertura insuficiente em E1 MF: 7/8" in errors


def test_coverage_of_exactly_eight_passes(tmp_path: Path) -> None:
    report, errors = validate_catalog.coverage(_index(tmp_path, _level(8)))
    assert "  E1 MF: 8/8 OK" in report
    assert not [e for e in errors if "E1 MF" in e]


# ── end to end ────────────────────────────────────────────────────────────────


@requires_gcc
def test_check_mode_fails_on_wrong_output_and_writes_nothing(
    catalog_dir: Path, one_combination: None
) -> None:
    index = _index(catalog_dir, [_question(saida="4\n")])
    build_catalog.materialize(index, catalog_dir / "questions")
    index_file = catalog_dir / "index/e1/e1_MF.json"
    before = index_file.read_bytes()

    assert validate_catalog.main([]) == 1
    assert index_file.read_bytes() == before
    assert (catalog_dir / "questions/e1/E1-MF-001/saidas/01.out").read_text() == "4\n"


@requires_gcc
def test_regenerate_mode_fixes_outputs_and_rebuilds_questions(
    catalog_dir: Path, one_combination: None
) -> None:
    _index(catalog_dir, [_question(saida="4\n")])

    assert validate_catalog.main(["--regenerate"]) == 0
    saved = json.loads((catalog_dir / "index/e1/e1_MF.json").read_text(encoding="utf-8"))
    assert saved["questoes"][0]["casos_teste"][0]["saida"] == "3\n"
    assert (catalog_dir / "questions/e1/E1-MF-001/saidas/01.out").read_text() == "3\n"
    assert validate_catalog.main([]) == 0


# ── the real catalog ──────────────────────────────────────────────────────────
# The gate runs the full validator; these cheap checks also run without gcc.


def test_real_catalog_is_well_formed_and_in_sync() -> None:
    index = build_catalog.load_index(REPO_ROOT / "data/catalog/index")
    assert validate_catalog.check_schema(index) == []
    assert validate_catalog.check_materialized(index, REPO_ROOT / "data/catalog/questions") == []
    assert validate_catalog.coverage(index)[1] == []
