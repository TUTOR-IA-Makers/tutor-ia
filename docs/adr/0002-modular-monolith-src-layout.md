# ADR-0002 — A modular monolith in a `src/` layout, not a monorepo

- **Status** Accepted
- **Date** 2026-09-18
- **Deciders** the team

## Context

Two things changed at once. The team went from two people to six, and the plan
for the next months is to build the features the SAD describes — submission,
sandboxed execution, deterministic grading, structural analysis, formative
feedback — rather than only hardening the question generator.

The code as it stood could not absorb either change:

- Eleven flat modules at the repository root (`config.py`, `models.py`,
  `routers/`, `services/`) with no package. Nothing could be imported without the
  working directory being the repository root; `pytest` and any packaging step
  needed path hacks.
- Every path relative to the process's working directory, so the server only ran
  from one place.
- The orchestrator called its own HTTP endpoints through
  `fastapi.testclient.TestClient` — a production path depending on a test
  utility, and five loopback requests to run five function calls.

Item 0.1 of the MVP backlog says "create a monorepo (API + evaluation worker +
feedback worker, distinct entrypoints)". That instruction describes a *target*,
and it was written for a system running at 50 submissions a minute with two
independently scaling workers. We do not have that system, that load, or the
operations budget to run it. A monorepo bought now costs tooling, CI matrices and
cross-package version discipline, and buys nothing until there is a second
deployable.

## Decision

One installable Python package, `src/codeexpert/`, with internal module
boundaries drawn along the SAD's domains. One deployable today; the boundaries
are what makes a second one cheap later.

```text
src/codeexpert/
  settings.py errors.py domain.py workspace.py
  llm/         the only module that talks to a model provider
  execution/   compiling and running C — swaps for Judge0 behind a protocol
  generation/  the EPIC-017 pipeline
  export/      Moodle CodeRunner XML
  api/         FastAPI — the only layer that knows HTTP exists
```

The dependency direction is one way, and it is the rule that makes the layout
worth anything:

```text
api → generation → {llm, execution, export, workspace} → {domain, settings, errors}
```

**How SAD features land here.** Each new area of the SAD becomes a sibling
package with the same discipline — `submissions/`, `grading/`, `analysis/`,
`feedback/` — with its own entrypoint under `api/routes/` and, when it needs to
run out of band, its own `__main__`. A package becomes a separate deployable only
when something measurable forces it: independent scaling, an isolation boundary,
or a failure domain that must not take the API down. That last one already has a
name in the SAD — the feedback worker must be able to fail without the grade
failing — so it is the most likely first extraction.

The one thing that is *not* negotiable, and does not depend on this ADR:
untrusted code runs on isolated infrastructure, never in the application process
(SAD D-1). See ADR-0004.

## Alternatives considered

| Alternative | Why not |
| --- | --- |
| A real monorepo now (per-package `pyproject.toml`, workspace tooling) | Real cost — dependency resolution, CI matrix, release coordination — for a benefit that only appears with a second deployable. Reversible later; the module boundaries are the expensive part and we are keeping them |
| Separate repositories per service | Six people cannot keep five repositories' CI, versions and cross-cutting changes coherent. A one-line change across three services becomes three PRs |
| Keep the flat layout, add packages later | The flat layout is what blocks testing and packaging *now*. Deferring it means writing the next features on a foundation we already know we will move |
| Split by technical layer (`models/`, `services/`, `routers/`) | Scales by kind of file, not by kind of change. Adding "structural analysis" would touch all three; adding it as a package touches one |

## Consequences

**Good**

- `pip install -e .` works; tests, linting and packaging stop needing path hacks.
- A new SAD feature has an obvious home and an obvious boundary.
- Extracting a worker later is a deployment change, not a re-layout.
- The orchestrator calls functions again, so the pipeline is usable from a
  script, a test or a future worker.

**Bad, or costly**

- A breaking move for anyone with an open branch: imports and paths all changed.
  Cheapest now, at six open branches, than in three months.
- Discipline, not tooling, keeps the dependency direction. Nothing fails the
  build if someone imports FastAPI inside `generation/` — reviewers have to
  catch it.
- "One repository, one package" invites a shared-everything design. The module
  boundaries only stay real if they are enforced in review.

## Revisit when

Any of these becomes true:

- A component needs to scale independently of the API under measured load.
- The feedback path (or any other) must survive a failure that would take the API
  down — the SAD's degradation rule.
- A second language runtime enters the project, making one dependency set
  untenable.
