"""Tests para tareas programadas (scheduling)."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from tests.conftest import obtener_token_admin


async def _cliente_auth() -> AsyncClient:
    token = await obtener_token_admin()
    c = AsyncClient(transport=ASGITransport(app=app), base_url="http://test")
    c.headers["Authorization"] = f"Bearer {token}"
    return c


async def _crear_tarea(c: AsyncClient) -> int:
    """Helper: crear una tarea y retornar su ID."""
    resp = await c.post(
        "/api/scheduling/tasks",
        json={
            "title": "Tarea de prueba",
            "task_type": "maintenance",
            "start_date": "2026-03-15",
            "priority": "medium",
            "equipo_id": 1,
        },
    )
    return resp.json()["data"]["id"]


@pytest.mark.asyncio
async def test_tareas_listar() -> None:
    """Debe retornar lista paginada de tareas."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/scheduling/tasks")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert "pagination" in datos


@pytest.mark.asyncio
async def test_tareas_listar_filtro_tipo() -> None:
    """Debe filtrar tareas por tipo."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/scheduling/tasks?task_type=maintenance")
    assert resp.status_code == 200
    assert resp.json()["success"] is True


@pytest.mark.asyncio
async def test_tareas_crear() -> None:
    """Debe crear una nueva tarea."""
    async with await _cliente_auth() as c:
        tarea_id = await _crear_tarea(c)
    assert tarea_id > 0


@pytest.mark.asyncio
async def test_tareas_obtener_inexistente() -> None:
    """Debe retornar 404 para tarea inexistente."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/scheduling/tasks/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_tareas_completar() -> None:
    """Debe completar una tarea."""
    async with await _cliente_auth() as c:
        tarea_id = await _crear_tarea(c)
        resp = await c.post(
            f"/api/scheduling/tasks/{tarea_id}/complete",
            json={"notas": "Completado exitosamente"},
        )
    assert resp.status_code == 200
    assert resp.json()["data"]["status"] == "completed"


@pytest.mark.asyncio
async def test_tareas_cancelar() -> None:
    """Debe cancelar una tarea."""
    async with await _cliente_auth() as c:
        tarea_id = await _crear_tarea(c)
        resp = await c.post(f"/api/scheduling/tasks/{tarea_id}/cancel")
    assert resp.status_code == 200
    assert resp.json()["data"]["status"] == "cancelled"


@pytest.mark.asyncio
async def test_tareas_eliminar_inexistente() -> None:
    """Debe retornar 404 al eliminar tarea inexistente."""
    async with await _cliente_auth() as c:
        resp = await c.delete("/api/scheduling/tasks/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_tareas_sin_auth() -> None:
    """Debe retornar 401 sin autenticación."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.get("/api/scheduling/tasks")
    assert resp.status_code == 401
