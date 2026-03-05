"""Tests para registro de trabajador y comportamiento historico."""

import uuid

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from tests.conftest import obtener_token_admin


BASE = "/api/hr/worker-registry"


def _uid() -> str:
    """Generate a short unique suffix for test data (max 4 chars)."""
    return uuid.uuid4().hex[:4].upper()


async def _cliente_auth() -> AsyncClient:
    token = await obtener_token_admin()
    c = AsyncClient(transport=ASGITransport(app=app), base_url="http://test")
    c.headers["Authorization"] = f"Bearer {token}"
    return c


@pytest.mark.asyncio
async def test_registro_trabajador_crud() -> None:
    """Debe crear, listar, obtener, actualizar y eliminar un registro de trabajador."""
    dni = f"7{_uid()}001"[:8]
    ruc = f"2040{_uid()}001"[:11]
    async with await _cliente_auth() as c:
        # Create
        payload = {
            "trabajador_dni": dni,
            "proveedor_ruc": ruc,
            "fecha_ingreso": "2025-01-15",
            "estatus": "ACTIVO",
            "sub_grupo": "OBRERO",
            "registrado_por": "admin",
        }
        resp = await c.post(f"{BASE}/registros", json=payload)
        assert resp.status_code == 201, resp.text
        reg_id = resp.json()["data"]["id"]

        # List (paginated)
        resp = await c.get(f"{BASE}/registros")
        assert resp.status_code == 200
        body = resp.json()
        assert "pagination" in body
        assert any(d["id"] == reg_id for d in body["data"])

        # Get detail (verify empty comportamiento_historico)
        resp = await c.get(f"{BASE}/registros/{reg_id}")
        assert resp.status_code == 200
        detalle = resp.json()["data"]
        assert detalle["trabajador_dni"] == dni
        assert detalle["proveedor_ruc"] == ruc
        assert detalle["estatus"] == "ACTIVO"
        assert detalle["sub_grupo"] == "OBRERO"
        assert detalle["fecha_ingreso"] == "2025-01-15"
        assert detalle["comportamiento_historico"] == []

        # Update
        resp = await c.put(
            f"{BASE}/registros/{reg_id}",
            json={"fecha_cese": "2025-06-30", "estatus": "CESADO"},
        )
        assert resp.status_code == 200

        # Verify update
        resp = await c.get(f"{BASE}/registros/{reg_id}")
        assert resp.status_code == 200
        detalle = resp.json()["data"]
        assert detalle["estatus"] == "CESADO"
        assert detalle["fecha_cese"] == "2025-06-30"

        # Delete
        resp = await c.delete(f"{BASE}/registros/{reg_id}")
        assert resp.status_code == 204

        # Verify gone
        resp = await c.get(f"{BASE}/registros/{reg_id}")
        assert resp.status_code == 404


@pytest.mark.asyncio
async def test_filtros_registro() -> None:
    """Debe filtrar registros por estatus, sub_grupo y search (DNI)."""
    dni_a = f"8{_uid()}01A"[:8]
    dni_b = f"8{_uid()}01B"[:8]
    ids_creados = []
    async with await _cliente_auth() as c:
        # Create ACTIVO/OBRERO
        resp = await c.post(
            f"{BASE}/registros",
            json={
                "trabajador_dni": dni_a,
                "estatus": "ACTIVO",
                "sub_grupo": "OBRERO",
            },
        )
        assert resp.status_code == 201
        ids_creados.append(resp.json()["data"]["id"])

        # Create CESADO/EMPLEADO
        resp = await c.post(
            f"{BASE}/registros",
            json={
                "trabajador_dni": dni_b,
                "estatus": "CESADO",
                "sub_grupo": "EMPLEADO",
            },
        )
        assert resp.status_code == 201
        ids_creados.append(resp.json()["data"]["id"])

        # Filter by estatus=ACTIVO
        resp = await c.get(f"{BASE}/registros", params={"estatus": "ACTIVO"})
        assert resp.status_code == 200
        datos = resp.json()["data"]
        assert any(d["id"] == ids_creados[0] for d in datos)
        assert all(d["estatus"] == "ACTIVO" for d in datos)

        # Filter by sub_grupo=EMPLEADO
        resp = await c.get(f"{BASE}/registros", params={"sub_grupo": "EMPLEADO"})
        assert resp.status_code == 200
        datos = resp.json()["data"]
        assert any(d["id"] == ids_creados[1] for d in datos)
        assert all(d["sub_grupo"] == "EMPLEADO" for d in datos)

        # Search by DNI
        resp = await c.get(f"{BASE}/registros", params={"search": dni_a})
        assert resp.status_code == 200
        datos = resp.json()["data"]
        assert any(d["trabajador_dni"] == dni_a for d in datos)

        # Cleanup
        for eid in ids_creados:
            await c.delete(f"{BASE}/registros/{eid}")


