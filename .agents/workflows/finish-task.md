# Workflow — finishing a task

## 1. The gate

```bash
make check
```

Everything green. A failure that looks unrelated is still a failure: find out
why, because CI will fail identically and the next person will inherit it.

## 2. Check the diff with your own eyes

```bash
git status --short
git diff --stat
git diff
```

Looking for, specifically:

- Anything outside the task. Delete it or move it to its own branch.
- Anything under `var/`, `cache/`, `Questions/`, or a `.env`. Should be
  impossible — if it happened, fix the cause and say so in the PR.
- Debug prints, commented-out code, a `TODO` with no issue number behind it.
- A changed prompt without a bumped `PROMPT_VERSIONS` entry.

## 3. Documentation

Did behaviour change that a page describes? Update the page in this PR. `make
check` builds the site strictly, but it only catches broken links — it cannot
catch a page that is now simply untrue.

## 4. Delete the task file

```bash
git rm .agents/tasks/42-scope-check.md
```

The context that outlives the branch goes to the issue, an ADR, or the commit
body. The task file itself is scaffolding.

## 5. Commit and open the PR

```bash
git commit                      # conventional subject, body explains why, Assisted-by trailer
git push -u origin feat/42-scope-check
gh pr create --fill
```

Fill in the template honestly. **"How this was verified" is the most useful line
in the PR** — more than the description, because it tells the reviewer what is
already covered and what still needs their eyes.

## 6. Review

Respond to every comment, even if only to say why you disagree. Rebase on `main`
rather than merging it in. An agent may push fixes; a human approves and merges.
