"""Constraints as named structure lists, and the five booleans they replaced (G2-1)."""

import itertools
import json

import pytest
from pydantic import ValidationError

from codeexpert.domain import FLAG_DEFAULTS, FLAG_GROUPS, Constraints, CStructure, RunMetadata
from codeexpert.generation.prompts import build_statement_prompt

FLAGS = list(FLAG_GROUPS)


def _flags(constraints: Constraints) -> dict[str, bool]:
    return {flag: getattr(constraints, flag) for flag in FLAGS}


def _old_statement_lines(flags: dict[str, bool]) -> list[str]:
    """The restriction lines as prompts.py wrote them from the booleans, before G2-1.

    Copied, not imported, so the test pins the prompt the booleans produced. If
    this and `describe_constraints` ever disagree for the same request, the prompt
    changed — which is a change for prompts.py, reviewed there, not a side effect.
    """
    if not flags["can_has_if"]:
        conditional = "NÃO deve usar estruturas condicionais (if)"
    elif not flags["can_has_else"]:
        conditional = "DEVE usar if mas NÃO deve usar else"
    else:
        conditional = "DEVE usar estruturas condicionais completas (if e else)"
    return [
        conditional,
        "DEVE usar estruturas de repetição (for, while ou do while)"
        if flags["can_has_repetition"]
        else "NÃO deve usar estruturas de repetição",
        "DEVE usar funções" if flags["can_has_function"] else "NÃO deve usar funções",
        "DEVE usar vetores ou matrizes"
        if flags["can_has_matrix"]
        else "NÃO deve usar vetores ou matrizes",
    ]


class TestDefaults:
    def test_an_empty_request_stores_what_the_prompt_asks_for(self) -> None:
        constraints = Constraints()
        assert constraints.required == []
        assert constraints.allowed == [CStructure.IF, CStructure.ELSE]
        assert set(constraints.forbidden) == (
            FLAG_GROUPS["can_has_repetition"]
            | FLAG_GROUPS["can_has_function"]
            | FLAG_GROUPS["can_has_matrix"]
        )

    def test_an_empty_request_keeps_the_old_flag_defaults(self) -> None:
        assert _flags(Constraints()) == FLAG_DEFAULTS

    def test_a_group_mentioned_once_is_not_filled_in(self) -> None:
        # Allowing `while` says something about loops; `for` is left unsaid.
        constraints = Constraints(allowed=[CStructure.WHILE])
        assert CStructure.FOR not in constraints.forbidden
        assert constraints.can_has_repetition is True


class TestLists:
    def test_same_structure_forbidden_and_required_is_rejected(self) -> None:
        with pytest.raises(ValidationError, match="forbidden and also"):
            Constraints(required=["if"], forbidden=["if"])

    def test_unknown_structure_is_rejected(self) -> None:
        with pytest.raises(ValidationError):
            Constraints(required=["lacos"])

    def test_lists_are_deduplicated_in_vocabulary_order(self) -> None:
        constraints = Constraints(required=["while", "for", "while"])
        assert constraints.required == [CStructure.FOR, CStructure.WHILE]

    def test_required_is_not_repeated_in_allowed(self) -> None:
        constraints = Constraints(required=["if"], allowed=["if", "else"])
        assert constraints.required == [CStructure.IF]
        assert constraints.allowed == [CStructure.ELSE]

    def test_asking_for_one_of_a_group_turns_its_flag_on_despite_a_sibling_forbidden(
        self,
    ) -> None:
        constraints = Constraints(required=["for"], forbidden=["while"])
        assert constraints.can_has_repetition is True

    def test_forbidding_a_whole_group_turns_its_flag_off(self) -> None:
        assert Constraints(forbidden=["if"]).can_has_if is False

    def test_flags_are_views_not_stored(self) -> None:
        dumped = Constraints().model_dump()
        assert not FLAG_GROUPS.keys() & dumped.keys()

    def test_round_trips_through_json(self) -> None:
        constraints = Constraints(required=["struct"], forbidden=["goto"])
        assert Constraints.model_validate_json(constraints.model_dump_json()) == constraints


class TestLegacyBooleans:
    @pytest.mark.parametrize("values", list(itertools.product([True, False], repeat=5)))
    def test_every_combination_yields_the_same_flags(self, values: tuple[bool, ...]) -> None:
        flags = dict(zip(FLAGS, values, strict=True))
        assert _flags(Constraints.model_validate(flags)) == flags

    @pytest.mark.parametrize("values", list(itertools.product([True, False], repeat=5)))
    def test_every_combination_yields_the_same_prompt(self, values: tuple[bool, ...]) -> None:
        flags = dict(zip(FLAGS, values, strict=True))
        prompt = build_statement_prompt(Constraints.model_validate(flags))
        for line in _old_statement_lines(flags):
            assert f"- {line}\n" in prompt

    def test_a_flag_left_out_keeps_its_default(self) -> None:
        constraints = Constraints.model_validate({"can_has_repetition": True})
        assert _flags(constraints) == {**FLAG_DEFAULTS, "can_has_repetition": True}

    def test_true_means_allowed_false_means_forbidden(self) -> None:
        constraints = Constraints.model_validate(
            {"can_has_repetition": True, "can_has_matrix": False}
        )
        assert FLAG_GROUPS["can_has_repetition"] <= set(constraints.allowed)
        assert FLAG_GROUPS["can_has_matrix"] <= set(constraints.forbidden)
        assert constraints.required == []

    def test_flags_and_lists_together_are_merged(self) -> None:
        constraints = Constraints.model_validate({"can_has_function": True, "forbidden": ["goto"]})
        assert constraints.can_has_function is True
        assert CStructure.GOTO in constraints.forbidden

    def test_a_flag_contradicting_a_list_is_rejected(self) -> None:
        with pytest.raises(ValidationError, match="forbidden and also"):
            Constraints.model_validate({"can_has_repetition": True, "forbidden": ["for"]})

    def test_a_flag_that_is_not_a_boolean_is_rejected(self) -> None:
        with pytest.raises(ValidationError):
            Constraints.model_validate({"can_has_if": "maybe"})

    def test_an_old_meta_json_still_loads(self) -> None:
        # The shape every run written before G2-1 has on disk and in runs.constraints.
        old = {
            "run_id": "20260918T221100Z-1a2b3c4d",
            "created_at": "2026-09-18T22:11:00Z",
            "constraints": {
                "can_has_if": True,
                "can_has_else": False,
                "can_has_repetition": True,
                "can_has_function": False,
                "can_has_matrix": False,
                "difficulty": "facil",
                "axis": None,
            },
        }
        metadata = RunMetadata.model_validate_json(json.dumps(old))
        assert metadata.constraints is not None
        assert _flags(metadata.constraints) == {flag: old["constraints"][flag] for flag in FLAGS}
