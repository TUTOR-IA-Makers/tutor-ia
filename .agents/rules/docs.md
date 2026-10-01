# Rules — documentation

The site in `docs/` is written in Brazilian Portuguese and built with MkDocs
Material. CI builds it with `--strict`, so a broken link, a missing anchor or a
page outside the nav fails. `make check` currently passes `--quiet`, which hides
those warnings — run `.venv/bin/mkdocs build --strict` yourself before a PR that
touches `docs/`.

## The distinction that this documentation exists to preserve

Much of the documentation describes things that do not exist yet: the delivery
plan until 30/11 (`docs/product/plano-30-11.md`) and the target platform (the
SAD, the epics, the waves). Every page must make clear which side of that line
it is on.

| Writing about | Say it like |
| --- | --- |
| What the code on `main` does today | Plainly, in the present tense, in `architecture/`, `guides/` or `reference/` |
| What the plan or the SAD specify | "The plan adds…", "The SAD defines…", and a link to `docs/product/roadmap.md` |
| State of a feature | The badge: `ce-status--done` (Implementado), `ce-status--wip` (Em desenvolvimento — open issue in the current sprint), `ce-status--planned` (Planejado) |

Confusing the two is the most expensive mistake available in this repository,
because it sends a reader looking for code that was never written.

One fact, one place: write it on one page and link to it from the others.
Guides (`onboarding/`, `guides/`) walk through a task; reference pages
(`reference/`) are for lookup. See `docs/reference/docs.md`.

## When code changes

If a change alters behaviour that a page describes, the page changes in the same
PR. The pages most easily made wrong:

- `docs/architecture/` — components, run workspace, pipeline, LLM client, XML templates
- `docs/reference/api.md` — request and response shapes, status codes
- `docs/reference/configuration.md` — `Makefile`, scripts, environment variables
- `docs/reference/harness.md` — `AGENTS.md`, `.agents/`, CI, `CODEOWNERS`
- `docs/onboarding/` — installation steps
- `docs/product/roadmap.md` — when an issue from the plan closes, move its badge

## Style

- Open each page with one `<p class="lead">` paragraph that summarises it.
- Every claim verifiable against the code. If it cannot be verified, write
  `A confirmar`.
- Admonitions: `danger` for silent damage, `warning` for limitations, `tip` for
  shortcuts, `info` for context.
- Mermaid diagrams only when they explain something prose cannot.
- Fake values in examples, always: `sk-XXXX`, `/caminho/para/a/chave.txt`.

## ADRs are different

`docs/adr/` is in English and follows its own template. Decisions are immutable:
you supersede an ADR, you never edit its decision. See
[`../workflows/add-adr.md`](../workflows/add-adr.md).
