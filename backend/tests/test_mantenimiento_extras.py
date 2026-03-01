"""Tests para endpoints extras de mantenimiento (stats, delete nonexistent)."""

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
async def test_stats_returns_data() -> None:
    """GET /api/maintenance/stats retorna 200 con data.total."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/maintenance/stats")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert "total" in datos["data"]
    assert "pendientes" in datos["data"]


@pytest.mark.asyncio
async def test_delete_nonexistent() -> None:
    """DELETE /api/maintenance/99999 debe retornar 204 (soft delete sin verificar existencia)."""
    async with await _cliente_auth() as c:
        resp = await c.delete("/api/maintenance/99999")
    # El endpoint hace DELETE directo sin verificar existencia, retorna 204
    assert resp.status_code == 204
