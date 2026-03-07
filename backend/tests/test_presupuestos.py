"""Tests para Presupuestos y Partidas — presupuestos module."""

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


async def _get_or_create_project(c: AsyncClient) -> int:
    """Get first project or create one for testing."""
    resp = await c.get("/api/projects/?limit=1")
    datos = resp.json()
    if datos["data"]:
        return datos["data"][0]["id"]
    # Create a project
    uid = uuid4().hex[:8]
    resp = await c.post(
        "/api/projects/",
        json={"codigo": f"PRY-PRES-{uid}", "nombre": f"Proyecto Presupuesto {uid}"},
    )
    return resp.json()["data"]["id"]


def _presupuesto_payload(proyecto_id: int, **overrides) -> dict:
    uid = uuid4().hex[:8]
    base = {
        "proyecto_id": proyecto_id,
        "codigo": f"PRES-{uid}",
        "nombre": f"Presupuesto Test {uid}",
        "fecha": "2026-03-06",
    }
    base.update(overrides)
    return base


async def _create_apu(c: AsyncClient, **overrides) -> int:
    uid = uuid4().hex[:8]
    payload = {
        "codigo": f"APU-P-{uid}",
        "nombre": f"APU Pres {uid}",
        "unidad_medida": "m3",
        "rendimiento": 20.0,
        "jornada": 8.0,
    }
    payload.update(overrides)
    resp = await c.post("/api/apus/", json=payload)
    return resp.json()["data"]["id"]


async def _create_insumo(c: AsyncClient, **overrides) -> int:
    uid = uuid4().hex[:8]
    payload = {
        "codigo": f"INS-P-{uid}",
        "nombre": f"Insumo Pres {uid}",
        "unidad_medida": "hh",
        "tipo": "MANO_OBRA",
        "precio_unitario": 15.0,
    }
    payload.update(overrides)
    resp = await c.post("/api/insumos/", json=payload)
    return resp.json()["data"]["id"]


# ── CRUD ─────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_presupuestos_listar() -> None:
    """Debe retornar lista paginada de presupuestos."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/presupuestos/")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert "pagination" in datos


@pytest.mark.asyncio
async def test_presupuestos_crear() -> None:
    """Debe crear un nuevo presupuesto."""
    async with await _cliente_auth() as c:
        pid = await _get_or_create_project(c)
        resp = await c.post("/api/presupuestos/", json=_presupuesto_payload(pid))
    assert resp.status_code == 201
    datos = resp.json()
    assert datos["success"] is True
    assert "id" in datos["data"]


@pytest.mark.asyncio
async def test_presupuestos_crear_codigo_duplicado() -> None:
    """Debe retornar 409 para código duplicado."""
    async with await _cliente_auth() as c:
        pid = await _get_or_create_project(c)
        payload = _presupuesto_payload(pid)
        await c.post("/api/presupuestos/", json=payload)
        resp = await c.post("/api/presupuestos/", json=payload)
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_presupuestos_obtener_detalle() -> None:
    """Debe retornar detalle con partidas."""
    async with await _cliente_auth() as c:
        pid = await _get_or_create_project(c)
        create_resp = await c.post("/api/presupuestos/", json=_presupuesto_payload(pid))
        pres_id = create_resp.json()["data"]["id"]
        resp = await c.get(f"/api/presupuestos/{pres_id}")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    data = datos["data"]
    assert data["id"] == pres_id
    assert "partidas" in data
    assert data["estado"] == "BORRADOR"


@pytest.mark.asyncio
async def test_presupuestos_obtener_inexistente() -> None:
    """Debe retornar 404 para presupuesto inexistente."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/presupuestos/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_presupuestos_actualizar() -> None:
    """Debe actualizar cabecera de presupuesto."""
    async with await _cliente_auth() as c:
        pid = await _get_or_create_project(c)
        create_resp = await c.post("/api/presupuestos/", json=_presupuesto_payload(pid))
        pres_id = create_resp.json()["data"]["id"]
        resp = await c.put(
            f"/api/presupuestos/{pres_id}",
            json={"nombre": "Presupuesto Actualizado", "estado": "APROBADO"},
        )
    assert resp.status_code == 200
    assert resp.json()["success"] is True


