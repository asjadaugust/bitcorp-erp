"""Tests para caja y banco (bank cash flow)."""

import uuid

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from tests.conftest import obtener_token_admin


def _uid() -> str:
    """Generate a short unique suffix for test data (max 4 chars)."""
    return uuid.uuid4().hex[:4].upper()


async def _cliente_auth() -> AsyncClient:
    token = await obtener_token_admin()
    c = AsyncClient(transport=ASGITransport(app=app), base_url="http://test")
    c.headers["Authorization"] = f"Bearer {token}"
    return c


@pytest.mark.asyncio
async def test_cuenta_caja_banco_crud() -> None:
    """Debe crear, listar, obtener, actualizar y eliminar una cuenta de caja y banco."""
    nc = f"CC{_uid()}"
    async with await _cliente_auth() as c:
        # Create
        resp = await c.post(
            "/api/bank-cash/cuentas",
            json={
                "numero_cuenta": nc,
                "cuenta": f"Cuenta Test {nc}",
                "acceso_proyecto": "SI",
                "estatus": "ACTIVO",
            },
        )
        assert resp.status_code == 201, resp.text
        cuenta_id = resp.json()["data"]["id"]

        # List
        resp = await c.get("/api/bank-cash/cuentas")
        assert resp.status_code == 200
        datos = resp.json()["data"]
        assert any(d["id"] == cuenta_id for d in datos)

        # Get by ID
        resp = await c.get(f"/api/bank-cash/cuentas/{cuenta_id}")
        assert resp.status_code == 200
        detalle = resp.json()["data"]
        assert detalle["numero_cuenta"] == nc
        assert detalle["estatus"] == "ACTIVO"

        # Update
        nuevo_nombre = f"Cuenta Upd {_uid()}"
        resp = await c.put(
            f"/api/bank-cash/cuentas/{cuenta_id}",
            json={"cuenta": nuevo_nombre},
        )
        assert resp.status_code == 200

        # Verify update
        resp = await c.get(f"/api/bank-cash/cuentas/{cuenta_id}")
        assert resp.status_code == 200
        assert resp.json()["data"]["cuenta"] == nuevo_nombre

        # Delete
        resp = await c.delete(f"/api/bank-cash/cuentas/{cuenta_id}")
        assert resp.status_code == 204


@pytest.mark.asyncio
async def test_flujo_caja_banco_crud_paginado() -> None:
    """Debe crear un flujo, listar con paginacion, obtener detalle y actualizar."""
    async with await _cliente_auth() as c:
        # Create
        resp = await c.post(
            "/api/bank-cash/flujos",
            json={
                "tipo_movimiento": "INGRESO",
                "fecha_movimiento": "2025-03-01",
                "numero_cuenta_origen": f"ORI{_uid()}",
                "cuenta_origen": "Cuenta Origen Test",
                "numero_cuenta_destino": f"DST{_uid()}",
                "cuenta_destino": "Cuenta Destino Test",
                "concepto": "Transferencia test",
                "moneda": "PEN",
                "total": 15000.50,
                "total_letra": "Quince mil quinientos",
                "voucher": f"V{_uid()}",
            },
        )
        assert resp.status_code == 201, resp.text
        flujo_id = resp.json()["data"]["id"]

        # List with pagination
        resp = await c.get("/api/bank-cash/flujos?page=1&limit=10")
        assert resp.status_code == 200
        body = resp.json()
        assert "pagination" in body
        assert body["pagination"]["page"] == 1
        assert body["pagination"]["limit"] == 10
        assert isinstance(body["pagination"]["total"], int)
        assert any(d["id"] == flujo_id for d in body["data"])

        # Get by ID (detail with nested detalles)
        resp = await c.get(f"/api/bank-cash/flujos/{flujo_id}")
        assert resp.status_code == 200
        detalle = resp.json()["data"]
        assert detalle["tipo_movimiento"] == "INGRESO"
        assert detalle["total"] == 15000.50
        assert "detalles" in detalle

        # Update
        resp = await c.put(
            f"/api/bank-cash/flujos/{flujo_id}",
            json={"concepto": "Transferencia actualizada"},
        )
        assert resp.status_code == 200


