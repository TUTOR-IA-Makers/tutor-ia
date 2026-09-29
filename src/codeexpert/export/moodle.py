"""Step 5 — Moodle CodeRunner XML.

Templates live next to this module and are read through `importlib.resources`,
so the package works from an installed wheel and not only from the repository
root. The macro substitution scheme is unchanged; what changed is that every
value is XML-escaped on the way in, and that the question's tags now describe
what actually happened to it.
"""

import logging
import re
from dataclasses import dataclass
from importlib import resources
from pathlib import Path
from xml.sax.saxutils import escape

from codeexpert.domain import RunMetadata, Statement, TestCase
from codeexpert.settings import get_settings
from codeexpert.workspace import SOLUTION, STATEMENT, TESTCASES, RunWorkspace

logger = logging.getLogger(__name__)

OUTPUT_FILENAME = "Moodle_Questionnaire.xml"
CODERUNNER_TYPE = "c_program"
EXAMPLE_CASE_COUNT = 3

_QUESTION_MARKER = re.compile(r'<question\s+type="coderunner"')


@dataclass(frozen=True)
class ExportResult:
    file_path: Path
    question_count: int


def _template(name: str) -> str:
    return (resources.files("codeexpert.export.templates") / name).read_text(encoding="utf-8")


def _cdata_safe(text: str) -> str:
    """Keep a literal `]]>` inside the source from closing the CDATA section."""
    return text.replace("]]>", "]]]]><![CDATA[>")


def _build_tags(metadata: RunMetadata) -> str:
    """Tags that describe the question truthfully.

    The template used to hard-code `Revisado` ("reviewed"), which asserted a human
    review that never happened — the gap that separates this prototype from
    FEAT-024. Until an approval gate exists, the honest tag is the opposite one.
    """
    tags = ["Gerado por IA"]
    if metadata.constraints is not None:
        tags.append(metadata.constraints.difficulty.value.title())
    tags.append("Revisado" if metadata.reviewed else "Nao revisado")
    return "\n          ".join(f"<tag><text>{escape(tag)}</text></tag>" for tag in tags)


def _build_testcases_xml(testcases: list[TestCase], template: str) -> str:
    parts = []
    for index, case in enumerate(testcases):
        xml = template
        xml = xml.replace("Macro_StdIn", escape(case.input.strip()))
        xml = xml.replace("Macro_OutputExpected", escape(case.output.strip()))
        xml = xml.replace("Macro_Display", "")
        xml = xml.replace("Macro_UseAsExample", '"1"' if index < EXAMPLE_CASE_COUNT else '"0"')
        parts.append(xml)
    return "\n".join(parts)


def export_question(workspace: RunWorkspace, output_dir: Path | None = None) -> ExportResult:
    """Append this run's question to the questionnaire file.

    Successive exports accumulate into one file, which is how a whole quiz gets
    built. The question number is derived from what the file already contains
    rather than fixed at 1.
    """
    statement = Statement.model_validate(workspace.read_json(STATEMENT))
    code = workspace.read_text(SOLUTION)
    testcases = [
        TestCase.model_validate(item) for item in workspace.read_json(TESTCASES)["testcases"]
    ]
    metadata = workspace.read_metadata()

    directory = output_dir or get_settings().questions_dir
    directory.mkdir(parents=True, exist_ok=True)
    output_file = directory / OUTPUT_FILENAME

    existing = output_file.read_text(encoding="utf-8") if output_file.exists() else ""
    question_number = len(_QUESTION_MARKER.findall(existing)) + 1

    statement_html = escape(statement.statement).replace("\n", "<br>")
    question_xml = (
        _template("question.xml")
        .replace("Macro_QuestionNumber", str(question_number))
        .replace("Macro_QuestionName", escape(statement.name))
        .replace("Macro_QuestionTextinHTML", statement_html)
        .replace("Macro_Hidden", "0")
        .replace("Macro_CoderunnerType", CODERUNNER_TYPE)
        .replace("Macro_Answer", _cdata_safe(code))
        .replace("Macro_TestCases", _build_testcases_xml(testcases, _template("case.xml")))
        .replace("Macro_Tags", _build_tags(metadata))
    )

    if existing:
        final_xml = existing.replace("</quiz>", question_xml + "\n</quiz>")
    else:
        final_xml = _template("questionnaire.xml").replace("Macro_Question", question_xml)

    output_file.write_text(final_xml, encoding="utf-8")
    logger.info("Moodle XML saved to %s (question %d)", output_file, question_number)
    return ExportResult(file_path=output_file, question_count=question_number)
