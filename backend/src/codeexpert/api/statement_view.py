"""Split a stored statement into the title, body, input and output the screen shows.

`parse_statement` keeps the whole model answer in `Statement.statement`, title
first, because steps 2 and 3 and the Moodle export read it as one text. The
review screen needs the parts apart: the title is the page heading and the
input and output have their own boxes. Splitting here, when the response is
built, also fixes questions stored before this existed.
"""

import re
import unicodedata
from dataclasses import dataclass

_TITLE_LABELS = frozenset({"titulo do problema", "titulo"})
_TEXT_LABELS = frozenset({"descricao do problema", "descricao", "enunciado", "problema"})
_INPUT_LABELS = frozenset({"descricao das entradas", "descricao da entrada", "entradas", "entrada"})
_OUTPUT_LABELS = frozenset({"descricao das saidas", "descricao da saida", "saidas", "saida"})

INPUT_LABEL = "Descricao das entradas"
OUTPUT_LABEL = "Descricao das saidas"


@dataclass(frozen=True)
class StatementParts:
    text: str
    input: str
    output: str


def _normalise(line: str) -> str:
    without_accents = unicodedata.normalize("NFKD", line).encode("ascii", "ignore").decode("ascii")
    return without_accents.strip().strip("[]").rstrip(":").strip().lower()


def _section_of(label: str) -> str | None:
    if label in _TITLE_LABELS:
        return "title"
    if label in _TEXT_LABELS:
        return "text"
    if label in _INPUT_LABELS:
        return "input"
    if label in _OUTPUT_LABELS:
        return "output"
    return None


def _inline_label(line: str) -> tuple[str, str] | None:
    """`Entrada: dois inteiros` → ("input", "dois inteiros")."""
    head, separator, rest = line.partition(":")
    if not separator or not rest.strip():
        return None
    section = _section_of(_normalise(head))
    if section not in {"input", "output"}:
        return None
    return section, rest.strip()


def _join(lines: list[str]) -> str:
    return re.sub(r"\n{3,}", "\n\n", "\n".join(lines)).strip()


def split_statement(name: str, statement: str) -> StatementParts:
    """Drop the title line and any block labels; move input and output out of the body."""
    sections: dict[str, list[str]] = {"text": [], "input": [], "output": []}
    current = "text"
    title_seen = False
    for raw in statement.split("\n"):
        line = raw.strip()
        if not line:
            sections[current].append("")
            continue
        section = _section_of(_normalise(line))
        if section == "title":
            continue
        if section is not None:
            current = section
            continue
        inline = _inline_label(line)
        if inline is not None:
            current, line = inline
        elif not title_seen and current == "text" and line == name.strip():
            title_seen = True
            continue
        sections[current].append(line)
    return StatementParts(
        text=_join(sections["text"]),
        input=_join(sections["input"]),
        output=_join(sections["output"]),
    )


def join_statement(name: str, parts: StatementParts) -> str:
    """The inverse: the single text steps 2 and 3 and the export read."""
    blocks = [f"{name}\n{parts.text.strip()}".strip()]
    if parts.input.strip():
        blocks.append(f"{INPUT_LABEL}\n{parts.input.strip()}")
    if parts.output.strip():
        blocks.append(f"{OUTPUT_LABEL}\n{parts.output.strip()}")
    return "\n\n".join(blocks)
