"""The XML that reaches Moodle.

A wrong macro or an unescaped character is invisible until the import fails, so
the export is asserted on its output rather than on its internals.
"""

import re
import threading
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from xml.etree import ElementTree

import pytest

from codeexpert.domain import Constraints, Difficulty, RunMetadata, Statement
from codeexpert.domain import TestCase as Case  # a bare `TestCase` is collected by pytest
from codeexpert.errors import MissingArtefactError
from codeexpert.export import ExportQuestion, export_questions, export_run, read_question
from codeexpert.store import LocalFilesystemStore
from codeexpert.workspace import SOLUTION, STATEMENT, TESTCASES, RunWorkspace


def _question(name: str = "Soma", *, output: str = "3\n", reviewed: bool = False) -> ExportQuestion:
    return ExportQuestion(
        statement=Statement(name=name, statement="Some 1 e 2."),
        code="int main(void) { return 0; }",
        testcases=(Case(input="1\n2\n", output=output),),
        metadata=RunMetadata(
            run_id=f"run-{name}",
            created_at="2026-11-19T00:00:00+00:00",
            constraints=Constraints(difficulty=Difficulty.FACIL),
            reviewed=reviewed,
        ),
    )


def _populate(workspace: RunWorkspace, *, name: str = "Soma") -> None:
    workspace.write_json(STATEMENT, {"name": name, "statement": "Some 1 e 2."})
    workspace.write_text(SOLUTION, "int main(void) { return 0; }")
    workspace.write_json(TESTCASES, {"testcases": [{"input": "1\n2\n", "output": "3\n"}]})
    metadata = workspace.read_metadata()
    metadata.constraints = Constraints(difficulty=Difficulty.FACIL)
    workspace.write_metadata(metadata)


def _names(xml: str) -> list[str | None]:
    return [q.findtext("name/text") for q in ElementTree.fromstring(xml).findall("question")]


def _numbers(xml: str) -> list[str]:
    """The `<!-- question: N -->` comment each question carries, in document order."""
    return re.findall(r"<!-- question: (\d+)\s+-->", xml)


def _files_under(root: Path) -> dict[Path, bytes]:
    return {path: path.read_bytes() for path in root.rglob("*") if path.is_file()}


# ── The rendered XML ──────────────────────────────────────────────────────────


def test_export_produces_parseable_xml() -> None:
    root = ElementTree.fromstring(export_questions([_question()]))
    assert root.tag == "quiz"
    assert len(root.findall("question")) == 1


def test_no_macro_placeholder_survives() -> None:
    assert "Macro_" not in export_questions([_question("A"), _question("B")])


def test_special_characters_in_output_do_not_break_the_xml() -> None:
    root = ElementTree.fromstring(export_questions([_question(output="a < b && c > d\n")]))
    assert root.findtext(".//testcase/expected/text") == "a < b && c > d"


def test_question_is_not_tagged_as_reviewed_when_it_was_not() -> None:
    """The template used to assert a human review that never happened."""
    root = ElementTree.fromstring(export_questions([_question()]))
    tags = {tag.text for tag in root.iter("text")}
    assert "Nao revisado" in tags
    assert "Revisado" not in tags
    assert "Gerado por IA" in tags


def test_an_approved_question_is_tagged_as_reviewed() -> None:
    root = ElementTree.fromstring(export_questions([_question(reviewed=True)]))
    tags = {tag.text for tag in root.iter("text")}
    assert "Revisado" in tags
    assert "Nao revisado" not in tags


# ── Numbering is the position in the list ─────────────────────────────────────


def test_questions_keep_the_order_given_and_are_numbered_by_position() -> None:
    xml = export_questions([_question("Primeira"), _question("Segunda"), _question("Terceira")])

    assert _names(xml) == ["Primeira", "Segunda", "Terceira"]
    assert _numbers(xml) == ["1", "2", "3"]


def test_the_same_list_gives_the_same_xml() -> None:
    questions = [_question("A"), _question("B")]
    assert export_questions(questions) == export_questions(list(questions))


def test_reordering_the_list_renumbers_the_questions() -> None:
    xml = export_questions([_question("B"), _question("A")])
    assert _names(xml) == ["B", "A"]
    assert _numbers(xml) == ["1", "2"]


