"""Tests para proyectos (EDT)."""

from uuid import uuid4

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
async def test_proyectos_listar() -> None:
    """Debe retornar lista paginada de proyectos."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/projects/")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert "pagination" in datos


@pytest.mark.asyncio
async def test_proyectos_listar_filtro_estado() -> None:
    """Debe filtrar proyectos por estado."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/projects/?estado=PLANIFICACION")
    assert resp.status_code == 200
    assert resp.json()["success"] is True


@pytest.mark.asyncio
async def test_proyectos_listar_busqueda() -> None:
    """Debe buscar proyectos por nombre o código."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/projects/?search=test")
    assert resp.status_code == 200
    assert resp.json()["success"] is True


@pytest.mark.asyncio
async def test_proyectos_crear() -> None:
    """Debe crear un nuevo proyecto."""
    async with await _cliente_auth() as c:
        resp = await c.post(
            "/api/projects/",
            json={
                "codigo": f"PRY-T-{uuid4().hex[:8]}",
                "nombre": f"Proyecto Test {uuid4().hex[:6]}",
                "estado": "PLANIFICACION",
            },
        )
    assert resp.status_code == 201
    datos = resp.json()
    assert datos["success"] is True
    assert "id" in datos["data"]


@pytest.mark.asyncio
async def test_proyectos_crear_codigo_duplicado() -> None:
    """Debe retornar 409 para código duplicado."""
    async with await _cliente_auth() as c:
        payload = {
            "codigo": f"PRY-D-{uuid4().hex[:8]}",
            "nombre": "Proyecto Dup",
        }
        await c.post("/api/projects/", json=payload)
        resp = await c.post("/api/projects/", json=payload)
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_proyectos_obtener_inexistente() -> None:
    """Debe retornar 404 para proyecto inexistente."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/projects/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_proyectos_estadisticas() -> None:
    """Debe retornar estadísticas del proyecto."""
    async with await _cliente_auth() as c:
        # Crear proyecto primero
        resp_crear = await c.post(
            "/api/projects/",
            json={"codigo": f"PRY-S-{uuid4().hex[:8]}", "nombre": "Proyecto Stats"},
        )
        pid = resp_crear.json()["data"]["id"]
        resp = await c.get(f"/api/projects/{pid}/stats")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert datos["data"]["proyecto_id"] == pid


@pytest.mark.asyncio
async def test_proyectos_sin_auth() -> None:
    """Debe retornar 401 sin autenticación."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.get("/api/projects/")
    assert resp.status_code == 401
