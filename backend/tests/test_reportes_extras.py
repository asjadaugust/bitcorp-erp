"""Tests para endpoints extras de reportes (operator reports, photos upload stub)."""

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
async def test_operator_reports_empty() -> None:
    """GET /api/reports/operator/99999 debe retornar 200 con pagination (lista vacía)."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/reports/operator/99999")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert "pagination" in datos


@pytest.mark.asyncio
async def test_photos_upload_stub() -> None:
    """POST /api/reports/1/photos debe retornar 200 (stub)."""
    async with await _cliente_auth() as c:
        resp = await c.post("/api/reports/1/photos")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
