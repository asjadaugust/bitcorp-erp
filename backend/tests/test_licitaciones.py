"""Tests para licitaciones."""

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
async def test_licitaciones_listar() -> None:
    """Debe retornar lista paginada de licitaciones."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/tenders/")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert "pagination" in datos


@pytest.mark.asyncio
async def test_licitaciones_listar_filtro_estado() -> None:
    """Debe filtrar licitaciones por estado."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/tenders/?estado=PUBLICADO")
    assert resp.status_code == 200
    assert resp.json()["success"] is True


@pytest.mark.asyncio
async def test_licitaciones_crear() -> None:
    """Debe crear una nueva licitación."""
    async with await _cliente_auth() as c:
        resp = await c.post(
            "/api/tenders/",
            json={
                "codigo": f"LIC-T-{uuid4().hex[:8]}",
                "nombre": f"Licitación de Prueba {uuid4().hex[:6]}",
                "entidad_convocante": "Entidad Test",
                "monto_referencial": 100000.00,
            },
        )
    assert resp.status_code == 201
    datos = resp.json()
    assert datos["success"] is True
    assert "id" in datos["data"]


@pytest.mark.asyncio
async def test_licitaciones_crear_codigo_duplicado() -> None:
    """Debe retornar 409 para código duplicado."""
    async with await _cliente_auth() as c:
        dup_code = f"LIC-D-{uuid4().hex[:8]}"
        payload = {"codigo": dup_code, "nombre": "Lic Dup"}
        await c.post("/api/tenders/", json=payload)
        resp = await c.post("/api/tenders/", json=payload)
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_licitaciones_obtener_inexistente() -> None:
    """Debe retornar 404 para licitación inexistente."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/tenders/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_licitaciones_transicion_valida() -> None:
    """Debe permitir transición PUBLICADO -> EVALUACION."""
    async with await _cliente_auth() as c:
        resp_crear = await c.post(
            "/api/tenders/",
            json={"codigo": f"LIC-T-{uuid4().hex[:8]}", "nombre": "Lic Trans"},
        )
        lid = resp_crear.json()["data"]["id"]
        resp = await c.post(
            f"/api/tenders/{lid}/transition",
            json={"nuevo_estado": "EVALUACION"},
        )
    assert resp.status_code == 200
    assert resp.json()["data"]["estado"] == "EVALUACION"


@pytest.mark.asyncio
async def test_licitaciones_transicion_invalida() -> None:
    """Debe retornar 422 para transición inválida."""
    async with await _cliente_auth() as c:
        resp_crear = await c.post(
            "/api/tenders/",
            json={"codigo": f"LIC-T-{uuid4().hex[:8]}", "nombre": "Lic Trans 2"},
        )
        lid = resp_crear.json()["data"]["id"]
        # Can't go directly from PUBLICADO to ADJUDICADO
        resp = await c.post(
            f"/api/tenders/{lid}/transition",
            json={"nuevo_estado": "ADJUDICADO"},
        )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_licitaciones_sin_auth() -> None:
    """Debe retornar 401 sin autenticación."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.get("/api/tenders/")
    assert resp.status_code == 401
