"""Tests para caja chica, solicitudes y movimientos."""

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
async def test_caja_chica_crud() -> None:
    """Debe crear, listar, obtener, actualizar y eliminar una caja chica."""
    nc = f"CT{_uid()}"
    async with await _cliente_auth() as c:
        # Create
        resp = await c.post(
            "/api/petty-cash/cajas",
            json={
                "numero_caja": nc,
                "saldo_inicial": 3000.00,
                "fecha_apertura": "2025-01-15",
            },
        )
        assert resp.status_code == 201, resp.text
        caja_id = resp.json()["data"]["id"]

        # List
        resp = await c.get("/api/petty-cash/cajas")
        assert resp.status_code == 200
        datos = resp.json()["data"]
        assert any(d["id"] == caja_id for d in datos)

        # Get by ID
        resp = await c.get(f"/api/petty-cash/cajas/{caja_id}")
        assert resp.status_code == 200
        detalle = resp.json()["data"]
        assert detalle["estatus"] == "ABIERTA"
        assert detalle["saldo_final"] == 3000.00

        # Update
        resp = await c.put(
            f"/api/petty-cash/cajas/{caja_id}",
            json={"numero_caja": f"CU{_uid()}"},
        )
        assert resp.status_code == 200

        # Delete
        resp = await c.delete(f"/api/petty-cash/cajas/{caja_id}")
        assert resp.status_code == 204


@pytest.mark.asyncio
async def test_cerrar_caja_recalcula_saldo() -> None:
    """Cerrar caja debe recalcular ingreso_total, salida_total y saldo_final."""
    nc = f"CL{_uid()}"
    async with await _cliente_auth() as c:
        # Create caja
        resp = await c.post(
            "/api/petty-cash/cajas",
            json={
                "numero_caja": nc,
                "saldo_inicial": 5000.00,
                "fecha_apertura": "2025-01-01",
            },
        )
        assert resp.status_code == 201
        caja_id = resp.json()["data"]["id"]

        # Create ENTRADA movimiento
        resp = await c.post(
            "/api/petty-cash/movimientos",
            json={
                "numero_caja": nc,
                "monto": 1000.00,
                "entrada_salida": "ENTRADA",
                "detalle": "Ingreso test",
            },
        )
        assert resp.status_code == 201

        # Create SALIDA movimiento
        resp = await c.post(
            "/api/petty-cash/movimientos",
            json={
                "numero_caja": nc,
                "monto": 500.00,
                "entrada_salida": "SALIDA",
                "detalle": "Salida test",
            },
        )
        assert resp.status_code == 201

        # Close caja
        resp = await c.post(f"/api/petty-cash/cajas/{caja_id}/cerrar")
        assert resp.status_code == 200

        # Get caja and verify
        resp = await c.get(f"/api/petty-cash/cajas/{caja_id}")
        assert resp.status_code == 200
        detalle = resp.json()["data"]
        assert detalle["estatus"] == "CERRADA"
        assert detalle["ingreso_total"] == 1000.00
        assert detalle["salida_total"] == 500.00
        assert detalle["saldo_final"] == 5500.00


@pytest.mark.asyncio
async def test_movimiento_caja_cerrada_rechazado() -> None:
    """No se debe poder agregar movimiento a caja cerrada."""
    nc = f"CR{_uid()}"
    async with await _cliente_auth() as c:
        # Create caja
        resp = await c.post(
            "/api/petty-cash/cajas",
            json={
                "numero_caja": nc,
                "saldo_inicial": 1000.00,
                "fecha_apertura": "2025-01-01",
            },
        )
        assert resp.status_code == 201
        caja_id = resp.json()["data"]["id"]

        # Close caja
        resp = await c.post(f"/api/petty-cash/cajas/{caja_id}/cerrar")
        assert resp.status_code == 200

        # Try to create movimiento -> should fail with 422
        resp = await c.post(
            "/api/petty-cash/movimientos",
            json={
                "numero_caja": nc,
                "monto": 200.00,
                "entrada_salida": "ENTRADA",
                "detalle": "Should fail",
            },
        )
        assert resp.status_code == 422


@pytest.mark.asyncio
async def test_solicitud_caja_crud() -> None:
    """Debe crear, listar, obtener y actualizar una solicitud de caja."""
    async with await _cliente_auth() as c:
        # Create
        resp = await c.post(
            "/api/petty-cash/solicitudes",
            json={
                "fecha_solicitud": "2025-02-01T10:00:00",
                "dni_usuario": "12345678",
                "nombre": "Test User",
                "motivo": "Compra de materiales",
                "monto_solicitado": 500.00,
            },
        )
        assert resp.status_code == 201
        sol_id = resp.json()["data"]["id"]

        # List
        resp = await c.get("/api/petty-cash/solicitudes")
        assert resp.status_code == 200
        datos = resp.json()["data"]
        assert any(d["id"] == sol_id for d in datos)

        # Get by ID
        resp = await c.get(f"/api/petty-cash/solicitudes/{sol_id}")
        assert resp.status_code == 200
        detalle = resp.json()["data"]
        assert detalle["estatus"] == "PENDIENTE"

        # Update with monto_rendido -> verify auto-calculate monto_devuelto_reembolsado
        resp = await c.put(
            f"/api/petty-cash/solicitudes/{sol_id}",
            json={"monto_rendido": 350.00},
        )
        assert resp.status_code == 200
        actualizada = resp.json()["data"]
        assert actualizada["monto_rendido"] == 350.00
        assert actualizada["monto_devuelto_reembolsado"] == 150.00


@pytest.mark.asyncio
async def test_movimiento_actualiza_totales_padre() -> None:
    """Crear movimientos debe actualizar ingreso_total y salida_total en la caja padre."""
    nc = f"TL{_uid()}"
    async with await _cliente_auth() as c:
        # Create open caja
        resp = await c.post(
            "/api/petty-cash/cajas",
            json={
                "numero_caja": nc,
                "saldo_inicial": 2000.00,
                "fecha_apertura": "2025-03-01",
            },
        )
        assert resp.status_code == 201
        caja_id = resp.json()["data"]["id"]

        # Create ENTRADA movimiento
        resp = await c.post(
            "/api/petty-cash/movimientos",
            json={
                "numero_caja": nc,
                "monto": 1000.00,
                "entrada_salida": "ENTRADA",
                "detalle": "Ingreso",
            },
        )
        assert resp.status_code == 201

        # Create SALIDA movimiento
        resp = await c.post(
            "/api/petty-cash/movimientos",
            json={
                "numero_caja": nc,
                "monto": 300.00,
                "entrada_salida": "SALIDA",
                "detalle": "Salida",
            },
        )
        assert resp.status_code == 201

        # Get parent caja and verify totals
        resp = await c.get(f"/api/petty-cash/cajas/{caja_id}")
        assert resp.status_code == 200
        detalle = resp.json()["data"]
        assert detalle["ingreso_total"] == 1000.00
        assert detalle["salida_total"] == 300.00


@pytest.mark.asyncio
async def test_caja_chica_forbidden_operador() -> None:
    """OPERADOR debe recibir 403 al acceder a caja chica."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        resp = await c.post(
            "/api/auth/login",
            json={"username": "operador1", "password": "Admin@123"},
        )
        token = resp.json()["data"]["access_token"]
        c.headers["Authorization"] = f"Bearer {token}"
        resp = await c.get("/api/petty-cash/cajas")
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_caja_chica_sin_auth() -> None:
    """Debe retornar 401 sin autenticacion."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        resp = await c.get("/api/petty-cash/cajas")
    assert resp.status_code == 401
