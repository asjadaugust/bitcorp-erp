# Deployment Guide - Bitcorp ERP

## Windows WSL2 Quick Start

### Prerequisites

- Windows 11 with WSL2 enabled
- Docker Desktop with WSL2 integration enabled
- Git configured with LF line endings
- Node.js 18+ (in WSL2 or Windows)

### First-Time Setup (5 minutes)

```bash
# 1. Clone repository
git clone <your-repo-url>
cd bitcorp-erp

# 2. Copy environment file (already exists, but verify)
ls -la .env
# If not found: cp .env.example .env

# 3. Start all services
docker-compose up -d --build

# 4. Wait for backend to initialize (watch logs)
docker-compose logs -f backend

# Look for these messages:
# ✅ "Database migrations completed successfully"
# ✅ "Server listening on port 3400"
# ✅ "Cron jobs started successfully"

# Press Ctrl+C to exit logs

# 5. Run database seeders (creates admin user)
docker-compose exec backend npm run seed:typeorm

# Expected output:
# ✅ "Seeding completed successfully"
# ✅ "Admin user created"

# 6. Access the application
# Frontend: http://localhost:3420
# Backend API: http://localhost:3400
# pgAdmin: http://localhost:3450 (optional)
# Redis Commander: http://localhost:3460 (optional)

# 7. Login with default credentials
# Username: admin
# Password: admin123
```

### Verify Installation

```bash
# Check all containers are running
docker-compose ps
# All should show "Up" status

# Check database is initialized
docker-compose exec postgres psql -U bitcorp -d bitcorp_dev \
  -c "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog', 'information_schema');"

# Check admin user exists
docker-compose exec postgres psql -U bitcorp -d bitcorp_dev \
  -c "SELECT nombre_usuario, correo_electronico FROM sistema.usuario WHERE nombre_usuario = 'admin';"

# Test API health
curl http://localhost:3400/health
# Expected: {"status":"OK","timestamp":"..."}

# Test login endpoint
curl -X POST http://localhost:3400/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq .
# Expected: access_token and refresh_token in response
```

---

## Troubleshooting

### Issue: Login fails with 401 "Invalid credentials"

**Cause**: Admin user not created or password hash mismatch

**Solution**:

```bash
# 1. Check if admin user exists
docker-compose exec postgres psql -U bitcorp -d bitcorp_dev \
  -c "SELECT nombre_usuario FROM sistema.usuario WHERE nombre_usuario = 'admin';"

# If no results, run seeders again
docker-compose exec backend npm run seed:typeorm

# 2. Verify password hash
docker-compose exec postgres psql -U bitcorp -d bitcorp_dev \
  -c "SELECT nombre_usuario, contrasena FROM sistema.usuario WHERE nombre_usuario = 'admin';"

# 3. Check backend logs for seeding errors
docker-compose logs backend --tail=50 | grep -i seed
```

### Issue: "Database connection error" or "Cannot connect to postgres"

**Cause**: PostgreSQL container not running or not ready

**Solution**:

```bash
# 1. Check container status
docker-compose ps postgres
# Should show "Up" status

# 2. Check PostgreSQL logs
docker-compose logs postgres --tail=50

# 3. Restart PostgreSQL
docker-compose restart postgres
docker-compose logs -f postgres
# Wait for "database system is ready to accept connections"

# 4. If still failing, rebuild
docker-compose down -v
docker-compose up -d --build
```

### Issue: "Port already in use" error

**Cause**: Another service using ports 3400, 3420, 5432, or 6379

**Solution**:

```bash
# Find process using port (example: 3400)
# Linux/WSL2:
lsof -i :3400
# Kill process:
kill -9 <PID>

# Or change ports in docker-compose.yml:
# Change: "3400:3400" to "3401:3400"
# Then access at http://localhost:3401

# Or use .env to override ports (if supported)
```

### Issue: "Migrations failed" or "Schema error"

**Cause**: TypeORM migrations didn't run or database is corrupted

**Solution**:

```bash
# 1. Check migration status
docker-compose exec backend npm run migration:show

# 2. View backend logs
docker-compose logs backend --tail=100 | grep -i migration

# 3. If corrupted, reset database
docker-compose down -v
docker-compose up -d --build
# Wait for migrations to run automatically

# 4. If still failing, manually run migrations
docker-compose exec backend npm run migrate
```

### Issue: Frontend shows blank page or "Cannot connect to API"

**Cause**: Frontend can't reach backend or API_URL is wrong

**Solution**:

```bash
# 1. Check API_URL in frontend
docker-compose exec frontend cat /app/src/environments/environment.ts | grep apiUrl

# 2. Verify backend is running
curl http://localhost:3400/health

# 3. Check frontend logs
docker-compose logs frontend --tail=50

# 4. Clear browser cache
# Ctrl+Shift+Delete (Windows/Linux) or Cmd+Shift+Delete (Mac)
# Or open DevTools → Application → Clear site data
```

---

## Development Workflow

### Starting Services

```bash
docker-compose up -d
```

### Stopping Services

```bash
docker-compose down
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Rebuilding After Code Changes

```bash
docker-compose up -d --build
```

### Fresh Database Reset

```bash
# Remove all data
docker-compose down -v

# Start fresh
docker-compose up -d --build

# Wait for migrations, then seed
docker-compose exec backend npm run seed:typeorm
```

---

## Production Deployment

For production deployment, see [DATABASE_MIGRATION.md](./DATABASE_MIGRATION.md) and [deploy/DEPLOYMENT.md](./deploy/DEPLOYMENT.md).

Key differences:

- Use `docker-compose.prod.yml` instead of `docker-compose.yml`
- Set `NODE_ENV=production`
- Use strong passwords and JWT secrets
- Enable HTTPS
- Configure backups
- Set up monitoring

---

## Environment Variables

See `.env` file for all available configuration options:

**Database**:

- POSTGRES_DB - Database name (default: bitcorp_dev)
- POSTGRES_USER - Database user (default: bitcorp)
- POSTGRES_PASSWORD - Database password
- POSTGRES_HOST - Database host (default: postgres)
- POSTGRES_PORT - Database port (default: 5432)

**JWT**:

- JWT_SECRET - Access token secret
- JWT_REFRESH_SECRET - Refresh token secret

**Application**:

- NODE_ENV - Environment (development/production)
- PORT - Backend port (default: 3400)
- API_URL - Backend URL for frontend
- FRONTEND_URL - Frontend URL for backend

**Redis**:

- REDIS_URL - Redis connection URL

---

## Support

For issues or questions:

1. Check the Troubleshooting section above
2. Review backend logs: `docker-compose logs backend --tail=100`
3. Check database: `docker-compose exec postgres psql -U bitcorp -d bitcorp_dev -c "\\dt"`
4. Create an issue with logs attached

---

**Last Updated**: 2026-01-28
**Version**: 1.0.0
