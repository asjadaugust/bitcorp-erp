# Antigravity Instructions

## 🚀 Application Runtime Environment

The application runs via **Docker Compose**.

- **Frontend URL**: [http://localhost:3420](http://localhost:3420)
- **Backend URL**: [http://localhost:3400](http://localhost:3400)
- **Login URL**: [http://localhost:3420/login](http://localhost:3420/login)

### 🔑 Credentials

| Role      | Username | Password   |
| :-------- | :------- | :--------- |
| **Admin** | `admin`  | `admin123` |

### 🛠️ Useful Commands

```bash
# Start all services
docker-compose up -d --build

# View logs for a specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart a specific service
docker-compose restart backend
```

## 🏗️ Technical Overview

### Stack

- **Frontend**: Angular 19 (Standalone Components, Signals)
- **Backend**: Node.js v20, Express, TypeScript
- **Database**: PostgreSQL 16
- **ORM**: TypeORM
- **Cache**: Redis 7

### Key Directories

- `frontend/src/app/features`: Feature modules (Projects, Equipment, Providers, etc.)
- `frontend/src/app/core`: Singleton services, guards, interceptors.
- `backend/src/api`: Controller layer.
- `backend/src/services`: Business logic layer.
- `backend/src/models`: TypeORM entities.

## 🤖 Agent Workflow

When starting a task, follow these steps:

1.  **Pull Latest Code**: Always ensure you are working on the latest version.
    ```bash
    git pull origin main
    ```
2.  **Check Application Status**:
    - Check if `docker-compose` is running.
    - If not, start the application: `docker-compose up -d --build`.
3.  **Commit & Push**:
    - Stage all changes: `git add .`
    - Configure Identity (if needed):
      ```bash
      git config user.name "Mohammad Asjad"
      git config user.email "asjad.august@gmail.com"
      ```
    - Commit using **Conventional Commits**: `git commit -m "feat: description"`
    - Push changes: `git push`
