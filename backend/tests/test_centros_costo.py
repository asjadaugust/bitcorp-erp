"""Tests para centros de costo y usuarios."""

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
async def test_centros_costo_listar() -> None:
    """Debe retornar lista paginada."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/admin/cost-centers/")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert "pagination" in datos
    pag = datos["pagination"]
    for campo in ["page", "limit", "total", "total_pages"]:
        assert campo in pag


@pytest.mark.asyncio
async def test_centros_costo_contar() -> None:
    """Debe retornar conteo de activos."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/admin/cost-centers/count")
    assert resp.status_code == 200
    assert isinstance(resp.json()["data"]["count"], int)


@pytest.mark.asyncio
async def test_centros_costo_inexistente() -> None:
    """Debe retornar 404 para ID inexistente."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/admin/cost-centers/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_centros_costo_sin_auth() -> None:
    """Debe retornar 401 sin auth."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.get("/api/admin/cost-centers/")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_usuarios_listar() -> None:
    """Debe retornar lista paginada de usuarios."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/users/")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert "pagination" in datos


@pytest.mark.asyncio
async def test_usuarios_buscar() -> None:
    """Debe permitir búsqueda."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/users/search?q=admin")
    assert resp.status_code == 200
    assert resp.json()["success"] is True


@pytest.mark.asyncio
async def test_roles_listar() -> None:
    """Debe retornar roles disponibles."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/users/roles")
    assert resp.status_code == 200
    datos = resp.json()
    assert len(datos["data"]) > 0
    rol = datos["data"][0]
    for campo in ["id", "codigo", "nombre"]:
        assert campo in rol


@pytest.mark.asyncio
async def test_usuarios_sin_auth() -> None:
    """Debe retornar 401 sin auth."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.get("/api/users/")
    assert resp.status_code == 401
