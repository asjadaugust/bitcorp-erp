# Bitcorp ERP System

Modern ERP system for civil engineering equipment management built with Angular 19, Node.js, PostgreSQL, and Redis.

## 📚 Documentation

| Document                                                           | Description                             |
| ------------------------------------------------------------------ | --------------------------------------- |
| **[docs/SCHEMA_CONVENTIONS.md](./docs/SCHEMA_CONVENTIONS.md)**     | 📘 Database schema & naming conventions |
| **[deploy/DEPLOYMENT.md](./deploy/DEPLOYMENT.md)**                 | 🚀 Production deployment guide          |
| **[deploy/DATABASE_SCRIPTS.md](./deploy/DATABASE_SCRIPTS.md)**     | 🗄️ Database management                  |
| **[docs/CLEANUP_SUMMARY.md](./docs/CLEANUP_SUMMARY.md)**           | 🧹 Recent cleanup changes               |
| **[docs/copilot-instructions.md](./docs/copilot-instructions.md)** | 🤖 AI development guide                 |
| **[docs/testing/](./docs/testing/)**                               | 🧪 Testing documentation                |

---

## 🚀 Quick Start

### 📱 **Local Development**

```bash
# Install dependencies
npm install

# Start containers
docker-compose up -d --build

# Run migrations
./scripts/run-migrations-local.sh

# Access application
# Frontend: http://localhost:4200
# Backend API: http://localhost:3400
```

### 🖥️ **Production (Synology NAS)**

See [deploy/DEPLOYMENT.md](./deploy/DEPLOYMENT.md) for complete deployment instructions.

```bash
# Quick deploy
cd /volume1/projects/bitcorp-erp
docker-compose -f deploy/docker-compose.prod.yml up -d

# Initialize database (first time only)
./deploy/init-database.sh
```

---

## 📁 Project Structure

```
bitcorp-erp/
├── backend/              # Node.js TypeScript API
├── frontend/             # Angular 19 application
├── database/             # Database schemas and migrations
├── deploy/               # Production deployment configs
├── docs/                 # Documentation
├── docker/               # Dockerfiles
├── scripts/              # Development scripts
├── tests/                # E2E tests (Playwright)
└── docker-compose.yml    # Development environment
```

---

## 🔑 Default Credentials

| Role              | Username    | Password      |
| ----------------- | ----------- | ------------- |
| **Administrator** | `admin`     | `admin123`    |
| **Operator**      | `operator1` | `operator123` |

---

## 🛠️ Tech Stack

| Component            | Technology              | Version |
| -------------------- | ----------------------- | ------- |
| **Frontend**         | Angular                 | 19      |
| **Backend**          | Node.js + TypeScript    | 20 LTS  |
| **Database**         | PostgreSQL              | 16      |
| **Cache**            | Redis                   | 7       |
| **Containerization** | Docker + Docker Compose | Latest  |

---

## 📁 Project Structure

```
bitcorp-erp/
├── frontend/                      # Angular 19 application
│   ├── src/app/
│   │   ├── core/                 # Services, guards, interceptors
│   │   ├── shared/               # Shared components
│   │   └── features/             # Feature modules
│   └── package.json
│
├── backend/                       # Node.js TypeScript API
│   ├── src/
│   │   ├── api/                  # REST API routes
│   │   ├── services/             # Business logic
│   │   ├── repositories/         # Data access
│   │   ├── models/               # TypeORM entities
│   │   └── middleware/           # Express middleware
│   └── package.json
│
├── database/                      # Database scripts
│   ├── init/                     # Init SQL (schema)
│   └── migrations/               # Migration SQL (seed data)
│
├── docker/                        # Dockerfiles
│   ├── backend.prod.Dockerfile
│   ├── frontend.prod.Dockerfile
│   └── nginx.conf
│
├── docs/                          # Documentation
│   ├── api/                      # API documentation
│   ├── architecture/             # Architecture diagrams
│   └── archive/                  # Old documentation
│
├── tests/                         # E2E tests
│   └── e2e/                      # Playwright tests
│
├── docker-compose.yml             # Production compose
├── docker-compose.dev.yml         # Development compose
├── .env.example                   # Environment template
├── SYNOLOGY_DEPLOYMENT_GUIDE.md   # NAS deployment guide
├── nas-commands.sh                # NAS management menu
└── README.md                      # This file
```

---

## 📚 Documentation

| Document                                                         | Description                                 |
| ---------------------------------------------------------------- | ------------------------------------------- |
| [`docs/SCHEMA_CONVENTIONS.md`](./docs/SCHEMA_CONVENTIONS.md)     | 📘 **Database schema & naming conventions** |
| [`SYNOLOGY_DEPLOYMENT_GUIDE.md`](./SYNOLOGY_DEPLOYMENT_GUIDE.md) | 🚀 Complete NAS deployment guide            |
| [`nas-commands.sh`](./nas-commands.sh)                           | 🔧 Interactive NAS management menu          |
| [`copilot-instructions.md`](./copilot-instructions.md)           | 🤖 AI development guidelines                |
| [`docs/api/`](./docs/api/)                                       | 📡 API endpoint documentation               |
| [`docs/architecture/`](./docs/architecture/)                     | 🏗️ System architecture                      |

---

## 🔧 Development Commands

### Local Development

