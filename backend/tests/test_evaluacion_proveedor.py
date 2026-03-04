"""Tests para evaluacion de proveedor."""

import uuid

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from tests.conftest import obtener_token_admin


BASE = "/api/providers/evaluations"


def _uid() -> str:
    """Generate a short unique suffix for test data (max 4 chars)."""
    return uuid.uuid4().hex[:4].upper()


async def _cliente_auth() -> AsyncClient:
    token = await obtener_token_admin()
    c = AsyncClient(transport=ASGITransport(app=app), base_url="http://test")
    c.headers["Authorization"] = f"Bearer {token}"
    return c


@pytest.mark.asyncio
async def test_listar_criterios() -> None:
    """GET /criterios debe retornar criterios de evaluacion con campos requeridos."""
    async with await _cliente_auth() as c:
        resp = await c.get(f"{BASE}/criterios")
        assert resp.status_code == 200
        datos = resp.json()["data"]
        assert isinstance(datos, list)
        # The criteria catalog should have seed data (>=1 records)
        assert len(datos) >= 1
        # Verify shape of first record
        primer = datos[0]
        for campo in ("id", "aspecto", "parametro"):
            assert campo in primer


@pytest.mark.asyncio
async def test_evaluacion_proveedor_crud() -> None:
    """Debe crear, listar, obtener, actualizar y eliminar una evaluacion."""
    ruc = f"2050{_uid()}001"
    async with await _cliente_auth() as c:
        # Create
        payload = {
            "ruc": ruc,
            "razon_social": f"Proveedor Test {_uid()}",
            "precio": "Competitivo",
            "plazo_pago": "30 dias",
            "calidad": "Alta",
            "plazo_cumplimiento": "Puntual",
            "ubicacion": "Local",
            "atencion_cliente": "Buena",
            "sgc": "ISO 9001",
            "sgsst": "ISO 45001",
            "sga": "ISO 14001",
            "puntaje": 16,
            "observacion": "Evaluacion de prueba",
            "fecha_evaluacion": "2025-06-15T10:00:00",
            "evaluado_por": "admin",
        }
        resp = await c.post(f"{BASE}/evaluaciones", json=payload)
        assert resp.status_code == 201, resp.text
        eval_id = resp.json()["data"]["id"]

        # Verify auto-calculated resultado and accion
        resp = await c.get(f"{BASE}/evaluaciones/{eval_id}")
        assert resp.status_code == 200
        detalle = resp.json()["data"]
        assert detalle["puntaje"] == 16
        assert detalle["resultado"] == "Muy Bueno"
        assert detalle["accion"] == "Se continua trabajando"
        assert detalle["precio"] == "Competitivo"
        assert detalle["ruc"] == ruc

        # List (paginated)
        resp = await c.get(f"{BASE}/evaluaciones")
        assert resp.status_code == 200
        body = resp.json()
        assert "pagination" in body
        assert any(d["id"] == eval_id for d in body["data"])

        # Update puntaje -> resultado/accion should change
        resp = await c.put(
            f"{BASE}/evaluaciones/{eval_id}",
            json={"puntaje": 8},
        )
        assert resp.status_code == 200

        # Verify updated resultado
        resp = await c.get(f"{BASE}/evaluaciones/{eval_id}")
        assert resp.status_code == 200
        detalle = resp.json()["data"]
        assert detalle["puntaje"] == 8
        assert detalle["resultado"] == "Pesimo"
        assert detalle["accion"] == "Buscar otros proveedores"

        # Delete
        resp = await c.delete(f"{BASE}/evaluaciones/{eval_id}")
        assert resp.status_code == 204

        # Verify gone
        resp = await c.get(f"{BASE}/evaluaciones/{eval_id}")
        assert resp.status_code == 404


@pytest.mark.asyncio
async def test_scoring_ranges() -> None:
    """Crear evaluaciones con diferentes puntajes para verificar los 5 rangos."""
    rangos = [
        (8, "Pesimo", "Buscar otros proveedores"),
        (11, "Regular", "Se requiere mejora"),
        (14, "Bueno", "Se continua trabajando"),
        (17, "Muy Bueno", "Se continua trabajando"),
        (20, "Excelente", "Proveedor estrategico"),
    ]
    ids_creados = []
    async with await _cliente_auth() as c:
        for puntaje, resultado_esperado, accion_esperada in rangos:
            ruc = f"2060{_uid()}001"
            resp = await c.post(
                f"{BASE}/evaluaciones",
                json={
                    "ruc": ruc,
                    "razon_social": f"Test Scoring {puntaje}",
                    "puntaje": puntaje,
                },
            )
            assert resp.status_code == 201, f"Failed for puntaje={puntaje}: {resp.text}"
            eval_id = resp.json()["data"]["id"]
            ids_creados.append(eval_id)

            resp = await c.get(f"{BASE}/evaluaciones/{eval_id}")
            assert resp.status_code == 200
            detalle = resp.json()["data"]
            assert detalle["resultado"] == resultado_esperado, (
                f"puntaje={puntaje}: expected resultado={resultado_esperado}, got={detalle['resultado']}"
            )
            assert detalle["accion"] == accion_esperada, (
                f"puntaje={puntaje}: expected accion={accion_esperada}, got={detalle['accion']}"
            )

        # Cleanup
        for eid in ids_creados:
            await c.delete(f"{BASE}/evaluaciones/{eid}")


@pytest.mark.asyncio
async def test_filtrar_por_ruc() -> None:
    """Debe filtrar evaluaciones por RUC del proveedor."""
    ruc = f"2070{_uid()}001"
    async with await _cliente_auth() as c:
        # Create evaluation for this RUC
        resp = await c.post(
            f"{BASE}/evaluaciones",
            json={
                "ruc": ruc,
                "razon_social": "Proveedor Filtro RUC",
                "puntaje": 15,
            },
        )
        assert resp.status_code == 201
        eval_id = resp.json()["data"]["id"]

        # Filter by RUC
        resp = await c.get(f"{BASE}/evaluaciones/proveedor/{ruc}")
        assert resp.status_code == 200
        datos = resp.json()["data"]
        assert len(datos) >= 1
        assert all(d["ruc"] == ruc for d in datos)

        # Non-existent RUC returns empty
        resp = await c.get(f"{BASE}/evaluaciones/proveedor/00000000000")
        assert resp.status_code == 200
        assert resp.json()["data"] == []

        # Cleanup
        await c.delete(f"{BASE}/evaluaciones/{eval_id}")


@pytest.mark.asyncio
async def test_filtrar_por_resultado() -> None:
    """Debe filtrar evaluaciones por resultado."""
    ruc = f"2080{_uid()}001"
    async with await _cliente_auth() as c:
        # Create an "Excelente" evaluation
        resp = await c.post(
            f"{BASE}/evaluaciones",
            json={
                "ruc": ruc,
                "razon_social": "Proveedor Filtro Resultado",
                "puntaje": 20,
            },
        )
        assert resp.status_code == 201
        eval_id = resp.json()["data"]["id"]

        # Filter by resultado=Excelente
        resp = await c.get(f"{BASE}/evaluaciones", params={"resultado": "Excelente"})
        assert resp.status_code == 200
        datos = resp.json()["data"]
        assert any(d["id"] == eval_id for d in datos)
        assert all(d["resultado"] == "Excelente" for d in datos)

        # Cleanup
        await c.delete(f"{BASE}/evaluaciones/{eval_id}")


@pytest.mark.asyncio
async def test_evaluacion_sin_auth() -> None:
    """Debe retornar 401 sin autenticacion."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        resp = await c.get(f"{BASE}/evaluaciones")
    assert resp.status_code == 401
