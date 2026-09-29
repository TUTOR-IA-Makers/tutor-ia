# Rules — Python

## The boundary that matters most

Nothing below `codeexpert/api/` imports FastAPI. Services raise the domain
exceptions in `codeexpert/errors.py`; `codeexpert/api/errors.py` maps each one to
a status code, in one table.

```python
# generation/codegen.py — correct
raise MissingArtefactError("'statement.json' not found. Generate a statement first.")

# generation/codegen.py — wrong, and the reason: this function must stay callable
# from a script, a test, a CLI and a future worker process
raise HTTPException(status_code=404, detail="...")
```

Adding a `try/except` inside a route is almost always the wrong fix. Add the
exception to `STATUS_BY_ERROR` instead.

## Exception messages are user interface

They reach the client as `detail`. Say what is missing **and** what to do:

```python
"'solution.c' not found in run 20260918T2211Z-1a2b3c4d. Generate a solution first (POST /gen_code)."
```

## Effects arrive through dependencies

Model provider, compiler and settings are injected — `LLMClient` and `CodeRunner`
are protocols. That is what makes the suite run offline and without a compiler.
A module that imports `httpx` or `subprocess` directly outside `llm/` and
`execution/` is a bug.

## Shape of a module

```python
"""One line saying what this module is for, and why it exists if that is not obvious."""

import ...                                  # stdlib, third party, codeexpert — ruff sorts them

logger = logging.getLogger(__name__)
CONSTANTS = ...

def _helper(): ...                          # private first
def public_entry_point(...) -> Model: ...    # the one public function, last
```

## Style

| Aspect | Rule |
| --- | --- |
| Formatting | `ruff format`. Never argued about in review |
| Paths | `pathlib.Path`, never `os.path` |
| Logging | `logger.info("Saved to %s", path)` — `%s` args, never f-strings |
| Secrets in logs | Never. Model name yes, key never |
| Types | On every public signature, return type included |
| Comments | Explain *why*. The diff already shows *what* |
| Language | Code, comments, logs, tests: English. Prompts and student-facing text: Portuguese |

## Tests

- `tests/unit/` — pure functions. No network, no compiler, no filesystem outside `tmp_path`.
- `tests/integration/` — several modules together, still offline. `FakeLLM` always.
- A test needing a compiler is marked `@requires_gcc` and skips when absent.
- A bug fix comes with the test that failed before it. No exceptions: this suite
  exists because the parsers used to fail silently.