```bash
# Install dependencies
npm install

# Run development environment
npm run dev                     # Start all services with Docker

# Or run individually:
cd backend && npm run dev       # Backend only
cd frontend && npm start        # Frontend only

# Database operations
npm run db:migrate              # Run migrations
npm run db:seed                 # Seed test data
npm run db:reset                # Reset database

# Testing
npm run test:all                # All tests
npm run test:e2e                # E2E tests
npm run test:backend            # Backend unit tests

# Build
npm run build                   # Build all
npm run build:prod              # Production build
```

### NAS Deployment

```bash
# SSH into NAS
ssh -p 2450 mohammad@192.168.0.13

# Quick commands (in /volume1/docker/bitcorp-erp):
sudo docker-compose ps                    # View status
sudo docker-compose logs -f               # View logs
sudo docker-compose up -d --build         # Rebuild and restart
sudo docker-compose restart backend       # Restart backend only
sudo docker-compose down -v               # Stop and remove all

# Or use interactive menu:
bash nas-commands.sh
```

---

## 🗄️ Database

### Schema Organization

The database uses PostgreSQL schemas to organize tables by business domain:

- **`sistema`** - Core system (users, roles, audit)
- **`proyectos`** - Project management
- **`equipo`** - Equipment management
- **`rrhh`** - Human resources
- **`logistica`** - Logistics & inventory
- **`proveedores`** - Suppliers
- **`administracion`** - Finance & admin
- **`sst`** - Safety & health

📘 **See [docs/SCHEMA_CONVENTIONS.md](./docs/SCHEMA_CONVENTIONS.md) for complete naming conventions and best practices.**

### Migrations

Migrations run automatically on container startup:

- `database/001_init_schema.sql` - Schema creation
- `database/002_seed.sql` - Test data seeding

Manual migration (if needed):

```bash
sudo docker exec -i bitcorp-postgres psql -U bitcorp -d bitcorp_prod < /volume1/docker/bitcorp-erp/database/001_init_schema.sql
sudo docker exec -i bitcorp-postgres psql -U bitcorp -d bitcorp_prod < /volume1/docker/bitcorp-erp/database/002_seed.sql
```

---

## 📊 Features

### Core Modules

- ✅ **Authentication** - JWT-based auth with refresh tokens
- ✅ **Project Management** - Multi-site project tracking
- ✅ **Equipment Management** - Equipment tracking, assignments, scheduling
- ✅ **Operator Management** - Operator profiles, skills, scheduling
- ✅ **Daily Reports** - Mobile-friendly daily reporting
- ✅ **Scheduling** - Equipment and operator scheduling engine
- ✅ **Cost Analysis** - Cost tracking and equipment valuations
- ✅ **Safety (SST)** - Safety incident reporting
- ✅ **Documents (SIG)** - Document management system
- ✅ **Tenders** - Tender tracking and management
- ✅ **Fuel Management** - Fuel consumption tracking
- ✅ **HR** - Employee management

---

## 🐛 Troubleshooting

### Quick Fixes

| Issue                 | Solution                                               |
| --------------------- | ------------------------------------------------------ |
| **Can't login**       | Check backend logs: `sudo docker-compose logs backend` |
| **502 Gateway**       | Backend not running: `sudo docker-compose ps`          |
| **Empty tables**      | Re-run seed: See deployment guide                      |
| **Permission denied** | Use `sudo` with docker-compose on NAS                  |

### Common Issues

**Backend crashes**:

```bash
# Check logs
sudo docker-compose logs backend | tail -50

# Rebuild backend
sudo docker-compose up -d --build backend
```

**Database connection failed**:

```bash
# Fresh start (removes all data!)
sudo docker-compose down -v
sudo rm -rf /volume1/docker/bitcorp-erp/postgres/*
sudo docker-compose up -d
```

**Frontend 502 error**:

```bash
# Check network
sudo docker network inspect bitcorp-erp_bitcorp-network

# Restart frontend
sudo docker-compose restart frontend
```

**📖 Full troubleshooting**: [`SYNOLOGY_DEPLOYMENT_GUIDE.md`](./SYNOLOGY_DEPLOYMENT_GUIDE.md#-troubleshooting)

---

## 🔒 Security

- ✅ JWT authentication with httpOnly cookies
- ✅ Refresh token rotation
- ✅ Password hashing with bcrypt
- ✅ Role-based access control (RBAC)
- ✅ CORS protection
- ✅ SQL injection prevention (TypeORM)
- ✅ Environment-based secrets
- ✅ Rate limiting on auth endpoints

---

## 🚦 System Status

**Production (Synology NAS)**:

| Service  | Status     | URL                      |
| -------- | ---------- | ------------------------ |
| Frontend | ✅ Running | http://192.168.0.13:3420 |
| Backend  | ✅ Running | http://192.168.0.13:3400 |
| Database | ✅ Running | Internal (3440)          |
| Redis    | ✅ Running | Internal (3460)          |

Check status:

```bash
sudo docker-compose ps
```

---

## 🤝 Contributing

This is a proprietary project.

**Development guidelines**: [`copilot-instructions.md`](./copilot-instructions.md)

---

## 📄 License

Proprietary - Bitcorp © 2025

---

## 📞 Support

1. Check logs: `sudo docker-compose logs -f`
2. See troubleshooting: [`SYNOLOGY_DEPLOYMENT_GUIDE.md`](./SYNOLOGY_DEPLOYMENT_GUIDE.md#-troubleshooting)
3. Review docs: [`docs/`](./docs/)
4. Check archived docs: [`docs/archive/`](./docs/archive/)

---

**Last Updated**: 2025-12-10  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
