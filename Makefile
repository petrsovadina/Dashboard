.PHONY: help install start stop restart logs build deploy backup clean test lint type-check

help: ## Show this help message
	@echo 'Azure AI Dashboard - Available Commands:'
	@echo ''
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies and setup project
	npm install
	cp .env.example .env
	@echo "✅ Setup complete! Please edit .env with your Azure credentials."

start: ## Start the dashboard in development mode  
	npm run dev

build: ## Build TypeScript and Docker containers
	npm run build
	docker-compose build

deploy: ## Deploy dashboard with Docker Compose
	./scripts/deploy.sh

stop: ## Stop all services
	docker-compose down

restart: ## Restart all services
	docker-compose restart

logs: ## Show application logs
	docker-compose logs -f azure-ai-dashboard

backup: ## Create backup of dashboard data
	./scripts/backup.sh

clean: ## Clean up containers and volumes
	docker-compose down -v
	docker system prune -f
	npm run clean || true

test: ## Run tests
	npm test

lint: ## Run ESLint
	npm run lint

lint-fix: ## Fix ESLint issues
	npm run lint:fix

type-check: ## Run TypeScript type checking
	npm run type-check

status: ## Show service status
	docker-compose ps

health: ## Check application health
	curl -f http://localhost:3001/api/health || echo "❌ Application is not healthy"

monitoring: ## Open monitoring dashboard
	@echo "📈 Grafana: http://localhost:3000 (admin/dashboard123)"
	@echo "🔧 Prometheus: http://localhost:9090"

dev-setup: install ## Complete development setup
	@echo "🔧 Setting up development environment..."
	@echo "1. Configure your .env file with Azure credentials"
	@echo "2. Run 'make start' to start development server"
	@echo "3. Run 'make deploy' to start full Docker stack"