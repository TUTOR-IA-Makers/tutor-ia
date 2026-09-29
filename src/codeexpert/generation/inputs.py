"""Step 3 — candidate stdin payloads for the reference solution."""

import json
import logging

from codeexpert.domain import Statement
from codeexpert.generation._trace import record_step
from codeexpert.generation.prompts import INPUTS_SYSTEM, PROMPT_VERSIONS, build_inputs_prompt
from codeexpert.llm import LLMClient
from codeexpert.workspace import INPUTS, SOLUTION, STATEMENT, RunWorkspace

logger = logging.getLogger(__name__)


def parse_inputs(raw: str) -> list[str]:
    """Best-effort extraction of a JSON array of strings.

    Three tiers, in order of trust: valid JSON, a bracketed line, then one input
    per line. The fallbacks exist because the model occasionally wraps the array
    in prose; they are deliberately forgiving and deliberately tested.
    """
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        pass
    else:
        if isinstance(parsed, list):
            return [str(item) for item in parsed]

    stripped = raw.strip()
    if stripped.startswith("[") and stripped.endswith("]"):
        body = stripped[1:-1]
        return [item.strip().strip('"') for item in body.split(",") if item.strip()]

    return [
        line.strip().strip('[]"` ')
        for line in stripped.split("\n")
        if line.strip() and not line.startswith("```")
    ]


def generate_inputs(workspace: RunWorkspace, quantity: int, llm: LLMClient) -> list[str]:
    statement = Statement.model_validate(workspace.read_json(STATEMENT))
    solution_code = workspace.read_text(SOLUTION)

    raw = llm.complete(
        system=INPUTS_SYSTEM,
        user=build_inputs_prompt(statement.statement, solution_code, quantity),
    )
    inputs = parse_inputs(raw)[:quantity]

    workspace.write_json(INPUTS, {"inputs": inputs})

    metadata = workspace.read_metadata()
    metadata.input_quantity = quantity
    workspace.write_metadata(metadata)
    record_step(workspace, "inputs", PROMPT_VERSIONS["inputs"])

    logger.info("Inputs saved to %s", workspace.path(INPUTS))
    return inputs
