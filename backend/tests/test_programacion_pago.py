"""Tests para programación de pagos."""

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
async def test_programacion_listar() -> None:
    """Debe retornar lista paginada."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/payment-schedules/")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert "pagination" in datos


@pytest.mark.asyncio
async def test_programacion_listar_filtro_estado() -> None:
    """Debe filtrar por estado."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/payment-schedules/?estado=PROGRAMADO")
    assert resp.status_code == 200
    assert resp.json()["success"] is True


@pytest.mark.asyncio
async def test_programacion_obtener_inexistente() -> None:
    """Debe retornar 404 para programación inexistente."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/payment-schedules/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_programacion_eliminar_inexistente() -> None:
    """Debe retornar 404 al eliminar inexistente."""
    async with await _cliente_auth() as c:
        resp = await c.delete("/api/payment-schedules/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_programacion_aprobar_inexistente() -> None:
    """Debe retornar 404 al aprobar inexistente."""
    async with await _cliente_auth() as c:
        resp = await c.post("/api/payment-schedules/99999/approve")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_programacion_procesar_inexistente() -> None:
    """Debe retornar 404 al procesar inexistente."""
    async with await _cliente_auth() as c:
        resp = await c.post("/api/payment-schedules/99999/process")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_programacion_cancelar_inexistente() -> None:
    """Debe retornar 404 al cancelar inexistente."""
    async with await _cliente_auth() as c:
        resp = await c.post("/api/payment-schedules/99999/cancel")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_programacion_sin_auth() -> None:
    """Debe retornar 401 sin autenticación."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.get("/api/payment-schedules/")
    assert resp.status_code == 401
