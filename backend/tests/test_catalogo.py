"""Tests para catálogos SUNAT."""

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
async def test_tipos_medio_pago_listar() -> None:
    """Debe retornar lista de tipos de medio de pago."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/catalog/tipos-medio-pago")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    items = datos["data"]
    assert isinstance(items, list)
    assert len(items) >= 8
    for item in items:
        assert "id" in item
        assert "codigo" in item
        assert "nombre" in item
        assert "is_active" in item


@pytest.mark.asyncio
async def test_unidades_medida_listar() -> None:
    """Debe retornar lista de unidades de medida."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/catalog/unidades-medida")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    items = datos["data"]
    assert isinstance(items, list)
    assert len(items) >= 42
    for item in items:
        assert "id" in item
        assert "codigo" in item
        assert "nombre" in item
        assert "abreviatura" in item
        assert "is_active" in item


@pytest.mark.asyncio
async def test_tipos_comprobante_listar() -> None:
    """Debe retornar lista de tipos de comprobante."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/catalog/tipos-comprobante")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    items = datos["data"]
    assert isinstance(items, list)
    assert len(items) >= 11
    for item in items:
        assert "id" in item
        assert "codigo" in item
        assert "nombre" in item
        assert "is_active" in item


@pytest.mark.asyncio
async def test_tipos_operacion_listar() -> None:
    """Debe retornar lista de tipos de operación."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/catalog/tipos-operacion")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    items = datos["data"]
    assert isinstance(items, list)
    assert len(items) >= 16
    for item in items:
        assert "id" in item
        assert "codigo" in item
        assert "nombre" in item
        assert "ingreso_salida" in item
        assert "is_active" in item


@pytest.mark.asyncio
async def test_catalogo_sin_auth() -> None:
    """Debe retornar 401 sin autenticación."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.get("/api/catalog/tipos-medio-pago")
    assert resp.status_code == 401
