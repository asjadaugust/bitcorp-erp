"""Tests para endpoints extras de checklists (inspections overdue, inspections stats)."""

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
async def test_inspections_overdue() -> None:
    """GET /api/checklists/inspections/overdue debe retornar 200."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/checklists/inspections/overdue")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert isinstance(datos["data"], list)


@pytest.mark.asyncio
async def test_inspections_stats() -> None:
    """GET /api/checklists/inspections/stats debe retornar 200 con data.total."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/checklists/inspections/stats")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert "total" in datos["data"]
