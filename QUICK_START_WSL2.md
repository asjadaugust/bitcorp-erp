# Quick Start Guide - Windows WSL2

**For**: Colleague deploying on Windows 11 with WSL2  
**Time**: ~5 minutes  
**Status**: ✅ Tested and verified

---

## ⚡ 5-Minute Setup

### Step 1: Clone Repository

```bash
git clone <your-repo-url>
cd bitcorp-erp
```

### Step 2: Start Services

```bash
docker-compose up -d --build
```

### Step 3: Wait for Backend (30 seconds)

```bash
docker-compose logs -f backend
```

Look for:

```
✅ Database migrations completed successfully
✅ Server listening on port 3400
```

Press `Ctrl+C` to exit logs.

### Step 4: Create Admin User

```bash
docker-compose exec backend npm run seed:typeorm
```

### Step 5: Login

- **Frontend**: http://localhost:3420
- **Username**: `admin`
- **Password**: `admin123`

✅ **Done!**

---

## 🔗 Access Points

| Service     | URL                   | Purpose                        |
| ----------- | --------------------- | ------------------------------ |
| Frontend    | http://localhost:3420 | Angular application            |
| Backend API | http://localhost:3400 | REST API                       |
| pgAdmin     | http://localhost:3450 | Database management (optional) |
| Redis       | http://localhost:6379 | Cache (internal)               |

---

## 🛑 Troubleshooting

### Login fails with "Invalid credentials"

```bash
# Run seeders again
docker-compose exec backend npm run seed:typeorm

# Check if admin user exists
docker-compose exec postgres psql -U bitcorp -d bitcorp_dev \
  -c "SELECT nombre_usuario FROM sistema.usuario WHERE nombre_usuario = 'admin';"
```

### "Cannot connect to database"

```bash
# Check if postgres is running
docker-compose ps postgres

# Restart postgres
docker-compose restart postgres
```

### "Port already in use"

```bash
# Find process using port 3400
lsof -i :3400

# Kill it
kill -9 <PID>

# Or change port in docker-compose.yml
```

### Frontend shows blank page

```bash
# Clear browser cache
# Ctrl+Shift+Delete (Windows)

# Or restart frontend
docker-compose restart frontend
```

### Everything broken?

```bash
# Nuclear option - reset everything
docker-compose down -v
docker-compose up -d --build
docker-compose exec backend npm run seed:typeorm
```

---

## 📝 Common Commands

```bash
# View logs
docker-compose logs -f backend

# Stop services
docker-compose down

# Start services
docker-compose up -d

# Restart a service
docker-compose restart backend

# Run database migrations
docker-compose exec backend npm run migrate

# Run seeders
docker-compose exec backend npm run seed:typeorm

# Access database
docker-compose exec postgres psql -U bitcorp -d bitcorp_dev

# Check container status
docker-compose ps
```

---

## ✅ Verification Checklist

- [ ] Docker containers running (`docker-compose ps`)
- [ ] Backend logs show "migrations completed"
- [ ] Seeders ran successfully
- [ ] Can login with admin/admin123
- [ ] Frontend loads at http://localhost:3420
- [ ] Backend responds at http://localhost:3400/health

---

## 📚 Full Documentation

- **Setup Issues**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Database Migrations**: See [DATABASE_MIGRATION.md](./DATABASE_MIGRATION.md)
- **Project Overview**: See [README.md](./README.md)

---

## 🆘 Still Stuck?

1. Check backend logs: `docker-compose logs backend --tail=100`
2. Check database: `docker-compose exec postgres psql -U bitcorp -d bitcorp_dev -c "\dt"`
3. Reset database: `docker-compose down -v && docker-compose up -d`
4. See [DEPLOYMENT.md](./DEPLOYMENT.md) troubleshooting section

---

**Default Credentials**

- Username: `admin`
- Password: `admin123`

**Change password after first login!**

---

_Last Updated: January 28, 2026_  
_Status: ✅ Tested on Windows 11 WSL2_
