# Docker Build Troubleshooting Guide

**Last Updated:** January 26, 2026
**Platform:** Windows with WSL2

---

## Issue: Docker Build Hangs on npm install

### Symptom

```
=> [development 3/5] RUN npm install @rollup/rollup-linux-x64-gnu --save-optional --no-package-lock
[Hangs for minutes/hours...]
```

### Root Cause

The `@rollup/rollup-linux-x64-gnu` package was a workaround for an npm 11.x bug. It:

1. **Is no longer needed** (Angular CLI handles this now)
2. **Causes hangs** during docker build
3. **Increases build time** significantly

### Fix Applied

**File:** `docker/frontend.Dockerfile`

```dockerfile
# BEFORE (Problematic)
RUN npm install @rollup/rollup-linux-x64-gnu --save-optional --no-package-lock

# AFTER (Fixed)
# Removed this line - Angular CLI handles native dependencies
```

---

## Issue: Slow npm install in Docker

### Symptom

```
=> [development 2/5] RUN npm install --legacy-peer-deps
[Very slow, takes 5-10 minutes]
```

### Fixes Applied

#### 1. Added npm configuration for timeouts

```dockerfile
# In Dockerfiles (frontend.Dockerfile, backend.Dockerfile)
RUN npm config set fetch-timeout 600000 && \
    npm config set fetch-retries 5 && \
    npm config set loglevel=info
```

#### 2. Enable Docker build cache

Docker caches layers by default. If you're experiencing slow builds:

```bash
# Check if Docker build cache is being used
docker-compose build --no-cache frontend  # Force no cache (slow, fresh build)
docker-compose build frontend              # Use cache (fast)
```

#### 3. Check Docker Desktop settings

**Docker Desktop → Settings → Resources:**

1. **Memory:** Increase to at least 4GB (recommended 8GB)
2. **Swap:** At least 2GB
3. **Disk image size:** At least 64GB
4. **File sharing:** Ensure project directory is accessible:
   - Add `/home/asjad/projects/bitcorp-erp` OR
   - Add your WSL2 distro (e.g., `Ubuntu-20.04`)

**Docker Desktop → Settings → Docker Engine:**

```json
{
  "max-concurrent-downloads": 10,
  "max-concurrent-uploads": 5,
  "proxies": {},
  "builder": {
    "gc": {
      "enabled": true,
      "defaultKeepStorage": "20GB"
    }
  }
}
```

---

## Issue: Frontend Build Fails

### Common Errors

#### Error: peer dependency conflicts

```
npm ERR! peer dep missing: @angular/compiler@19.0.0
```

**Fix:** The `--legacy-peer-deps` flag handles this (already in Dockerfile).

#### Error: Out of memory during build

```
FATAL ERROR: CALL_AND_RETRY_LAST_FAILED: Ineffective mark-compacts-gc
```

**Fix 1:** Increase Docker memory

1. Docker Desktop → Settings → Resources
2. Increase Memory to 6GB-8GB
3. Click "Apply & Restart"

**Fix 2:** Add swap in WSL2

```bash
# Create swap file in WSL2
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Add to /etc/fstab for persistence
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

#### Error: Cannot connect to backend from frontend

```
Proxy error: Could not proxy request /api/...
```

**Fix 1:** Check backend is running

```bash
docker-compose ps backend
# Should show: "Up (healthy)"
```

**Fix 2:** Check backend health

```bash
curl http://localhost:3400/health
# Should return: {"status":"OK","timestamp":"..."}
```

**Fix 3:** Verify CORS configuration

```bash
# Check backend logs
docker-compose logs backend | grep -i cors
```

---

## Issue: Backend Build Fails

### Common Errors

#### Error: Chromium download fails

```
Error: Failed to download Chromium
```

**Fix:** Already fixed in `docker/backend.Dockerfile`:

```dockerfile
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

#### Error: Puppeteer errors

```
Error: Failed to launch the browser process
```

**Fix:** Add these flags to Puppeteer configuration:

```typescript
const browser = await puppeteer.launch({
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--shm-size=2gb'],
});
```

#### Error: Database connection failed

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Fix 1:** Wait for postgres to be healthy

```bash
# Check postgres status
docker-compose ps postgres
# Should show: "Up (healthy)"

# If not healthy, wait:
docker-compose logs postgres | tail -20
```

**Fix 2:** Check database URL in backend container

```bash
# Check environment variables
docker-compose exec backend env | grep DATABASE_URL
# Should be: DATABASE_URL=postgresql://bitcorp:dev_password_change_me@postgres:5432/bitcorp_dev
```

---

## Issue: Volume Mount Issues on Windows/WSL2

### Symptom

```
Error: ENOSPC: no space left on device
OR
Slow performance, high CPU usage
```

### Root Cause

Windows filesystem (`/mnt/c/`) mounted in WSL2 is slower than native Linux filesystem.

### Fixes

#### Fix 1: Use Named Volumes for node_modules

**Already applied in docker-compose.yml:**

```yaml
volumes:
  - backend_node_modules:/app/node_modules
  - frontend_node_modules:/app/node_modules
```

#### Fix 2: Store project in WSL2 filesystem

**Current:** `/home/asjad/projects/bitcorp-erp` ✅ (Good!)
**Avoid:** `/mnt/c/Users/...` ❌ (Slow!)

#### Fix 3: Use WSL2 file path in VS Code

```bash
# Open project with WSL2 path
code /home/asjad/projects/bitcorp-erp

# NOT Windows path
code \\wsl$\Ubuntu\home\asjad\projects\bitcorp-erp  # Works but slower
```

