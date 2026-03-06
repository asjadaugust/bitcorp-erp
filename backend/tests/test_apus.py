"""Tests para APU (Analisis de Precios Unitarios) — presupuestos module."""

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


def _insumo_payload(**overrides) -> dict:
    uid = uuid4().hex[:8]
    base = {
        "codigo": f"INS-APU-{uid}",
        "nombre": f"Insumo APU {uid}",
        "unidad_medida": "hh",
        "tipo": "MANO_OBRA",
        "precio_unitario": 18.50,
    }
    base.update(overrides)
    return base


def _apu_payload(**overrides) -> dict:
    uid = uuid4().hex[:8]
    base = {
        "codigo": f"APU-{uid}",
        "nombre": f"APU Test {uid}",
        "unidad_medida": "m3",
        "rendimiento": 25.0,
        "jornada": 8.0,
    }
    base.update(overrides)
    return base


async def _create_insumo(c: AsyncClient, **overrides) -> int:
    resp = await c.post("/api/insumos/", json=_insumo_payload(**overrides))
    return resp.json()["data"]["id"]


async def _create_apu(c: AsyncClient, **overrides) -> int:
    resp = await c.post("/api/apus/", json=_apu_payload(**overrides))
    return resp.json()["data"]["id"]


# ── CRUD ─────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_apus_listar() -> None:
    """Debe retornar lista paginada de APUs."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/apus/")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert "pagination" in datos


@pytest.mark.asyncio
async def test_apus_crear() -> None:
    """Debe crear un nuevo APU."""
    async with await _cliente_auth() as c:
        resp = await c.post("/api/apus/", json=_apu_payload())
    assert resp.status_code == 201
    datos = resp.json()
    assert datos["success"] is True
    assert "id" in datos["data"]


@pytest.mark.asyncio
async def test_apus_crear_codigo_duplicado() -> None:
    """Debe retornar 409 para código duplicado."""
    payload = _apu_payload()
    async with await _cliente_auth() as c:
        await c.post("/api/apus/", json=payload)
        resp = await c.post("/api/apus/", json=payload)
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_apus_obtener_detalle() -> None:
    """Debe retornar detalle de APU con grupos de insumos."""
    async with await _cliente_auth() as c:
        apu_id = await _create_apu(c)
        resp = await c.get(f"/api/apus/{apu_id}")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    data = datos["data"]
    assert data["id"] == apu_id
    # Verify grouped sections exist
    for key in ("mano_obra", "materiales", "equipos", "herramientas", "subcontratos"):
        assert key in data


@pytest.mark.asyncio
async def test_apus_obtener_inexistente() -> None:
    """Debe retornar 404 para APU inexistente."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/apus/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_apus_actualizar() -> None:
    """Debe actualizar cabecera de APU."""
    async with await _cliente_auth() as c:
        apu_id = await _create_apu(c)
        resp = await c.put(
            f"/api/apus/{apu_id}",
            json={"nombre": "APU Actualizado", "rendimiento": 50.0},
        )
    assert resp.status_code == 200
    assert resp.json()["success"] is True


@pytest.mark.asyncio
async def test_apus_eliminar() -> None:
    """Debe eliminar (soft delete) un APU."""
    async with await _cliente_auth() as c:
        apu_id = await _create_apu(c)
        resp = await c.delete(f"/api/apus/{apu_id}")
    assert resp.status_code == 204


