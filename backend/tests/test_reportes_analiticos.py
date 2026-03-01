"""Tests para reportes analíticos."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from tests.conftest import obtener_token_admin


async def _cliente_auth() -> AsyncClient:
    token = await obtener_token_admin()
    c = AsyncClient(transport=ASGITransport(app=app), base_url="http://test")
    c.headers["Authorization"] = f"Bearer {token}"
    return c


# --- Utilización de equipo ---


@pytest.mark.asyncio
async def test_utilizacion_equipo_reporte() -> None:
    """Debe retornar reporte de utilización."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/reporting/equipment-utilization")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert isinstance(datos["data"], list)


@pytest.mark.asyncio
async def test_utilizacion_equipo_con_fechas() -> None:
    """Debe aceptar filtros de fecha."""
    async with await _cliente_auth() as c:
        resp = await c.get(
            "/api/reporting/equipment-utilization?fecha_inicio=2025-01-01&fecha_fin=2026-12-31"
        )
    assert resp.status_code == 200
    assert resp.json()["success"] is True


@pytest.mark.asyncio
async def test_utilizacion_equipo_filtro_equipo() -> None:
    """Debe filtrar por equipo_id."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/reporting/equipment-utilization?equipo_id=1")
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_utilizacion_equipo_grupo_mensual() -> None:
    """Debe agrupar por mes."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/reporting/equipment-utilization?group_by=monthly")
    assert resp.status_code == 200
    datos = resp.json()["data"]
    if len(datos) > 0:
        for campo in ["equipo_id", "codigo_equipo", "total_horas", "periodo"]:
            assert campo in datos[0]


# --- Mantenimiento ---


@pytest.mark.asyncio
async def test_mantenimiento_reporte() -> None:
    """Debe retornar reporte paginado de mantenimiento."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/reporting/maintenance")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert "pagination" in datos


@pytest.mark.asyncio
async def test_mantenimiento_con_filtros() -> None:
    """Debe aceptar filtros de tipo y estado."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/reporting/maintenance?tipo=PREVENTIVO&estado=PROGRAMADO")
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_mantenimiento_formato() -> None:
    """Elementos deben tener campos correctos."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/reporting/maintenance")
    datos = resp.json()["data"]
    if len(datos) > 0:
        item = datos[0]
        for campo in ["id", "equipo_id", "tipo_mantenimiento", "estado"]:
            assert campo in item


# --- Inventario ---


@pytest.mark.asyncio
async def test_inventario_reporte() -> None:
    """Debe retornar reporte de inventario."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/reporting/inventory")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert "pagination" in datos


@pytest.mark.asyncio
async def test_inventario_paginacion() -> None:
    """Paginación debe funcionar correctamente."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/reporting/inventory?page=1&limit=10")
    assert resp.status_code == 200
    pag = resp.json()["pagination"]
    assert pag["page"] == 1
    assert pag["limit"] == 10


# --- Hoja de operador ---


@pytest.mark.asyncio
async def test_hoja_operador_reporte() -> None:
    """Debe retornar reporte de hoja de operador."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/reporting/operator-timesheet")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert "pagination" in datos


@pytest.mark.asyncio
async def test_hoja_operador_con_fechas() -> None:
    """Debe aceptar filtro de fechas."""
    async with await _cliente_auth() as c:
        resp = await c.get(
            "/api/reporting/operator-timesheet?fecha_inicio=2025-01-01&fecha_fin=2026-12-31"
        )
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_hoja_operador_filtro_trabajador() -> None:
    """Debe filtrar por trabajador_id."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/reporting/operator-timesheet?trabajador_id=1")
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_hoja_operador_formato() -> None:
    """Elementos deben tener campos correctos."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/reporting/operator-timesheet")
    datos = resp.json()["data"]
    if len(datos) > 0:
        item = datos[0]
        for campo in ["trabajador_id", "nombres", "fecha", "equipo_id", "horas_trabajadas"]:
            assert campo in item


# --- Mantenimiento paginación ---


@pytest.mark.asyncio
async def test_mantenimiento_paginacion() -> None:
    """Paginación de mantenimiento debe funcionar correctamente."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/reporting/maintenance?page=1&limit=5")
    assert resp.status_code == 200
    pag = resp.json()["pagination"]
    assert pag["page"] == 1
    assert pag["limit"] == 5


# --- Auth ---


@pytest.mark.asyncio
async def test_reportes_sin_auth() -> None:
    """Debe retornar 401 sin autenticación."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.get("/api/reporting/equipment-utilization")
    assert resp.status_code == 401
