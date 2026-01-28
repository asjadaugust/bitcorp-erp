# For Your Colleague - Setup Instructions

**Hi! Here's everything you need to deploy Bitcorp ERP on your Windows 11 WSL2 machine.**

---

## ⚡ Quick Setup (5 minutes)

### Prerequisites

- Windows 11 with WSL2 enabled
- Docker Desktop installed and running
- Git installed

### Setup Steps

```bash
# 1. Clone the repository
git clone <repo-url>
cd bitcorp-erp

# 2. Start all services
docker-compose up -d --build

# 3. Wait for backend to initialize (30 seconds)
# You'll see: "Database migrations completed successfully"

# 4. Create admin user
docker-compose exec backend npm run seed:typeorm

# 5. Open browser and login
# Frontend: http://localhost:3420
# Username: admin
# Password: admin123
```

**That's it! You're done.** ✅

---

## 🔗 What You Can Access

| Service            | URL                   | Purpose            |
| ------------------ | --------------------- | ------------------ |
| **Frontend**       | http://localhost:3420 | Main application   |
| **Backend API**    | http://localhost:3400 | REST API           |
| **Database Admin** | http://localhost:3450 | pgAdmin (optional) |

---

## 🛑 If Something Goes Wrong

### Problem: Login fails with "Invalid credentials"

```bash
# Run seeders again
docker-compose exec backend npm run seed:typeorm
```

### Problem: "Cannot connect to database"

```bash
# Restart PostgreSQL
docker-compose restart postgres
```

### Problem: "Port already in use"

```bash
# Kill the process using port 3400
lsof -i :3400
kill -9 <PID>
```

### Problem: Everything is broken

```bash
# Nuclear reset
docker-compose down -v
docker-compose up -d --build
docker-compose exec backend npm run seed:typeorm
```

---

## 📚 Helpful Commands

```bash
# View logs
docker-compose logs -f backend

# Stop everything
docker-compose down

# Start everything
docker-compose up -d

# Restart a service
docker-compose restart backend

# Check status
docker-compose ps
```

---

## 📖 Full Documentation

If you need more details:

1. **Quick Start**: [QUICK_START_WSL2.md](./QUICK_START_WSL2.md)
2. **Full Setup Guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)
3. **Database Info**: [DATABASE_MIGRATION.md](./DATABASE_MIGRATION.md)
4. **What Changed**: [LOGIN_FIX_SUMMARY.md](./LOGIN_FIX_SUMMARY.md)

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] All Docker containers running (`docker-compose ps`)
- [ ] Can login with admin/admin123
- [ ] Frontend loads at http://localhost:3420
- [ ] Backend responds at http://localhost:3400/health

---

## 🆘 Still Need Help?

1. Check the logs: `docker-compose logs backend --tail=100`
2. See [DEPLOYMENT.md](./DEPLOYMENT.md) troubleshooting section
3. Reset database: `docker-compose down -v && docker-compose up -d`

---

## 🎯 Default Credentials

- **Username**: admin
- **Password**: admin123

**⚠️ Change this password after first login!**

---

## 📝 Notes

- All services run in Docker containers
- Database persists in Docker volumes
- Frontend runs on port 3420
- Backend API runs on port 3400
- PostgreSQL runs on port 5432 (internal)

---

**Questions?** Check the documentation files listed above.

**Ready to go!** 🚀

---

_Setup verified on Windows 11 with WSL2 - January 28, 2026_
