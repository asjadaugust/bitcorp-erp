"""Tests para checklists de inspección."""

from uuid import uuid4

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
async def test_checklists_listar_plantillas() -> None:
    """Debe retornar lista paginada de plantillas."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/checklists/templates")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert "pagination" in datos


@pytest.mark.asyncio
async def test_checklists_listar_plantillas_filtro_tipo() -> None:
    """Debe filtrar plantillas por tipo_equipo."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/checklists/templates?tipo_equipo=EXCAVADORA")
    assert resp.status_code == 200
    assert resp.json()["success"] is True


@pytest.mark.asyncio
async def test_checklists_crear_plantilla() -> None:
    """Debe crear una nueva plantilla."""
    async with await _cliente_auth() as c:
        resp = await c.post(
            "/api/checklists/templates",
            json={
                "codigo": f"CHK-T-{uuid4().hex[:8]}",
                "nombre": f"Checklist de Prueba {uuid4().hex[:6]}",
                "tipo_equipo": "TEST",
                "frecuencia": "DIARIO",
            },
        )
    assert resp.status_code == 201
    datos = resp.json()
    assert datos["success"] is True
    assert "id" in datos["data"]


@pytest.mark.asyncio
async def test_checklists_crear_plantilla_duplicada() -> None:
    """Debe retornar 409 para código duplicado."""
    async with await _cliente_auth() as c:
        dup_code = f"CHK-D-{uuid4().hex[:8]}"
        payload = {"codigo": dup_code, "nombre": "Dup"}
        await c.post("/api/checklists/templates", json=payload)
        resp = await c.post("/api/checklists/templates", json=payload)
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_checklists_obtener_plantilla_existente() -> None:
    """Debe retornar plantilla con items (de los seed data)."""
    async with await _cliente_auth() as c:
        # Template ID 1 exists from seed data
        resp = await c.get("/api/checklists/templates/1")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert "items" in datos["data"]


@pytest.mark.asyncio
async def test_checklists_obtener_plantilla_inexistente() -> None:
    """Debe retornar 404 para plantilla inexistente."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/checklists/templates/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_checklists_actualizar_plantilla_inexistente() -> None:
    """Debe retornar 404 al actualizar plantilla inexistente."""
    async with await _cliente_auth() as c:
        resp = await c.put(
            "/api/checklists/templates/99999",
            json={"nombre": "Updated"},
        )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_checklists_listar_inspecciones() -> None:
    """Debe retornar lista paginada de inspecciones."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/checklists/inspections")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert "pagination" in datos


@pytest.mark.asyncio
async def test_checklists_listar_inspecciones_filtro_estado() -> None:
    """Debe filtrar inspecciones por estado."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/checklists/inspections?estado=COMPLETADO")
    assert resp.status_code == 200
    assert resp.json()["success"] is True


@pytest.mark.asyncio
async def test_checklists_obtener_inspeccion_inexistente() -> None:
    """Debe retornar 404 para inspección inexistente."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/checklists/inspections/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_checklists_estadisticas() -> None:
    """Debe retornar estadísticas de checklists."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/checklists/stats")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert "total_plantillas" in datos["data"]
    assert "total_inspecciones" in datos["data"]


@pytest.mark.asyncio
async def test_checklists_sin_auth() -> None:
    """Debe retornar 401 sin autenticación."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.get("/api/checklists/templates")
    assert resp.status_code == 401
