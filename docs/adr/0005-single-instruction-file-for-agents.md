# ADR-0005 — One instruction file for every agent

- **Status** Accepted
- **Date** 2026-09-18
- **Deciders** the team

## Context

The team uses at least three coding agents — Claude Code, Codex and Antigravity —
and different people prefer different ones. Each reads a different instruction
file by convention.

The previous setup had one agent instruction file plus a `progress.md`, written
for one person using one tool. With six people and three tools the obvious next
move is one instruction file per agent, and that move is a trap: three files
describing the same rules drift within weeks, and then the agent that read the
stale copy produces work that fails review for reasons its instructions never
mentioned.

The instructions are not agent-specific anyway. "Run `make check` before opening
a PR" and "never commit a secret" are properties of the repository.

## Decision

`AGENTS.md` at the repository root is the single source of instructions. Other
agents' conventional files are pointers containing no rules of their own:

| File | Content |
| --- | --- |
| `AGENTS.md` | Everything |
| `CLAUDE.md` | An `@AGENTS.md` import and one sentence saying why |
| `.github/copilot-instructions.md` | A link |

Detail that would bloat `AGENTS.md` lives in `.agents/rules/` and
`.agents/workflows/`, linked from it and read on demand.

An agent whose convention is not yet covered gets another pointer file. It never
gets its own rules.

## Alternatives considered

| Alternative | Why not |
| --- | --- |
| One instruction file per agent | Three copies of the same rules, drifting. The failure is silent and lands in review |
| Instructions only in the tool's UI or personal settings | Invisible to everyone else, unversioned, unreviewable. Six people would have six variants |
| Symlink `CLAUDE.md` → `AGENTS.md` | Works on Unix, is hostile on Windows checkouts and renders confusingly on GitHub. A two-line pointer costs nothing |

## Consequences

**Good**

- Changing the working agreement is one PR, reviewed like code, effective for
  every agent at once.
- Onboarding a new agent is one pointer file.
- Briefing an agent is the same sentence regardless of which one it is: *read
  `AGENTS.md` and the task file*.

**Bad, or costly**

- `AGENTS.md` is loaded on every session, so length there is a recurring cost.
  Keeping it short is a standing obligation, and the reason the detail was split
  into `.agents/`.
- Pointer files depend on each agent honouring them; a tool that ignores its own
  convention still needs a person to paste the link.

## Revisit when

A tool arrives that cannot be pointed at a file at all.
