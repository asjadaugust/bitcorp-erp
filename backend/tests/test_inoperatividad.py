"""Tests para períodos de inoperatividad."""

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


async def _crear_periodo(c: AsyncClient, equipo_id: int, **kwargs: object) -> dict[str, object]:
    payload: dict[str, object] = {
        "equipo_id": equipo_id,
        "fecha_inicio": "2026-02-01",
        "motivo": "Falla mecánica en motor",
        "dias_plazo": 5,
        **kwargs,
    }
    resp = await c.post("/api/periodos-inoperatividad/", json=payload)
    return resp.json()


# ─── Listar ──────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_listar_periodos() -> None:
    async with await _cliente_auth() as c:
        resp = await c.get("/api/periodos-inoperatividad/")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert "pagination" in datos


@pytest.mark.asyncio
async def test_listar_periodos_filtro_estado() -> None:
    async with await _cliente_auth() as c:
        resp = await c.get("/api/periodos-inoperatividad/?estado=ACTIVO")
    assert resp.status_code == 200
    assert resp.json()["success"] is True


# ─── CRUD ────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_crear_periodo() -> None:
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"IN-EQ-{_TS}-01")
        r = await _crear_periodo(c, eq_id)
    assert r["success"] is True
    assert r["data"]["id"] > 0


@pytest.mark.asyncio
async def test_obtener_periodo() -> None:
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"IN-EQ-{_TS}-02")
        r = await _crear_periodo(c, eq_id)
        per_id = r["data"]["id"]
        resp = await c.get(f"/api/periodos-inoperatividad/{per_id}")
    assert resp.status_code == 200
    datos = resp.json()["data"]
    assert datos["estado"] == "ACTIVO"
    assert datos["motivo"] == "Falla mecánica en motor"


# ─── By Equipment ───────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_listar_por_equipo() -> None:
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"IN-EQ-{_TS}-03")
        await _crear_periodo(c, eq_id)
        resp = await c.get(f"/api/periodos-inoperatividad/equipo/{eq_id}")
    assert resp.status_code == 200
    assert len(resp.json()["data"]) >= 1


# ─── State transitions ──────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_resolver_periodo() -> None:
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"IN-EQ-{_TS}-04")
        r = await _crear_periodo(c, eq_id)
        per_id = r["data"]["id"]
        resp = await c.post(
            f"/api/periodos-inoperatividad/{per_id}/resolver",
            json={"fecha_fin": "2026-02-04"},
        )
    assert resp.status_code == 200
    assert resp.json()["data"]["estado"] == "RESUELTO"


@pytest.mark.asyncio
async def test_aplicar_penalidad() -> None:
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"IN-EQ-{_TS}-05")
        r = await _crear_periodo(c, eq_id, fecha_inicio="2026-01-01", dias_plazo=5)
        per_id = r["data"]["id"]
        # First resolve with a date exceeding plazo (>5 days)
        await c.post(
            f"/api/periodos-inoperatividad/{per_id}/resolver",
            json={"fecha_fin": "2026-01-10"},
        )
        resp = await c.post(
            f"/api/periodos-inoperatividad/{per_id}/penalidad",
            json={"monto_penalidad": 2500.0, "observaciones_penalidad": "Excedió plazo"},
        )
    assert resp.status_code == 200
    datos = resp.json()["data"]
    assert datos["penalidad_aplicada"] is True
    assert datos["monto_penalidad"] == 2500.0


@pytest.mark.asyncio
async def test_inoperatividad_sin_auth() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.get("/api/periodos-inoperatividad/")
    assert resp.status_code == 401
