"""The stored statement split into the parts the review screen shows."""

from codeexpert.api.statement_view import StatementParts, join_statement, split_statement
from codeexpert.generation.statement import parse_statement

MODEL_ANSWER = (
    "[Soma de dois numeros]\n"
    "Leia dois numeros inteiros e escreva a soma.\n"
    "[Descricao das entradas]\n"
    "Dois inteiros, um por linha.\n"
    "[Descricao das saidas]\n"
    "A soma dos dois."
)


def test_title_and_blocks_leave_the_body() -> None:
    statement = parse_statement(MODEL_ANSWER)

    parts = split_statement(statement.name, statement.statement)

    assert parts == StatementParts(
        text="Leia dois numeros inteiros e escreva a soma.",
        input="Dois inteiros, um por linha.",
        output="A soma dos dois.",
    )


def test_placeholder_labels_copied_by_the_model_are_dropped() -> None:
    raw = (
        "[Titulo do problema]\nMedia de notas\n"
        "[Descrição do problema]\nCalcule a media.\n"
        "[Descrição das entradas]\nTres notas.\n"
        "[Descrição das saídas]\nA media."
    )
    statement = parse_statement(raw)

    parts = split_statement("Media de notas", statement.statement)

    assert parts == StatementParts(text="Calcule a media.", input="Tres notas.", output="A media.")


def test_inline_labels_are_split() -> None:
    text = "Ano bissexto\nDiga se o ano e bissexto.\nEntrada: um inteiro.\nSaida: SIM ou NAO."

    parts = split_statement("Ano bissexto", text)

    assert parts == StatementParts(
        text="Diga se o ano e bissexto.", input="um inteiro.", output="SIM ou NAO."
    )


def test_text_without_blocks_stays_whole_minus_the_title() -> None:
    parts = split_statement("Fatorial", "Fatorial\nCalcule o fatorial.\n\nUse um laco.")

    assert parts == StatementParts(text="Calcule o fatorial.\n\nUse um laco.", input="", output="")


def test_a_body_line_equal_to_the_title_after_the_first_is_kept() -> None:
    parts = split_statement("Eco", "Eco\nRepita a palavra.\nEco")

    assert parts.text == "Repita a palavra.\nEco"


def test_join_is_the_inverse_of_split() -> None:
    parts = StatementParts(text="Calcule.\n\nDepois some.", input="Dois inteiros.", output="Um.")

    assert split_statement("Soma", join_statement("Soma", parts)) == parts
