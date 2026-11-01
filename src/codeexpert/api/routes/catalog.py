"""Read-only vocabulary shared by the configuration form and cataloging."""

from fastapi import APIRouter
from pydantic import BaseModel

from codeexpert.domain import CStructure

router = APIRouter(prefix="/api/v1", tags=["catalog"])


class StructureOption(BaseModel):
    id: CStructure
    label: str


@router.get("/structures", response_model=list[StructureOption])
async def structures() -> list[StructureOption]:
    """Expose the canonical vocabulary without maintaining another ID list."""
    return [StructureOption(id=item, label=item.value) for item in CStructure]
