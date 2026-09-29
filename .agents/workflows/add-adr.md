# Workflow — recording a decision

## When

Write an ADR when a choice is expensive to reverse and a future reader will
otherwise ask "why on earth is it like this?":

- A dependency direction, a boundary, a new module
- Choosing a library or a service over an alternative
- A rule that constrains all future code (for example: the grade never depends on
  a model)
- Reversing an earlier decision

**Not** for: naming, formatting, anything a comment covers, anything local to one
function.

## How

1. Copy `docs/adr/0000-template.md` to `docs/adr/NNNN-short-title.md`, taking the
   next free number. Numbers are never reused.
2. Fill it in. The **Context** section is the valuable one: what was true at the
   time, what constraints applied, what was uncertain. A decision without its
   context cannot be re-evaluated later.
3. List the alternatives you rejected and why. The rejected options are half the
   value of the document.
4. Be honest in **Consequences**. An ADR with no downsides is an advertisement,
   not a record.
5. Add it to the `nav` in `mkdocs.yml`, or `make check` fails — strict mode
   rejects a page outside the navigation.

## Status

`Proposed` → `Accepted` → `Superseded by ADR-NNNN`.

**An accepted ADR is never edited to change its decision.** If the decision
changes, write a new ADR that supersedes it and mark the old one. The record of
what we believed in September is exactly what makes the change in March
understandable.

## Who decides

An agent may draft an ADR — it is good at laying out alternatives. A person
accepts it. `CODEOWNERS` requires a human review on `docs/adr/`.
