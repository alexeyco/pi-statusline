.DEFAULT_GOAL := help

.PHONY: help
help: ## Show this help
	@printf "pi-statusline — make targets:\n"
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z_-]+:.*##/ {printf "  \033[1m%-6s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

.PHONY: fmt
fmt: ## Format sources (prettier)
	@npx --yes prettier@3 --write .

.PHONY: check
check: ## Run repo sanity checks (same as CI)
	@node scripts/check.mjs

.PHONY: test
test: ## Run unit tests (Node >= 22.18)
	@node --test src/status.test.ts
