"""Tests para equipo EDT y combustible (asociaciones)."""

import uuid

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from tests.conftest import obtener_token_admin

BASE = "/api/equipment/associations"


def _uid() -> str:
    """Generate a short unique suffix for test data (max 4 chars)."""
    return uuid.uuid4().hex[:4].upper()


async def _cliente_auth() -> AsyncClient:
    token = await obtener_token_admin()
    c = AsyncClient(transport=ASGITransport(app=app), base_url="http://test")
    c.headers["Authorization"] = f"Bearer {token}"
    return c


@pytest.mark.asyncio
async def test_equipo_edt_crud() -> None:
    """Debe crear, listar, obtener, actualizar y eliminar un registro EDT."""
    async with await _cliente_auth() as c:
        # Create
        payload = {
            "edt_nombre": f"EDT-{_uid()}",
            "actividad": f"Actividad-{_uid()}",
            "porcentaje": 60.0,
        }
        resp = await c.post(f"{BASE}/edt", json=payload)
        assert resp.status_code == 201, resp.text
        edt_id = resp.json()["data"]["id"]

        # List — should contain created record
        resp = await c.get(f"{BASE}/edt")
        assert resp.status_code == 200
        datos = resp.json()["data"]
        assert any(d["id"] == edt_id for d in datos)

        # Detail
        resp = await c.get(f"{BASE}/edt/{edt_id}")
        assert resp.status_code == 200
        detalle = resp.json()["data"]
        assert detalle["porcentaje"] == 60.0
        assert detalle["edt_nombre"] == payload["edt_nombre"]
        assert detalle["actividad"] == payload["actividad"]

        # Update
        resp = await c.put(
            f"{BASE}/edt/{edt_id}",
            json={"porcentaje": 50.0},
        )
        assert resp.status_code == 200

        # Verify update
        resp = await c.get(f"{BASE}/edt/{edt_id}")
        assert resp.status_code == 200
        assert resp.json()["data"]["porcentaje"] == 50.0

        # Delete
        resp = await c.delete(f"{BASE}/edt/{edt_id}")
        assert resp.status_code == 204

        # Verify gone
        resp = await c.get(f"{BASE}/edt/{edt_id}")
        assert resp.status_code == 404


@pytest.mark.asyncio
async def test_porcentaje_validation() -> None:
    """Debe validar que los porcentajes de EDT suman 100% para un parte diario."""
    async with await _cliente_auth() as c:
        ids_creados = []

        # Find a parte_diario_id with no existing EDT records by listing
        # existing EDTs and picking an unused parte_diario_id.
        # We use parte_diario_id=1 (known to exist) and check its baseline.
        parte_diario_id = 1

        # Get existing total before our test records
        resp = await c.get(f"{BASE}/edt/validate/{parte_diario_id}")
        assert resp.status_code == 200
        base_total = resp.json()["data"]["total"]

        # Create first EDT — porcentaje chosen so we don't exceed 100 with base
        p1 = 40.0
        resp = await c.post(
            f"{BASE}/edt",
            json={
                "parte_diario_id": parte_diario_id,
                "edt_nombre": f"EDT-A-{_uid()}",
                "porcentaje": p1,
            },
        )
        assert resp.status_code == 201, resp.text
        ids_creados.append(resp.json()["data"]["id"])

        # Validate — should show accumulated total (not yet 100)
        resp = await c.get(f"{BASE}/edt/validate/{parte_diario_id}")
        assert resp.status_code == 200
        validacion = resp.json()["data"]
        assert validacion["total"] == round(base_total + p1, 2)

        # Create second EDT to reach exactly 100
        p2 = round(100.0 - base_total - p1, 2)
        resp = await c.post(
            f"{BASE}/edt",
            json={
                "parte_diario_id": parte_diario_id,
                "edt_nombre": f"EDT-B-{_uid()}",
                "porcentaje": p2,
            },
        )
        assert resp.status_code == 201, resp.text
        ids_creados.append(resp.json()["data"]["id"])

        # Validate — should be valid (100%)
        resp = await c.get(f"{BASE}/edt/validate/{parte_diario_id}")
        assert resp.status_code == 200
        validacion = resp.json()["data"]
        assert validacion["valid"] is True
        assert validacion["total"] == 100.0

        # Cleanup
        for eid in ids_creados:
            await c.delete(f"{BASE}/edt/{eid}")

        # After cleanup, total should return to base
        resp = await c.get(f"{BASE}/edt/validate/{parte_diario_id}")
        assert resp.status_code == 200
        assert resp.json()["data"]["total"] == base_total


