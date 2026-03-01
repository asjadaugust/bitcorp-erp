"""Tests para vales de combustible."""

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


async def _crear_vale(
    c: AsyncClient, equipo_id: int, numero: str, **kwargs: object,
) -> dict[str, object]:
    payload: dict[str, object] = {
        "equipo_id": equipo_id,
        "fecha": "2026-03-15",
        "numero_vale": numero,
        "tipo_combustible": "DIESEL",
        "cantidad_galones": 50.0,
        "precio_unitario": 12.50,
        **kwargs,
    }
    resp = await c.post("/api/vales-combustible/", json=payload)
    return resp.json()


# ─── Listar ──────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_listar_vales() -> None:
    async with await _cliente_auth() as c:
        resp = await c.get("/api/vales-combustible/")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert "pagination" in datos


@pytest.mark.asyncio
async def test_listar_vales_filtro_tipo() -> None:
    async with await _cliente_auth() as c:
        resp = await c.get("/api/vales-combustible/?tipo_combustible=DIESEL")
    assert resp.status_code == 200
    assert resp.json()["success"] is True


# ─── CRUD ────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_crear_vale() -> None:
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"VC-EQ-{_TS}-01")
        r = await _crear_vale(c, eq_id, f"V{_TS}01")
    assert r["success"] is True
    assert r["data"]["id"] > 0


@pytest.mark.asyncio
async def test_obtener_vale() -> None:
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"VC-EQ-{_TS}-02")
        r = await _crear_vale(c, eq_id, f"V{_TS}02")
        vale_id = r["data"]["id"]
        resp = await c.get(f"/api/vales-combustible/{vale_id}")
    assert resp.status_code == 200
    datos = resp.json()["data"]
    assert datos["codigo"].startswith("VCB-")
    assert datos["estado"] == "PENDIENTE"


@pytest.mark.asyncio
async def test_vale_inexistente() -> None:
    async with await _cliente_auth() as c:
        resp = await c.get("/api/vales-combustible/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_actualizar_vale() -> None:
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"VC-EQ-{_TS}-03")
        r = await _crear_vale(c, eq_id, f"V{_TS}03")
        vale_id = r["data"]["id"]
        resp = await c.put(
            f"/api/vales-combustible/{vale_id}",
            json={"cantidad_galones": 75.0, "proveedor": "Repsol"},
        )
    assert resp.status_code == 200
    assert resp.json()["data"]["proveedor"] == "Repsol"


# ─── By Equipment ───────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_listar_por_equipo() -> None:
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"VC-EQ-{_TS}-04")
        await _crear_vale(c, eq_id, f"V{_TS}04")
        resp = await c.get(f"/api/vales-combustible/equipo/{eq_id}")
    assert resp.status_code == 200
    assert len(resp.json()["data"]) >= 1


# ─── State transitions ──────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_registrar_vale() -> None:
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"VC-EQ-{_TS}-05")
        r = await _crear_vale(c, eq_id, f"V{_TS}05")
        vale_id = r["data"]["id"]
        resp = await c.post(f"/api/vales-combustible/{vale_id}/registrar")
    assert resp.status_code == 200
    assert resp.json()["data"]["estado"] == "REGISTRADO"


@pytest.mark.asyncio
async def test_anular_vale() -> None:
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"VC-EQ-{_TS}-06")
        r = await _crear_vale(c, eq_id, f"V{_TS}06")
        vale_id = r["data"]["id"]
        resp = await c.post(f"/api/vales-combustible/{vale_id}/anular")
    assert resp.status_code == 200
    assert resp.json()["data"]["estado"] == "ANULADO"
