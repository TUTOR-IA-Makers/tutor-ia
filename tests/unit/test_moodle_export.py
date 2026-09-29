"""The XML that reaches Moodle.

A wrong macro or an unescaped character is invisible until the import fails, so
the export is asserted on its output rather than on its internals.
"""

from pathlib import Path
from xml.etree import ElementTree

from codeexpert.domain import Constraints, Difficulty
from codeexpert.export.moodle import OUTPUT_FILENAME, export_question
from codeexpert.workspace import SOLUTION, STATEMENT, TESTCASES, RunWorkspace


def _populate(workspace: RunWorkspace, *, output: str = "3\n", name: str = "Soma") -> None:
    workspace.write_json(STATEMENT, {"name": name, "statement": "Some 1 e 2."})
    workspace.write_text(SOLUTION, "int main(void) { return 0; }")
    workspace.write_json(TESTCASES, {"testcases": [{"input": "1\n2\n", "output": output}]})
    metadata = workspace.read_metadata()
    metadata.constraints = Constraints(difficulty=Difficulty.FACIL)
    workspace.write_metadata(metadata)


def test_export_produces_parseable_xml(workspace: RunWorkspace, tmp_path: Path) -> None:
    _populate(workspace)
    result = export_question(workspace, output_dir=tmp_path / "out")

    root = ElementTree.parse(result.file_path).getroot()
    assert root.tag == "quiz"
    assert len(root.findall("question")) == 1
    assert result.question_count == 1


def test_no_macro_placeholder_survives(workspace: RunWorkspace, tmp_path: Path) -> None:
    _populate(workspace)
    result = export_question(workspace, output_dir=tmp_path / "out")
    assert "Macro_" not in result.file_path.read_text(encoding="utf-8")


def test_special_characters_in_output_do_not_break_the_xml(
    workspace: RunWorkspace, tmp_path: Path
) -> None:
    _populate(workspace, output="a < b && c > d\n")
    result = export_question(workspace, output_dir=tmp_path / "out")

    root = ElementTree.parse(result.file_path).getroot()
    expected = root.find(".//testcase/expected/text")
    assert expected is not None
    assert expected.text == "a < b && c > d"


def test_question_is_not_tagged_as_reviewed_when_it_was_not(
    workspace: RunWorkspace, tmp_path: Path
) -> None:
    """The template used to assert a human review that never happened."""
    _populate(workspace)
    result = export_question(workspace, output_dir=tmp_path / "out")

    tags = {tag.text for tag in ElementTree.parse(result.file_path).getroot().iter("text")}
    assert "Nao revisado" in tags
    assert "Revisado" not in tags
    assert "Gerado por IA" in tags


def test_successive_exports_accumulate_and_number_questions(
    workspace: RunWorkspace, tmp_path: Path, isolated_settings
) -> None:
    _populate(workspace, name="Primeira")
    export_question(workspace, output_dir=tmp_path / "out")

    second = RunWorkspace.create(isolated_settings.workspace_root)
    _populate(second, name="Segunda")
    result = export_question(second, output_dir=tmp_path / "out")

    assert result.question_count == 2
    root = ElementTree.parse(tmp_path / "out" / OUTPUT_FILENAME).getroot()
    names = [q.findtext("name/text") for q in root.findall("question")]
    assert names == ["Primeira", "Segunda"]
