# Testing Skill — BitCorp ERP

> **When to activate**: Any prompt involving writing tests, debugging test failures, or running test suites.

---

## 1. Test Infrastructure

### Python Backend

```bash
cd backend
python -m pytest tests/ -v --tb=short     # All tests
python -m pytest tests/test_equipos.py -v # Single file
python -m ruff check app/ tests/          # Linting
python -m mypy app/ --strict              # Type checking
```

- **Framework**: pytest + pytest-asyncio + httpx
- **Config**: `backend/pyproject.toml`
- **Pattern**: `tests/test_<module>.py` files

### Frontend

```bash
cd frontend && npx ng build --configuration=production  # Build check (no unit tests yet)
```

---

## 2. Python Test Patterns

### Fixtures (`tests/conftest.py`)

```python
import os
# ENV OVERRIDES BEFORE APP IMPORTS (critical for localhost vs Docker)
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://bitcorp:dev_password_change_me@localhost:3440/bitcorp_dev")
os.environ.setdefault("REDIS_URL", "redis://localhost:3460")

import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app

@pytest.fixture
async def cliente_async():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as cliente:
        yield cliente

async def obtener_token_admin() -> str:
    """Get admin JWT token for authenticated tests."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        resp = await c.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
        return resp.json()["data"]["access_token"]
```

### Test Structure

```python
import time
import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app
from tests.conftest import obtener_token_admin

_TS = str(int(time.time()))[-6:]  # Unique suffix per test run

async def _cliente_auth() -> AsyncClient:
    """Authenticated client helper."""
    token = await obtener_token_admin()
    c = AsyncClient(transport=ASGITransport(app=app), base_url="http://test")
    c.headers["Authorization"] = f"Bearer {token}"
    return c

@pytest.mark.asyncio
async def test_listar_items() -> None:
    """Debe retornar lista paginada."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/<route>/")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert "data" in datos
    assert "pagination" in datos

@pytest.mark.asyncio
async def test_crear_item() -> None:
    """Debe crear un item nuevo."""
    async with await _cliente_auth() as c:
        resp = await c.post("/api/<route>/", json={"campo": f"test-{_TS}"})
    assert resp.status_code == 201
    datos = resp.json()
    assert datos["success"] is True
    assert "id" in datos["data"]

@pytest.mark.asyncio
async def test_obtener_item_no_existente() -> None:
    """Debe retornar 404 para item inexistente."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/<route>/999999")
    assert resp.status_code == 404
    assert resp.json()["success"] is False

@pytest.mark.asyncio
async def test_sin_autorizacion() -> None:
    """Debe retornar 401 sin token."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.get("/api/<route>/")
    assert resp.status_code == 401
```

---

## 3. Test Conventions

| Convention  | Rule                                              |
| ----------- | ------------------------------------------------- |
| Naming      | `test_<feature>_<scenario>` in Spanish docstring  |
| Async       | All tests `@pytest.mark.asyncio` + `async def`    |
| Auth        | Use `_cliente_auth()` for authenticated endpoints |
| Unique data | Timestamp suffix `_TS` to avoid collisions        |
| Structure   | Arrange → Act → Assert (explicit sections)        |
| Cleanup     | Tests should not depend on execution order        |
| Coverage    | CRUD + auth + error cases per module              |

---

## 4. Prerequisites

```bash
# Docker DB + Redis must be running
docker-compose up -d postgres redis

# Verify connectivity
docker-compose ps  # postgres on :3440, redis on :3460
```

---

## 5. Quality Gates (run before commit)

```bash
cd backend
python -m ruff check app/ tests/       # Zero warnings
python -m mypy app/ --strict           # Zero errors
python -m pytest tests/ -v --tb=short  # All pass
```

---

## 6. Common Test Failures & Fixes

| Symptom                | Cause                               | Fix                                                            |
| ---------------------- | ----------------------------------- | -------------------------------------------------------------- |
| Tests hang forever     | Docker DB not running or wrong host | Start Docker, check conftest.py env overrides                  |
| `401 Unauthorized`     | Missing/invalid token               | Check `obtener_token_admin()`, ensure seed data has admin user |
| `404 Not Found`        | Wrong route path                    | Check `app/api/router.py` for registered prefix                |
| `422 Validation Error` | DTO field mismatch                  | Check Pydantic schema field names vs payload                   |
| `500 Internal Error`   | Model column missing                | Check SQLAlchemy model matches DB schema                       |
| `IntegrityError`       | FK constraint or unique violation   | Check test data doesn't conflict with seed data                |
