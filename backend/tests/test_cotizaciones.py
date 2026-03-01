"""Tests para cotizaciones de proveedor."""

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


async def _crear_solicitud(c: AsyncClient) -> int:
    resp = await c.post(
        "/api/solicitudes-equipo/",
        json={
            "tipo_equipo": "Excavadora",
            "cantidad": 1,
            "fecha_requerida": "2026-06-01",
            "prioridad": "ALTA",
        },
    )
    return resp.json()["data"]["id"]


async def _crear_proveedor(c: AsyncClient, ruc: str) -> int:
    resp = await c.post(
        "/api/providers/",
        json={"ruc": ruc, "razon_social": f"Prov {ruc}"},
    )
    return resp.json()["data"]["id"]


async def _crear_cotizacion(
    c: AsyncClient, sol_id: int, prov_id: int, tarifa: float = 150.0
) -> dict[str, object]:
    resp = await c.post(
        "/api/cotizaciones/",
        json={
            "solicitud_equipo_id": sol_id,
            "proveedor_id": prov_id,
            "tarifa_propuesta": tarifa,
            "tipo_tarifa": "HORA",
        },
    )
    return resp.json()


# ─── Listar ──────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_listar_cotizaciones() -> None:
    async with await _cliente_auth() as c:
        resp = await c.get("/api/cotizaciones/")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert "pagination" in datos


# ─── CRUD ────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_crear_cotizacion() -> None:
    async with await _cliente_auth() as c:
        sol_id = await _crear_solicitud(c)
        prov_id = await _crear_proveedor(c, f"30{_TS}001")
        r = await _crear_cotizacion(c, sol_id, prov_id)
    assert r["success"] is True
    assert r["data"]["id"] > 0


@pytest.mark.asyncio
async def test_obtener_cotizacion() -> None:
    async with await _cliente_auth() as c:
        sol_id = await _crear_solicitud(c)
        prov_id = await _crear_proveedor(c, f"30{_TS}002")
        r = await _crear_cotizacion(c, sol_id, prov_id)
        cot_id = r["data"]["id"]
        resp = await c.get(f"/api/cotizaciones/{cot_id}")
    assert resp.status_code == 200
    assert resp.json()["data"]["codigo"].startswith("COT-")


@pytest.mark.asyncio
async def test_actualizar_cotizacion() -> None:
    async with await _cliente_auth() as c:
        sol_id = await _crear_solicitud(c)
        prov_id = await _crear_proveedor(c, f"30{_TS}003")
        r = await _crear_cotizacion(c, sol_id, prov_id)
        cot_id = r["data"]["id"]
        resp = await c.put(
            f"/api/cotizaciones/{cot_id}",
            json={"tarifa_propuesta": 200.0},
        )
    assert resp.status_code == 200
    assert resp.json()["data"]["tarifa_propuesta"] == 200.0


# ─── State transitions ──────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_evaluar_cotizacion() -> None:
    async with await _cliente_auth() as c:
        sol_id = await _crear_solicitud(c)
        prov_id = await _crear_proveedor(c, f"30{_TS}004")
        r = await _crear_cotizacion(c, sol_id, prov_id)
        cot_id = r["data"]["id"]
        resp = await c.put(
            f"/api/cotizaciones/{cot_id}/evaluar",
            json={"puntaje": 85},
        )
    assert resp.status_code == 200
    assert resp.json()["data"]["estado"] == "EVALUADA"
    assert resp.json()["data"]["puntaje"] == 85


@pytest.mark.asyncio
async def test_seleccionar_requiere_minimo_2_cotizaciones() -> None:
    """Min 2 quotes rule: selecting with only 1 quote should fail."""
    async with await _cliente_auth() as c:
        sol_id = await _crear_solicitud(c)
        prov_id = await _crear_proveedor(c, f"30{_TS}005")
        r = await _crear_cotizacion(c, sol_id, prov_id)
        cot_id = r["data"]["id"]
        # Evaluar first
        await c.put(f"/api/cotizaciones/{cot_id}/evaluar", json={"puntaje": 90})
        # Try selecting with only 1 quote
        resp = await c.put(f"/api/cotizaciones/{cot_id}/seleccionar", json={})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_rechazar_cotizacion() -> None:
    async with await _cliente_auth() as c:
        sol_id = await _crear_solicitud(c)
        prov_id = await _crear_proveedor(c, f"30{_TS}006")
        r = await _crear_cotizacion(c, sol_id, prov_id)
        cot_id = r["data"]["id"]
        resp = await c.put(f"/api/cotizaciones/{cot_id}/rechazar")
    assert resp.status_code == 200
    assert resp.json()["data"]["estado"] == "RECHAZADA"


# ─── Auth ────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_cotizaciones_sin_auth() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.get("/api/cotizaciones/")
    assert resp.status_code == 401
