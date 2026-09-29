# ADR-0003 — One workspace per generation run

- **Status** Accepted
- **Date** 2026-09-18
- **Deciders** the team

## Context

Every intermediate artefact lived in a single `cache/` directory: `statement.json`,
`solution.c`, the compiled binary, `inputs.json`, `testcases.json`. The
orchestrator emptied it at the start of each run.

That design has three defects, and all three become urgent with six people:

1. **Two concurrent requests corrupt each other.** The second run clears the
   first run's directory mid-pipeline. Two people generating a question at the
   same time — or one person and one agent — silently produce a question whose
   statement and solution come from different runs.
2. **The directory was tracked by git**, including a compiled `solution.exe`, so
   `git status` was dirty after every run and test artefacts leaked into diffs.
3. **A run leaves no record.** Nothing says which model, which prompt version or
   which constraints produced a given question — which EPIC-017 requires before a
   generated question may be shown to a teacher.

## Decision

Each run gets its own directory under `var/runs/<run_id>/`, created by
`RunWorkspace`. The run id is time-ordered (`20260918T221305Z-1a2b3c4d`) so
listing the workspace sorts chronologically.

The API returns the `run_id` from the first step, and every later step takes it.
`var/` is git-ignored in its entirety.

Each workspace holds a `meta.json` recording the constraints, the model, the
prompt version of each step and a `reviewed` flag — the traceability record.

Run ids arrive from clients as path segments, so `RunWorkspace.open` validates
them against a fixed pattern before touching the filesystem. A traversal attempt
is a 404, and there is a test for it.

## Alternatives considered

| Alternative | Why not |
| --- | --- |
| A lock around `cache/` | Serialises every user of the service to make a design flaw survivable |
| Keep state in memory, keyed by run id | Loses the property that makes the pipeline resumable and inspectable: a step's output is a file you can read, edit and re-run from |
| A database | Correct destination for the platform, wildly premature for a prototype whose artefacts are five files |
| A per-request temporary directory, deleted at the end | Throws away exactly what makes the prototype useful — the ability to inspect and re-run one step |

## Consequences

**Good**

- Concurrent generation is correct, which is the precondition for six people
  sharing one deployment.
- `git status` is clean after running the app, by construction.
- Traceability exists — the prerequisite for the human approval gate, the scope
  check, and any cost accounting.
- The API gained a resource identifier, which is what a job-oriented API needed
  anyway.

**Bad, or costly**

- A breaking API change: every step after the first now requires `run_id`.
- `var/runs/` grows without bound. No cleanup policy exists yet; `make clean`
  removes it by hand. Worth an issue before any shared deployment.

## Revisit when

The service is deployed anywhere shared, at which point retention and cleanup
stop being optional.
