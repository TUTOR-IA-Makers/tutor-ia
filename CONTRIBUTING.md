# Contributing

The working agreement for this repository — for people and for coding agents
alike — is [AGENTS.md](AGENTS.md). It is not a separate set of rules for humans:
one file, so nothing drifts.

If you have not read [ONBOARDING.md](ONBOARDING.md) yet, start there.

## The short version

```bash
make setup                            # once
make task T=feat I=42 S=scope-check   # branch + task file, from issue 42
#   ... fill in .agents/tasks/42-scope-check.md before writing code ...
make check                            # the gate — the same script CI runs
git push -u origin feat/42-scope-check
gh pr create --fill
```

## Where the detail lives

| You are | Read |
| --- | --- |
| Starting or finishing a task | [`.agents/workflows/`](.agents/workflows/) |
| Writing Python | [`.agents/rules/code.md`](.agents/rules/code.md) |
| Touching a prompt | [`.agents/rules/prompts.md`](.agents/rules/prompts.md) |
| Writing documentation | [`.agents/rules/docs.md`](.agents/rules/docs.md) |
| Touching execution or configuration | [`.agents/rules/security.md`](.agents/rules/security.md) |
| Branching, committing, opening a PR | [`.agents/rules/git.md`](.agents/rules/git.md) |
| Reviewing someone's PR | [`.agents/workflows/review.md`](.agents/workflows/review.md) |
| Making a decision that is hard to reverse | [`.agents/workflows/add-adr.md`](.agents/workflows/add-adr.md) |

## Using a coding agent

Encouraged, and the same for all of them. Brief it with exactly this:

```text
Read AGENTS.md and .agents/tasks/<your-task-file>.md, then implement the plan.
```

You remain the author of what you push: run `make check`, read the diff, and put
an `Assisted-by:` trailer on the commit. An agent may open a PR; an agent never
approves or merges one.
