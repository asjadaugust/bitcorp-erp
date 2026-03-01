"""Tests para solicitudes de equipo."""

import time

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from tests.conftest import obtener_token_admin

_TS = str(int(time.time()))[-6:]


async def _cliente_auth() -> AsyncClient:
    token = await obtener_token_admin()
    c = AsyncClient(transport=ASGITransport(app=app), base_url="http://test")
    c.headers["Authorization"] = f"Bearer {token}"
    return c


async def _crear_solicitud(c: AsyncClient, **kwargs: object) -> dict[str, object]:
    payload: dict[str, object] = {
        "tipo_equipo": "Excavadora 320D",
        "cantidad": 1,
        "fecha_requerida": "2026-06-01",
        "prioridad": "MEDIA",
        **kwargs,
    }
    resp = await c.post("/api/solicitudes-equipo/", json=payload)
    return resp.json()


# ─── Listar ──────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_listar_solicitudes() -> None:
    async with await _cliente_auth() as c:
        resp = await c.get("/api/solicitudes-equipo/")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert "pagination" in datos


# ─── CRUD ────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_crear_solicitud() -> None:
    async with await _cliente_auth() as c:
        r = await _crear_solicitud(c)
    assert r["success"] is True
    assert r["data"]["id"] > 0


@pytest.mark.asyncio
async def test_obtener_solicitud() -> None:
    async with await _cliente_auth() as c:
        r = await _crear_solicitud(c)
        sol_id = r["data"]["id"]
        resp = await c.get(f"/api/solicitudes-equipo/{sol_id}")
    assert resp.status_code == 200
    datos = resp.json()["data"]
    assert datos["codigo"].startswith("SEQ-")
    assert datos["estado"] == "BORRADOR"


@pytest.mark.asyncio
async def test_solicitud_inexistente() -> None:
    async with await _cliente_auth() as c:
        resp = await c.get("/api/solicitudes-equipo/99999")
    assert resp.status_code == 404


# ─── State transitions ──────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_enviar_solicitud() -> None:
    async with await _cliente_auth() as c:
        r = await _crear_solicitud(c)
        sol_id = r["data"]["id"]
        resp = await c.post(f"/api/solicitudes-equipo/{sol_id}/enviar")
    assert resp.status_code == 200
    assert resp.json()["data"]["estado"] == "ENVIADO"


@pytest.mark.asyncio
async def test_aprobar_solicitud() -> None:
    async with await _cliente_auth() as c:
        r = await _crear_solicitud(c)
        sol_id = r["data"]["id"]
        await c.post(f"/api/solicitudes-equipo/{sol_id}/enviar")
        resp = await c.post(f"/api/solicitudes-equipo/{sol_id}/aprobar")
    assert resp.status_code == 200
    assert resp.json()["data"]["estado"] == "APROBADO"


@pytest.mark.asyncio
async def test_rechazar_solicitud() -> None:
    async with await _cliente_auth() as c:
        r = await _crear_solicitud(c)
        sol_id = r["data"]["id"]
        await c.post(f"/api/solicitudes-equipo/{sol_id}/enviar")
        resp = await c.post(f"/api/solicitudes-equipo/{sol_id}/rechazar")
    assert resp.status_code == 200
    assert resp.json()["data"]["estado"] == "RECHAZADO"