def test_an_empty_list_is_refused() -> None:
    with pytest.raises(ValueError, match="at least one question"):
        export_questions([])


# ── No shared file ────────────────────────────────────────────────────────────


def test_a_preexisting_questionnaire_is_neither_read_nor_changed(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """The old exporter numbered by counting questions already in this file, then rewrote it."""
    monkeypatch.chdir(tmp_path)
    shared = tmp_path / "var" / "questions" / "Moodle_Questionnaire.xml"
    shared.parent.mkdir(parents=True)
    shared.write_text(export_questions([_question(f"Velha {n}") for n in range(5)]))
    before = _files_under(tmp_path)

    xml = export_questions([_question("Nova")])

    assert _numbers(xml) == ["1"]
    assert _names(xml) == ["Nova"]
    assert _files_under(tmp_path) == before


def test_exporting_a_run_writes_nothing_outside_the_run(
    workspace: RunWorkspace, isolated_settings, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.chdir(tmp_path)
    _populate(workspace)
    run_dir = isolated_settings.workspace_root / workspace.run_id
    outside = {
        path: content
        for path, content in _files_under(tmp_path).items()
        if not path.is_relative_to(run_dir)
    }

    result = export_run(workspace)

    assert _names(result.xml) == ["Soma"]
    assert result.question_count == 1
    assert {
        path: content
        for path, content in _files_under(tmp_path).items()
        if not path.is_relative_to(run_dir)
    } == outside
    assert not (tmp_path / "var").exists()


def test_concurrent_exports_of_distinct_sets_are_both_complete() -> None:
    """The bug G1-8 fixes: two exports at once used to lose one question, silently."""
    sets = {
        "a": [_question(f"A{n}") for n in range(20)],
        "b": [_question(f"B{n}") for n in range(30)],
    }
    start = threading.Barrier(len(sets))

    def export(key: str) -> str:
        start.wait()
        return export_questions(sets[key])

    with ThreadPoolExecutor(max_workers=len(sets)) as pool:
        results = dict(zip(sets, pool.map(export, sets), strict=True))

    for key, questions in sets.items():
        assert _names(results[key]) == [q.statement.name for q in questions]
        assert _numbers(results[key]) == [str(n) for n in range(1, len(questions) + 1)]


def test_concurrent_runs_exported_at_once_do_not_see_each_other(isolated_settings) -> None:
    store = LocalFilesystemStore(isolated_settings.workspace_root)
    workspaces = [RunWorkspace.create(store) for _ in range(8)]
    for index, workspace in enumerate(workspaces):
        _populate(workspace, name=f"Questao {index}")
    start = threading.Barrier(len(workspaces))

    def export(workspace: RunWorkspace) -> str:
        start.wait()
        return export_run(workspace).xml

    with ThreadPoolExecutor(max_workers=len(workspaces)) as pool:
        results = list(pool.map(export, workspaces))

    for index, (workspace, xml) in enumerate(zip(workspaces, results, strict=True)):
        assert _names(xml) == [f"Questao {index}"]
        assert _numbers(xml) == ["1"]
        assert workspace.is_complete()


# ── Step 5 over a run ─────────────────────────────────────────────────────────


def test_exporting_a_run_twice_gives_the_same_xml(workspace: RunWorkspace) -> None:
    """It used to append the question to the file a second time."""
    _populate(workspace)
    assert export_run(workspace).xml == export_run(workspace).xml


def test_read_question_matches_what_the_run_holds(workspace: RunWorkspace) -> None:
    _populate(workspace, name="Lida")
    question = read_question(workspace)

    assert question.statement.name == "Lida"
    assert question.testcases == (Case(input="1\n2\n", output="3\n"),)
    assert question.metadata.run_id == workspace.run_id


def test_a_run_without_testcases_is_not_exported_nor_completed(workspace: RunWorkspace) -> None:
    workspace.write_json(STATEMENT, {"name": "Incompleta", "statement": "..."})
    workspace.write_text(SOLUTION, "int main(void) { return 0; }")

    with pytest.raises(MissingArtefactError, match=r"testcases\.json"):
        export_run(workspace)
    assert not workspace.is_complete()
