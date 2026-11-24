"""Validate the reference catalog in data/catalog/ (G6-2). Part of the gate.

Fails (exit 1) when any of these is true:

- an index file or question breaks the schema: missing field, wrong type, an axis,
  level or structure outside the closed vocabulary of `codeexpert.domain`;
- a solution does not compile, crashes or times out on a test case;
- a recorded `saida` differs from what the solution actually prints (rule 4 of
  AGENTS.md: expected outputs come from running the solution, never from a model);
- `questions/` is not exactly what `build_catalog.py` makes from `index/`;
- an axis x level combination has fewer than 8 questions.

Solutions are compiled with the platform's own compiler flags and run by
`LocalGccRunner`, the runner the platform uses for generated questions, so a
catalog output is what the platform itself would have produced. The one addition
is `-lm`: Moodle CodeRunner links the maths library, and several catalog
solutions call `sqrt`/`pow`/`round`.

    python scripts/validate_catalog.py               # check only; never writes
    python scripts/validate_catalog.py --regenerate  # rewrite every `saida`, then rebuild questions/

`--regenerate` is for after a deliberate change to a solution or an input. Review
its diff: it accepts whatever the solution prints, bugs included.
"""

from __future__ import annotations

import argparse
import re
import shutil
import subprocess
import sys
import tempfile
from collections import Counter
from pathlib import Path

import build_catalog as catalog

# Importable straight from a checkout, without `pip install -e backend`.
sys.path.insert(0, str(catalog.REPO_ROOT / "backend" / "src"))

from codeexpert.domain import CStructure
from codeexpert.execution.local import COMPILER, COMPILER_FLAGS, LocalGccRunner
from codeexpert.settings import Settings

REQUIRED_COVERAGE = 8
AXES = ("E1", "E2")
LEVELS = ("MF", "F", "M", "D", "MD")
STRUCTURES = {s.value for s in CStructure}
QUESTION_FIELDS = {
    "id": str,
    "eixo": str,
    "nivel": str,
    "estruturas": list,
    "origem": str,
    "direitos_restritos": bool,
    "path": str,
    "enunciado": str,
    "solucao_referencia": str,
    "casos_teste": list,
}


def check_schema(index: list[tuple[Path, dict]]) -> list[str]:
    """Structural errors. Empty when every file and question is well formed."""
    errors: list[str] = []
    seen_ids: Counter[str] = Counter()
    present = {(path.parent.name, path.stem) for path, _ in index}

    for axis in AXES:
        for level in LEVELS:
            if (axis.lower(), f"{axis.lower()}_{level}") not in present:
                errors.append(f"índice ausente: index/{axis.lower()}/{axis.lower()}_{level}.json")

    for path, data in index:
        where = f"{path.parent.name}/{path.name}"
        match = re.fullmatch(r"(e\d)_([A-Z]+)", path.stem)
        if not match or match[1] != path.parent.name:
            errors.append(f"{where}: nome fora do padrão e<N>/e<N>_<NIVEL>.json")
            continue
        axis, level = match[1].upper(), match[2]
        if not isinstance(data, dict) or not isinstance(data.get("questoes"), list):
            errors.append(f"{where}: a raiz deve ser um objeto com a lista 'questoes'")
            continue
        if data.get("eixo") != axis or data.get("nivel") != level:
            errors.append(f"{where}: 'eixo'/'nivel' do envelope não batem com o nome do arquivo")
        if data.get("total") != len(data["questoes"]):
            errors.append(f"{where}: 'total' = {data.get('total')}, mas há {len(data['questoes'])}")

        for position, q in enumerate(data["questoes"], start=1):
            errors.extend(_check_question(q, f"{where} #{position}", axis, level))
            if isinstance(q, dict) and isinstance(q.get("id"), str):
                seen_ids[q["id"]] += 1

    errors.extend(f"id duplicado: {qid}" for qid, n in seen_ids.items() if n > 1)
    return errors


def _check_question(q: object, where: str, axis: str, level: str) -> list[str]:
    if not isinstance(q, dict):
        return [f"{where}: questão deve ser um objeto"]
    errors = [
        f"{where}: campo '{name}' ausente ou não é {kind.__name__}"
        for name, kind in QUESTION_FIELDS.items()
        if not isinstance(q.get(name), kind)
    ]
    if errors:
        return errors

    qid = q["id"]
    where = f"{where} ({qid})"
    if not re.fullmatch(rf"{axis}-{level}-\d{{3}}", qid):
        errors.append(f"{where}: id deve seguir {axis}-{level}-NNN")
    if q["eixo"] != axis or q["nivel"] != level:
        errors.append(f"{where}: eixo/nível diferentes dos do arquivo ({axis}/{level})")
    if q["path"] != f"questions/{axis.lower()}/{qid}":
        errors.append(f"{where}: 'path' deve ser questions/{axis.lower()}/{qid}")
    if not q["origem"].strip():
        errors.append(f"{where}: 'origem' vazia")
    if not q["enunciado"].strip() or not q["solucao_referencia"].strip():
        errors.append(f"{where}: enunciado ou solução vazios")
    unknown = [s for s in q["estruturas"] if s not in STRUCTURES]
    if unknown:
        errors.append(f"{where}: estruturas fora do vocabulário: {unknown}")
    if len(set(q["estruturas"])) != len(q["estruturas"]):
        errors.append(f"{where}: estruturas repetidas")
    if not q["casos_teste"]:
        errors.append(f"{where}: nenhum caso de teste")
    for n, case in enumerate(q["casos_teste"], start=1):
        if not (
            isinstance(case, dict)
            and isinstance(case.get("entrada"), str)
            and isinstance(case.get("saida"), str)
        ):
            errors.append(f"{where}: caso {n} precisa de 'entrada' e 'saida' (texto)")
    return errors


