# Antigravity Instructions

## 🚀 Application Runtime Environment

The application runs via **Docker Compose**.

- **Frontend URL**: [http://localhost:3420](http://localhost:3420)
- **Backend URL**: [http://localhost:3410](http://localhost:3410)
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
- **Backend**: Python 3.12, FastAPI
- **Database**: PostgreSQL 16
- **ORM**: SQLAlchemy 2.0 Async
- **Cache**: Redis 7

### Key Directories

- `frontend/src/app/features`: Feature modules (Projects, Equipment, Providers, etc.)
- `frontend/src/app/core`: Singleton services, guards, interceptors.
- `backend/app/api`: Router layer.
- `backend/app/services`: Business logic layer.
- `backend/app/models`: SQLAlchemy models.

## 🤖 Agent Workflow

When starting a task, follow these steps:

1.  **Pull Latest Code**: Always ensure you are working on the latest version.
    ```bash
    git pull origin main
    ```
2.  **Check Application Status**:
    - Check if `docker-compose` is running.
    - If not, start the application: `docker-compose up -d --build`.
3.  **Check Logs**:
    - Before committing, check the logs for any errors:
      ```bash
      docker-compose logs --tail=50 -f backend
      docker-compose logs --tail=50 -f frontend
      ```
4.  **Commit & Push**:
    - Stage all changes: `git add .`
    - Configure Identity (if needed):
      ```bash
      git config user.name "Mohammad Asjad"
      git config user.email "asjad.august@gmail.com"
      ```
    - Commit using **Conventional Commits**: `git commit -m "feat: description"`
    - Push changes: `git push`
