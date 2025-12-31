.PHONY: help run-docker db-clean db-migrate db-seed db-fresh stop logs test deploy-nas dev-backend dev-frontend install build

# Default target
help:
	@echo "════════════════════════════════════════════════"
	@echo "  Bitcorp ERP - Makefile Commands"
	@echo "════════════════════════════════════════════════"
	@echo ""
	@echo "🐳 Docker Commands:"
	@echo "  make run-docker    - Build and start all containers"
	@echo "  make stop          - Stop all containers"
	@echo "  make logs          - Show container logs"
	@echo "  make shell         - Shell into backend container"
	@echo ""
	@echo "🗄️  Database Commands:"
	@echo "  make db-clean      - Drop all tables and reset database"
	@echo "  make db-migrate    - Run database migrations"
	@echo "  make db-seed       - Seed database with sample data"
	@echo "  make db-fresh      - Clean + Migrate + Seed (full reset)"
	@echo ""
	@echo "🧪 Testing Commands:"
	@echo "  make test          - Run all tests"
	@echo "  make test-e2e      - Run E2E tests only"
	@echo ""
	@echo "💻 Development Commands:"
	@echo "  make dev-backend   - Start backend in dev mode"
	@echo "  make dev-frontend  - Start frontend in dev mode"
	@echo "  make install       - Install all dependencies"
	@echo "  make build         - Build project"
	@echo ""
	@echo "🚀 Deployment Commands:"
	@echo "  make deploy-nas    - Deploy to Synology NAS"
	@echo ""
	@echo "════════════════════════════════════════════════"

# Docker commands
run-docker:
	@echo "🐳 Building and starting Docker containers..."
	@docker-compose down || true
	@docker-compose up -d --build
	@echo ""
	@echo "✅ Containers are running!"
	@echo "📊 Frontend: http://localhost:4200"
	@echo "🔧 Backend:  http://localhost:3000"
	@echo "🗄️  Database: localhost:5432"
	@echo ""

stop:
	@echo "🛑 Stopping containers..."
	@docker-compose down
	@echo "✅ Containers stopped"

logs:
	@docker-compose logs -f

shell:
	@docker-compose exec backend sh

# Database commands
db-clean:
	@echo "🧹 Cleaning database..."
	@docker-compose exec -T postgres psql -U bitcorp -d bitcorp_dev -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO bitcorp; GRANT ALL ON SCHEMA public TO PUBLIC;" || true
	@echo "✅ Database cleaned"

db-migrate:
	@echo "🔄 Running migrations..."
	@cat database/001_init_schema.sql | docker-compose exec -T postgres psql -U bitcorp -d bitcorp_dev
	@echo "✅ Migrations complete - Modern schema with integer IDs"

db-seed:
	@echo "🌱 Seeding database..."
	@cat database/002_seed.sql | docker-compose exec -T postgres psql -U bitcorp -d bitcorp_dev
	@echo "✅ Database seeded with sample data"

db-fresh: db-clean db-migrate db-seed
	@echo ""
	@echo "✨ Database refreshed with clean data!"
	@echo "🔑 Default Login:"
	@echo "   Username: admin"
	@echo "   Password: admin123"
	@echo ""
	@echo "📊 Seeded Data:"
	@echo "   • 2 Companies"
	@echo "   • 5 Users (admin, director, jefe_equipo, operador1, admin_fin)"
	@echo "   • 12 Equipment"
	@echo "   • 8 Operators"
	@echo "   • 18 Daily Reports"
	@echo "   • 6 Contracts"
	@echo "   • 3 Projects"
	@echo ""

# Test commands
test:
	@echo "🧪 Running all tests..."
	@npm run test:all

test-e2e:
	@echo "🎭 Running E2E tests..."
	@npm run test:e2e

# Development helpers
dev-backend:
	@echo "🔧 Starting backend in dev mode..."
	@cd backend && npm run dev

dev-frontend:
	@echo "💻 Starting frontend in dev mode..."
	@cd frontend && npm start

install:
	@echo "📦 Installing dependencies..."
	@cd backend && npm install
	@cd frontend && npm install
	@echo "✅ Dependencies installed"

build:
	@echo "🏗️  Building project..."
	@cd backend && npm run build
	@cd frontend && npm run build
	@echo "✅ Build complete"

# NAS deployment
deploy-nas:
	@echo "🚀 Deploying to Synology NAS..."
	@./deploy_to_nas.py
	@echo "✅ Deployed to NAS!"




sudo docker compose exec -T postgres psql -U bitcorp -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='bitcorp_dev' AND pid<>pg_backend_pid();" && sudo docker compose exec -T postgres psql -U bitcorp -d bitcorp_dev -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public AUTHORIZATION bitcorp; GRANT ALL ON SCHEMA public TO PUBLIC;"