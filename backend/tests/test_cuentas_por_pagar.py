"""Tests para cuentas por pagar."""

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
async def test_cuentas_listar() -> None:
    """Debe retornar lista paginada de cuentas por pagar."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/accounts-payable/")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert "pagination" in datos


@pytest.mark.asyncio
async def test_cuentas_listar_filtro_estado() -> None:
    """Debe filtrar por estado."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/accounts-payable/?estado=PENDIENTE")
    assert resp.status_code == 200
    assert resp.json()["success"] is True


@pytest.mark.asyncio
async def test_cuentas_pendientes() -> None:
    """Debe retornar cuentas pendientes."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/accounts-payable/pending")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert isinstance(datos["data"], list)


@pytest.mark.asyncio
async def test_cuentas_resumen() -> None:
    """Debe retornar resumen de cuentas."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/accounts-payable/summary")
    assert resp.status_code == 200
    d = resp.json()["data"]
    assert "total_pendientes" in d
    assert "saldo_total" in d


@pytest.mark.asyncio
async def test_cuentas_obtener_inexistente() -> None:
    """Debe retornar 404 para cuenta inexistente."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/accounts-payable/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_cuentas_eliminar_inexistente() -> None:
    """Debe retornar 404 al eliminar inexistente."""
    async with await _cliente_auth() as c:
        resp = await c.delete("/api/accounts-payable/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_cuentas_sin_auth() -> None:
    """Debe retornar 401 sin autenticación."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.get("/api/accounts-payable/")
    assert resp.status_code == 401
