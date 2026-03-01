"""Tests para SST / incidentes de seguridad."""

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
async def test_sst_listar_incidentes() -> None:
    """Debe retornar lista paginada de incidentes."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/sst/incidents")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert "pagination" in datos


@pytest.mark.asyncio
async def test_sst_listar_filtro_severidad() -> None:
    """Debe filtrar incidentes por severidad."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/sst/incidents?severidad=LEVE")
    assert resp.status_code == 200
    assert resp.json()["success"] is True


@pytest.mark.asyncio
async def test_sst_listar_filtro_estado() -> None:
    """Debe filtrar incidentes por estado."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/sst/incidents?estado=ABIERTO")
    assert resp.status_code == 200
    assert resp.json()["success"] is True


@pytest.mark.asyncio
async def test_sst_crear_incidente() -> None:
    """Debe crear un nuevo incidente."""
    async with await _cliente_auth() as c:
        resp = await c.post(
            "/api/sst/incidents",
            json={
                "fecha_incidente": "2026-03-01T10:00:00",
                "tipo_incidente": "CAIDA",
                "severidad": "LEVE",
                "ubicacion": "Zona A",
                "descripcion": "Incidente de prueba",
            },
        )
    assert resp.status_code == 201
    datos = resp.json()
    assert datos["success"] is True
    assert "id" in datos["data"]


@pytest.mark.asyncio
async def test_sst_obtener_incidente_inexistente() -> None:
    """Debe retornar 404 para incidente inexistente."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/sst/incidents/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_sst_actualizar_incidente_inexistente() -> None:
    """Debe retornar 404 al actualizar incidente inexistente."""
    async with await _cliente_auth() as c:
        resp = await c.put(
            "/api/sst/incidents/99999",
            json={"severidad": "GRAVE"},
        )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_sst_eliminar_incidente_inexistente() -> None:
    """Debe retornar 404 al eliminar incidente inexistente."""
    async with await _cliente_auth() as c:
        resp = await c.delete("/api/sst/incidents/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_sst_sin_auth() -> None:
    """Debe retornar 401 sin autenticación."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.get("/api/sst/incidents")
    assert resp.status_code == 401