# ── Dropdown ─────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_apus_dropdown() -> None:
    """Debe retornar opciones para dropdown."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/apus/dropdown")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert isinstance(datos["data"], list)


# ── Insumo lines ─────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_apus_agregar_insumo() -> None:
    """Debe agregar un insumo a un APU."""
    async with await _cliente_auth() as c:
        apu_id = await _create_apu(c)
        insumo_id = await _create_insumo(c, tipo="MANO_OBRA")
        resp = await c.post(
            f"/api/apus/{apu_id}/insumos",
            json={
                "insumo_id": insumo_id,
                "tipo": "MANO_OBRA",
                "cantidad": 2,
            },
        )
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert len(datos["data"]["mano_obra"]) >= 1


@pytest.mark.asyncio
async def test_apus_agregar_material() -> None:
    """Debe agregar un material con aporte."""
    async with await _cliente_auth() as c:
        apu_id = await _create_apu(c)
        insumo_id = await _create_insumo(c, tipo="MATERIAL", precio_unitario=120.0)
        resp = await c.post(
            f"/api/apus/{apu_id}/insumos",
            json={
                "insumo_id": insumo_id,
                "tipo": "MATERIAL",
                "cantidad": 1,
                "aporte": 0.05,
            },
        )
    assert resp.status_code == 200
    datos = resp.json()
    assert len(datos["data"]["materiales"]) >= 1


@pytest.mark.asyncio
async def test_apus_eliminar_insumo() -> None:
    """Debe eliminar una línea de insumo de APU."""
    async with await _cliente_auth() as c:
        apu_id = await _create_apu(c)
        insumo_id = await _create_insumo(c, tipo="MATERIAL")
        add_resp = await c.post(
            f"/api/apus/{apu_id}/insumos",
            json={"insumo_id": insumo_id, "tipo": "MATERIAL", "cantidad": 1, "aporte": 0.1},
        )
        line_id = add_resp.json()["data"]["materiales"][0]["id"]
        resp = await c.delete(f"/api/apus/{apu_id}/insumos/{line_id}")
    assert resp.status_code == 200
    assert resp.json()["success"] is True


# ── Duplicar ─────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_apus_duplicar() -> None:
    """Debe duplicar un APU con sus líneas."""
    async with await _cliente_auth() as c:
        apu_id = await _create_apu(c)
        insumo_id = await _create_insumo(c, tipo="MANO_OBRA")
        await c.post(
            f"/api/apus/{apu_id}/insumos",
            json={"insumo_id": insumo_id, "tipo": "MANO_OBRA", "cantidad": 3},
        )
        resp = await c.post(f"/api/apus/{apu_id}/duplicar")
    assert resp.status_code == 201
    datos = resp.json()
    assert datos["success"] is True
    new_id = datos["data"]["id"]
    assert new_id != apu_id


# ── Calculo recursivo ────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_apus_calcular_vacio() -> None:
    """APU sin insumos debe calcular PU = 0."""
    async with await _cliente_auth() as c:
        apu_id = await _create_apu(c)
        resp = await c.get(f"/api/apus/{apu_id}/calcular")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert datos["data"]["precio_unitario"] == 0


@pytest.mark.asyncio
async def test_apus_calcular_mano_obra() -> None:
    """Calcula costo MO = cantidad × precio × jornada / rendimiento."""
    async with await _cliente_auth() as c:
        # Create APU with rendimiento=25, jornada=8
        apu_id = await _create_apu(c, rendimiento=25.0, jornada=8.0)
        # Create insumo MO at 18.50/hh
        insumo_id = await _create_insumo(c, tipo="MANO_OBRA", precio_unitario=18.50)
        # Add 2 workers
        await c.post(
            f"/api/apus/{apu_id}/insumos",
            json={"insumo_id": insumo_id, "tipo": "MANO_OBRA", "cantidad": 2},
        )
        resp = await c.get(f"/api/apus/{apu_id}/calcular")
    datos = resp.json()["data"]
    # Expected: 2 × 18.50 × 8 / 25 = 11.84
    assert datos["total_mano_obra"] == pytest.approx(11.84, abs=0.01)
    assert datos["precio_unitario"] == pytest.approx(11.84, abs=0.01)


@pytest.mark.asyncio
async def test_apus_calcular_material() -> None:
    """Calcula costo material = aporte × precio."""
    async with await _cliente_auth() as c:
        apu_id = await _create_apu(c, rendimiento=10.0, jornada=8.0)
        insumo_id = await _create_insumo(c, tipo="MATERIAL", precio_unitario=120.0)
        await c.post(
            f"/api/apus/{apu_id}/insumos",
            json={"insumo_id": insumo_id, "tipo": "MATERIAL", "cantidad": 1, "aporte": 0.05},
        )
        resp = await c.get(f"/api/apus/{apu_id}/calcular")
    datos = resp.json()["data"]
    # Expected: 0.05 × 120 = 6.00
    assert datos["total_materiales"] == pytest.approx(6.0, abs=0.01)


@pytest.mark.asyncio
async def test_apus_calcular_herramientas_porcentaje() -> None:
    """Herramientas = porcentaje × total_mano_obra / 100."""
    async with await _cliente_auth() as c:
        apu_id = await _create_apu(c, rendimiento=25.0, jornada=8.0)
        # Add MO insumo
        mo_id = await _create_insumo(c, tipo="MANO_OBRA", precio_unitario=18.50)
        await c.post(
            f"/api/apus/{apu_id}/insumos",
            json={"insumo_id": mo_id, "tipo": "MANO_OBRA", "cantidad": 2},
        )
        # Add herramientas at 3%
        herr_id = await _create_insumo(c, tipo="MATERIAL", precio_unitario=0)
        await c.post(
            f"/api/apus/{apu_id}/insumos",
            json={
                "insumo_id": herr_id,
                "tipo": "HERRAMIENTAS",
                "cantidad": 1,
                "es_porcentaje": True,
                "porcentaje": 3.0,
            },
        )
        resp = await c.get(f"/api/apus/{apu_id}/calcular")
    datos = resp.json()["data"]
    # MO = 2 × 18.50 × 8 / 25 = 11.84
    # Herramientas = 3% × 11.84 = 0.3552
    assert datos["total_herramientas"] == pytest.approx(0.3552, abs=0.01)


@pytest.mark.asyncio
async def test_apus_calcular_sub_apu_recursivo() -> None:
    """Sub-APU recursion: parent APU references child APU as sub-analysis."""
    async with await _cliente_auth() as c:
        # Create child APU with one MO insumo
        child_id = await _create_apu(c, rendimiento=10.0, jornada=8.0)
        mo_id = await _create_insumo(c, tipo="MANO_OBRA", precio_unitario=20.0)
        await c.post(
            f"/api/apus/{child_id}/insumos",
            json={"insumo_id": mo_id, "tipo": "MANO_OBRA", "cantidad": 1},
        )
        # Child PU = 1 × 20 × 8 / 10 = 16.00

        # Create parent APU that uses child as sub-APU
        parent_id = await _create_apu(c, rendimiento=5.0, jornada=8.0)
        await c.post(
            f"/api/apus/{parent_id}/insumos",
            json={"sub_apu_id": child_id, "tipo": "EQUIPO", "cantidad": 1},
        )
        resp = await c.get(f"/api/apus/{parent_id}/calcular")
    assert resp.status_code == 200
    datos = resp.json()["data"]
    # Sub-APU resolves to PU=16.00, then parent equipo cost = 1 × 16.00 × 8 / 5 = 25.60
    assert datos["total_equipos"] == pytest.approx(25.60, abs=0.1)


@pytest.mark.asyncio
async def test_apus_calcular_full_breakdown() -> None:
    """Full APU with MO + Material + Equipment + Herramientas."""
    async with await _cliente_auth() as c:
        apu_id = await _create_apu(c, rendimiento=20.0, jornada=8.0)

        # MO: 3 workers × 15.0/hh → 3 × 15 × 8 / 20 = 18.00
        mo_id = await _create_insumo(c, tipo="MANO_OBRA", precio_unitario=15.0)
        await c.post(
            f"/api/apus/{apu_id}/insumos",
            json={"insumo_id": mo_id, "tipo": "MANO_OBRA", "cantidad": 3},
        )

        # Material: aporte=0.1 × price=200 = 20.00
        mat_id = await _create_insumo(c, tipo="MATERIAL", precio_unitario=200.0)
        await c.post(
            f"/api/apus/{apu_id}/insumos",
            json={"insumo_id": mat_id, "tipo": "MATERIAL", "cantidad": 1, "aporte": 0.1},
        )

        # Equipment: 1 × 80/hm × 8 / 20 = 32.00
        eq_id = await _create_insumo(c, tipo="EQUIPO", precio_unitario=80.0)
        await c.post(
            f"/api/apus/{apu_id}/insumos",
            json={"insumo_id": eq_id, "tipo": "EQUIPO", "cantidad": 1},
        )

        # Herramientas: 5% of MO = 0.05 × 18 = 0.90
        herr_id = await _create_insumo(c, tipo="MATERIAL", precio_unitario=0)
        await c.post(
            f"/api/apus/{apu_id}/insumos",
            json={
                "insumo_id": herr_id,
                "tipo": "HERRAMIENTAS",
                "cantidad": 1,
                "es_porcentaje": True,
                "porcentaje": 5.0,
            },
        )

        resp = await c.get(f"/api/apus/{apu_id}/calcular")
    datos = resp.json()["data"]
    assert datos["total_mano_obra"] == pytest.approx(18.0, abs=0.01)
    assert datos["total_materiales"] == pytest.approx(20.0, abs=0.01)
    assert datos["total_equipos"] == pytest.approx(32.0, abs=0.01)
    assert datos["total_herramientas"] == pytest.approx(0.9, abs=0.01)
    # PU = 18 + 20 + 32 + 0.9 = 70.90
    assert datos["precio_unitario"] == pytest.approx(70.9, abs=0.1)


# ── Auth ─────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_apus_sin_auth() -> None:
    """Debe retornar 401 sin autenticación."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.get("/api/apus/")
    assert resp.status_code == 401
