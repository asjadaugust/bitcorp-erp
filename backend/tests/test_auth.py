"""Tests para el módulo de autenticación."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


async def _crear_cliente() -> AsyncClient:
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


@pytest.mark.asyncio
async def test_login_credenciales_validas() -> None:
    """Login con admin/admin123 debe retornar tokens y datos de usuario."""
    async with await _crear_cliente() as c:
        resp = await c.post("/api/auth/login", json={"username": "admin", "password": "Admin@123"})
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert "access_token" in datos["data"]
    assert "refresh_token" in datos["data"]
    assert datos["data"]["user"]["username"] == "admin"
    assert isinstance(datos["data"]["user"]["roles"], list)


@pytest.mark.asyncio
async def test_login_credenciales_invalidas() -> None:
    """Login con password incorrecto debe retornar 401."""
    async with await _crear_cliente() as c:
        resp = await c.post("/api/auth/login", json={"username": "admin", "password": "wrong"})
    assert resp.status_code == 401
    assert resp.json()["success"] is False


@pytest.mark.asyncio
async def test_login_usuario_inexistente() -> None:
    """Login con usuario inexistente debe retornar 401."""
    async with await _crear_cliente() as c:
        resp = await c.post("/api/auth/login", json={"username": "noexiste", "password": "pass"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_me_con_token_valido() -> None:
    """/me con token válido debe retornar datos del usuario."""
    async with await _crear_cliente() as c:
        login = await c.post("/api/auth/login", json={"username": "admin", "password": "Admin@123"})
        token = login.json()["data"]["access_token"]
        resp = await c.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert datos["data"]["user"]["username"] == "admin"


@pytest.mark.asyncio
async def test_me_sin_token() -> None:
    """/me sin token debe retornar 401."""
    async with await _crear_cliente() as c:
        resp = await c.get("/api/auth/me")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_me_token_invalido() -> None:
    """/me con token inválido debe retornar 401."""
    async with await _crear_cliente() as c:
        resp = await c.get("/api/auth/me", headers={"Authorization": "Bearer invalid"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_refresh_token() -> None:
    """Refresh token debe generar nuevos tokens."""
    async with await _crear_cliente() as c:
        login = await c.post("/api/auth/login", json={"username": "admin", "password": "Admin@123"})
        refresh = login.json()["data"]["refresh_token"]
        resp = await c.post("/api/auth/refresh", json={"refresh_token": refresh})
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert "access_token" in datos["data"]
    assert "refresh_token" in datos["data"]


@pytest.mark.asyncio
async def test_refresh_token_invalido() -> None:
    """Refresh con token inválido debe retornar 401."""
    async with await _crear_cliente() as c:
        resp = await c.post("/api/auth/refresh", json={"refresh_token": "invalid"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_login_formato_api() -> None:
    """Login exitoso cumple el contrato {success, data}."""
    async with await _crear_cliente() as c:
        resp = await c.post("/api/auth/login", json={"username": "admin", "password": "Admin@123"})
    datos = resp.json()
    assert "success" in datos
    assert "data" in datos
    user = datos["data"]["user"]
    for campo in ["id", "username", "email", "full_name", "roles"]:
        assert campo in user, f"Falta campo '{campo}'"
