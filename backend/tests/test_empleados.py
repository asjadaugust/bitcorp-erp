"""Tests para empleados (trabajadores)."""

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
async def test_empleados_listar() -> None:
    """Debe retornar lista paginada de empleados."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/employees/")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert "pagination" in datos


@pytest.mark.asyncio
async def test_empleados_listar_busqueda() -> None:
    """Debe buscar empleados por nombre o DNI."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/employees/?search=test")
    assert resp.status_code == 200
    assert resp.json()["success"] is True


@pytest.mark.asyncio
async def test_empleados_crear() -> None:
    """Debe crear un nuevo empleado."""
    async with await _cliente_auth() as c:
        resp = await c.post(
            "/api/employees/",
            json={
                "dni": uuid4().hex[:8],
                "nombres": "Juan Carlos",
                "apellido_paterno": "Test",
                "cargo": "Operador",
            },
        )
    assert resp.status_code == 201
    datos = resp.json()
    assert datos["success"] is True
    assert "id" in datos["data"]


@pytest.mark.asyncio
async def test_empleados_crear_dni_duplicado() -> None:
    """Debe retornar 409 para DNI duplicado."""
    async with await _cliente_auth() as c:
        payload = {
            "dni": uuid4().hex[:8],
            "nombres": "Maria",
            "apellido_paterno": "Dup",
        }
        await c.post("/api/employees/", json=payload)
        resp = await c.post("/api/employees/", json=payload)
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_empleados_obtener_inexistente() -> None:
    """Debe retornar 404 para empleado inexistente."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/employees/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_empleados_eliminar_inexistente() -> None:
    """Debe retornar 404 al eliminar empleado inexistente."""
    async with await _cliente_auth() as c:
        resp = await c.delete("/api/employees/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_empleados_actualizar_inexistente() -> None:
    """Debe retornar 404 al actualizar empleado inexistente."""
    async with await _cliente_auth() as c:
        resp = await c.put(
            "/api/employees/99999",
            json={"nombres": "Updated"},
        )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_empleados_sin_auth() -> None:
    """Debe retornar 401 sin autenticación."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.get("/api/employees/")
    assert resp.status_code == 401