@pytest.mark.asyncio
async def test_presupuestos_eliminar() -> None:
    """Debe eliminar (soft delete) un presupuesto."""
    async with await _cliente_auth() as c:
        pid = await _get_or_create_project(c)
        create_resp = await c.post("/api/presupuestos/", json=_presupuesto_payload(pid))
        pres_id = create_resp.json()["data"]["id"]
        resp = await c.delete(f"/api/presupuestos/{pres_id}")
    assert resp.status_code == 204


# ── Partidas ─────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_presupuestos_agregar_partida() -> None:
    """Debe agregar una partida al presupuesto."""
    async with await _cliente_auth() as c:
        pid = await _get_or_create_project(c)
        create_resp = await c.post("/api/presupuestos/", json=_presupuesto_payload(pid))
        pres_id = create_resp.json()["data"]["id"]
        resp = await c.post(
            f"/api/presupuestos/{pres_id}/partidas",
            json={
                "codigo": "01.01",
                "descripcion": "Excavación en tierra",
                "unidad_medida": "m3",
                "metrado": 100.0,
                "precio_unitario": 45.50,
                "fase": "01 Movimiento de Tierras",
            },
        )
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    partidas = datos["data"]["partidas"]
    assert len(partidas) >= 1
    p = partidas[-1]
    assert p["codigo"] == "01.01"
    # parcial = metrado × precio_unitario = 100 × 45.50 = 4550.00
    assert p["parcial"] == pytest.approx(4550.0, abs=0.01)


@pytest.mark.asyncio
async def test_presupuestos_partida_con_apu() -> None:
    """Debe auto-llenar precio_unitario desde APU."""
    async with await _cliente_auth() as c:
        pid = await _get_or_create_project(c)
        create_resp = await c.post("/api/presupuestos/", json=_presupuesto_payload(pid))
        pres_id = create_resp.json()["data"]["id"]

        # Create APU with insumo so it has a price
        apu_id = await _create_apu(c, rendimiento=10.0, jornada=8.0)
        insumo_id = await _create_insumo(c, tipo="MANO_OBRA", precio_unitario=20.0)
        await c.post(
            f"/api/apus/{apu_id}/insumos",
            json={"insumo_id": insumo_id, "tipo": "MANO_OBRA", "cantidad": 1},
        )
        # APU PU = 1 × 20 × 8 / 10 = 16.00

        resp = await c.post(
            f"/api/presupuestos/{pres_id}/partidas",
            json={
                "codigo": "02.01",
                "descripcion": "Partida con APU",
                "unidad_medida": "m3",
                "metrado": 50.0,
                "apu_id": apu_id,
                "fase": "02 Estructuras",
            },
        )
    assert resp.status_code == 200
    partidas = resp.json()["data"]["partidas"]
    p = next(x for x in partidas if x["codigo"] == "02.01")
    # precio_unitario should be auto-filled from APU = 16.00
    assert p["precio_unitario"] == pytest.approx(16.0, abs=0.1)
    # parcial = 50 × 16 = 800
    assert p["parcial"] == pytest.approx(800.0, abs=5.0)


@pytest.mark.asyncio
async def test_presupuestos_eliminar_partida() -> None:
    """Debe eliminar una partida del presupuesto."""
    async with await _cliente_auth() as c:
        pid = await _get_or_create_project(c)
        create_resp = await c.post("/api/presupuestos/", json=_presupuesto_payload(pid))
        pres_id = create_resp.json()["data"]["id"]

        # Add partida
        add_resp = await c.post(
            f"/api/presupuestos/{pres_id}/partidas",
            json={
                "codigo": "DEL-01",
                "descripcion": "Partida a eliminar",
                "unidad_medida": "und",
                "metrado": 10,
                "precio_unitario": 100,
            },
        )
        partida_id = add_resp.json()["data"]["partidas"][0]["id"]

        # Delete
        resp = await c.delete(f"/api/presupuestos/{pres_id}/partidas/{partida_id}")
    assert resp.status_code == 200
    assert resp.json()["success"] is True