@pytest.mark.asyncio
async def test_combustible_crud_auto_importe() -> None:
    """Debe crear combustible con importe auto-calculado, actualizar y eliminar."""
    async with await _cliente_auth() as c:
        # Create — importe should be 50 * 12.50 = 625.00
        payload = {
            "cantidad": 50.0,
            "precio_unitario_sin_igv": 12.50,
            "comentario": f"Test-{_uid()}",
        }
        resp = await c.post(f"{BASE}/combustible", json=payload)
        assert resp.status_code == 201, resp.text
        comb_id = resp.json()["data"]["id"]

        # Verify importe
        resp = await c.get(f"{BASE}/combustible/{comb_id}")
        assert resp.status_code == 200
        detalle = resp.json()["data"]
        assert detalle["importe"] == 625.0
        assert detalle["cantidad"] == 50.0
        assert detalle["precio_unitario_sin_igv"] == 12.5

        # Update cantidad — importe should recalculate to 60 * 12.50 = 750.00
        resp = await c.put(
            f"{BASE}/combustible/{comb_id}",
            json={"cantidad": 60.0},
        )
        assert resp.status_code == 200

        # Verify recalculated importe
        resp = await c.get(f"{BASE}/combustible/{comb_id}")
        assert resp.status_code == 200
        detalle = resp.json()["data"]
        assert detalle["importe"] == 750.0

        # Delete
        resp = await c.delete(f"{BASE}/combustible/{comb_id}")
        assert resp.status_code == 204

        # Verify gone
        resp = await c.get(f"{BASE}/combustible/{comb_id}")
        assert resp.status_code == 404


@pytest.mark.asyncio
async def test_combustible_importe_recalculates_on_precio_update() -> None:
    """Importe debe recalcularse cuando se actualiza precio_unitario_sin_igv."""
    async with await _cliente_auth() as c:
        # Create — importe = 100 * 15.00 = 1500.00
        resp = await c.post(
            f"{BASE}/combustible",
            json={
                "cantidad": 100.0,
                "precio_unitario_sin_igv": 15.0,
                "comentario": f"Precio-{_uid()}",
            },
        )
        assert resp.status_code == 201, resp.text
        comb_id = resp.json()["data"]["id"]

        # Verify initial importe
        resp = await c.get(f"{BASE}/combustible/{comb_id}")
        assert resp.status_code == 200
        assert resp.json()["data"]["importe"] == 1500.0

        # Update precio — importe should recalculate to 100 * 16.00 = 1600.00
        resp = await c.put(
            f"{BASE}/combustible/{comb_id}",
            json={"precio_unitario_sin_igv": 16.0},
        )
        assert resp.status_code == 200

        # Verify recalculated importe
        resp = await c.get(f"{BASE}/combustible/{comb_id}")
        assert resp.status_code == 200
        assert resp.json()["data"]["importe"] == 1600.0

        # Cleanup
        await c.delete(f"{BASE}/combustible/{comb_id}")


@pytest.mark.asyncio
async def test_equipo_asociaciones_sin_auth() -> None:
    """Debe retornar 401 sin autenticacion."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        resp = await c.get(f"{BASE}/edt")
        assert resp.status_code == 401

        resp = await c.get(f"{BASE}/combustible")
        assert resp.status_code == 401
