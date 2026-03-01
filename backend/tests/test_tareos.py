"""Tests para tareos (timesheets)."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from tests.conftest import obtener_token_admin


async def _cliente_auth() -> AsyncClient:
    token = await obtener_token_admin()
    c = AsyncClient(transport=ASGITransport(app=app), base_url="http://test")
    c.headers["Authorization"] = f"Bearer {token}"
    return c


async def _crear_tareo(c: AsyncClient) -> int:
    """Helper: crear un tareo y retornar su ID."""
    # Need a valid trabajador_id — get one from employees list
    resp_emp = await c.get("/api/operators/")
    emp_data = resp_emp.json()
    trabajador_id = 1
    if emp_data.get("data") and len(emp_data["data"]) > 0:
        trabajador_id = emp_data["data"][0]["id"]

    resp = await c.post(
        "/api/timesheets/",
        json={
            "trabajador_id": trabajador_id,
            "periodo": "2026-03",
            "observaciones": "Tareo de prueba",
        },
    )
    return resp.json()["data"]["id"]


@pytest.mark.asyncio
async def test_tareos_listar() -> None:
    """Debe retornar lista paginada de tareos."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/timesheets/")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert "pagination" in datos


@pytest.mark.asyncio
async def test_tareos_listar_filtro_periodo() -> None:
    """Debe filtrar tareos por periodo."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/timesheets/?periodo=2026-03")
    assert resp.status_code == 200
    assert resp.json()["success"] is True


@pytest.mark.asyncio
async def test_tareos_listar_filtro_estado() -> None:
    """Debe filtrar tareos por estado."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/timesheets/?estado=BORRADOR")
    assert resp.status_code == 200
    assert resp.json()["success"] is True


@pytest.mark.asyncio
async def test_tareos_crear() -> None:
    """Debe crear un nuevo tareo."""
    async with await _cliente_auth() as c:
        tareo_id = await _crear_tareo(c)
    assert tareo_id > 0


@pytest.mark.asyncio
async def test_tareos_obtener_inexistente() -> None:
    """Debe retornar 404 para tareo inexistente."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/timesheets/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_tareos_enviar() -> None:
    """Debe enviar tareo (BORRADOR -> ENVIADO)."""
    async with await _cliente_auth() as c:
        tareo_id = await _crear_tareo(c)
        resp = await c.post(f"/api/timesheets/{tareo_id}/submit")
    assert resp.status_code == 200
    assert resp.json()["data"]["estado"] == "ENVIADO"


@pytest.mark.asyncio
async def test_tareos_aprobar() -> None:
    """Debe aprobar tareo (ENVIADO -> APROBADO)."""
    async with await _cliente_auth() as c:
        tareo_id = await _crear_tareo(c)
        await c.post(f"/api/timesheets/{tareo_id}/submit")
        resp = await c.post(f"/api/timesheets/{tareo_id}/approve")
    assert resp.status_code == 200
    assert resp.json()["data"]["estado"] == "APROBADO"


@pytest.mark.asyncio
async def test_tareos_rechazar_y_reabrir() -> None:
    """Debe rechazar y reabrir tareo."""
    async with await _cliente_auth() as c:
        tareo_id = await _crear_tareo(c)
        await c.post(f"/api/timesheets/{tareo_id}/submit")
        resp_rej = await c.post(f"/api/timesheets/{tareo_id}/reject")
        assert resp_rej.json()["data"]["estado"] == "RECHAZADO"
        resp_reopen = await c.post(f"/api/timesheets/{tareo_id}/reopen")
    assert resp_reopen.status_code == 200
    assert resp_reopen.json()["data"]["estado"] == "BORRADOR"


@pytest.mark.asyncio
async def test_tareos_transicion_invalida() -> None:
    """Debe retornar 422 para transición inválida."""
    async with await _cliente_auth() as c:
        tareo_id = await _crear_tareo(c)
        # Can't approve a BORRADOR directly
        resp = await c.post(f"/api/timesheets/{tareo_id}/approve")
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_tareos_sin_auth() -> None:
    """Debe retornar 401 sin autenticación."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.get("/api/timesheets/")
    assert resp.status_code == 401
