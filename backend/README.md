# Backend — CodeExpert API

FastAPI service that generates C exercises and exports them as Moodle CodeRunner
XML. Run everything below from the repository root through `make`; the commands
here are what `make` wraps.

```text
src/codeexpert/   the application (see AGENTS.md §4 for the layers)
tests/            unit/ and integration/, both offline
pyproject.toml    dependencies, ruff and pytest configuration
Dockerfile        API image — build context is this folder
.env.example      every setting, with fake values
```

```bash
cd backend
cp .env.example .env              # then fill in CODEEXPERT_LLM_API_KEY
.venv/bin/uvicorn codeexpert.api.app:app --reload --port 8000
.venv/bin/pytest
docker build -t codeexpert .      # context = backend/
```

`.env` and `var/` (runs, questions) are resolved relative to the working
directory, so they live in `backend/` and are git-ignored.
