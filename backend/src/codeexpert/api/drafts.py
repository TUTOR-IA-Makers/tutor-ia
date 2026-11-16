"""What the generation form sends, and what it means for the pipeline.

The form speaks the front-end's vocabulary — ten contents, a 500-3500 rating,
three lists of structures (`frontend/src/services/http/mappers.ts`, `fromDraft`)
— while the pipeline takes `Constraints`. The translation is a pure function so
it can be tested without a server, and so the rules live in one place.

The mapping is lossy: ten contents become four axes, a rating range becomes one
level, and most structures have no flag. That is why the route also stores the
draft itself.
"""

from pydantic import BaseModel, Field, model_validator

from codeexpert.domain import Constraints, ContentAxis, CStructure, Difficulty

RATING_MIN = 500
RATING_MAX = 3500

# frontend/src/domain/contents.ts → the axes of docs/product/taxonomy.md.
CONTENT_AXIS: dict[str, ContentAxis] = {
    "entrada-saida": ContentAxis.FUNDAMENTOS,
    "condicionais": ContentAxis.CONTROLE_FLUXO,
    "repeticao": ContentAxis.CONTROLE_FLUXO,
    "vetores": ContentAxis.ESTRUTURAS_PONTEIROS,
    "matrizes": ContentAxis.ESTRUTURAS_PONTEIROS,
    "strings": ContentAxis.ESTRUTURAS_PONTEIROS,
    "ponteiros": ContentAxis.ESTRUTURAS_PONTEIROS,
    "structs": ContentAxis.ESTRUTURAS_PONTEIROS,
    "funcoes": ContentAxis.MODULARIZACAO,
    "recursao": ContentAxis.MODULARIZACAO,
}

# Upper bound of each band, copied from DIFFICULTY_BANDS in
# frontend/src/domain/difficulty.ts so the level matches the label the teacher saw.
DIFFICULTY_BANDS: list[tuple[int, Difficulty]] = [
    (950, Difficulty.MUITO_FACIL),
    (1350, Difficulty.FACIL),
    (1850, Difficulty.MEDIO),
    (2350, Difficulty.DIFICIL),
    (RATING_MAX, Difficulty.MUITO_DIFICIL),
]

# Each `Constraints` flag and the structures it stands for. The prompt can only
# say "use" or "do not use" per flag, so a flag covers a group.
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


class StructureRules(BaseModel):
    required: list[CStructure] = Field(default_factory=list)
    allowed: list[CStructure] = Field(default_factory=list)
    forbidden: list[CStructure] = Field(default_factory=list)

    @model_validator(mode="after")
    def _forbidden_is_exclusive(self) -> "StructureRules":
        clash = set(self.forbidden) & (set(self.required) | set(self.allowed))
        if clash:
            names = ", ".join(sorted(clash))
            raise ValueError(
                f"A structure cannot be forbidden and also required or allowed: {names}."
            )
        return self


class QuestionDraft(BaseModel):
    """The body of `POST /api/v1/questions`. Limits mirror the form's schema."""

    content_id: str
    difficulty_min: int = Field(ge=RATING_MIN, le=RATING_MAX)
    difficulty_max: int = Field(ge=RATING_MIN, le=RATING_MAX)
    test_case_count: int = Field(ge=1, le=20)
    test_case_hints: str | None = Field(default=None, max_length=1000)
    context: str | None = Field(default=None, max_length=300)
    structures: StructureRules = Field(default_factory=StructureRules)

    @model_validator(mode="after")
    def _check(self) -> "QuestionDraft":
        if self.content_id not in CONTENT_AXIS:
            known = ", ".join(CONTENT_AXIS)
            raise ValueError(f"Unknown content_id '{self.content_id}'. Use one of: {known}.")
        if self.difficulty_min > self.difficulty_max:
            raise ValueError("difficulty_min cannot be greater than difficulty_max.")
        return self


def difficulty_from_rating(rating: int) -> Difficulty:
    return next(level for upper, level in DIFFICULTY_BANDS if rating <= upper)


def to_constraints(draft: QuestionDraft) -> Constraints:
    """Translate the form into what the statement prompt is built from.

    Within a group, asking for or allowing any structure turns the flag on, even
    if another one of the group is forbidden: the solution must be able to use
    what was asked for. Only then does a prohibition turn it off. A group the
    teacher did not mention keeps the `Constraints` default.

    Difficulty takes the band of `difficulty_max`. Provisional: requiring
    `min == max` would reject the form's own default range. See issue #38.
    """
    wanted = set(draft.structures.required) | set(draft.structures.allowed)
    forbidden = set(draft.structures.forbidden)
    fields: dict[str, object] = {
        "difficulty": difficulty_from_rating(draft.difficulty_max),
        "axis": CONTENT_AXIS[draft.content_id],
    }
    for flag, group in FLAG_GROUPS.items():
        if group & wanted:
            fields[flag] = True
        elif group & forbidden:
            fields[flag] = False
    return Constraints.model_validate(fields)
