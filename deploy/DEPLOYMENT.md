# Bitcorp ERP - Deployment Guide

## Prerequisites

- Docker and Docker Compose installed
- PostgreSQL database configured
- Environment variables set

## Production Deployment

### 1. Prepare Environment

```bash
# Copy and configure environment variables
cp .env.example .env.prod
# Edit .env.prod with production values
```

### 2. Build and Start Services

```bash
# Using docker-compose
docker-compose -f docker-compose.prod.yml up -d

# Or using Makefile
make deploy:prod
```

### 3. Initialize Database

```bash
# Run database initialization script
./deploy/init-database.sh

# Or manually
npm run db:migrate
npm run db:seed
```

## Docker Compose Files

- `docker-compose.dev.yml` - Development environment (in root)
- `docker-compose.yml` - Default configuration (in root)
- `docker-compose.prod.yml` - Production environment (in deploy/)
- `docker-compose.test.yml` - Testing environment (in deploy/)

## Database Scripts

See [DATABASE_SCRIPTS.md](./DATABASE_SCRIPTS.md) for database management commands.

## Monitoring

- Backend API: http://localhost:3400
- Frontend: http://localhost:3420
- PostgreSQL: localhost:3440
- Logs: `docker-compose logs -f`

## Troubleshooting

### Port Conflicts

```bash
# Check if ports are in use
lsof -i :3400  # Backend
lsof -i :3420  # Frontend
lsof -i :3440  # PostgreSQL

# On Windows (PowerShell):
netstat -ano | findstr ":3400"
netstat -ano | findstr ":3420"
```

### Reset Database

```bash
./deploy/reset-database.sh
```

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
```
