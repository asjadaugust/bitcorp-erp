"""Tests para tipos de equipo."""

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
async def test_listar_tipos() -> None:
    """Debe retornar lista de tipos activos."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/tipos-equipo/")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert len(datos["data"]) > 0
    tipo = datos["data"][0]
    for campo in ["id", "codigo", "nombre", "categoria_prd", "activo"]:
        assert campo in tipo


@pytest.mark.asyncio
async def test_listar_agrupados() -> None:
    """Debe retornar tipos agrupados por categoría."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/tipos-equipo/agrupados")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert len(datos["data"]) > 0
    grupo = datos["data"][0]
    assert "categoria_prd" in grupo
    assert "label" in grupo
    assert "tipos" in grupo


@pytest.mark.asyncio
async def test_listar_por_categoria() -> None:
    """Debe retornar tipos filtrados por categoría."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/tipos-equipo/categoria/MAQUINARIA_PESADA")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    for tipo in datos["data"]:
        assert tipo["categoria_prd"] == "MAQUINARIA_PESADA"


@pytest.mark.asyncio
async def test_obtener_tipo_por_id() -> None:
    """Debe retornar tipo por ID."""
    async with await _cliente_auth() as c:
        lista = await c.get("/api/tipos-equipo/")
        tipo_id = lista.json()["data"][0]["id"]
        resp = await c.get(f"/api/tipos-equipo/{tipo_id}")
    assert resp.status_code == 200
    assert resp.json()["data"]["id"] == tipo_id


@pytest.mark.asyncio
async def test_tipo_inexistente() -> None:
    """Debe retornar 404 para tipo inexistente."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/tipos-equipo/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_tipos_sin_auth() -> None:
    """Debe retornar 401 sin token."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.get("/api/tipos-equipo/")
    assert resp.status_code == 401
