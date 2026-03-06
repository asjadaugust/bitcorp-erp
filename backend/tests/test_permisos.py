"""Tests para permisos, rol-permiso, usuario-rol-UO y componentes-UO."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from tests.conftest import obtener_token_admin


async def _cliente_auth() -> AsyncClient:
    token = await obtener_token_admin()
    c = AsyncClient(transport=ASGITransport(app=app), base_url="http://test")
    c.headers["Authorization"] = f"Bearer {token}"
    return c


async def _obtener_token_operador() -> str:
    """Helper: obtener token de operador1 para tests de prohibicion."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        resp = await c.post(
            "/api/auth/login",
            json={"username": "operador1", "password": "Admin@123"},
        )
        token: str = resp.json()["data"]["access_token"]
        return token


# ─── Permisos CRUD ──────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_permisos_listar() -> None:
    """Debe retornar lista de permisos (>= 26 del seed)."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/permissions/")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert isinstance(datos["data"], list)
    assert len(datos["data"]) >= 26


@pytest.mark.asyncio
async def test_permiso_crud() -> None:
    """Debe crear, leer, actualizar y eliminar un permiso."""
    async with await _cliente_auth() as c:
        # Crear
        resp = await c.post(
            "/api/permissions/",
            json={"proceso": "TEST", "modulo": "TEST_MOD", "permiso": "TEST_PERM"},
        )
        assert resp.status_code == 201
        permiso_id = resp.json()["data"]["id"]

        # Leer
        resp = await c.get(f"/api/permissions/{permiso_id}")
        assert resp.status_code == 200
        d = resp.json()["data"]
        assert d["proceso"] == "TEST"
        assert d["modulo"] == "TEST_MOD"
        assert d["permiso"] == "TEST_PERM"

        # Actualizar
        resp = await c.put(
            f"/api/permissions/{permiso_id}",
            json={"proceso": "TEST_UPDATED"},
        )
        assert resp.status_code == 200
        assert resp.json()["data"]["proceso"] == "TEST_UPDATED"

        # Eliminar
        resp = await c.delete(f"/api/permissions/{permiso_id}")
        assert resp.status_code == 204

        # Verificar eliminado
        resp = await c.get(f"/api/permissions/{permiso_id}")
        assert resp.status_code == 404


# ─── Rol-Permiso ────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_permisos_rol_listar() -> None:
    """Debe retornar lista de permisos de un rol."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/permissions/roles/1/permisos")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert isinstance(datos["data"], list)


@pytest.mark.asyncio
async def test_permiso_asignar_revocar() -> None:
    """Debe asignar y revocar un permiso de un rol."""
    async with await _cliente_auth() as c:
        # Crear un permiso temporal para evitar conflictos con seed data
        resp = await c.post(
            "/api/permissions/",
            json={"proceso": "TEST_AR", "modulo": "TEST_AR_MOD", "permiso": "TEST_AR_PERM"},
        )
        assert resp.status_code == 201
        permiso_id = resp.json()["data"]["id"]

        # Asignar al rol 1 (ADMIN, siempre existe en seed)
        resp = await c.post(
            "/api/permissions/roles/1/permisos",
            json={"permiso_id": permiso_id},
        )
        assert resp.status_code == 201
        d = resp.json()["data"]
        assert d["rol_id"] == 1
        assert d["permiso_id"] == permiso_id

        # Verificar que aparece en la lista
        resp = await c.get("/api/permissions/roles/1/permisos")
        assert resp.status_code == 200
        ids = [x["permiso_id"] for x in resp.json()["data"]]
        assert permiso_id in ids

        # Revocar
        resp = await c.delete(f"/api/permissions/roles/1/permisos/{permiso_id}")
        assert resp.status_code == 204

        # Verificar que ya no aparece
        resp = await c.get("/api/permissions/roles/1/permisos")
        assert resp.status_code == 200
        ids = [x["permiso_id"] for x in resp.json()["data"]]
        assert permiso_id not in ids

        # Limpiar: eliminar el permiso temporal
        resp = await c.delete(f"/api/permissions/{permiso_id}")
        assert resp.status_code == 204


# ─── Usuario-Rol-UO ─────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_usuario_rol_uo_listar() -> None:
    """Debe retornar lista de asignaciones usuario-rol-UO (>= 44 del seed)."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/permissions/usuario-rol-uo")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert isinstance(datos["data"], list)


# ─── Componentes-UO ─────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_componentes_uo_listar() -> None:
    """Debe retornar lista de componentes-UO (>= 3 del seed)."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/permissions/componentes-uo")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert isinstance(datos["data"], list)
    assert len(datos["data"]) >= 3


# ─── Auth / Roles ────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_permisos_sin_auth() -> None:
    """Debe retornar 401 sin autenticacion."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        resp = await c.get("/api/permissions/")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_permisos_operador_forbidden() -> None:
    """Debe retornar 403 para operador (solo ADMIN/ADMIN_SISTEMA permitidos)."""
    token = await _obtener_token_operador()
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        c.headers["Authorization"] = f"Bearer {token}"
        resp = await c.get("/api/permissions/")
    assert resp.status_code == 403
