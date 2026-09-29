# Workflow — reviewing a pull request

With six people and three agents producing code, review is the only place where
a consistent standard is actually applied. Budget real time for it.

## Order of attention

Review in this order, and stop at the first level that fails — there is no point
discussing naming in a PR that does the wrong thing.

1. **Is this the right change?** Does it match the issue? Is anything in the diff
   outside the task?
2. **Is it correct?** Read the test, then the code. A test that would pass
   against the old code tests nothing.
3. **Is it safe?** Secrets, `subprocess` outside `execution/`, a new path built
   from client input, a new dependency.
4. **Is the boundary intact?** Does anything below `api/` import FastAPI? Does
   anything outside `llm/` call a model?
5. **Is it honest?** Does documentation claim behaviour the diff does not
   deliver? Does an XML tag assert a review that did not happen?
6. **Then style.** `ruff` already decided formatting. Naming and comments are
   what is left.

## Agent-written code specifically

The failure modes differ from a person's. Look for:

- **Plausible but unused abstractions** — a protocol with one implementation and
  no second one in sight, an option nobody passes.
- **Tests that assert the implementation** rather than the behaviour, or that
  restate the code's own logic.
- **Silent scope creep** — an unrelated file "cleaned up" along the way.
- **Confident comments that are wrong.** A comment is a claim; verify it like any
  other.
- **Invented facts in documentation.** Every claim about behaviour must be
  checkable in the diff.

Check the `Assisted-by:` trailer is present. It costs nothing now and answers a
real question later.

## Approving

Approve when you would be comfortable being paged about this code. "Looks fine"
on a diff you skimmed is how a six-person team loses the ability to trust review
at all.
