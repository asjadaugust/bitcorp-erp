"""Tests para reportes (partes diarios)."""

import time
from datetime import date, timedelta

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from tests.conftest import obtener_token_admin

# Unique suffix per test run to avoid collisions
_TS = str(int(time.time()))[-6:]


async def _cliente_auth() -> AsyncClient:
    token = await obtener_token_admin()
    c = AsyncClient(transport=ASGITransport(app=app), base_url="http://test")
    c.headers["Authorization"] = f"Bearer {token}"
    return c


async def _crear_equipo(c: AsyncClient, codigo: str) -> int:
    """Helper: crear equipo y retornar su ID."""
    resp = await c.post("/api/equipment/", json={"codigo_equipo": codigo})
    assert resp.status_code == 201, f"Failed to create equipment: {resp.text}"
    return resp.json()["data"]["id"]


async def _crear_reporte(
    c: AsyncClient,
    equipo_id: int,
    fecha: str | None = None,
    **kwargs: object,
) -> dict[str, object]:
    """Helper: crear reporte y retornar respuesta completa."""
    payload: dict[str, object] = {
        "equipo_id": equipo_id,
        "fecha": fecha or str(date.today()),
        "horas_trabajadas": 8.0,
        **kwargs,
    }
    resp = await c.post("/api/reports/", json=payload)
    return resp.json()


# ─── Listar ──────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_listar_reportes() -> None:
    """Debe retornar lista paginada de reportes."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/reports/")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert "data" in datos
    assert "pagination" in datos


@pytest.mark.asyncio
async def test_listar_reportes_con_filtro_estado() -> None:
    """Debe filtrar reportes por estado."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/reports/?estado=BORRADOR")
    assert resp.status_code == 200
    assert resp.json()["success"] is True


@pytest.mark.asyncio
async def test_listar_reportes_paginacion() -> None:
    """Debe paginar correctamente."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/reports/?page=1&limit=5")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["pagination"]["page"] == 1
    assert datos["pagination"]["limit"] == 5


@pytest.mark.asyncio
async def test_listar_reportes_filtro_fecha() -> None:
    """Debe filtrar por rango de fechas."""
    async with await _cliente_auth() as c:
        resp = await c.get(
            "/api/reports/?fecha_inicio=2026-01-01&fecha_fin=2026-12-31"
        )
    assert resp.status_code == 200
    assert resp.json()["success"] is True


# ─── CRUD: Crear ─────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_crear_reporte() -> None:
    """Debe crear un reporte nuevo."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-RPT-{_TS}-001")
        resp = await c.post(
            "/api/reports/",
            json={
                "equipo_id": eq_id,
                "fecha": str(date.today()),
                "horas_trabajadas": 8.0,
                "turno": "DIA",
                "observaciones": "Trabajo normal",
            },
        )
    assert resp.status_code == 201
    datos = resp.json()
    assert datos["success"] is True
    assert datos["data"]["id"] > 0


@pytest.mark.asyncio
async def test_crear_reporte_con_hijos() -> None:
    """Debe crear reporte con actividades, producción y demoras."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-RPT-{_TS}-002")
        resp = await c.post(
            "/api/reports/",
            json={
                "equipo_id": eq_id,
                "fecha": str(date.today()),
                "horas_trabajadas": 10.0,
                "actividades": [
                    {"codigo": "ACT-01", "descripcion": "Excavación"},
                    {"codigo": "ACT-02", "descripcion": "Transporte"},
                ],
                "produccion": [
                    {"numero": 1, "material_trabajado_descripcion": "Tierra"},
                    {"numero": 2, "material_trabajado_descripcion": "Roca"},
                ],
                "demoras_operativas": [
                    {"codigo": "DO-01"},
                ],
                "demoras_mecanicas": [
                    {"codigo": "DM-01", "descripcion": "Falla hidráulica"},
                ],
                "otros_eventos": [
                    {"codigo": "OE-01", "descripcion": "Lluvia"},
                ],
            },
        )
    assert resp.status_code == 201
    reporte_id = resp.json()["data"]["id"]
    # GET to verify children
    async with await _cliente_auth() as c2:
        detail = await c2.get(f"/api/reports/{reporte_id}")
    datos = detail.json()["data"]
    assert len(datos["actividades"]) == 2
    assert len(datos["produccion"]) == 2
    assert len(datos["demoras_operativas"]) == 1
    assert len(datos["demoras_mecanicas"]) == 1
    assert len(datos["otros_eventos"]) == 1


@pytest.mark.asyncio
async def test_crear_reporte_auto_calc_horas() -> None:
    """Debe auto-calcular horas desde horómetros."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-RPT-{_TS}-003")
        resp = await c.post(
            "/api/reports/",
            json={
                "equipo_id": eq_id,
                "fecha": str(date.today()),
                "horometro_inicial": 1000.0,
                "horometro_final": 1008.5,
            },
        )
    assert resp.status_code == 201
    reporte_id = resp.json()["data"]["id"]
    # GET to verify auto-calc
    async with await _cliente_auth() as c2:
        detail = await c2.get(f"/api/reports/{reporte_id}")
    datos = detail.json()["data"]
    assert datos["horas_trabajadas"] == 8.5


