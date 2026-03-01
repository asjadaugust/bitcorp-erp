"""Tests para analítica de equipos."""

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
async def test_utilizacion_equipo_existente() -> None:
    """Debe retornar utilización de un equipo existente."""
    async with await _cliente_auth() as c:
        # Primero obtener un equipo existente
        resp_eq = await c.get("/api/equipment/")
        equipos = resp_eq.json()["data"]
        if not equipos:
            pytest.skip("No hay equipos en la BD")
        equipo_id = equipos[0]["id"]
        resp = await c.get(f"/api/analytics/equipment/{equipo_id}/utilization")
    assert resp.status_code == 200
    d = resp.json()["data"]
    campos = ["equipo_id", "total_horas", "dias_con_reporte",
              "promedio_diario", "utilizacion_porcentaje"]
    for campo in campos:
        assert campo in d


@pytest.mark.asyncio
async def test_utilizacion_equipo_periodo() -> None:
    """Debe aceptar parámetro de periodo."""
    async with await _cliente_auth() as c:
        resp_eq = await c.get("/api/equipment/")
        equipos = resp_eq.json()["data"]
        if not equipos:
            pytest.skip("No hay equipos")
        equipo_id = equipos[0]["id"]
        resp = await c.get(f"/api/analytics/equipment/{equipo_id}/utilization?period=90d")
    assert resp.status_code == 200
    assert resp.json()["success"] is True


@pytest.mark.asyncio
async def test_utilizacion_equipo_inexistente() -> None:
    """Debe retornar datos vacíos para equipo sin reportes."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/analytics/equipment/99999/utilization")
    assert resp.status_code == 200
    d = resp.json()["data"]
    assert d["total_horas"] == 0
    assert d["dias_con_reporte"] == 0


# --- Tendencia de utilización ---


@pytest.mark.asyncio
async def test_tendencia_utilizacion() -> None:
    """Debe retornar tendencia mensual."""
    async with await _cliente_auth() as c:
        resp_eq = await c.get("/api/equipment/")
        equipos = resp_eq.json()["data"]
        if not equipos:
            pytest.skip("No hay equipos")
        equipo_id = equipos[0]["id"]
        resp = await c.get(f"/api/analytics/equipment/{equipo_id}/utilization-trend")
    assert resp.status_code == 200
    datos = resp.json()["data"]
    assert isinstance(datos, list)
    if len(datos) > 0:
        for campo in ["mes", "total_horas", "dias_con_reporte", "promedio_diario"]:
            assert campo in datos[0]


@pytest.mark.asyncio
async def test_tendencia_utilizacion_meses() -> None:
    """Debe aceptar parámetro months."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/analytics/equipment/1/utilization-trend?months=3")
    assert resp.status_code == 200


# --- Utilización de flota ---


@pytest.mark.asyncio
async def test_utilizacion_flota() -> None:
    """Debe retornar utilización de toda la flota."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/analytics/fleet/utilization")
    assert resp.status_code == 200
    d = resp.json()["data"]
    for campo in ["total_equipos", "equipos_con_actividad", "total_horas", "promedio_por_equipo"]:
        assert campo in d
    assert isinstance(d["total_equipos"], int)


# --- Combustible ---


@pytest.mark.asyncio
async def test_metricas_combustible() -> None:
    """Debe retornar métricas de combustible."""
    async with await _cliente_auth() as c:
        resp_eq = await c.get("/api/equipment/")
        equipos = resp_eq.json()["data"]
        if not equipos:
            pytest.skip("No hay equipos")
        equipo_id = equipos[0]["id"]
        resp = await c.get(f"/api/analytics/equipment/{equipo_id}/fuel")
    assert resp.status_code == 200
    d = resp.json()["data"]
    for campo in ["equipo_id", "total_galones", "costo_total", "galones_por_hora"]:
        assert campo in d


@pytest.mark.asyncio
async def test_tendencia_combustible() -> None:
    """Debe retornar tendencia mensual de combustible."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/analytics/equipment/1/fuel-trend")
    assert resp.status_code == 200
    assert isinstance(resp.json()["data"], list)


# --- Mantenimiento ---


@pytest.mark.asyncio
async def test_metricas_mantenimiento() -> None:
    """Debe retornar métricas de mantenimiento."""
    async with await _cliente_auth() as c:
        resp_eq = await c.get("/api/equipment/")
        equipos = resp_eq.json()["data"]
        if not equipos:
            pytest.skip("No hay equipos")
        equipo_id = equipos[0]["id"]
        resp = await c.get(f"/api/analytics/equipment/{equipo_id}/maintenance")
    assert resp.status_code == 200
    d = resp.json()["data"]
    for campo in ["equipo_id", "total_mantenimientos", "costo_total", "mantenimientos_pendientes"]:
        assert campo in d


@pytest.mark.asyncio
async def test_analitica_sin_auth() -> None:
    """Debe retornar 401 sin autenticación."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.get("/api/analytics/fleet/utilization")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_metricas_mantenimiento_formato() -> None:
    """Métricas de mantenimiento deben tener tipos correctos."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/analytics/equipment/1/maintenance")
    d = resp.json()["data"]
    assert isinstance(d["total_mantenimientos"], int)
    assert isinstance(d["costo_total"], (int, float))
    assert isinstance(d["mantenimientos_pendientes"], int)


@pytest.mark.asyncio
async def test_analitica_tipos_numericos() -> None:
    """Métricas deben ser numéricas."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/analytics/equipment/99999/utilization")
    d = resp.json()["data"]
    assert isinstance(d["total_horas"], (int, float))
    assert isinstance(d["utilizacion_porcentaje"], (int, float))
