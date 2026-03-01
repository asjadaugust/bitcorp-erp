"""Tests para mantenimiento de equipos."""

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


async def _crear_mantenimiento(
    c: AsyncClient, equipo_id: int, tipo: str = "PREVENTIVO", **kwargs: object
) -> dict[str, object]:
    payload: dict[str, object] = {
        "equipo_id": equipo_id,
        "tipo_mantenimiento": tipo,
        "descripcion": f"Mant {tipo} test",
        "fecha_programada": "2026-04-01",
        **kwargs,
    }
    resp = await c.post("/api/maintenance/", json=payload)
    return resp.json()


# ─── Listar ──────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_listar_mantenimientos() -> None:
    async with await _cliente_auth() as c:
        resp = await c.get("/api/maintenance/")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert "pagination" in datos


@pytest.mark.asyncio
async def test_listar_mantenimientos_filtro_estado() -> None:
    async with await _cliente_auth() as c:
        resp = await c.get("/api/maintenance/?estado=PROGRAMADO")
    assert resp.status_code == 200
    assert resp.json()["success"] is True


@pytest.mark.asyncio
async def test_listar_mantenimientos_filtro_tipo() -> None:
    async with await _cliente_auth() as c:
        resp = await c.get("/api/maintenance/?tipo=PREVENTIVO")
    assert resp.status_code == 200
    assert resp.json()["success"] is True


@pytest.mark.asyncio
async def test_listar_mantenimientos_paginacion() -> None:
    async with await _cliente_auth() as c:
        resp = await c.get("/api/maintenance/?page=1&limit=5")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["pagination"]["page"] == 1
    assert datos["pagination"]["limit"] == 5


# ─── CRUD ────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_crear_mantenimiento_preventivo() -> None:
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"MT-EQ-{_TS}-01")
        r = await _crear_mantenimiento(c, eq_id, "PREVENTIVO")
    assert r["success"] is True
    assert r["data"]["id"] > 0


@pytest.mark.asyncio
async def test_crear_mantenimiento_correctivo() -> None:
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"MT-EQ-{_TS}-02")
        r = await _crear_mantenimiento(c, eq_id, "CORRECTIVO")
    assert r["success"] is True


@pytest.mark.asyncio
async def test_crear_mantenimiento_tipo_invalido() -> None:
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"MT-EQ-{_TS}-03")
        resp = await c.post(
            "/api/maintenance/",
            json={
                "equipo_id": eq_id,
                "tipo_mantenimiento": "INVALIDO",
            },
        )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_obtener_mantenimiento() -> None:
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"MT-EQ-{_TS}-04")
        r = await _crear_mantenimiento(c, eq_id)
        mant_id = r["data"]["id"]
        resp = await c.get(f"/api/maintenance/{mant_id}")
    assert resp.status_code == 200
    assert resp.json()["data"]["tipo_mantenimiento"] == "PREVENTIVO"


@pytest.mark.asyncio
async def test_mantenimiento_inexistente() -> None:
    async with await _cliente_auth() as c:
        resp = await c.get("/api/maintenance/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_actualizar_mantenimiento() -> None:
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"MT-EQ-{_TS}-05")
        r = await _crear_mantenimiento(c, eq_id)
        mant_id = r["data"]["id"]
        resp = await c.put(
            f"/api/maintenance/{mant_id}",
            json={"costo_estimado": 5000.0, "tecnico_responsable": "Carlos"},
        )
    assert resp.status_code == 200
    assert resp.json()["data"]["tecnico_responsable"] == "Carlos"


# ─── Overdue + By Equipment ─────────────────────────────────────────────


@pytest.mark.asyncio
async def test_obtener_vencidos() -> None:
    async with await _cliente_auth() as c:
        resp = await c.get("/api/maintenance/overdue")
    assert resp.status_code == 200
    assert isinstance(resp.json()["data"], list)


@pytest.mark.asyncio
async def test_listar_por_equipo() -> None:
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"MT-EQ-{_TS}-06")
        await _crear_mantenimiento(c, eq_id)
        resp = await c.get(f"/api/maintenance/equipo/{eq_id}")
    assert resp.status_code == 200
    assert len(resp.json()["data"]) >= 1


# ─── State transitions ──────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_iniciar_mantenimiento() -> None:
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"MT-EQ-{_TS}-07")
        r = await _crear_mantenimiento(c, eq_id)
        mant_id = r["data"]["id"]
        resp = await c.post(f"/api/maintenance/{mant_id}/start")
    assert resp.status_code == 200
    assert resp.json()["data"]["estado"] == "EN_PROCESO"


@pytest.mark.asyncio
async def test_completar_mantenimiento() -> None:
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"MT-EQ-{_TS}-08")
        r = await _crear_mantenimiento(c, eq_id)
        mant_id = r["data"]["id"]
        await c.post(f"/api/maintenance/{mant_id}/start")
        resp = await c.post(f"/api/maintenance/{mant_id}/complete")
    assert resp.status_code == 200
    assert resp.json()["data"]["estado"] == "COMPLETADO"


@pytest.mark.asyncio
async def test_cancelar_mantenimiento() -> None:
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"MT-EQ-{_TS}-09")
        r = await _crear_mantenimiento(c, eq_id)
        mant_id = r["data"]["id"]
        resp = await c.post(f"/api/maintenance/{mant_id}/cancel")
    assert resp.status_code == 200
    assert resp.json()["data"]["estado"] == "CANCELADO"
