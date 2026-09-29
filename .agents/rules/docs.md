# Rules — documentation

The site in `docs/` is written in Portuguese and built with MkDocs Material.
`make check` builds it with `--strict`, so a broken link, a missing anchor or a
page outside the nav fails the gate.

## The distinction that this documentation exists to preserve

Most of `docs/product/` describes a **platform that does not exist yet** — the
SAD, the epics, the waves. This repository implements one prototype of one epic
from the last wave. Every page must make clear which side of that line it is on.

| Writing about | Say it like |
| --- | --- |
| What the code does today | Plainly, in the present tense |
| What the planning documents specify | "The SAD defines…", "EPIC-017 requires…" |
| What is missing | Name the gap and link to `docs/product/gap-analysis.md` |

Confusing the two is the most expensive mistake available in this repository,
because it sends a reader looking for code that was never written.

## When code changes

If a change alters behaviour that a page describes, the page changes in the same
PR. The pages most easily made wrong:

- `docs/architecture/` — pipeline, run workspace, LLM integration, XML templates
- `docs/api/` — request and response shapes
- `docs/getting-started/` — installation and configuration
- `docs/development/` — project structure and conventions

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