@pytest.mark.asyncio
async def test_presupuestos_total_actualiza() -> None:
    """El total_presupuestado debe actualizarse al agregar partidas."""
    async with await _cliente_auth() as c:
        pid = await _get_or_create_project(c)
        create_resp = await c.post("/api/presupuestos/", json=_presupuesto_payload(pid))
        pres_id = create_resp.json()["data"]["id"]

        # Add two partidas
        await c.post(
            f"/api/presupuestos/{pres_id}/partidas",
            json={
                "codigo": "T01", "descripcion": "P1",
                "unidad_medida": "m3", "metrado": 10, "precio_unitario": 100,
            },
        )
        resp = await c.post(
            f"/api/presupuestos/{pres_id}/partidas",
            json={
                "codigo": "T02", "descripcion": "P2",
                "unidad_medida": "m2", "metrado": 20, "precio_unitario": 50,
            },
        )
    datos = resp.json()["data"]
    # Total = (10 × 100) + (20 × 50) = 1000 + 1000 = 2000
    assert datos["total_presupuestado"] == pytest.approx(2000.0, abs=0.01)


# ── Recalcular ───────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_presupuestos_recalcular() -> None:
    """Recalcular debe actualizar precios desde APUs actuales."""
    async with await _cliente_auth() as c:
        pid = await _get_or_create_project(c)
        create_resp = await c.post("/api/presupuestos/", json=_presupuesto_payload(pid))
        pres_id = create_resp.json()["data"]["id"]

        # Add partida with manual price
        await c.post(
            f"/api/presupuestos/{pres_id}/partidas",
            json={
                "codigo": "RC01", "descripcion": "Recalc",
                "unidad_medida": "m3", "metrado": 10, "precio_unitario": 50,
            },
        )

        # Recalculate
        resp = await c.post(f"/api/presupuestos/{pres_id}/recalcular")
    assert resp.status_code == 200
    assert resp.json()["success"] is True


# ── Resumen ──────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_presupuestos_resumen() -> None:
    """Resumen debe agrupar por fase con subtotales."""
    async with await _cliente_auth() as c:
        pid = await _get_or_create_project(c)
        create_resp = await c.post("/api/presupuestos/", json=_presupuesto_payload(pid))
        pres_id = create_resp.json()["data"]["id"]

        # Add partidas in different phases
        await c.post(
            f"/api/presupuestos/{pres_id}/partidas",
            json={
                "codigo": "R01",
                "descripcion": "Fase A Item",
                "unidad_medida": "m3",
                "metrado": 10,
                "precio_unitario": 100,
                "fase": "Fase A",
            },
        )
        await c.post(
            f"/api/presupuestos/{pres_id}/partidas",
            json={
                "codigo": "R02",
                "descripcion": "Fase B Item",
                "unidad_medida": "m2",
                "metrado": 20,
                "precio_unitario": 50,
                "fase": "Fase B",
            },
        )

        resp = await c.get(f"/api/presupuestos/{pres_id}/resumen")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    resumen = datos["data"]
    assert resumen["total"] == pytest.approx(2000.0, abs=0.01)
    assert len(resumen["fases"]) >= 2
    fase_names = [f["fase"] for f in resumen["fases"]]
    assert "Fase A" in fase_names
    assert "Fase B" in fase_names


# ── Auth ─────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_presupuestos_sin_auth() -> None:
    """Debe retornar 401 sin autenticación."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.get("/api/presupuestos/")
    assert resp.status_code == 401
