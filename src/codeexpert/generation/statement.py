"""Step 1 — the exercise statement."""

import logging

from codeexpert.domain import Constraints, Statement
from codeexpert.generation._trace import record_step
from codeexpert.generation.prompts import (
    PROMPT_VERSIONS,
    STATEMENT_SYSTEM,
    build_statement_prompt,
)
from codeexpert.llm import LLMClient
from codeexpert.workspace import STATEMENT, RunWorkspace

logger = logging.getLogger(__name__)


def parse_statement(raw: str) -> Statement:
    """Turn the model's `[block]` layout into a title and a formatted body.

    Pure, and the reason it is pure: this is where a prompt change breaks things
    silently, so it must be testable without a network call.
    """
    parts: list[str] = []
    current: list[str] = []
    for line in raw.split("\n"):
        line = line.strip()
        if line.startswith("[") and line.endswith("]"):
            if current:
                parts.append("\n".join(current))
            current = [line.strip("[]")]
        elif line:
            current.append(line)
    if current:
        parts.append("\n".join(current))

    formatted = "\n\n".join(parts)
    title = next((line for line in formatted.split("\n") if line.strip()), "Exercício")
    return Statement(name=title, statement=formatted)


def generate_statement(
    workspace: RunWorkspace, constraints: Constraints, llm: LLMClient
) -> Statement:
    raw = llm.complete(system=STATEMENT_SYSTEM, user=build_statement_prompt(constraints))
    statement = parse_statement(raw)

    workspace.write_json(STATEMENT, statement.model_dump())

    metadata = workspace.read_metadata()
    metadata.constraints = constraints
    workspace.write_metadata(metadata)
    record_step(workspace, "statement", PROMPT_VERSIONS["statement"])

    logger.info("Statement saved to %s", workspace.path(STATEMENT))
    return statement
