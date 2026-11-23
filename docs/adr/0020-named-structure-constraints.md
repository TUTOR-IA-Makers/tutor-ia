# ADR-0020 — Constraints are three named lists of structures; the five booleans become a translation

- **Status** Proposed
- **Date** 2026-11-23
- **Deciders** the team (draft written by an agent; a person accepts)

## Context

`Constraints` was five booleans: `can_has_if`, `can_has_else`,
`can_has_repetition`, `can_has_function`, `can_has_matrix`. Each stood for a
group of structures (repetition is `for`, `while` or `do-while`), and the
statement prompt turned each into one "DEVE" / "NÃO deve" line. Nothing checked
the solution against them.

G2-1 (#64) replaces them with named lists, so that G2-2 can compare what the
teacher asked for with the structures `tree-sitter-c` finds in `solution.c`.
G6-1 already closed the vocabulary: the `CStructure` enum in `domain.py`, kept
equal to `docs/product/taxonomy.md` by a test. The web form already sends
`required` / `allowed` / `forbidden` lists of `CStructure`, and
`api/drafts.py` squeezed them into the five booleans, dropping every structure
outside the five groups (`struct`, `goto`, `ponteiro`…).

Three facts constrained the choice:

- **`prompts.py` needs a human to change** (AGENTS.md §7), and a prompt change
  needs the G7 regression batch. Whatever the new shape, the prompt had to stay
  the same text for the same request.
- **Old data and old clients carry booleans.** Every `meta.json` and every
  `runs.constraints` jsonb written so far has them, and
  `POST /gen_statement` / `POST /create_question` accepted them.
- **The booleans do not mean one thing.** The prompt reads `true` as "must use"
  (`DEVE usar estruturas de repetição (for, while ou do while)`), but for two
  groups that is "must use *one of*", which no list of required structures can
  say.

## Decision

1. `Constraints` holds `required`, `allowed` and `forbidden`, each a list of
   `CStructure`, plus `difficulty` and `axis`. A structure forbidden and also
   required or allowed is a validation error (422 at the API).
2. The lists are normalised: deduplicated, in `CStructure` order, and a
   structure in `required` is not repeated in `allowed`.
3. **A flag group the request does not mention gets its old default**: `if`
   and `else` allowed; loops, functions and arrays forbidden. The prompt has
   always asked for these defaults, so storing them keeps "what was asked" and
   "what will be verified" the same.
4. **The five booleans are still accepted** on input (requests, `meta.json`,
   the jsonb column) and translated: `true` adds the group to `allowed`, `false`
   to `forbidden`. They can be mixed with the lists; a contradiction is a 422.
5. The flags survive as read-only properties derived from the lists — a group's
   flag is on when any of its structures is required or allowed — so
   `prompts.py` is unchanged. They are not fields: never stored, never in the
   OpenAPI schema.
6. The groups and the defaults live in `domain.py` (`FLAG_GROUPS`,
   `FLAG_DEFAULTS`), next to `CStructure`. `api/drafts.py` passes the form's
   lists through.

Field names are English (`required`, `allowed`, `forbidden`): code is English
(AGENTS.md §5), and they are the names the front-end already sends. The plan's
`obrigatorias` / `permitidas` / `proibidas` name the concept.

## Alternatives considered

| Alternative | Why not |
| --- | --- |
| Drop the booleans and document the break | Every old run would fail to load, and curl users of `/gen_statement` would get a silent default instead of what they asked for (pydantic ignores unknown fields) |
| `true` → `required` | Wrong for loops and arrays: requiring `for`, `while` and `do-while` together is not what "repetition yes" meant |
| Leave unmentioned groups empty | The prompt would still say "NÃO deve usar repetição" while the stored constraints forbid nothing; G2-2 would pass a `for` the prompt told the model not to write |
| Rewrite the prompt to state each list item | The right end state, but a prompt change: human-gated and needs the regression batch. A separate issue |
| Portuguese field names | Breaks the code-in-English rule and the names the front-end already sends |

## Consequences

**Good**

- What the teacher picks in the form reaches the run in full, by name, in the
  taxonomy's vocabulary. G2-2 has something to verify.
- Same request, same prompt: a test pins all 32 boolean combinations.
- Old runs load, and old clients keep working without a change.

**Bad, or costly**

- The prompt is still coarser than the lists. Forbidding `goto` or requiring
  `struct` is stored and will be verified, but the model is not told. Allowing
  `while` while forbidding `for` makes the prompt say "for, while ou do while".
- `true` for a group was "must use" in the prompt and becomes only "may use" in
  the lists. A legacy request for repetition will not fail G2-2 when the
  solution has no loop. Clients that mean "must" should send `required`.
- An empty request now stores eight forbidden structures it did not name. That
  is what the prompt asked for all along, but it can surprise someone reading
  `meta.json`.
- The legacy flags do not appear in the OpenAPI schema; only
  `docs/reference/api.md` says they are accepted.

## Revisit when

The statement prompt is rewritten to state the lists directly. At that point the
derived flags and the per-group defaults have no reader left, and the legacy
input can be given a removal date.
