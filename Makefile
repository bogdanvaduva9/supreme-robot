.PHONY: build test lint typecheck deploy diff clean

# ── Python Lambda build ───────────────────────────────────────────────────────
# Zips each handler module + shared/ into dist/<name>.zip for CDK to reference.
HANDLERS := $(shell ls backend/src/api/ backend/src/pipeline/ 2>/dev/null | grep '\.py$$' | sed 's/\.py$$//')

build:
	@rm -rf dist && mkdir -p dist/deps
	@echo "Installing production dependencies..."
	@cd backend && uv export --no-dev --no-hashes -o ../dist/deps/requirements.txt
	@pip install -r dist/deps/requirements.txt -t dist/deps/ --quiet
	@rm dist/deps/requirements.txt
	@for name in $(HANDLERS); do \
	  echo "  packaging $$name ..."; \
	  mkdir -p dist/$$name && \
	  cp -r dist/deps/. dist/$$name/ && \
	  cp -r backend/src/shared dist/$$name/ && \
	  find backend/src -maxdepth 2 -name "$$name.py" -exec cp {} dist/$$name/ \; && \
	  (cd dist/$$name && zip -r ../$$name.zip . -x "**/__pycache__/*" "**/*.dist-info/*" "**/*.pyc" > /dev/null) && \
	  rm -rf dist/$$name; \
	done
	@rm -rf dist/deps
	@echo "Build complete — dist/ contains $$(ls dist/*.zip 2>/dev/null | wc -l | tr -d ' ') zip(s)"

# ── Tests ─────────────────────────────────────────────────────────────────────
test:
	cd backend && uv run pytest -v

# ── Lint & type check ─────────────────────────────────────────────────────────
lint:
	cd backend && uv run ruff check .

format:
	cd backend && uv run ruff format .

typecheck:
	cd backend && uv run mypy src

check: lint typecheck

# ── CDK ───────────────────────────────────────────────────────────────────────
diff:
	cd infrastructure && npm run diff

deploy: build
	cd infrastructure && npm run deploy

# ── Housekeeping ──────────────────────────────────────────────────────────────
clean:
	rm -rf dist
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .mypy_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .ruff_cache -exec rm -rf {} + 2>/dev/null || true
