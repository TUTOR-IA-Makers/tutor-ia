# ADR-0006 — GitHub issues for status, one task file per branch for context

- **Status** Accepted
- **Date** 2026-09-18
- **Deciders** the team

## Context

Coordination used to run on `progress.md`: one file, edited by whoever was
working, recording what was done and what came next.

It works for one person on one branch. With six people on parallel branches it
fails twice over. Mechanically: every branch edits the same file, so every merge
conflicts, and the conflicts are in prose, where Git's resolution is worst.
Practically: a single narrative file cannot represent six concurrent threads of
work, so it degrades into a changelog nobody trusts.

But deleting it loses something real. Agents start every session with no memory.
Without a written account of the branch's goal, constraints and decisions, each
session re-derives context from the diff — expensively, and sometimes wrongly.

Two different needs were sharing one file: **status across the team**, and
**context within a branch**.

## Decision

Separate them, and put each where it does not conflict.

**Status lives in GitHub issues and the project board.** Who is doing what, what
is blocked, what is next. Issues are concurrent by design, they carry discussion,
and a PR closing one moves the board without anyone updating a file.

**Context lives in `.agents/tasks/<issue>-<slug>.md`, one file per branch.**
Named after the issue, created together with the branch by `make task`. Branch A
only ever writes its own file, branch B only ever writes its own: no two branches
touch the same path, so merge conflicts are impossible by construction rather
than by care.

The task file is deleted in the PR that closes the issue. Durable records go to
three places that are already built for it: the issue, the ADRs, the commit
bodies.

## Alternatives considered

| Alternative | Why not |
| --- | --- |
| Keep `progress.md` | The conflicts are the problem, and they get worse with every extra branch |
| Status in files, no issue tracker | Rebuilds by hand what the board already does, and loses discussion, assignment and notifications |
| Everything in issues, no task file | Agents cannot rely on issue threads: they are long, they are unstructured, and half the context is in comments written for humans mid-conversation |
| An append-only log directory with a generated index | Conflict-free, but it is a changelog — it answers "what happened" and not "what is this branch for" |

## Consequences

**Good**

- Merge conflicts over coordination are structurally impossible.
- The board is accurate without anyone maintaining it.
- An agent resuming a branch reads two files and has what it needs, whichever
  agent it is.
- The context is in the repository, so it is reviewed in the PR like anything
  else.

**Bad, or costly**

- The discipline of writing the task file before writing code. Skipping it is
  invisible until someone else picks the branch up.
- Requires GitHub issues to actually be used. A branch with no issue has nowhere
  to put its status.
- Abandoned branches leave orphan task files. Seeing one on `main` means a PR
  forgot to delete it, which is a useful signal in itself.

## Revisit when

The board stops reflecting reality, or task files are routinely empty — both mean
the practice was dropped and something lighter should replace it.
