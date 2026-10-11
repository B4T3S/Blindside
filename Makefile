.DEFAULT_GOAL := help

.PHONY: help
help: ## Show available commands
	@echo "Available commands:"
	@awk 'BEGIN {FS = ":.*##"; printf "\n"} /^[a-zA-Z_-]+:.*##/ { printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

.PHONY: setup
setup: ## Installs all npm packages and bundles files
	docker run -v ./:/app -t -w /app node:26-alpine npm install --dev

.PHONY: up
up: ## Start containers in detached mode
	docker compose up -d

.PHONY: down
down: ## Stop and remove containers
	docker compose down

.PHONY: restart
restart: ## Restart containers
	docker compose restart

.PHONY: logs
logs: ## Follow container logs
	docker compose logs -f

.PHONY: shell
shell: ## Open a shell in the web container
	docker compose exec web sh

.PHONY: npm
npm: ## Run an npm command in the web container (e.g. make npm install)
	docker compose exec web npm $(filter-out $@,$(MAKECMDGOALS))

.PHONY: npx
npx: ## Run an npx command in the web container
	docker compose exec web npx $(filter-out $@,$(MAKECMDGOALS))

.PHONY: tailwind
tailwind: ## Builds all css files
	docker compose exec web npm run tailwind

.PHONY: tailwind-watch
tailwind-watch: ## Runs a watcher that builds all css files on file change (This runs automatically with `make up`!)
	docker compose exec web npm run tailwind:watch

.PHONY: bundle
bundle: ## Bundles all JS files
	docker compose exec web npm run bundle

.PHONY: bundle-watch
bundle-watch: ## Runs a watcher that bundles all JS files on file change (This runs automatically with `make up`!)
    docker compose exec web npm run bundle:watch

# Allow arbitrary arguments after "npm"
%:
	@:
