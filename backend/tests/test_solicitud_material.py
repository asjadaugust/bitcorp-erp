"""Tests para solicitudes de material, requerimientos y cotizaciones logisticas."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from tests.conftest import obtener_token_admin

BASE = "/api/logistics/requests"


async def _cliente_auth() -> AsyncClient:
    token = await obtener_token_admin()
    c = AsyncClient(transport=ASGITransport(app=app), base_url="http://test")
    c.headers["Authorization"] = f"Bearer {token}"
    return c


@pytest.mark.asyncio
async def test_categorias_listado() -> None:
    """Debe listar categorias (read-only)."""
    async with await _cliente_auth() as c:
        resp = await c.get(f"{BASE}/categorias")
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert body["success"] is True
        assert isinstance(body["data"], list)


@pytest.mark.asyncio
async def test_solicitud_material_crud() -> None:
    """Debe crear, listar, obtener, actualizar y eliminar una solicitud de material."""
    async with await _cliente_auth() as c:
        # Create with 2 detail lines
        resp = await c.post(
            f"{BASE}/solicitudes-material",
            json={
                "motivo": "Compra urgente",
                "fecha_solicitud": "2025-06-01",
                "solicitado_por": "Juan Test",
                "detalles": [
                    {
                        "producto": "Tornillos 1/4",
                        "cantidad": 100,
                        "unidad_medida": "UND",
                        "fecha_requerida": "2025-06-05",
                        "marca_sugerida": "Stanley",
                        "descripcion": "Tornillos galvanizados",
                        "estatus": "PENDIENTE",
                    },
                    {
                        "producto": "Clavos 2 pulgadas",
                        "cantidad": 200,
                        "unidad_medida": "UND",
                        "fecha_requerida": "2025-06-05",
                        "estatus": "PENDIENTE",
                    },
                ],
            },
        )
        assert resp.status_code == 201, resp.text
        sol_id = resp.json()["data"]["id"]

        # List (paginated)
        resp = await c.get(f"{BASE}/solicitudes-material?page=1&limit=10")
        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert "pagination" in body
        assert body["pagination"]["page"] == 1
        assert any(d["id"] == sol_id for d in body["data"])

        # Get detail (with nested detalles)
        resp = await c.get(f"{BASE}/solicitudes-material/{sol_id}")
        assert resp.status_code == 200
        detalle = resp.json()["data"]
        assert detalle["motivo"] == "Compra urgente"
        assert detalle["solicitado_por"] == "Juan Test"
        assert len(detalle["detalles"]) == 2
        assert detalle["detalles"][0]["producto"] in (
            "Tornillos 1/4",
            "Clavos 2 pulgadas",
        )

        # Update header
        resp = await c.put(
            f"{BASE}/solicitudes-material/{sol_id}",
            json={"motivo": "Compra regular"},
        )
        assert resp.status_code == 200

        # Verify update
        resp = await c.get(f"{BASE}/solicitudes-material/{sol_id}")
        assert resp.status_code == 200
        assert resp.json()["data"]["motivo"] == "Compra regular"

        # Delete (cascade detail lines)
        resp = await c.delete(f"{BASE}/solicitudes-material/{sol_id}")
        assert resp.status_code == 204


@pytest.mark.asyncio
async def test_requerimiento_crud() -> None:
    """Debe crear, listar, obtener, actualizar y eliminar un requerimiento con auto-increment."""
    async with await _cliente_auth() as c:
        # Create first requerimiento with 2 detail lines
        resp = await c.post(
            f"{BASE}/requerimientos",
            json={
                "motivo": "Requerimiento obra norte",
                "fecha_requerimiento": "2025-07-01",
                "solicitado_por": "Maria Test",
                "detalles": [
                    {
                        "producto": "Cemento Portland",
                        "cantidad": 50,
                        "unidad_medida": "BLS",
                        "fecha_requerida": "2025-07-10",
                        "estatus": "PENDIENTE",
                    },
                    {
                        "producto": "Arena fina",
                        "cantidad": 10,
                        "unidad_medida": "M3",
                        "fecha_requerida": "2025-07-10",
                        "estatus": "PENDIENTE",
                    },
                ],
            },
        )
        assert resp.status_code == 201, resp.text
        req_id_1 = resp.json()["data"]["id"]

        # Get detail and check auto-increment numero_requerimiento
        resp = await c.get(f"{BASE}/requerimientos/{req_id_1}")
        assert resp.status_code == 200
        detalle_1 = resp.json()["data"]
        num_1 = detalle_1["numero_requerimiento"]
        assert num_1 is not None
        assert len(detalle_1["detalles"]) == 2

        # Create second requerimiento to verify auto-increment
        resp = await c.post(
            f"{BASE}/requerimientos",
            json={
                "motivo": "Requerimiento obra sur",
                "fecha_requerimiento": "2025-07-15",
                "solicitado_por": "Pedro Test",
                "detalles": [],
            },
        )
        assert resp.status_code == 201
        req_id_2 = resp.json()["data"]["id"]

        resp = await c.get(f"{BASE}/requerimientos/{req_id_2}")
        assert resp.status_code == 200
        num_2 = resp.json()["data"]["numero_requerimiento"]
        assert num_2 == num_1 + 1

        # List (paginated)
        resp = await c.get(f"{BASE}/requerimientos?page=1&limit=10")
        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert "pagination" in body

        # Update header
        resp = await c.put(
            f"{BASE}/requerimientos/{req_id_1}",
            json={"motivo": "Requerimiento obra norte actualizado"},
        )
        assert resp.status_code == 200

        # Delete both (cascade detail lines)
        resp = await c.delete(f"{BASE}/requerimientos/{req_id_1}")
        assert resp.status_code == 204

        resp = await c.delete(f"{BASE}/requerimientos/{req_id_2}")
        assert resp.status_code == 204


@pytest.mark.asyncio
async def test_cotizaciones_listado() -> None:
    """Debe listar cotizaciones logisticas (read-only)."""
    async with await _cliente_auth() as c:
        resp = await c.get(f"{BASE}/cotizaciones-logistica")
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert body["success"] is True
        assert isinstance(body["data"], list)


@pytest.mark.asyncio
async def test_solicitud_material_sin_auth() -> None:
    """Debe retornar 401 sin autenticacion."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        resp = await c.get(f"{BASE}/solicitudes-material")
    assert resp.status_code == 401
