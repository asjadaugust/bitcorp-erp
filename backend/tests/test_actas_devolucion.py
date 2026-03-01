"""Tests para actas de devolución."""

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


async def _crear_equipo(c: AsyncClient, codigo: str) -> int:
    resp = await c.post("/api/equipment/", json={"codigo_equipo": codigo})
    return resp.json()["data"]["id"]


async def _crear_acta(c: AsyncClient, equipo_id: int, **kwargs: object) -> dict[str, object]:
    payload: dict[str, object] = {
        "equipo_id": equipo_id,
        "fecha_devolucion": "2026-03-20",
        "tipo": "DEVOLUCION",
        "condicion_equipo": "BUENO",
        **kwargs,
    }
    resp = await c.post("/api/actas-devolucion/", json=payload)
    return resp.json()


# ─── Listar ──────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_listar_actas() -> None:
    async with await _cliente_auth() as c:
        resp = await c.get("/api/actas-devolucion/")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert "pagination" in datos


# ─── CRUD ────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_crear_acta() -> None:
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"ADV-EQ-{_TS}-01")
        r = await _crear_acta(c, eq_id)
    assert r["success"] is True
    assert r["data"]["id"] > 0


@pytest.mark.asyncio
async def test_obtener_acta() -> None:
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"ADV-EQ-{_TS}-02")
        r = await _crear_acta(c, eq_id)
        acta_id = r["data"]["id"]
        resp = await c.get(f"/api/actas-devolucion/{acta_id}")
    assert resp.status_code == 200
    datos = resp.json()["data"]
    assert datos["codigo"].startswith("ADV-")
    assert datos["estado"] == "BORRADOR"


@pytest.mark.asyncio
async def test_actualizar_acta() -> None:
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"ADV-EQ-{_TS}-03")
        r = await _crear_acta(c, eq_id)
        acta_id = r["data"]["id"]
        resp = await c.put(
            f"/api/actas-devolucion/{acta_id}",
            json={"condicion_equipo": "REGULAR", "observaciones": "Desgaste normal"},
        )
    assert resp.status_code == 200
    assert resp.json()["data"]["condicion_equipo"] == "REGULAR"


# ─── State transitions ──────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_firmar_acta() -> None:
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"ADV-EQ-{_TS}-04")
        r = await _crear_acta(c, eq_id)
        acta_id = r["data"]["id"]
        resp = await c.post(f"/api/actas-devolucion/{acta_id}/firmar")
    assert resp.status_code == 200
    assert resp.json()["data"]["estado"] == "FIRMADO"


@pytest.mark.asyncio
async def test_anular_acta() -> None:
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"ADV-EQ-{_TS}-05")
        r = await _crear_acta(c, eq_id)
        acta_id = r["data"]["id"]
        resp = await c.post(f"/api/actas-devolucion/{acta_id}/anular")
    assert resp.status_code == 200
    assert resp.json()["data"]["estado"] == "ANULADO"
