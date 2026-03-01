"""Tests para endpoints extras de valorizaciones."""

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
async def test_analytics_returns_stats() -> None:
    """GET /api/valuations/analytics debe retornar 200 con success:true y data.total."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/valuations/analytics")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert "total" in datos["data"]


@pytest.mark.asyncio
async def test_registry_returns_paginated() -> None:
    """GET /api/valuations/registry debe retornar 200 con success:true y pagination."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/valuations/registry")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert "pagination" in datos


@pytest.mark.asyncio
async def test_summary_not_found() -> None:
    """GET /api/valuations/99999/summary debe retornar 404."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/valuations/99999/summary")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_discount_events_empty() -> None:
    """GET /api/valuations/99999/discount-events debe retornar 200 (lista vacía o 404)."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/valuations/99999/discount-events")
    # La valorización 99999 no existe, pero el endpoint consulta directo la tabla
    # de eventos — retorna lista vacía con 200, o 404 si valida existencia
    assert resp.status_code in (200, 404)


@pytest.mark.asyncio
async def test_deducciones_empty() -> None:
    """GET /api/valuations/99999/deducciones debe retornar 200 (lista vacía o 404)."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/valuations/99999/deducciones")
    # Similar a discount-events: consulta directa a tabla, retorna lista vacía o 404
    assert resp.status_code in (200, 404)
