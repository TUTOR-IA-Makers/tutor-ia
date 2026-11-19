"""Step 5 — Moodle CodeRunner XML.

Templates live next to this module and are read through `importlib.resources`,
so the package works from an installed wheel and not only from the repository
root. Every value is XML-escaped on the way in, and the question's tags describe
what actually happened to it.

The renderer is a pure function from questions to XML. It used to append to a
shared `var/questions/Moodle_Questionnaire.xml`, numbering each question by
counting the ones already in the file: read, modify, write. Two exports at the
same time read the same file and one question vanished without an error. Now
nothing is shared, so there is nothing to race on (G1-8, #43).
"""

import logging
from collections.abc import Sequence
from dataclasses import dataclass
from importlib import resources
from xml.sax.saxutils import escape

from codeexpert.domain import RunMetadata, Statement, TestCase
from codeexpert.workspace import SOLUTION, STATEMENT, TESTCASES, RunWorkspace

logger = logging.getLogger(__name__)

CODERUNNER_TYPE = "c_program"
EXAMPLE_CASE_COUNT = 3


@dataclass(frozen=True)
class ExportQuestion:
    """Everything the XML of one question is made of, and nothing about where it came from."""

    statement: Statement
    code: str
    testcases: tuple[TestCase, ...]
    metadata: RunMetadata


@dataclass(frozen=True)
class ExportResult:
    """Step 5's answer: the run's question as a questionnaire of its own."""

    xml: str
    question_count: int


def _template(name: str) -> str:
    return (resources.files("codeexpert.export.templates") / name).read_text(encoding="utf-8")


def _cdata_safe(text: str) -> str:
    """Keep a literal `]]>` inside the source from closing the CDATA section."""
    return text.replace("]]>", "]]]]><![CDATA[>")


def _build_tags(metadata: RunMetadata) -> str:
    """Tags that describe the question truthfully.

    The template used to hard-code `Revisado` ("reviewed"), which asserted a human
    review that never happened. A question is tagged reviewed only once approved.
    """
    tags = ["Gerado por IA"]
    if metadata.constraints is not None:
        tags.append(metadata.constraints.difficulty.value.title())
    tags.append("Revisado" if metadata.reviewed else "Nao revisado")
    return "\n          ".join(f"<tag><text>{escape(tag)}</text></tag>" for tag in tags)


def _build_testcases_xml(testcases: Sequence[TestCase], template: str) -> str:
    parts = []
    for index, case in enumerate(testcases):
        xml = template
        xml = xml.replace("Macro_StdIn", escape(case.input.strip()))
        xml = xml.replace("Macro_OutputExpected", escape(case.output.strip()))
        xml = xml.replace("Macro_Display", "")
        xml = xml.replace("Macro_UseAsExample", '"1"' if index < EXAMPLE_CASE_COUNT else '"0"')
        parts.append(xml)
    return "\n".join(parts)


def _build_question_xml(
    question: ExportQuestion, number: int, question_template: str, case_template: str
) -> str:
    statement_html = escape(question.statement.statement).replace("\n", "<br>")
    return (
        question_template.replace("Macro_QuestionNumber", str(number))
        .replace("Macro_QuestionName", escape(question.statement.name))
        .replace("Macro_QuestionTextinHTML", statement_html)
        .replace("Macro_Hidden", "0")
        .replace("Macro_CoderunnerType", CODERUNNER_TYPE)
        .replace("Macro_Answer", _cdata_safe(question.code))
        .replace("Macro_TestCases", _build_testcases_xml(question.testcases, case_template))
        .replace("Macro_Tags", _build_tags(question.metadata))
    )


def read_question(workspace: RunWorkspace) -> ExportQuestion:
    """Load what the XML needs from a run, or raise `MissingArtefactError` naming the step."""
    return ExportQuestion(
        statement=Statement.model_validate(workspace.read_json(STATEMENT)),
        code=workspace.read_text(SOLUTION),
        testcases=tuple(
            TestCase.model_validate(item) for item in workspace.read_json(TESTCASES)["testcases"]
        ),
        metadata=workspace.read_metadata(),
    )


def export_questions(questions: Sequence[ExportQuestion]) -> str:
    """Render `questions` as one Moodle CodeRunner questionnaire, in the order given.

    Pure: no file is read or written, and the same list always gives the same
    XML. A question's number is its 1-based position in `questions`, so the
    caller decides the order of the quiz. Refusing questions that are not
    approved is the caller's job (G3-4), not this function's.

    Raises `ValueError` on an empty list: Moodle has nothing to import from an
    empty quiz, and a caller that reaches here with no questions has a bug.
    """
    if not questions:
        raise ValueError("Nothing to export: pass at least one question.")
    question_template = _template("question.xml")
    case_template = _template("case.xml")
    body = "\n".join(
        _build_question_xml(question, number, question_template, case_template)
        for number, question in enumerate(questions, start=1)
    )
    return _template("questionnaire.xml").replace("Macro_Question", body)


def export_run(workspace: RunWorkspace) -> ExportResult:
    """Step 5: render this run's question and mark the run complete.

    The XML is returned, not written anywhere: one run's export cannot touch
    another's. Calling it twice gives the same XML twice.
    """
    xml = export_questions([read_question(workspace)])
    # The last step: only now is this a question and not a draft. See docs/adr/0012.
    workspace.complete()
    logger.info("Run %s — Moodle XML rendered", workspace.run_id)
    return ExportResult(xml=xml, question_count=1)
