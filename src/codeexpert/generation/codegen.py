"""Step 2 — the reference solution in C."""

import logging
import re

from codeexpert.domain import Statement
from codeexpert.generation._trace import record_step
from codeexpert.generation.prompts import CODE_SYSTEM, PROMPT_VERSIONS, build_code_prompt
from codeexpert.llm import LLMClient
from codeexpert.workspace import SOLUTION, STATEMENT, RunWorkspace

logger = logging.getLogger(__name__)

_FENCE = re.compile(r"^\s*```[a-zA-Z0-9+#-]*\s*\n(?P<body>.*?)\n\s*```\s*$", re.DOTALL)


def strip_code_fences(raw: str) -> str:
    """Remove a surrounding markdown fence if the model added one anyway.

    Both prompts forbid markdown, and the model still emits it often enough to be
    the most common cause of a compilation failure. Cheaper to strip than to
    re-prompt.
    """
    match = _FENCE.match(raw)
    return match.group("body").strip() if match else raw.strip()


def generate_code(workspace: RunWorkspace, llm: LLMClient) -> str:
    statement = Statement.model_validate(workspace.read_json(STATEMENT))

    raw = llm.complete(system=CODE_SYSTEM, user=build_code_prompt(statement.statement))
    code = strip_code_fences(raw)

    workspace.write_text(SOLUTION, code)
    record_step(workspace, "code", PROMPT_VERSIONS["code"])

    logger.info("Solution saved to %s", workspace.path(SOLUTION))
    return code
