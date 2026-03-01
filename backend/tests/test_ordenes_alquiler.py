"""Tests para órdenes de alquiler."""

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


async def _crear_proveedor(c: AsyncClient, ruc: str) -> int:
    resp = await c.post(
        "/api/providers/",
        json={"ruc": ruc, "razon_social": f"Prov OAL {ruc}"},
    )
    return resp.json()["data"]["id"]


async def _crear_orden(c: AsyncClient, prov_id: int, **kwargs: object) -> dict[str, object]:
    payload: dict[str, object] = {
        "proveedor_id": prov_id,
        "descripcion_equipo": "Excavadora CAT 320D",
        "fecha_orden": "2026-03-15",
        "tarifa_acordada": 250.0,
        **kwargs,
    }
    resp = await c.post("/api/ordenes-alquiler/", json=payload)
    return resp.json()


# ─── Listar ──────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_listar_ordenes() -> None:
    async with await _cliente_auth() as c:
        resp = await c.get("/api/ordenes-alquiler/")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert "pagination" in datos


# ─── CRUD ────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_crear_orden() -> None:
    async with await _cliente_auth() as c:
        prov_id = await _crear_proveedor(c, f"40{_TS}001")
        r = await _crear_orden(c, prov_id)
    assert r["success"] is True
    assert r["data"]["id"] > 0


@pytest.mark.asyncio
async def test_obtener_orden() -> None:
    async with await _cliente_auth() as c:
        prov_id = await _crear_proveedor(c, f"40{_TS}002")
        r = await _crear_orden(c, prov_id)
        orden_id = r["data"]["id"]
        resp = await c.get(f"/api/ordenes-alquiler/{orden_id}")
    assert resp.status_code == 200
    datos = resp.json()["data"]
    assert datos["codigo"].startswith("OAL-")
    assert datos["estado"] == "BORRADOR"


@pytest.mark.asyncio
async def test_actualizar_orden() -> None:
    async with await _cliente_auth() as c:
        prov_id = await _crear_proveedor(c, f"40{_TS}003")
        r = await _crear_orden(c, prov_id)
        orden_id = r["data"]["id"]
        resp = await c.put(
            f"/api/ordenes-alquiler/{orden_id}",
            json={"tarifa_acordada": 300.0},
        )
    assert resp.status_code == 200
    assert resp.json()["data"]["tarifa_acordada"] == 300.0


# ─── State transitions ──────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_enviar_orden() -> None:
    async with await _cliente_auth() as c:
        prov_id = await _crear_proveedor(c, f"40{_TS}004")
        r = await _crear_orden(c, prov_id)
        orden_id = r["data"]["id"]
        resp = await c.post(
            f"/api/ordenes-alquiler/{orden_id}/enviar",
            json={"enviado_a": "proveedor@test.com"},
        )
    assert resp.status_code == 200
    assert resp.json()["data"]["estado"] == "ENVIADO"


@pytest.mark.asyncio
async def test_confirmar_orden() -> None:
    async with await _cliente_auth() as c:
        prov_id = await _crear_proveedor(c, f"40{_TS}005")
        r = await _crear_orden(c, prov_id)
        orden_id = r["data"]["id"]
        await c.post(
            f"/api/ordenes-alquiler/{orden_id}/enviar",
            json={"enviado_a": "prov@test.com"},
        )
        resp = await c.post(
            f"/api/ordenes-alquiler/{orden_id}/confirmar",
            json={"confirmado_por": "Representante Legal"},
        )
    assert resp.status_code == 200
    assert resp.json()["data"]["estado"] == "CONFIRMADO"


@pytest.mark.asyncio
async def test_cancelar_orden() -> None:
    async with await _cliente_auth() as c:
        prov_id = await _crear_proveedor(c, f"40{_TS}006")
        r = await _crear_orden(c, prov_id)
        orden_id = r["data"]["id"]
        resp = await c.post(
            f"/api/ordenes-alquiler/{orden_id}/cancelar",
            json={"motivo_cancelacion": "Cambio de proveedor"},
        )
    assert resp.status_code == 200
    assert resp.json()["data"]["estado"] == "CANCELADO"
