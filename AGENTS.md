# AGENTS.md — working agreement

This file is the contract for everyone who changes this repository: the six of us
and every coding agent we use (Claude Code, Codex, Antigravity, or whatever comes
next). It is the **single source of instructions**; `CLAUDE.md` and
`.github/copilot-instructions.md` only point here. Change this file, and every
agent changes behaviour at once.

New to the project? Read [ONBOARDING.md](ONBOARDING.md) first — it explains what
we are building and why. This file assumes you already have.

---

## 1. Non-negotiables

Six rules. Breaking one is a revert, not a review comment.

1. **Never commit a secret.** No API keys, no tokens, no absolute paths carrying
   someone's username. Configuration comes from the environment; `.env` is
   git-ignored and `.env.example` holds only fake values.
2. **Never commit runtime artefacts.** Everything the app writes lives under
   `var/`, which is ignored. If `git status` is dirty after running the app,
   that is a bug in the code, not something to `git add -f`.
3. **`./scripts/check.sh` passes before you open a PR.** Same script as CI. No
   agent-specific shortcut, no "the failure is unrelated".
4. **Expected outputs are never predicted by a model.** They come from compiling
   and running the solution. This is the one product rule that survives every
   refactor — see [ONBOARDING.md](ONBOARDING.md#the-rule-that-explains-the-codebase).
5. **Don't state something in `docs/` that the code does not do.** This project
   documents a platform that mostly does not exist yet; mixing "planned" with
   "built" is the most expensive mistake available here. Mark planned work as
   planned.
6. **Stay inside the task.** One issue, one branch, one concern. If you find a
   second problem, open an issue — do not fold it into the current diff. A
   six-person team reviews diffs it can hold in its head.

## 2. The loop

```bash
make task T=feat I=42 S=scope-check   # branch + task file, both named after issue 42
#   ... fill in .agents/tasks/42-scope-check.md before writing code ...
make check                            # the gate
git push -u origin feat/42-scope-check
gh pr create --fill                   # PR body links the issue; template does the rest
```

**The task file is how humans and agents share context across a branch.**
One file per branch, named after the issue, so two branches never touch the same
file and merges never conflict. It records the goal, the constraints, the plan
and what was decided along the way — which is what lets a different person, or a
different agent, pick the branch up tomorrow. Template:
[.agents/tasks/TEMPLATE.md](.agents/tasks/TEMPLATE.md).

Delete the task file in the PR that closes the issue. It is scaffolding, not
history: the history lives in the issue, the ADRs and the commits.

## 3. Commands

| Command | What it does |
| --- | --- |
| `make setup` | `.venv`, dependencies, `.env` — run once |
| `make run` | API with auto-reload on <http://127.0.0.1:8000> |
| `make check` | **The gate.** Artefacts, secrets, format, lint, tests, docs |
| `make check-fast` | The gate without the documentation build |
| `make fix` | Apply formatting and auto-fixable lint |
| `make test` | Tests with coverage |
| `make docs` | Documentation on <http://127.0.0.1:8001> |

Never invoke `pytest`/`ruff` with your own flags when reporting that work is
done. Report what `make check` says.

## 4. Where things live

```text
src/codeexpert/
  settings.py      configuration, from the environment only
  errors.py        the exceptions services raise
  domain.py        entities: Constraints, Statement, TestCase, RunMetadata
  workspace.py     one directory per generation run — the unit of isolation
  llm/             the only module that talks to a model provider
  execution/       compiling and running C — the seam a real sandbox replaces
  generation/      the five pipeline steps, plus prompts.py
  export/          Moodle CodeRunner XML and its templates
  api/             FastAPI: routes, schemas, dependencies, error mapping
tests/unit/        pure functions — no network, no compiler
tests/integration/ several modules together — still offline
docs/              MkDocs site (Portuguese). docs/adr/ holds decisions (English)
.agents/           this harness: rules, workflows, task files
```

**Dependency direction, and it only goes one way:**

```text
api  →  generation  →  {llm, execution, export, workspace}  →  {domain, settings, errors}
```

Nothing below `api/` imports FastAPI. Nothing below `llm/` makes an HTTP call to
a model. A violation of either is a design bug, not a style preference.

## 5. Conventions

Detail lives in `.agents/rules/`. Read the one that matches what you are touching:

| Touching | Read |
| --- | --- |
| Python | [.agents/rules/code.md](.agents/rules/code.md) |
| Anything in `prompts.py` | [.agents/rules/prompts.md](.agents/rules/prompts.md) |
| `docs/` | [.agents/rules/docs.md](.agents/rules/docs.md) |
| `execution/`, config, anything touching keys | [.agents/rules/security.md](.agents/rules/security.md) |
| Branches, commits, PRs | [.agents/rules/git.md](.agents/rules/git.md) |

The short version: English for code, comments, logs and ADRs; Portuguese for
prompts and anything a student or teacher reads. Comments explain *why*.
Conventional Commits. Branch `type/<issue>-<slug>`.

## 6. Definition of Done

A change is done when all of these are true. Say so explicitly in the PR:

- [ ] `make check` passes.
- [ ] New behaviour has a test. A bug fix has a test that failed before it.
- [ ] Documentation matches reality, or the change does not touch documented behaviour.
- [ ] An architectural decision is recorded as an ADR (`.agents/workflows/add-adr.md`).
- [ ] The task file is deleted and the PR closes its issue.
- [ ] Nothing in the diff is outside the task.

## 7. What an agent must not decide alone

Bring a human in before changing any of these. `CODEOWNERS` enforces it, but ask
first rather than opening a PR that sits blocked:

| Area | Why |
| --- | --- |
| `src/codeexpert/generation/prompts.py` | Prompts are the product. A change alters output in ways tests cannot fully catch |
| `src/codeexpert/export/templates/` | A broken macro is invisible until a Moodle import fails |
| `docs/adr/` | Decisions are made by people; agents draft, humans accept |
| `.github/workflows/`, `AGENTS.md`, `CODEOWNERS` | An agent must not widen its own permissions |
| Dependencies in `pyproject.toml` | Supply chain |

## 8. Attribution

Every agent-assisted commit carries a trailer naming the agent:

```text
feat: verify declared constraints against the generated solution

Closes #42

Assisted-by: claude-opus-5
Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
```

Use `Assisted-by: codex`, `Assisted-by: antigravity`, and so on. This is not
ceremony: with three agent brands in play we need to be able to ask "which tool
produced the changes we later reverted?" and get an answer from `git log`.

## 9. When the instructions are wrong

If this file contradicts the code, the code wins and **this file is the bug**.
Open a PR against it. An agent that silently works around a stale rule leaves the
next agent to hit the same wall.
