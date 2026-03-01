"""Tests para notificaciones."""

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
async def test_notificaciones_listar() -> None:
    """Debe retornar lista paginada de notificaciones."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/notifications/")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert "pagination" in datos
    pag = datos["pagination"]
    for campo in ["page", "limit", "total", "total_pages"]:
        assert campo in pag


@pytest.mark.asyncio
async def test_notificaciones_listar_filtro_leido() -> None:
    """Debe filtrar por estado leído."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/notifications/?leido=false")
    assert resp.status_code == 200
    assert resp.json()["success"] is True


@pytest.mark.asyncio
async def test_notificaciones_contar_no_leidas() -> None:
    """Debe retornar conteo de no leídas."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/notifications/unread-count")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert isinstance(datos["data"]["count"], int)


@pytest.mark.asyncio
async def test_notificaciones_crear() -> None:
    """Debe crear una notificación."""
    async with await _cliente_auth() as c:
        resp = await c.post(
            "/api/notifications/",
            json={
                "usuario_id": 1,
                "tipo": "info",
                "titulo": "Test Notification",
                "mensaje": "Mensaje de prueba",
            },
        )
    assert resp.status_code == 201
    datos = resp.json()
    assert datos["success"] is True
    assert "id" in datos["data"]


@pytest.mark.asyncio
async def test_notificaciones_crear_con_url() -> None:
    """Debe crear notificación con URL y data."""
    async with await _cliente_auth() as c:
        resp = await c.post(
            "/api/notifications/",
            json={
                "usuario_id": 1,
                "tipo": "warning",
                "titulo": "Alerta",
                "mensaje": "Documento por vencer",
                "url": "/equipment/123",
                "data": {"equipo_id": 123},
            },
        )
    assert resp.status_code == 201
    assert resp.json()["data"]["id"] > 0


@pytest.mark.asyncio
async def test_notificaciones_obtener_inexistente() -> None:
    """Debe retornar 404 para notificación inexistente."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/notifications/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_notificaciones_marcar_leido_inexistente() -> None:
    """Debe retornar 404 al marcar leído notificación inexistente."""
    async with await _cliente_auth() as c:
        resp = await c.patch("/api/notifications/99999/read")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_notificaciones_marcar_todas_leidas() -> None:
    """Debe marcar todas como leídas."""
    async with await _cliente_auth() as c:
        resp = await c.patch("/api/notifications/read-all")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert "count" in datos["data"]


@pytest.mark.asyncio
async def test_notificaciones_eliminar_inexistente() -> None:
    """Debe retornar 404 al eliminar inexistente."""
    async with await _cliente_auth() as c:
        resp = await c.delete("/api/notifications/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_notificaciones_sin_auth() -> None:
    """Debe retornar 401 sin autenticación."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.get("/api/notifications/")
    assert resp.status_code == 401
