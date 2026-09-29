# ADR-0008 — One gate, shared by people, agents and CI

- **Status** Accepted
- **Date** 2026-09-18
- **Deciders** the team

## Context

The repository had no tests, no linter, no formatter and no CI beyond a
documentation build. Quality rested entirely on review, by one person, on code
written by one person.

That does not survive six people and three agents. Agents in particular produce
plausible code quickly: without an automatic gate, the entire burden of catching
a subtly wrong change falls on a human reading a diff — and that human will be
reading several diffs a day.

The second-order problem is variation. If everyone runs their own commands, "it
passed for me" and "it failed in CI" become routine, and the most common answer —
"that failure is unrelated" — is sometimes right, which is what makes it
corrosive.

## Decision

One script, `scripts/check.sh`, is the gate. People run it as `make check`,
agents are instructed to run it, and CI runs the same script. It checks, in
order:

1. no runtime artefacts or secrets tracked by git;
2. nothing shaped like a provider key in the working tree;
3. `ruff format --check`;
4. `ruff check`;
5. `pytest`;
6. `mkdocs build --strict`.

CI runs `./scripts/check.sh` rather than restating the steps, so the two cannot
drift. `AGENTS.md` instructs agents to report what the gate says, not results
from their own invocation of `pytest`.

## Alternatives considered

| Alternative | Why not |
| --- | --- |
| Steps listed in the CI workflow, developers run what they remember | Guarantees drift, and makes CI failures feel like CI's fault |
| Pre-commit hooks | Useful, and easy to skip with `--no-verify`. A hook can call this script, but the script stays the gate |
| Trust review | Already the situation, and it is what six people and three agents overwhelm |

## Consequences

**Good**

- "It passes locally" and "it passes in CI" mean the same thing.
- Style stops being a review topic; review spends its attention on behaviour.
- Agent output is filtered by the same standard as anyone else's before a human
  reads it.
- Adding a check is one edit to one file, effective everywhere at once.

**Bad, or costly**

- The gate must stay fast, or people route around it. The `--fast` flag skips the
  documentation build for the inner loop.
- A bash script is a dependency on bash. Windows contributors need WSL or Git
  Bash; noted in the onboarding document.

## Revisit when

The full gate stops finishing in under a couple of minutes, at which point it
splits into a fast local subset and a fuller CI run.