def check_outputs(index: list[tuple[Path, dict]], *, regenerate: bool) -> list[str]:
    """Run every solution on every input; compare (or, with `regenerate`, record) the output."""
    errors: list[str] = []
    settings = Settings()
    runner = LocalGccRunner(settings)

    with tempfile.TemporaryDirectory(prefix="catalog-") as tmp:
        work = Path(tmp)
        for _path, data in index:
            for q in data["questoes"]:
                source = work / f"{q['id']}.c"
                binary = work / q["id"]
                source.write_text(q["solucao_referencia"], encoding="utf-8")
                compiled = _compile(source, binary, settings.compile_timeout_seconds)
                if compiled is not None:
                    errors.append(f"{q['id']}: não compila\n{compiled}")
                    continue

                for n, case in enumerate(q["casos_teste"], start=1):
                    outcome = runner.run(binary, case["entrada"])
                    if outcome.timed_out or outcome.exit_code != 0 or outcome.truncated:
                        errors.append(
                            f"{q['id']} caso {n:02d}: execução falhou "
                            f"(exit {outcome.exit_code}, timeout={outcome.timed_out})"
                        )
                    elif regenerate:
                        case["saida"] = outcome.stdout
                    elif outcome.stdout != case["saida"]:
                        errors.append(
                            f"{q['id']} caso {n:02d}: saída registrada difere da execução\n"
                            f"    esperado: {case['saida']!r}\n"
                            f"    obtido:   {outcome.stdout!r}"
                        )
    return errors


def _compile(source: Path, binary: Path, timeout: float) -> str | None:
    """Compiler diagnostics on failure, None on success."""
    try:
        result = subprocess.run(  # noqa: S603 - fixed argv, no shell
            [COMPILER, *COMPILER_FLAGS, "-o", str(binary), str(source), "-lm"],
            capture_output=True,
            text=True,
            timeout=timeout,
        )
    except subprocess.TimeoutExpired:
        return f"compilação excedeu {timeout:.0f}s"
    return result.stderr if result.returncode != 0 else None


def check_materialized(index: list[tuple[Path, dict]], questions_dir: Path) -> list[str]:
    """Rebuild questions/ in a scratch directory and diff it against the committed one."""
    with tempfile.TemporaryDirectory(prefix="catalog-") as tmp:
        expected_root = Path(tmp)
        catalog.materialize(index, expected_root)
        expected = _tree(expected_root)
    actual = _tree(questions_dir) if questions_dir.is_dir() else {}

    errors = [f"questions/{p}: ausente" for p in sorted(expected.keys() - actual.keys())]
    errors += [
        f"questions/{p}: não existe em index/" for p in sorted(actual.keys() - expected.keys())
    ]
    errors += [
        f"questions/{p}: difere de index/"
        for p in sorted(expected.keys() & actual.keys())
        if expected[p] != actual[p]
    ]
    if errors:
        errors.append("questions/ está dessincronizado: rode `python scripts/build_catalog.py`")
    return errors


def _tree(root: Path) -> dict[str, bytes]:
    return {
        path.relative_to(root).as_posix(): path.read_bytes()
        for path in root.rglob("*")
        if path.is_file()
    }


def coverage(index: list[tuple[Path, dict]]) -> tuple[list[str], list[str]]:
    """(report lines, errors) for the minimum of 8 questions per axis x level."""
    counts = Counter((q["eixo"], q["nivel"]) for _path, data in index for q in data["questoes"])
    report, errors = [], []
    for axis in AXES:
        for level in LEVELS:
            n = counts[(axis, level)]
            ok = n >= REQUIRED_COVERAGE
            report.append(
                f"  {axis} {level:>2}: {n}/{REQUIRED_COVERAGE} {'OK' if ok else 'FALHOU'}"
            )
            if not ok:
                errors.append(f"cobertura insuficiente em {axis} {level}: {n}/{REQUIRED_COVERAGE}")
    return report, errors


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument(
        "--regenerate",
        action="store_true",
        help="grava em index/ a saída real de cada caso e reconstrói questions/",
    )
    args = parser.parse_args(argv)

    if not catalog.INDEX_DIR.is_dir():
        print(f"[ERRO] diretório {catalog.INDEX_DIR} não encontrado")
        return 1
    try:
        index = catalog.load_index(catalog.INDEX_DIR)
    except ValueError as exc:  # json.JSONDecodeError is a ValueError
        print(f"[ERRO] JSON inválido em index/: {exc}")
        return 1

    errors = check_schema(index)
    if errors:
        # The other checks assume a well-formed index; report the schema first.
        return _finish(errors)

    if shutil.which(COMPILER) is None:
        return _finish(
            [f"'{COMPILER}' não está no PATH: sem compilador não há como conferir as saídas"]
        )
    errors += check_outputs(index, regenerate=args.regenerate)

    if args.regenerate:
        for path, data in index:
            catalog.write_index(path, data)
        catalog.materialize(index, catalog.QUESTIONS_DIR)
        print("saídas regravadas em index/ e questions/ reconstruído — revise o diff")

    errors += check_materialized(index, catalog.QUESTIONS_DIR)
    report, coverage_errors = coverage(index)
    print("Cobertura por eixo x nível:")
    print("\n".join(report))
    return _finish(errors + coverage_errors, total=sum(len(d["questoes"]) for _, d in index))


def _finish(errors: list[str], total: int | None = None) -> int:
    if errors:
        print(f"\n[FALHA] {len(errors)} problema(s) no catálogo:")
        for error in errors:
            print(f"  - {error}")
        return 1
    print(f"\n[OK] catálogo válido: {total} questões, saídas conferidas por execução")
    return 0


if __name__ == "__main__":
    sys.exit(main())
