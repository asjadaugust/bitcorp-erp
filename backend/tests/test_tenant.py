"""Tests para el router de tenant (proyectos del usuario)."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from tests.conftest import obtener_token_admin


async def _cliente_auth() -> AsyncClient:
    token = await obtener_token_admin()
    c = AsyncClient(transport=ASGITransport(app=app), base_url="http://test")
    c.headers["Authorization"] = f"Bearer {token}"
    return c


@pytest.mark.asyncio
async def test_my_projects_returns_list() -> None:
    """GET /api/tenant/my-projects debe retornar 200 con array plano (sin wrapper)."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/tenant/my-projects")
    assert resp.status_code == 200
    datos = resp.json()
    # Tenant my-projects retorna array plano, NO wrapped en {success, data}
    assert isinstance(datos, list)


@pytest.mark.asyncio
async def test_my_projects_without_auth_returns_401() -> None:
    """GET /api/tenant/my-projects sin auth debe retornar 401."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        resp = await c.get("/api/tenant/my-projects")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_switch_project_stub() -> None:
    """POST /api/tenant/switch-project/1 debe retornar 200 con success:true."""
    async with await _cliente_auth() as c:
        resp = await c.post("/api/tenant/switch-project/1")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
