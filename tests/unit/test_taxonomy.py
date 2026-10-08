import re
from pathlib import Path

from codeexpert.domain import ContentAxis, CStructure


def test_taxonomy_docs_match_enums():
    docs_path = Path("docs/product/taxonomy.md")
    assert docs_path.exists(), "Taxonomy document must exist"
    content = docs_path.read_text(encoding="utf-8")

    # Extract enum values to check
    axis_values = set(item.value for item in ContentAxis)
    struct_values = set(item.value for item in CStructure)

    import unicodedata

    def strip_accents(s):
        return "".join(
            c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn"
        )

    content_unaccented = strip_accents(content).lower()

    for axis in axis_values:
        axis_clean = strip_accents(axis).lower()
        assert axis_clean in content_unaccented, f"ContentAxis '{axis}' not found in taxonomy.md"

    for struct in struct_values:
        # We expect `- `struct`: ` in the markdown
        pattern = r"- `" + re.escape(struct) + r"`:"
        assert re.search(pattern, content), (
            f"CStructure '{struct}' definition not found in taxonomy.md (expected format: `- `{struct}`:`)"
        )
