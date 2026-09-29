# `.agents/` — the harness

This directory is the working agreement, split so that nobody has to read all of
it to do one thing.

```text
.agents/
  rules/       what is true regardless of the task — read the one you are touching
  workflows/   step-by-step procedures — read when you are doing that thing
  tasks/       one file per active branch — the context an agent needs
```

The entry point is [`../AGENTS.md`](../AGENTS.md). Nothing here repeats it;
everything here is the detail it points to.

## Why it is shaped like this

We used to run on a single `progress.md` plus one agent instruction file. That
works for one person on one branch, and fails for six people on six branches
with three different agents:

| Problem | What this directory does about it |
| --- | --- |
| A shared status file conflicts on every merge | Status lives in GitHub issues; per-branch context lives in one file per branch, and nobody else touches it |
| Each agent reads a different instruction file | One `AGENTS.md`; `CLAUDE.md` and the Copilot file are pointers |
| "Works on my machine" reviews | One gate, `./scripts/check.sh`, run identically by people, agents and CI |
| Decisions lost in chat threads | `docs/adr/` — numbered, immutable, one file per decision |
| Agent output nobody can audit | Commit trailers name the agent that assisted |

## Rules of the directory itself

- **Keep it short.** Every agent loads `AGENTS.md` on every session. Bloat there
  is a cost paid on every task by every person.
- **No duplication.** If something is stated in `AGENTS.md`, link to it here
  rather than restating it. Two copies drift; one does not.
- **A rule that the code contradicts is a bug in the rule.** Fix the file.
