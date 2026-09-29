# CodeExpert — onboarding

**The onboarding lives in the documentation now:
[`docs/onboarding/index.md`](docs/onboarding/index.md)** — published at
<https://hugorosa29.github.io/coderunner_v2/onboarding/>, in Portuguese like the
rest of the site. Read it once, on your first day: it explains what we are
building, what this repository actually contains, and the one rule that makes
sense of most of the code.

It is not duplicated here on purpose. Two copies of the same twenty minutes drift
apart, and the next person reads the stale one.

Then read [AGENTS.md](AGENTS.md), which is how we work.

## The rule that explains the codebase

> **No language-model output ever enters the calculation of a grade, in any
> proportion.**

In this repository the same rule appears as: **what can be verified by execution
is never predicted.** The model writes the exercise statement and a candidate
solution — then we compile that solution with `gcc`, run it against every input,
and the real `stdout` becomes the expected output in the exported question. We
never ask the model what the program would print.

That single sentence explains `execution/`, the `CodeRunner` protocol, the
timeouts, and why the test suite cares so much about a step that looks like
plumbing. The reasoning behind it is in
[the onboarding](docs/onboarding/index.md#a-regra-que-explica-o-codigo).

## Where to go next

| Question | Read |
| --- | --- |
| What are we building, and why? | [`docs/onboarding/`](docs/onboarding/index.md) |
| How do we work? | [AGENTS.md](AGENTS.md) — summarised in [`docs/contributing/`](docs/contributing/index.md) |
| What is in `.agents/`? | [`docs/contributing/harness.md`](docs/contributing/harness.md) |
| Why is the code shaped like this? | [`docs/adr/`](docs/adr/index.md) |
| How do I run it? | [`docs/getting-started/`](docs/getting-started/index.md) |

Read the site locally with `make docs` (<http://127.0.0.1:8001>).
