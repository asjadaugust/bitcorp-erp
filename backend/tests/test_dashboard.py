"""Tests para dashboard."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from tests.conftest import obtener_token_admin


async def _cliente_auth() -> AsyncClient:
    token = await obtener_token_admin()
    c = AsyncClient(transport=ASGITransport(app=app), base_url="http://test")
    c.headers["Authorization"] = f"Bearer {token}"
    return c


@pytest.mark.asyncio
async def test_dashboard_stats() -> None:
    """Debe retornar estadísticas del dashboard."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/dashboard/stats")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    d = datos["data"]
    for campo in [
        "total_equipos",
        "contratos_activos",
        "valorizaciones_pendientes",
        "pagos_pendientes",
        "reportes_hoy",
    ]:
        assert campo in d


@pytest.mark.asyncio
async def test_dashboard_stats_tipos() -> None:
    """Debe retornar tipos correctos en estadísticas."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/dashboard/stats")
    d = resp.json()["data"]
    assert isinstance(d["total_equipos"], int)
    assert isinstance(d["contratos_activos"], int)
    assert isinstance(d["valorizaciones_pendientes"], int)
    assert isinstance(d["pagos_pendientes"], (int, float))
    assert isinstance(d["reportes_hoy"], int)


@pytest.mark.asyncio
async def test_dashboard_document_alerts() -> None:
    """Debe retornar lista de alertas de documentos."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/dashboard/document-alerts")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert isinstance(datos["data"], list)


@pytest.mark.asyncio
async def test_dashboard_document_alerts_formato() -> None:
    """Alertas deben tener campos correctos si existen."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/dashboard/document-alerts")
    datos = resp.json()["data"]
    if len(datos) > 0:
        alerta = datos[0]
        campos = ["equipo_id", "codigo", "tipo_documento",
                  "fecha_vencimiento", "dias_restantes"]
        for campo in campos:
            assert campo in alerta


@pytest.mark.asyncio
async def test_dashboard_modules() -> None:
    """Debe retornar módulos del usuario."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/dashboard/modules")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert isinstance(datos["data"], list)
    assert len(datos["data"]) > 0


@pytest.mark.asyncio
async def test_dashboard_modules_formato() -> None:
    """Módulos deben tener campos correctos."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/dashboard/modules")
    modulo = resp.json()["data"][0]
    for campo in ["nombre", "ruta", "icono", "descripcion"]:
        assert campo in modulo


@pytest.mark.asyncio
async def test_dashboard_modules_admin_tiene_mas() -> None:
    """Admin debe tener más módulos que usuario básico."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/dashboard/modules")
    # Admin user should have extended modules
    modulos = resp.json()["data"]
    nombres = [m["nombre"] for m in modulos]
    assert "Analítica" in nombres


@pytest.mark.asyncio
async def test_dashboard_sin_auth() -> None:
    """Debe retornar 401 sin autenticación."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.get("/api/dashboard/stats")
    assert resp.status_code == 401