@pytest.mark.asyncio
async def test_crear_reporte_fecha_futura() -> None:
    """Debe rechazar fecha futura."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-RPT-{_TS}-004")
        future = str(date.today() + timedelta(days=5))
        resp = await c.post(
            "/api/reports/",
            json={"equipo_id": eq_id, "fecha": future, "horas_trabajadas": 8},
        )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_crear_reporte_horas_invalidas() -> None:
    """Debe rechazar horas fuera de rango (0-24)."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-RPT-{_TS}-005")
        resp = await c.post(
            "/api/reports/",
            json={
                "equipo_id": eq_id,
                "fecha": str(date.today()),
                "horas_trabajadas": 25,
            },
        )
    assert resp.status_code == 400


# ─── CRUD: Obtener ───────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_obtener_reporte_por_id() -> None:
    """Debe obtener reporte por ID con detalle."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-RGET-{_TS}")
        data = await _crear_reporte(c, eq_id, observaciones="Test detalle")
        reporte_id = data["data"]["id"]
        resp = await c.get(f"/api/reports/{reporte_id}")
    assert resp.status_code == 200
    datos = resp.json()["data"]
    assert datos["id"] == reporte_id
    assert datos["observaciones"] == "Test detalle"
    # Should have child arrays (empty)
    assert "actividades" in datos
    assert "produccion" in datos


@pytest.mark.asyncio
async def test_reporte_inexistente() -> None:
    """Debe retornar 404 para reporte inexistente."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/reports/99999")
    assert resp.status_code == 404


# ─── CRUD: Actualizar ────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_actualizar_reporte() -> None:
    """Debe actualizar campos del reporte."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-RUPD-{_TS}")
        data = await _crear_reporte(c, eq_id)
        reporte_id = data["data"]["id"]
        resp = await c.put(
            f"/api/reports/{reporte_id}",
            json={"observaciones": "Actualizado", "turno": "NOCHE"},
        )
    assert resp.status_code == 200
    datos = resp.json()["data"]
    assert datos["observaciones"] == "Actualizado"
    assert datos["turno"] == "NOCHE"


@pytest.mark.asyncio
async def test_actualizar_reporte_reemplazar_hijos() -> None:
    """Debe reemplazar actividades al actualizar."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-RUPD2-{_TS}")
        data = await _crear_reporte(
            c, eq_id,
            actividades=[{"codigo": "A1", "descripcion": "Original"}],
        )
        reporte_id = data["data"]["id"]
        resp = await c.put(
            f"/api/reports/{reporte_id}",
            json={
                "actividades": [
                    {"codigo": "A2", "descripcion": "Reemplazada"},
                    {"codigo": "A3", "descripcion": "Nueva"},
                ],
            },
        )
    assert resp.status_code == 200
    datos = resp.json()["data"]
    assert len(datos["actividades"]) == 2
    codigos = {a["codigo"] for a in datos["actividades"]}
    assert codigos == {"A2", "A3"}


