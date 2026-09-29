# Rules — branches, commits, pull requests

## Branches

`type/<issue>-<slug>`, always branched from `main`:

```text
feat/42-scope-check      fix/57-export-timeout      docs/61-api-errors
refactor/70-run-workspace  chore/73-pin-dependencies  test/75-parser-cases
```

`make task T=feat I=42 S=scope-check` creates the branch and the task file
together, which is the only way they stay named the same.

> **`docs` is both a branch and a directory.** `git checkout docs` is ambiguous
> and Git refuses it. Use `git switch docs` for the branch and
> `git checkout -- docs/` for the directory. Better: let the old `docs` branch
> die once it is merged.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/). The subject is
imperative, lowercase, no trailing period:

```text
feat: verify declared constraints against the generated solution

Without this, a question generated as "no loops" can ship with a for loop and a
teacher only finds out in class. Checks the AST of the reference solution against
the constraints recorded in meta.json and fails the run when they disagree.

Closes #42

Assisted-by: claude-opus-5
```

- **The body explains why.** The diff already shows what.
- **One commit, one change.** A reformatting pass is its own commit, never mixed
  with behaviour.
- **Agent-assisted commits carry `Assisted-by:`.** Three agent brands are in use;
  `git log` has to be able to answer which one wrote what.

## Pull requests

- Small enough to review in one sitting. If it is not, it was more than one task.
- Links its issue with `Closes #N`, so the board moves itself.
- Deletes its task file.
- States that `make check` passed, and what was verified by hand if anything.
- At least one human approval. `CODEOWNERS` adds a required reviewer on prompts,
  templates, CI and ADRs.

An agent may open the PR. An agent never approves or merges one.

## Keeping up to date

Rebase on `main` rather than merging it in, so the branch stays one readable
story:

```bash
git fetch origin && git rebase origin/main
```
