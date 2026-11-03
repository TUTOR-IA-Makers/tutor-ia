# Thin wrappers over scripts/. Everything real lives in the scripts, so the
# commands work identically whether they are typed, run by CI, or run by an agent.
.DEFAULT_GOAL := help
.PHONY: help setup run check check-fast fix test docs task clean \
        front-install front-dev front-build front-check front-e2e

help: ## Show this help
	@grep -hE '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | \
	  awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

setup: ## Create .venv, install everything, create .env
	@./scripts/dev-setup.sh

run: ## Start the API with auto-reload on http://127.0.0.1:8000
	@.venv/bin/uvicorn codeexpert.api.app:app --reload --port 8000

check: ## The gate — run before every push (same checks as CI)
	@./scripts/check.sh

check-fast: ## The gate without the documentation build
	@./scripts/check.sh --fast

fix: ## Apply formatting and auto-fixable lint
	@./scripts/fix.sh

test: ## Run the test suite with coverage
	@.venv/bin/pytest --cov --cov-report=term-missing

docs: ## Serve the documentation on http://127.0.0.1:8001
	@.venv/bin/mkdocs serve -a 127.0.0.1:8001

task: ## Start a task: make task T=feat I=42 S=scope-check
	@./scripts/new-task.sh $(T) $(I) $(S)

front-install: ## Install the front-end from package-lock.json
	@cd frontend && npm ci

front-dev: ## Vite on http://127.0.0.1:5173, proxying /api and /health to make run
	@cd frontend && npm run dev

front-build: ## Production build of the front-end into frontend/dist
	@cd frontend && npm run build

front-check: ## Front-end gate: format, lint, types, contrast, tests, build, secrets, size, audit
	@./scripts/front-check.sh

front-e2e: ## Playwright end-to-end and axe tests against the production build
	@cd frontend && npm run test:e2e

clean: ## Remove build output and generation runs
	@rm -rf .dist var .pytest_cache .ruff_cache .coverage \
	  frontend/dist frontend/coverage frontend/test-results frontend/playwright-report
	@find . -name __pycache__ -type d -prune -exec rm -rf {} +
	@echo "✓ clean"