---

## Issue: Port Already in Use

### Symptom

```
Error: bind: address already in use [::]:3400
```

### Diagnosis

```bash
# Linux/WSL2
lsof -i :3400

# Windows PowerShell
netstat -ano | findstr ":3400"
```

### Fixes

#### Fix 1: Kill conflicting process

```bash
# Linux/WSL2
sudo kill -9 <PID>

# Windows
taskkill /F /PID <PID>
```

#### Fix 2: Change port in .env

```bash
# Edit .env
PORT=3401  # Change to unused port
```

#### Fix 3: Stop and remove old containers

```bash
docker-compose down -v
docker system prune -a
```

---

## Issue: Containers Won't Start

### Symptom

```
Container exited with code 1
```

### Diagnosis

```bash
# Check container logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
```

### Common Issues

#### Issue: Invalid .env values

```bash
# Check .env file
cat .env

# Verify no special characters
# Verify no trailing spaces
```

#### Issue: Missing dependencies

```bash
# Rebuild from scratch
docker-compose down -v
docker-compose up -d --build
```

#### Issue: Health check failing

```bash
# Check container status
docker-compose ps

# If shows "health: starting" or "health: unhealthy":
# Check health check logs
docker inspect bitcorp-backend-dev | jq -r '.[0].State.Health.Log'
```

---

## Issue: Database Schema Not Created

### Symptom

Backend starts but API returns errors about missing tables.

### Fix 1: Run migrations manually

```bash
# Option A: Use manual SQL script
./scripts/run-migrations-local.sh

# Option B: Run TypeORM migrations (if exists)
docker-compose exec backend npm run migrate

# Option C: Reset database completely
docker-compose down -v
docker-compose up -d --build
./scripts/run-migrations-local.sh
```

### Fix 2: Verify database connection

```bash
# Connect to database
docker-compose exec postgres psql -U bitcorp -d bitcorp_dev

# List tables
\dt sistema.*
\dt proyectos.*
\dt equipo.*
```

---

## Performance Optimization Tips

### Speed up Docker builds

```bash
# Use build cache (default)
docker-compose build

# Only rebuild specific service
docker-compose build backend

# Use BuildKit (Docker Desktop default)
DOCKER_BUILDKIT=1 docker-compose build
```

### Reduce rebuild times

1. **Minimize COPY statements** - Docker copies layers, fewer layers = faster builds
2. **Use .dockerignore** - Don't copy unnecessary files
3. **Order Dockerfile instructions** - Copy package.json first, then dependencies, then source

### .dockerignore examples

**backend/.dockerignore:**

```
node_modules
dist
*.log
.env
*.md
.git
```

**frontend/.dockerignore:**

```
node_modules
dist
.angular
*.log
.env
.git
```

---

## WSL2-Specific Optimizations

### Check WSL2 version

```bash
# Windows PowerShell
wsl --list --verbose

# Should show:
# WSL version: 2.x.x.x
# Kernel version: 5.x.x or higher
```

### Enable systemd in WSL2 (if available)

```bash
# Check if systemd is available
systemctl --version

# If yes, WSL2 automatically manages services
```

### Use WSL2 IP for containers (if localhost issues)

```bash
# Get WSL2 IP
hostname -I

# Use in .env
API_URL=http://<WSL2-IP>:3400
```

---

## Docker Compose Commands Reference

### Build and start

```bash
docker-compose up -d --build          # Build and start all services
docker-compose up -d --build backend  # Build and start only backend
```

### Stop and remove

```bash
docker-compose down                   # Stop and remove containers
docker-compose down -v               # Stop, remove containers AND volumes
```

### View logs

```bash
docker-compose logs                   # All logs
docker-compose logs backend          # Backend logs
docker-compose logs -f backend       # Follow backend logs (live)
docker-compose logs --tail 100 backend # Last 100 lines
```

### Execute commands in containers

```bash
# Backend shell
docker-compose exec backend sh

# Frontend shell
docker-compose exec frontend sh

# PostgreSQL
docker-compose exec postgres psql -U bitcorp -d bitcorp_dev
```

### Restart services

```bash
docker-compose restart backend
docker-compose restart frontend
docker-compose restart postgres
```

---

## Getting Help

### Check Docker Desktop status

1. Docker Desktop → Troubleshoot → Reset to factory defaults
2. Diagnose & Feedback → Check for updates

### Check WSL2 status

```bash
# In PowerShell
wsl --status
wsl --update
```

### Full cleanup and restart

```bash
# Stop everything
docker-compose down -v

# Remove all containers
docker rm -f $(docker ps -aq)

# Remove all images
docker rmi -f $(docker images -q)

# Remove all volumes
docker volume rm $(docker volume ls -q)

# Start fresh
docker-compose up -d --build
```

---

## Quick Reference

| Issue                | Command                                                  |
| -------------------- | -------------------------------------------------------- |
| Build hanging        | Check Dockerfile for problematic npm install             |
| Slow builds          | Increase Docker memory, use build cache                  |
| Port in use          | `lsof -i :<port>`                                        |
| DB connection failed | `docker-compose logs postgres`                           |
| Container exit       | `docker-compose logs <service>`                          |
| WSL2 slow            | Use native WSL2 paths, named volumes                     |
| Clean restart        | `docker-compose down -v && docker-compose up -d --build` |

---

**For more help:**

- Docker Docs: https://docs.docker.com/
- WSL2 Docs: https://learn.microsoft.com/en-us/windows/wsl/
- Angular CLI: https://angular.io/cli
