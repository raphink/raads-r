.PHONY: build run test deploy clean dev fmt help

# Variables
BINARY_NAME=raads-pdf-service
GO_VERSION=1.21
PROJECT_ID?=raads-r
SERVICE_NAME?=raads-pdf-service
REGION?=europe-west6

# Default target
help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Development
build: ## Build the application
	@echo "🏗️  Building $(BINARY_NAME)..."
	go build -o bin/$(BINARY_NAME) .

run: ## Run the application locally
	@echo "🚀 Running $(BINARY_NAME) locally..."
	go run .

run-summon: ## Run the application locally using summon for secrets
	@echo "🔐 Running $(BINARY_NAME) locally with summon..."
	@test -f secrets.yml || (echo "❌ secrets.yml not found" && exit 1)
	summon go run .

dev: ## Run with live reload (requires air: go install github.com/cosmtrek/air@latest)
	@echo "🔄 Starting live reload development server..."
	air

test: ## Run tests
	@echo "🧪 Running tests..."
	go test -v ./...

fmt: ## Format code
	@echo "📝 Formatting code..."
	go fmt ./...
	go mod tidy

# Docker
docker-build: ## Build Docker image
	@echo "🐳 Building Docker image..."
	docker build -t $(BINARY_NAME) .

docker-run: ## Run Docker container locally
	@echo "🐳 Running Docker container..."
	docker run -p 8080:8080 \
		-e CLAUDE_API_KEY="$(CLAUDE_API_KEY)" \
		$(BINARY_NAME)

# Google Cloud Platform
gcp-setup: ## Set up GCP project and enable APIs
	@echo "🔧 Setting up GCP project..."
	gcloud config set project $(PROJECT_ID)
	gcloud services enable cloudbuild.googleapis.com run.googleapis.com storage.googleapis.com

deploy: ## Deploy to Cloud Run (requires manual env vars)
	@echo "🚀 Deploying to Cloud Run..."
	chmod +x deploy.sh
	./deploy.sh

deploy-summon: ## Deploy to Cloud Run using summon for secrets
	@echo "🔐 Deploying to Cloud Run with summon..."
	@test -f secrets.yml || (echo "❌ secrets.yml not found" && exit 1)
	chmod +x deploy.sh
	summon ./deploy.sh

logs: ## View Cloud Run logs
	@echo "📊 Viewing Cloud Run logs..."
	gcloud run services logs tail $(SERVICE_NAME) --platform=managed --region=$(REGION)

# Environment
env-check: ## Check required environment variables
	@echo "🔍 Checking environment variables..."
	@test -n "$(CLAUDE_API_KEY)" || (echo "❌ CLAUDE_API_KEY is not set" && exit 1)
	@echo "✅ All required environment variables are set"

# Utilities
clean: ## Clean build artifacts
	@echo "🧹 Cleaning build artifacts..."
	rm -rf bin/
	go clean

deps: ## Download and verify dependencies
	@echo "📦 Downloading dependencies..."
	go mod download
	go mod verify

# Local testing
test-health: ## Test health endpoint locally
	@echo "🏥 Testing health endpoint..."
	curl -X GET http://localhost:8080/health | jq

test-pdf: ## Test PDF generation locally (requires sample data)
	@echo "📄 Testing PDF generation..."
	curl -X POST http://localhost:8080/generate-pdf \
		-H "Content-Type: application/json" \
		-d @test-data.json | jq

# Development setup
init: ## Initialize development environment
	@echo "🎯 Initializing development environment..."
	go mod init raads-pdf-backend 2>/dev/null || true
	go mod tidy
	@echo "📦 Installing development tools..."
	go install github.com/cosmtrek/air@latest
	@echo "✅ Development environment ready!"

# Security
security-scan: ## Run security scan on dependencies
	@echo "🔒 Running security scan..."
	go list -json -deps | nancy sleuth

# Performance
bench: ## Run benchmarks
	@echo "⚡ Running benchmarks..."
	go test -bench=. -benchmem

# Documentation
docs: ## Generate documentation
	@echo "📚 Generating documentation..."
	godoc -http=:6060
	@echo "Documentation available at http://localhost:6060"
