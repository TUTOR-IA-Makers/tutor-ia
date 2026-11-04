"""Read-only vocabulary shared by the configuration form and cataloging."""

from fastapi import APIRouter
from pydantic import BaseModel

from codeexpert.domain import CStructure

router = APIRouter(prefix="/api/v1", tags=["catalog"])

# Teacher-facing labels (Portuguese). The enum value is the identifier and stays
# machine-friendly; the label is what the form shows. Indexing without a default
# makes a new CStructure member fail loudly here instead of showing a raw id.
LABELS: dict[CStructure, str] = {
    CStructure.IF: "if",
    CStructure.ELSE: "else",
    CStructure.TERNARY: "operador ternário",
    CStructure.SWITCH: "switch",
    CStructure.FOR: "for",
    CStructure.WHILE: "while",
    CStructure.DO_WHILE: "do / while",
    CStructure.BREAK: "break",
    CStructure.CONTINUE: "continue",
    CStructure.GOTO: "goto",
    CStructure.ARRAY_1D: "vetor",
    CStructure.ARRAY_2D: "matriz",
    CStructure.STRING: "string",
    CStructure.STRUCT: "struct",
    CStructure.TYPEDEF: "typedef",
    CStructure.ENUM: "enum",
    CStructure.POINTER: "ponteiro",
    CStructure.DYNAMIC_ALLOC: "alocação dinâmica",
    CStructure.FUNCTION: "função",
    CStructure.PASS_BY_REFERENCE: "passagem por referência",
    CStructure.RECURSION: "recursão",
    CStructure.FILE_IO: "arquivos",
    CStructure.MATH_LIB: "math.h",
    CStructure.STRING_LIB: "string.h",
    CStructure.STDLIB: "stdlib.h",
}


class StructureOption(BaseModel):
    id: CStructure
    label: str


@router.get("/structures", response_model=list[StructureOption])
async def structures() -> list[StructureOption]:
    """Expose the canonical vocabulary without maintaining another ID list."""
    return [StructureOption(id=item, label=LABELS[item]) for item in CStructure]
