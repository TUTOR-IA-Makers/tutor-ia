"""Every prompt in the project, in one reviewable file.

Prompts are the transferable asset of this prototype: changing one changes the
output in a way no type checker catches. Two rules, enforced by review (see
CODEOWNERS) and by `.agents/rules/prompts.md`:

1.  Bump the matching entry in `PROMPT_VERSIONS` in the same commit. The version
    is written into each run's `meta.json`, so a bad batch of questions can be
    traced back to the prompt that produced it.
2.  If you change the *shape* of the answer you ask for, update the parser that
    reads it. `parse_statement` depends on the `[block]` convention; `parse_inputs`
    depends on the answer being a JSON array. Mismatches fail silently, not loudly.
"""

from codeexpert.domain import Constraints, Difficulty

PROMPT_VERSIONS = {
    "statement": "2026-09-18.1",
    "code": "2026-09-18.1",
    "inputs": "2026-09-18.1",
}

STATEMENT_SYSTEM = (
    "You are a problem statement generator for programming exercises. "
    "Do not use any markdown formatting in your responses. Use plain text only."
)

CODE_SYSTEM = (
    "You are a C code generator for programming exercises. "
    "Do not use any markdown formatting in your responses. "
    "Return only the raw C code without backticks or language indicators."
)

INPUTS_SYSTEM = (
    "You are a test input generator that creates diverse and valid inputs based on code analysis."
)

_DIFFICULTY_LINE = {
    Difficulty.MUITO_FACIL: "A questão deve ser de nivel MUITO FÁCIL",
    Difficulty.FACIL: "A questão deve ser de nivel FÁCIL",
    Difficulty.MEDIO: "A questão deve ser de nivel MEDIO",
    Difficulty.DIFICIL: "A questão deve ser de nivel DIFICIL",
    Difficulty.MUITO_DIFICIL: "A questão deve ser de nivel MUITO DIFICIL",
}


def describe_constraints(constraints: Constraints) -> list[str]:
    """The restriction lines, in the order the prompt presents them.

    Returned separately from the prompt because a scope check (FEAT-024) will
    need the same list to verify the generated solution against what was asked.
    """
    lines: list[str] = []

    if not constraints.can_has_if:
        lines.append("NÃO deve usar estruturas condicionais (if)")
    elif not constraints.can_has_else:
        lines.append("DEVE usar if mas NÃO deve usar else")
    else:
        lines.append("DEVE usar estruturas condicionais completas (if e else)")

    lines.append(_DIFFICULTY_LINE[constraints.difficulty])
    lines.append(
        "DEVE usar estruturas de repetição (for, while ou do while)"
        if constraints.can_has_repetition
        else "NÃO deve usar estruturas de repetição"
    )
    lines.append("DEVE usar funções" if constraints.can_has_function else "NÃO deve usar funções")
    lines.append(
        "DEVE usar vetores ou matrizes"
        if constraints.can_has_matrix
        else "NÃO deve usar vetores ou matrizes"
    )
    return lines


def build_statement_prompt(constraints: Constraints) -> str:
    requirements = "\n".join(f"- {line}" for line in describe_constraints(constraints))
    return f"""Gere um enunciado de problema de programação para alunos que estão tendo seu primeiro contato com a programação em português seguindo estas regras:

Requisitos da solução:
{requirements}

Gere um título curto e descritivo para o exercício que reflita os requisitos acima.

O enunciado deve seguir este formato:

[Título do problema]

[Descrição do problema]

[Descrição das entradas]

[Descrição das saídas]

IMPORTANTE:
1. NÃO inclua exemplos de entrada e saída no enunciado
2. NÃO use formatação markdown (como #, *, _, >, `) no texto
3. Use apenas texto puro sem formatação especial
4. O título deve ser gerado de acordo com o problema
5. O problema deve ser resolvível seguindo EXATAMENTE os requisitos de solução acima
6. NÃO COLOQUE ACENTOS, para evitar problemas com a linguagem C
"""


def build_code_prompt(statement: str) -> str:
    return f"""Write C code that solves this problem:

{statement}

Rules:
1. Use function for input without any prompting messages
2. Read inputs directly without printing any messages or instructions
3. Do not use any markdown formatting (no backticks, no language indicators)
4. Use meaningful variable names
5. Add comments explaining the code
6. Follow good programming practices

Respond with ONLY the C code, no explanations or formatting."""


def build_inputs_prompt(statement: str, solution_code: str, quantity: int) -> str:
    return f"""Analyze this C code and problem statement to generate {quantity} valid test inputs.

Problem Statement:
{statement}

C Code:
{solution_code}

Rules:
1. Each input must match exactly what the code expects to read from stdin
2. Follow the scanf patterns in the code to determine input format
3. Generate {quantity} different valid inputs
4. If the code has no input instructions (scanf/gets), return an empty array
5. Return ONLY a JSON array containing the inputs
6. For multi-line inputs, use \\n between lines
7. Include edge cases and normal cases
8. Do not use markdown formatting
9. Each number must be on a separate line (no space-separated numbers)

Respond with ONLY a JSON array. Example: ["3\\n10\\n20\\n30\\n-1\\n", "2\\n5\\n-1\\n"]"""
