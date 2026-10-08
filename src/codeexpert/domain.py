"""Entities shared by the generation steps.

Plain pydantic models with no I/O and no HTTP. `codeexpert.api.schemas` wraps
these for the wire; services return them directly.
"""

from enum import StrEnum

from pydantic import BaseModel, Field


class Difficulty(StrEnum):
    """Accepted difficulty levels.

    A closed set, so an unknown value is a 422 from the API instead of a prompt
    that silently omits the difficulty line.
    """

    MUITO_FACIL = "muito facil"
    FACIL = "facil"
    MEDIO = "medio"
    DIFICIL = "dificil"
    MUITO_DIFICIL = "muito dificil"


class ContentAxis(StrEnum):
    """Priority axes for content taxonomy (E1-E4).
    A closed set to ensure standard taxonomy across cataloging.
    """

    FUNDAMENTOS = "fundamentos"
    CONTROLE_FLUXO = "controle de fluxo"
    ESTRUTURAS_PONTEIROS = "estruturas de dados e ponteiros"
    MODULARIZACAO = "modularizacao"


class CStructure(StrEnum):
    """Closed vocabulary of C structures for cataloging."""

    IF = "if"
    ELSE = "else"
    TERNARY = "ternario"
    SWITCH = "switch"
    FOR = "for"
    WHILE = "while"
    DO_WHILE = "do-while"
    BREAK = "break"
    CONTINUE = "continue"
    GOTO = "goto"
    ARRAY_1D = "vetor"
    ARRAY_2D = "matriz"
    STRING = "string"
    STRUCT = "struct"
    TYPEDEF = "typedef"
    ENUM = "enum"
    POINTER = "ponteiro"
    DYNAMIC_ALLOC = "alocacao dinamica"
    FUNCTION = "funcao"
    PASS_BY_REFERENCE = "passagem por referencia"  # noqa: S105
    RECURSION = "recursao"
    FILE_IO = "arquivos"
    MATH_LIB = "math.h"
    STRING_LIB = "string.h"
    STDLIB = "stdlib.h"


class Constraints(BaseModel):
    """The pedagogical restrictions an exercise must respect.

    These are what the statement prompt is built from, and what a future scope
    check (FEAT-024) will verify against the generated solution's AST.
    """

    can_has_if: bool = True
    can_has_else: bool = True
    can_has_repetition: bool = False
    can_has_function: bool = False
    can_has_matrix: bool = False
    difficulty: Difficulty = Difficulty.MUITO_FACIL


class Statement(BaseModel):
    name: str = ""
    statement: str = ""


class TestCase(BaseModel):
    input: str
    output: str


class StepRecord(BaseModel):
    """One executed pipeline step, for traceability."""

    step: str
    prompt_version: str | None = None
    model: str | None = None
    finished_at: str


class RunMetadata(BaseModel):
    """Everything needed to explain how a question was produced.

    Persisted as `meta.json` inside the run workspace. EPIC-017 requires
    traceability of model, prompt version and parameters before a generated
    question may be shown to a teacher; this is where that record lives.
    """

    run_id: str
    created_at: str
    constraints: Constraints | None = None
    input_quantity: int | None = None
    steps: list[StepRecord] = Field(default_factory=list)
    reviewed: bool = False