@pytest.mark.asyncio
async def test_flujo_filtros() -> None:
    """Debe filtrar flujos por tipo_movimiento."""
    uid = _uid()
    async with await _cliente_auth() as c:
        # Create flujo with tipo_movimiento=SALIDA
        resp = await c.post(
            "/api/bank-cash/flujos",
            json={
                "tipo_movimiento": "SALIDA",
                "fecha_movimiento": "2025-04-01",
                "concepto": f"Salida test {uid}",
                "moneda": "PEN",
                "total": 5000.00,
            },
        )
        assert resp.status_code == 201, resp.text
        flujo_id = resp.json()["data"]["id"]

        # Filter by tipo_movimiento=SALIDA
        resp = await c.get("/api/bank-cash/flujos?tipo_movimiento=SALIDA")
        assert resp.status_code == 200
        body = resp.json()
        assert all(d["tipo_movimiento"] == "SALIDA" for d in body["data"])
        assert any(d["id"] == flujo_id for d in body["data"])


@pytest.mark.asyncio
async def test_detalle_movimiento_crud() -> None:
    """Debe crear un flujo, agregar detalle, listar detalles y eliminar detalle."""
    async with await _cliente_auth() as c:
        # Create parent flujo
        resp = await c.post(
            "/api/bank-cash/flujos",
            json={
                "tipo_movimiento": "INGRESO",
                "fecha_movimiento": "2025-05-01",
                "concepto": "Flujo para detalles",
                "moneda": "PEN",
                "total": 10000.00,
            },
        )
        assert resp.status_code == 201, resp.text
        flujo_id = resp.json()["data"]["id"]

        # Create detail line
        resp = await c.post(
            f"/api/bank-cash/flujos/{flujo_id}/detalles",
            json={
                "concepto": "Pago proveedor",
                "clasificacion": "SERVICIO",
                "monto": 2500.00,
            },
        )
        assert resp.status_code == 201, resp.text
        detalle_id = resp.json()["data"]["id"]

        # List detail lines
        resp = await c.get(f"/api/bank-cash/flujos/{flujo_id}/detalles")
        assert resp.status_code == 200
        detalles = resp.json()["data"]
        assert any(d["id"] == detalle_id for d in detalles)
        assert detalles[0]["concepto"] == "Pago proveedor"

        # Delete detail line
        resp = await c.delete(f"/api/bank-cash/flujos/{flujo_id}/detalles/{detalle_id}")
        assert resp.status_code == 204

        # Verify deleted
        resp = await c.get(f"/api/bank-cash/flujos/{flujo_id}/detalles")
        assert resp.status_code == 200
        assert not any(d["id"] == detalle_id for d in resp.json()["data"])


@pytest.mark.asyncio
async def test_admin_centros_costo_listado() -> None:
    """Debe listar centros de costo administrativos (read-only)."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/bank-cash/admin-centros-costo")
        assert resp.status_code == 200
        assert isinstance(resp.json()["data"], list)


@pytest.mark.asyncio
async def test_caja_banco_forbidden_operador() -> None:
    """OPERADOR debe recibir 403 al acceder a caja y banco."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        resp = await c.post(
            "/api/auth/login",
            json={"username": "operador1", "password": "Admin@123"},
        )
        token = resp.json()["data"]["access_token"]
        c.headers["Authorization"] = f"Bearer {token}"
        resp = await c.get("/api/bank-cash/flujos")
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_caja_banco_sin_auth() -> None:
    """Debe retornar 401 sin autenticacion."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        resp = await c.get("/api/bank-cash/flujos")
    assert resp.status_code == 401
