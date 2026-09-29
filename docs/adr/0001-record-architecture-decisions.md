# ADR-0001 — Record architecture decisions in this repository

- **Status** Accepted
- **Date** 2026-09-18
- **Deciders** the team

## Context

The project moves from two people to six, working on parallel branches, using
three different coding agents. Two kinds of knowledge were previously kept in
people's heads or in chat: *why* the code is shaped the way it is, and *what was
already rejected*.

Both cost more with six people than with two. A new contributor — or an agent
starting with no memory — cannot infer intent from code. Without a record, every
decision is either re-litigated or cargo-culted, and both are expensive.

The SAD already uses numbered ADRs for the platform's decisions, so the format is
familiar to everyone here.

## Decision

Record decisions that are expensive to reverse as numbered Markdown files in
`docs/adr/`, following `0000-template.md`. An accepted ADR is never edited to
change its decision; it is superseded by a new one.

ADRs are written in English, like the code, and appear in the documentation site
navigation.

## Alternatives considered

| Alternative | Why not |
| --- | --- |
| A single `DECISIONS.md` | Every branch edits the same file: merge conflicts, which is exactly the failure this harness exists to remove |
| A wiki or a chat channel | Not reviewed, not versioned with the code, invisible to an agent reading the repository |
| Nothing — rely on commit messages | A commit explains one change; it cannot explain a constraint that spans the codebase |

## Consequences

**Good**

- The reason for a boundary survives the person who drew it.
- Agents read the repository, so they read the ADRs, so they stop proposing
  options that were already rejected.
- Superseding rather than editing keeps an honest record of what we believed and
  when.

**Bad, or costly**

- Writing one takes half an hour, and the temptation is to skip it under pressure.
- The set grows stale if nobody supersedes outdated entries. `Revisit when` in
  each ADR is the mitigation.

## Revisit when

Never, realistically. If the practice is being skipped, the problem is adoption,
not the decision.