@pytest.mark.asyncio
async def test_comportamiento_historico_crud() -> None:
    """Debe crear, listar (via detalle), actualizar y eliminar comportamiento historico."""
    dni = f"9{_uid()}001"[:8]
    async with await _cliente_auth() as c:
        # Create parent registro
        resp = await c.post(
            f"{BASE}/registros",
            json={
                "trabajador_dni": dni,
                "estatus": "ACTIVO",
                "sub_grupo": "OBRERO",
            },
        )
        assert resp.status_code == 201
        reg_id = resp.json()["data"]["id"]

        # Add 2 comportamiento entries
        ch1_payload = {
            "cargo": "Operador",
            "salario": 3500.00,
            "fecha_inicio": "2025-01-15",
            "numero_contrato": "C-001",
        }
        resp = await c.post(
            f"{BASE}/registros/{reg_id}/comportamiento", json=ch1_payload
        )
        assert resp.status_code == 201, resp.text
        ch1_id = resp.json()["data"]["id"]

        ch2_payload = {
            "cargo": "Supervisor",
            "salario": 5000.00,
            "fecha_inicio": "2025-03-01",
            "numero_contrato": "C-002",
        }
        resp = await c.post(
            f"{BASE}/registros/{reg_id}/comportamiento", json=ch2_payload
        )
        assert resp.status_code == 201, resp.text
        ch2_id = resp.json()["data"]["id"]

        # Get detail — verify 2 entries
        resp = await c.get(f"{BASE}/registros/{reg_id}")
        assert resp.status_code == 200
        detalle = resp.json()["data"]
        assert len(detalle["comportamiento_historico"]) == 2

        # Update one (set fecha_fin)
        resp = await c.put(
            f"{BASE}/registros/{reg_id}/comportamiento/{ch1_id}",
            json={"fecha_fin": "2025-02-28"},
        )
        assert resp.status_code == 200
        updated = resp.json()["data"]
        assert updated["fecha_fin"] == "2025-02-28"

        # Delete one
        resp = await c.delete(f"{BASE}/registros/{reg_id}/comportamiento/{ch2_id}")
        assert resp.status_code == 204

        # Verify only 1 left
        resp = await c.get(f"{BASE}/registros/{reg_id}")
        assert resp.status_code == 200
        detalle = resp.json()["data"]
        assert len(detalle["comportamiento_historico"]) == 1

        # Cleanup
        await c.delete(f"{BASE}/registros/{reg_id}")


@pytest.mark.asyncio
async def test_edt_tareo_listado() -> None:
    """GET /edt-tareo debe retornar lista (puede estar vacia)."""
    async with await _cliente_auth() as c:
        resp = await c.get(f"{BASE}/edt-tareo")
        assert resp.status_code == 200
        datos = resp.json()["data"]
        assert isinstance(datos, list)


@pytest.mark.asyncio
async def test_registro_sin_auth() -> None:
    """Debe retornar 401 sin autenticacion."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        resp = await c.get(f"{BASE}/registros")
    assert resp.status_code == 401
