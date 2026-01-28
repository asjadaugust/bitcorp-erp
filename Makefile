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
	@echo "🗄️  Database Commands (TypeORM):"
	@echo "  make db-clean           - Drop all schemas and reset database"
	@echo "  make db-migrate         - Run TypeORM migrations"
	@echo "  make db-migrate-revert  - Revert last migration"
	@echo "  make db-migrate-create  - Create new migration file"
	@echo "  make db-migrate-generate- Generate migration from entity changes"
	@echo "  make db-seed            - Run TypeORM seeders"
	@echo "  make db-fresh           - Clean + Migrate + Seed (full reset)"
	@echo "  make db-status          - Show migration and database status"
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
	@echo "📊 Frontend: http://localhost:3420"
	@echo "🔧 Backend:  http://localhost:3400"
	@echo "🗄️  Database: localhost:3440"
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
	@docker-compose exec -T postgres psql -U bitcorp -d bitcorp_dev -c "DROP SCHEMA IF EXISTS sistema, proyectos, proveedores, administracion, rrhh, logistica, equipo, sst, sig, public CASCADE; CREATE SCHEMA sistema; CREATE SCHEMA proyectos; CREATE SCHEMA proveedores; CREATE SCHEMA administracion; CREATE SCHEMA rrhh; CREATE SCHEMA logistica; CREATE SCHEMA equipo; CREATE SCHEMA sst; CREATE SCHEMA sig; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO bitcorp; GRANT ALL ON SCHEMA public TO PUBLIC;" || true
	@echo "✅ Database cleaned"

db-migrate:
	@echo "🔄 Running TypeORM migrations..."
	@docker-compose exec backend npm run migrate
	@echo "✅ Migrations complete!"

db-migrate-revert:
	@echo "⏪ Reverting last migration..."
	@docker-compose exec backend npm run migrate:revert
	@echo "✅ Migration reverted"

db-migrate-create:
	@echo "📝 Creating new migration..."
	@read -p "Migration name: " name; \
	docker-compose exec backend npm run typeorm migration:create src/database/migrations/$$name
	@echo "✅ Migration file created"

db-migrate-generate:
	@echo "🔍 Generating migration from entity changes..."
	@read -p "Migration name: " name; \
	docker-compose exec backend npm run typeorm migration:generate src/database/migrations/$$name -- -d src/config/database.config.ts
	@echo "✅ Migration generated"

db-seed:
	@echo "🌱 Running TypeORM seeders..."
	@docker-compose exec backend npm run seed:typeorm
	@echo "✅ Database seeded!"

db-fresh:
	@echo "🧹 Cleaning database..."
	@docker-compose exec postgres psql -U bitcorp -d bitcorp_dev \
	  -c "DROP SCHEMA IF EXISTS sistema, proyectos, proveedores, administracion, rrhh, logistica, equipo, sst, sig, public CASCADE;"
	@echo "🔄 Running TypeORM migrations..."
	@docker-compose exec backend npm run migrate
	@echo "🌱 Running TypeORM seeders..."
	@docker-compose exec backend npm run seed:typeorm
	@echo "✅ Database ready!"

db-status:
	@echo "📊 Database Status:"
	@echo ""
	@echo "🔌 Connection:"
	@docker-compose exec -T postgres psql -U bitcorp -d bitcorp_dev -c "SELECT version();" 2>/dev/null || echo "❌ Database not connected"
	@echo ""
	@echo "📋 Migration Status:"
	@docker-compose exec backend npm run typeorm migration:show -- -d src/config/database.config.ts 2>/dev/null || echo "❌ Cannot retrieve migration status"
	@echo ""
	@echo "📋 Tables by Schema:"
	@docker-compose exec -T postgres psql -U bitcorp -d bitcorp_dev -c "SELECT schemaname, COUNT(*) AS table_count FROM pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema') GROUP BY schemaname ORDER BY schemaname;" 2>/dev/null || echo "❌ Cannot retrieve tables"
	@echo ""
	@echo "📈 Top Tables by Row Count:"
	@docker-compose exec -T postgres psql -U bitcorp -d bitcorp_dev -c "SELECT schemaname || '.' || tablename AS table, n_live_tup AS rows FROM pg_stat_user_tables ORDER BY n_live_tup DESC LIMIT 20;" 2>/dev/null || echo "❌ Cannot retrieve row counts"

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
