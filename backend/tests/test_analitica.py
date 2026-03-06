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
    campos = ["equipo_id", "codigo_equipo", "horas_totales", "horas_trabajadas",
              "horas_inactivas", "tasa_utilizacion", "costo_por_hora", "costo_total",
              "periodo_inicio", "periodo_fin"]
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
        resp = await c.get(f"/api/analytics/equipment/{equipo_id}/utilization?fecha_inicio=2025-01-01&fecha_fin=2025-03-31")
    assert resp.status_code == 200
    assert resp.json()["success"] is True


@pytest.mark.asyncio
async def test_utilizacion_equipo_inexistente() -> None:
    """Debe retornar estructura válida para equipo sin reportes."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/analytics/equipment/99999/utilization")
    assert resp.status_code == 200
    d = resp.json()["data"]
    assert isinstance(d["horas_totales"], (int, float))
    assert isinstance(d["horas_trabajadas"], (int, float))


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
        for campo in ["fecha", "tasa_utilizacion", "horas_trabajadas", "costo"]:
            assert campo in datos[0]


@pytest.mark.asyncio
async def test_tendencia_utilizacion_meses() -> None:
    """Debe aceptar parámetro months."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/analytics/equipment/1/utilization-trend?fecha_inicio=2025-01-01&fecha_fin=2025-03-31")
    assert resp.status_code == 200


# --- Utilización de flota ---


@pytest.mark.asyncio
async def test_utilizacion_flota() -> None:
    """Debe retornar utilización de toda la flota."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/analytics/fleet/utilization")
    assert resp.status_code == 200
    d = resp.json()["data"]
    for campo in ["total_equipos", "equipos_activos", "tasa_utilizacion_promedio", "costo_total",
                  "mejores_equipos", "equipos_sub_utilizados"]:
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
    for campo in ["equipo_id", "total_combustible_consumido", "promedio_combustible_por_hora",
                  "costo_total_combustible", "costo_promedio_por_hora", "eficiencia"]:
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
    assert isinstance(d["horas_totales"], (int, float))
    assert isinstance(d["tasa_utilizacion"], (int, float))