# ─── CRUD: Eliminar ──────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_eliminar_reporte() -> None:
    """Debe eliminar (hard delete) un reporte."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-RDEL-{_TS}")
        data = await _crear_reporte(c, eq_id)
        reporte_id = data["data"]["id"]
        resp = await c.delete(f"/api/reports/{reporte_id}")
    assert resp.status_code == 204


@pytest.mark.asyncio
async def test_eliminar_reporte_inexistente() -> None:
    """Debe retornar 404 al eliminar reporte inexistente."""
    async with await _cliente_auth() as c:
        resp = await c.delete("/api/reports/99999")
    assert resp.status_code == 404


# ─── Workflow: Enviar ────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_enviar_reporte() -> None:
    """Debe enviar reporte BORRADOR → ENVIADO."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-RENV-{_TS}")
        data = await _crear_reporte(c, eq_id)
        reporte_id = data["data"]["id"]
        resp = await c.post(f"/api/reports/{reporte_id}/enviar")
    assert resp.status_code == 200
    assert resp.json()["data"]["estado"] == "ENVIADO"


@pytest.mark.asyncio
async def test_enviar_reporte_no_borrador() -> None:
    """Debe rechazar enviar reporte que no está en BORRADOR."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-RENV2-{_TS}")
        data = await _crear_reporte(c, eq_id)
        reporte_id = data["data"]["id"]
        # Send first time → ENVIADO
        await c.post(f"/api/reports/{reporte_id}/enviar")
        # Try again → should fail
        resp = await c.post(f"/api/reports/{reporte_id}/enviar")
    assert resp.status_code == 409


# ─── Workflow: Aprobar ───────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_aprobar_reporte() -> None:
    """Debe aprobar un reporte."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-RAPR-{_TS}")
        data = await _crear_reporte(c, eq_id)
        reporte_id = data["data"]["id"]
        resp = await c.post(f"/api/reports/{reporte_id}/approve")
    assert resp.status_code == 200
    assert resp.json()["data"]["estado"] == "APROBADO"


# ─── Workflow: Rechazar ──────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_rechazar_reporte() -> None:
    """Debe rechazar un reporte con motivo."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-RREJ-{_TS}")
        data = await _crear_reporte(c, eq_id)
        reporte_id = data["data"]["id"]
        resp = await c.post(
            f"/api/reports/{reporte_id}/reject",
            json={"reason": "Datos incompletos"},
        )
    assert resp.status_code == 200
    datos = resp.json()["data"]
    assert datos["estado"] == "RECHAZADO"
    assert datos["observaciones_correcciones"] == "Datos incompletos"


@pytest.mark.asyncio
async def test_rechazar_sin_motivo() -> None:
    """Debe rechazar request sin motivo (Pydantic validation)."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-RREJ2-{_TS}")
        data = await _crear_reporte(c, eq_id)
        reporte_id = data["data"]["id"]
        resp = await c.post(
            f"/api/reports/{reporte_id}/reject",
            json={"reason": ""},
        )
    assert resp.status_code == 400


# ─── Firmar residente ───────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_firmar_residente() -> None:
    """Debe registrar firma del residente."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-RFIR-{_TS}")
        data = await _crear_reporte(c, eq_id)
        reporte_id = data["data"]["id"]
        resp = await c.post(
            f"/api/reports/{reporte_id}/firmar-residente",
            json={"firma_residente": "data:image/png;base64,ABC123"},
        )
    assert resp.status_code == 200
    assert resp.json()["data"]["firma_residente"] == "data:image/png;base64,ABC123"


# ─── Estado de recepción ────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_estado_recepcion() -> None:
    """Debe retornar estado de recepción por equipo."""
    async with await _cliente_auth() as c:
        resp = await c.get(
            "/api/reports/reception-status"
            "?fecha_desde=2026-02-01&fecha_hasta=2026-02-28"
        )
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    # Response is a list (possibly empty if no active equipment)
    assert isinstance(datos["data"], list)


@pytest.mark.asyncio
async def test_estado_recepcion_sin_fechas() -> None:
    """Debe rechazar sin parámetros requeridos."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/reports/reception-status")
    assert resp.status_code == 400


# ─── Seguimiento de inspección ──────────────────────────────────────────


@pytest.mark.asyncio
async def test_seguimiento_inspeccion() -> None:
    """Debe retornar seguimiento de observaciones mecánicas."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/reports/inspection-tracking")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert isinstance(datos["data"], list)


# ─── Auth ────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_reportes_sin_auth() -> None:
    """Debe retornar 401 sin token."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        resp = await c.get("/api/reports/")
    assert resp.status_code == 401
