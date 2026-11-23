"""Entities shared by the generation steps.

Plain pydantic models with no I/O and no HTTP. `codeexpert.api.schemas` wraps
these for the wire; services return them directly.
"""

from collections.abc import Iterable
from enum import StrEnum
from typing import Any, Self

from pydantic import BaseModel, Field, TypeAdapter, model_validator


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


class QuestionState(StrEnum):
    """Where a question is in its life, from generation to a teacher's decision.

    The values are the names the plan and the review screen use, so the wire,
    the database and the documentation all say the same word. Which state may
    follow which lives in `codeexpert.lifecycle`, and nowhere else.
    """

    GERANDO = "GERANDO"
    GERADA = "GERADA"
    FALHOU_VERIFICACAO = "FALHOU_VERIFICACAO"
    APROVADA = "APROVADA"
    REJEITADA = "REJEITADA"


class JobState(StrEnum):
    """Where the background generation of a question stands — the process, not the question.

    Kept apart from `QuestionState` on purpose (docs/adr/0015, docs/adr/0017):
    `INTERROMPIDO` says the server stopped while generating, which is a fact about
    the job and says nothing a teacher has decided about the question.
    """

    EM_ANDAMENTO = "EM_ANDAMENTO"
    INTERROMPIDO = "INTERROMPIDO"
    FALHOU = "FALHOU"
    CONCLUIDO = "CONCLUIDO"


class JobRecord(BaseModel):
    """The persisted state of one background generation. See docs/adr/0017."""

    state: JobState
    # The step running (EM_ANDAMENTO) or the one that was running when the job
    # stopped. One of `codeexpert.generation.job.STEPS`; None before the first.
    step: str | None = None
    # Teacher-facing, Portuguese, never the exception text. Only when FALHOU.
    failure_reason: str | None = None
    # The exception class name, for whoever reads the server log next to it.
    error: str | None = None
    updated_at: str


# The five booleans `Constraints` used to be, and the structures each stood for.
# They survive in two places only: old requests and old runs still carry them
# (translated on the way in), and the statement prompt still speaks in them
# (derived on the way out). See docs/adr/0020.
FLAG_GROUPS: dict[str, frozenset[CStructure]] = {
    "can_has_if": frozenset({CStructure.IF}),
    "can_has_else": frozenset({CStructure.ELSE}),
    "can_has_repetition": frozenset({CStructure.FOR, CStructure.WHILE, CStructure.DO_WHILE}),
    "can_has_function": frozenset(
        {CStructure.FUNCTION, CStructure.RECURSION, CStructure.PASS_BY_REFERENCE}
    ),
    # The prompt line for this flag reads "vetores ou matrizes".
    "can_has_matrix": frozenset({CStructure.ARRAY_1D, CStructure.ARRAY_2D}),
}

# What each group gets when a request says nothing about it: the old flag
# defaults. The prompt has always asked for these, so they are stored as asked.
FLAG_DEFAULTS: dict[str, bool] = {
    "can_has_if": True,
    "can_has_else": True,
    "can_has_repetition": False,
    "can_has_function": False,
    "can_has_matrix": False,
}

_BOOL = TypeAdapter(bool)


def _in_vocabulary_order(structures: set[CStructure]) -> list[CStructure]:
    # One canonical order, so equal constraints compare and serialise equal.
    return [item for item in CStructure if item in structures]


def check_exclusive(
    required: Iterable[CStructure], allowed: Iterable[CStructure], forbidden: Iterable[CStructure]
) -> None:
    """Reject a structure that is forbidden and also required or allowed."""
    clash = set(forbidden) & (set(required) | set(allowed))
    if clash:
        names = ", ".join(_in_vocabulary_order(clash))
        raise ValueError(f"A structure cannot be forbidden and also required or allowed: {names}.")


class Constraints(BaseModel):
    """The pedagogical restrictions an exercise must respect, by structure name.

    Named in the vocabulary of docs/product/taxonomy.md (`CStructure`), so a
    scope check (G2-2) can compare them with the structures found in the
    solution's AST. `required` must appear, `forbidden` must not, `allowed` may.

    After validation every flag group is mentioned in some list: a group the
    request left out gets its old default. That keeps what is stored equal to
    what the prompt asked for.
    """

    required: list[CStructure] = Field(default_factory=list)
    allowed: list[CStructure] = Field(default_factory=list)
    forbidden: list[CStructure] = Field(default_factory=list)
    difficulty: Difficulty = Difficulty.MUITO_FACIL
    axis: ContentAxis | None = None

    @model_validator(mode="before")
    @classmethod
    def _translate_flags(cls, data: Any) -> Any:
        """Accept the five booleans from old clients and old `meta.json` files.

        `true` becomes allowed rather than required: for loops and arrays the old
        flag meant "any of the group", which a required list cannot express.
        """
        if not isinstance(data, dict) or not FLAG_GROUPS.keys() & data.keys():
            return data
        data = dict(data)
        allowed = list(data.get("allowed") or [])
        forbidden = list(data.get("forbidden") or [])
        for flag, group in FLAG_GROUPS.items():
            if flag in data:
                target = allowed if _BOOL.validate_python(data.pop(flag)) else forbidden
                target.extend(_in_vocabulary_order(set(group)))
        data["allowed"], data["forbidden"] = allowed, forbidden
        return data

    @model_validator(mode="after")
    def _normalise(self) -> Self:
        check_exclusive(self.required, self.allowed, self.forbidden)
        required, allowed, forbidden = set(self.required), set(self.allowed), set(self.forbidden)
        mentioned = required | allowed | forbidden
        for flag, group in FLAG_GROUPS.items():
            if not group & mentioned:
                (allowed if FLAG_DEFAULTS[flag] else forbidden).update(group)
        self.required = _in_vocabulary_order(required)
        # Required already permits; listing it twice would only invite drift.
        self.allowed = _in_vocabulary_order(allowed - required)
        self.forbidden = _in_vocabulary_order(forbidden)
        return self

    def _flag(self, flag: str) -> bool:
        # Asking for or allowing any structure of a group turns its flag on, even
        # if another one of the group is forbidden: the solution must be able to
        # use what was asked for.
        return bool(FLAG_GROUPS[flag] & (set(self.required) | set(self.allowed)))

    # Read-only views for the statement prompt, which still speaks in flags.
    # Not fields: they are never stored and never accepted as such.
    @property
    def can_has_if(self) -> bool:
        return self._flag("can_has_if")

    @property
    def can_has_else(self) -> bool:
        return self._flag("can_has_else")

    @property
    def can_has_repetition(self) -> bool:
        return self._flag("can_has_repetition")

    @property
    def can_has_function(self) -> bool:
        return self._flag("can_has_function")

    @property
    def can_has_matrix(self) -> bool:
        return self._flag("can_has_matrix")


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
    # Set once, by the approval that moved the question to APROVADA. A repeated
    # approval leaves them as they are. See docs/adr/0016.
    approved_by: str | None = None
    approved_at: str | None = None


class StoredQuestion(BaseModel):
    """The last completed generation, read from the structured question bank."""

    run_id: str
    statement: Statement
    reference_solution: str
    constraints: Constraints | None = None
    difficulty: Difficulty | None = None
    axis: ContentAxis | None = None
    state: QuestionState
    testcases: list[TestCase] = Field(default_factory=list)
    metadata: RunMetadata
