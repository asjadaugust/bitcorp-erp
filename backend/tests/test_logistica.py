"""Tests para logística / inventario."""

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
async def test_logistica_listar_productos() -> None:
    """Debe retornar lista paginada de productos."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/logistics/products")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert "pagination" in datos


@pytest.mark.asyncio
async def test_logistica_listar_productos_busqueda() -> None:
    """Debe buscar productos por nombre o código."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/logistics/products?search=test")
    assert resp.status_code == 200
    assert resp.json()["success"] is True


@pytest.mark.asyncio
async def test_logistica_listar_productos_categoria() -> None:
    """Debe filtrar productos por categoría."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/logistics/products?categoria=HERRAMIENTAS")
    assert resp.status_code == 200
    assert resp.json()["success"] is True


@pytest.mark.asyncio
async def test_logistica_obtener_producto_inexistente() -> None:
    """Debe retornar 404 para producto inexistente."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/logistics/products/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_logistica_listar_movimientos() -> None:
    """Debe retornar lista paginada de movimientos."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/logistics/movements")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert "pagination" in datos


@pytest.mark.asyncio
async def test_logistica_listar_movimientos_filtro_tipo() -> None:
    """Debe filtrar movimientos por tipo."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/logistics/movements?tipo=entrada")
    assert resp.status_code == 200
    assert resp.json()["success"] is True


@pytest.mark.asyncio
async def test_logistica_crear_movimiento() -> None:
    """Debe crear un nuevo movimiento."""
    async with await _cliente_auth() as c:
        resp = await c.post(
            "/api/logistics/movements",
            json={
                "tipo_movimiento": "entrada",
                "fecha": "2026-03-01",
                "numero_documento": "MOV-001",
                "observaciones": "Ingreso de materiales",
            },
        )
    assert resp.status_code == 201
    datos = resp.json()
    assert datos["success"] is True
    assert "id" in datos["data"]


@pytest.mark.asyncio
async def test_logistica_obtener_movimiento_inexistente() -> None:
    """Debe retornar 404 para movimiento inexistente."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/logistics/movements/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_logistica_stock() -> None:
    """Debe retornar resumen de stock."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/logistics/stock")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert isinstance(datos["data"], list)


@pytest.mark.asyncio
async def test_logistica_sin_auth() -> None:
    """Debe retornar 401 sin autenticación."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.get("/api/logistics/products")
    assert resp.status_code == 401
