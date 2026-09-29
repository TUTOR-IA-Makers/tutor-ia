"""The functions that read model output.

These fail silently when a prompt changes shape, which is why they are the first
thing this repository tests. See `.agents/rules/prompts.md`.
"""

import pytest

from codeexpert.generation.codegen import strip_code_fences
from codeexpert.generation.inputs import parse_inputs
from codeexpert.generation.statement import parse_statement


class TestParseStatement:
    def test_extracts_title_from_first_block(self, statement_response: str) -> None:
        statement = parse_statement(statement_response)
        assert statement.name == "Soma de dois numeros"
        assert "Leia dois numeros" in statement.statement

    def test_blocks_are_separated_by_blank_lines(self, statement_response: str) -> None:
        assert "\n\n" in parse_statement(statement_response).statement

    def test_answer_without_blocks_still_yields_a_title(self) -> None:
        statement = parse_statement("Escreva um programa que soma dois numeros.")
        assert statement.name == "Escreva um programa que soma dois numeros."

    def test_empty_answer_falls_back_to_a_placeholder_title(self) -> None:
        assert parse_statement("").name == "Exercício"


class TestStripCodeFences:
    def test_removes_fence_with_language_hint(self) -> None:
        assert strip_code_fences("```c\nint main(){}\n```") == "int main(){}"

    def test_removes_bare_fence(self) -> None:
        assert strip_code_fences("```\nint main(){}\n```") == "int main(){}"

    def test_leaves_unfenced_code_untouched(self) -> None:
        assert strip_code_fences("int main(){}\n") == "int main(){}"

    def test_does_not_eat_an_inner_fence_like_string(self) -> None:
        source = 'printf("```");'
        assert strip_code_fences(source) == source


class TestParseInputs:
    def test_json_array_is_the_happy_path(self) -> None:
        assert parse_inputs('["1\\n2\\n", "3\\n4\\n"]') == ["1\n2\n", "3\n4\n"]

    def test_bracketed_line_that_is_not_valid_json(self) -> None:
        assert parse_inputs('["1", "2",]') == ["1", "2"]

    def test_one_input_per_line_fallback(self) -> None:
        assert parse_inputs("1\n2\n3") == ["1", "2", "3"]

    def test_fenced_answer_drops_the_fence_lines(self) -> None:
        assert parse_inputs("```json\n5\n6\n```") == ["5", "6"]

    @pytest.mark.parametrize("answer", ["[]", "[ ]"])
    def test_empty_array_means_the_program_reads_nothing(self, answer: str) -> None:
        assert parse_inputs(answer) == []
