# Rules — prompts

Every prompt lives in `src/codeexpert/generation/prompts.py`. Nowhere else.

Prompts are the most valuable and most fragile thing in the repository: they
decide the output, no type checker guards them, and a change can degrade quality
without failing a single test. Three rules.

## 1. Bump the version in the same commit

```python
PROMPT_VERSIONS = {"statement": "2026-09-18.1", ...}
```

The version is written into every run's `meta.json`. It is how a batch of bad
questions gets traced back to the prompt that produced it. A prompt change
without a version bump makes that impossible, permanently.

## 2. Change the shape, change the parser

| Prompt asks for | Parser that depends on it |
| --- | --- |
| The `[block]` layout | `generation/statement.py::parse_statement` |
| A JSON array of strings | `generation/inputs.py::parse_inputs` |
| Raw C, no markdown | `generation/codegen.py::strip_code_fences` |

These parsers fail **silently** on a mismatch — a wrong title, an empty list, a
file that does not compile. They are unit-tested precisely so a prompt change
that breaks the contract also breaks a test. Update both together.

## 3. Prompt changes need a human reviewer

`CODEOWNERS` requires it. An agent may draft the change; a person decides whether
the output got better. Attach evidence: the same constraints, before and after,
on at least three generations.

## Conventions

- System prompt: a module constant. Role and format restrictions only.
- User prompt: an f-string with numbered rules.
- Format restrictions are repeated in both, deliberately. The redundancy is cheap
  and compliance measurably improves.
- Portuguese prompts keep their accents. The instruction *inside* the prompt says
  the generated exercise must avoid accents — that is about C source, not about
  the prompt text. Do not "clean up" the accents.
