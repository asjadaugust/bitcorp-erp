"""Tests para precalentamiento y combustible config."""

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
async def test_precalentamiento_listar() -> None:
    """Debe retornar lista de configuraciones."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/precalentamiento-config/")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert len(datos["data"]) > 0
    config = datos["data"][0]
    for campo in ["id", "tipo_equipo_id", "horas_precalentamiento", "activo"]:
        assert campo in config


@pytest.mark.asyncio
async def test_precalentamiento_por_tipo() -> None:
    """Debe retornar config para tipo de equipo específico."""
    async with await _cliente_auth() as c:
        lista = await c.get("/api/precalentamiento-config/")
        tipo_id = lista.json()["data"][0]["tipo_equipo_id"]
        resp = await c.get(f"/api/precalentamiento-config/tipo-equipo/{tipo_id}")
    assert resp.status_code == 200
    assert resp.json()["data"]["tipo_equipo_id"] == tipo_id


@pytest.mark.asyncio
async def test_precalentamiento_horas() -> None:
    """Debe retornar horas para un tipo."""
    async with await _cliente_auth() as c:
        lista = await c.get("/api/precalentamiento-config/")
        tipo_id = lista.json()["data"][0]["tipo_equipo_id"]
        resp = await c.get(f"/api/precalentamiento-config/tipo-equipo/{tipo_id}/horas")
    assert resp.status_code == 200
    datos = resp.json()
    assert "horas_precalentamiento" in datos["data"]


@pytest.mark.asyncio
async def test_precalentamiento_tipo_inexistente() -> None:
    """Debe retornar null para tipo sin config."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/precalentamiento-config/tipo-equipo/99999")
    assert resp.status_code == 200
    assert resp.json()["data"] is None


@pytest.mark.asyncio
async def test_combustible_obtener() -> None:
    """Debe retornar config de combustible."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/combustible-config/")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    if datos["data"] is not None:
        assert "precio_manipuleo" in datos["data"]


@pytest.mark.asyncio
async def test_combustible_precio() -> None:
    """Debe retornar tarifa de manipuleo."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/combustible-config/precio-manipuleo")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["data"]["precio_manipuleo"] >= 0
