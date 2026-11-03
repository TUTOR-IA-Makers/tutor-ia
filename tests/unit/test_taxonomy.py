import re
import unicodedata
from pathlib import Path

from codeexpert.domain import ContentAxis, CStructure

ROOT = Path(__file__).resolve().parents[2]


def _strip_accents(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def test_taxonomy_docs_match_enums():
    docs_path = ROOT / "docs" / "product" / "taxonomy.md"
    assert docs_path.exists(), f"Taxonomy document must exist at {docs_path}"
    content = docs_path.read_text(encoding="utf-8")

    # 1. Check ContentAxis bidirectional match
    axis_matches = re.findall(r"^### E\d+ — (.+)$", content, re.MULTILINE)
    doc_axes = {_strip_accents(m.strip()).lower() for m in axis_matches}
    enum_axes = {item.value for item in ContentAxis}
    assert doc_axes == enum_axes, (
        f"Mismatch between taxonomy.md axes and ContentAxis enum:\n"
        f"In doc only: {doc_axes - enum_axes}\n"
        f"In enum only: {enum_axes - doc_axes}"
    )

    # 2. Check CStructure bidirectional match
    vocab_match = re.search(
        r"## Vocabulário Fechado de Estruturas C(.*?)(?:\n---|\n## |\Z)",
        content,
        re.DOTALL,
    )
    assert vocab_match, "Section 'Vocabulário Fechado de Estruturas C' not found"
    vocab_section = vocab_match.group(1)

    doc_structs = set(re.findall(r"^[ \t]*- `([^`]+)`:", vocab_section, re.MULTILINE))
    enum_structs = {item.value for item in CStructure}

    assert doc_structs == enum_structs, (
        f"Mismatch between taxonomy.md structures and CStructure enum:\n"
        f"In doc only: {doc_structs - enum_structs}\n"
        f"In enum only: {enum_structs - doc_structs}"
    )
