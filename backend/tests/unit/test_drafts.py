"""The form-to-constraints translation behind POST /api/v1/questions."""

import pytest
from pydantic import ValidationError

from codeexpert.api.drafts import (
    CONTENT_AXIS,
    QuestionDraft,
    difficulty_from_rating,
    to_constraints,
)
from codeexpert.domain import Constraints, ContentAxis, Difficulty


def _draft(**overrides: object) -> QuestionDraft:
    body: dict[str, object] = {
        "content_id": "condicionais",
        "difficulty_min": 1200,
        "difficulty_max": 1200,
        "test_case_count": 5,
        "structures": {"required": ["if"], "allowed": [], "forbidden": []},
    }
    body.update(overrides)
    return QuestionDraft.model_validate(body)


def _rules(required=(), allowed=(), forbidden=()) -> dict[str, list[str]]:
    return {"required": list(required), "allowed": list(allowed), "forbidden": list(forbidden)}


class TestContent:
    @pytest.mark.parametrize(
        ("content_id", "axis"),
        [
            ("entrada-saida", ContentAxis.FUNDAMENTOS),
            ("repeticao", ContentAxis.CONTROLE_FLUXO),
            ("strings", ContentAxis.ESTRUTURAS_PONTEIROS),
            ("recursao", ContentAxis.MODULARIZACAO),
        ],
    )
    def test_content_becomes_its_taxonomy_axis(self, content_id: str, axis: ContentAxis) -> None:
        assert to_constraints(_draft(content_id=content_id)).axis is axis

    def test_every_form_content_is_mapped(self) -> None:
        # frontend/src/domain/contents.ts lists exactly these ten.
        assert set(CONTENT_AXIS) == {
            "entrada-saida",
            "condicionais",
            "repeticao",
            "vetores",
            "matrizes",
            "strings",
            "funcoes",
            "ponteiros",
            "structs",
            "recursao",
        }

    def test_unknown_content_is_rejected(self) -> None:
        with pytest.raises(ValidationError, match="Unknown content_id"):
            _draft(content_id="fundamentos")


class TestDifficulty:
    @pytest.mark.parametrize(
        ("rating", "level"),
        [
            (500, Difficulty.MUITO_FACIL),
            (950, Difficulty.MUITO_FACIL),
            (1000, Difficulty.FACIL),
            (1350, Difficulty.FACIL),
            (1400, Difficulty.MEDIO),
            (1850, Difficulty.MEDIO),
            (1900, Difficulty.DIFICIL),
            (2350, Difficulty.DIFICIL),
            (2400, Difficulty.MUITO_DIFICIL),
            (3500, Difficulty.MUITO_DIFICIL),
        ],
    )
    def test_bands_match_the_form_labels(self, rating: int, level: Difficulty) -> None:
        assert difficulty_from_rating(rating) is level

    def test_a_range_takes_the_band_of_its_maximum(self) -> None:
        # The form's default range, 1200-1600, spans Fácil and Médio.
        draft = _draft(difficulty_min=1200, difficulty_max=1600)
        assert to_constraints(draft).difficulty is Difficulty.MEDIO

    def test_minimum_above_maximum_is_rejected(self) -> None:
        with pytest.raises(ValidationError, match="difficulty_min"):
            _draft(difficulty_min=2000, difficulty_max=1000)

    @pytest.mark.parametrize("rating", [499, 3501])
    def test_rating_outside_the_scale_is_rejected(self, rating: int) -> None:
        with pytest.raises(ValidationError):
            _draft(difficulty_min=rating, difficulty_max=rating)


class TestStructures:
    def test_nothing_mentioned_keeps_the_defaults(self) -> None:
        constraints = to_constraints(_draft(structures=_rules()))
        defaults = Constraints()
        assert constraints.can_has_if == defaults.can_has_if
        assert constraints.can_has_else == defaults.can_has_else
        assert constraints.can_has_repetition == defaults.can_has_repetition
        assert constraints.can_has_function == defaults.can_has_function
        assert constraints.can_has_matrix == defaults.can_has_matrix

    def test_required_and_allowed_turn_flags_on(self) -> None:
        constraints = to_constraints(
            _draft(structures=_rules(required=["while"], allowed=["funcao", "vetor"]))
        )
        assert constraints.can_has_repetition is True
        assert constraints.can_has_function is True
        assert constraints.can_has_matrix is True

    def test_forbidden_turns_flags_off(self) -> None:
        constraints = to_constraints(
            _draft(structures=_rules(required=["for"], forbidden=["if", "else"]))
        )
        assert constraints.can_has_if is False
        assert constraints.can_has_else is False

    def test_asking_for_one_of_a_group_wins_over_forbidding_another(self) -> None:
        # The flag can only say "loops yes" or "loops no"; a required `for` needs yes.
        constraints = to_constraints(
            _draft(structures=_rules(required=["for"], forbidden=["while"]))
        )
        assert constraints.can_has_repetition is True

    def test_structures_without_a_flag_change_nothing(self) -> None:
        plain = to_constraints(_draft(structures=_rules()))
        with_struct = to_constraints(
            _draft(structures=_rules(required=["struct"], forbidden=["goto"]))
        )
        assert with_struct == plain

    def test_same_structure_forbidden_and_required_is_rejected(self) -> None:
        with pytest.raises(ValidationError, match="forbidden and also"):
            _draft(structures=_rules(required=["if"], forbidden=["if"]))

    def test_unknown_structure_is_rejected(self) -> None:
        # The form's catalog comes from GET /api/v1/structures, i.e. CStructure.
        with pytest.raises(ValidationError):
            _draft(structures=_rules(required=["lacos"]))


class TestLimits:
    @pytest.mark.parametrize("count", [0, 21])
    def test_test_case_count_outside_the_form_limits_is_rejected(self, count: int) -> None:
        with pytest.raises(ValidationError):
            _draft(test_case_count=count)

    def test_long_context_is_rejected(self) -> None:
        with pytest.raises(ValidationError):
            _draft(context="x" * 301)
