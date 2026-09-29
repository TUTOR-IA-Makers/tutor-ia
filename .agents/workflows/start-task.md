# Workflow — starting a task

## 1. Find the issue

Work starts from a GitHub issue, always. No issue means the work has not been
agreed with anyone, and a six-person team cannot absorb surprise diffs.

If the issue does not exist, open one first. If it is vague, sharpen it before
writing code — a vague issue produces a vague diff that review cannot judge.

## 2. Create the branch and the task file

```bash
make task T=feat I=42 S=scope-check
```

This branches from an up-to-date `main` and writes
`.agents/tasks/42-scope-check.md` from the template.

## 3. Fill in the task file *before* writing code

Especially **Goal** and **Out of scope**. This is the highest-value ten minutes
in the loop: it is what stops an agent from "helpfully" refactoring three
unrelated modules, and what lets someone else resume the branch.

## 4. Brief the agent

Give it exactly two things:

```text
Read AGENTS.md and .agents/tasks/42-scope-check.md, then implement the plan.
```

Both are in the repository, so this briefing is identical for Claude Code,
Codex and Antigravity. If an agent needs more, the gap belongs in the task file
or in `AGENTS.md`, not in a chat message nobody else can see.

## 5. Work in small steps

Change, run `make check-fast`, repeat. Append decisions to the task file as they
happen — after the fact, nobody remembers why the third option was rejected.

## When the task turns out to be two tasks

Stop and split it. Open the second issue, finish the first. A branch that grows a
second purpose is a branch that will not get a careful review.
