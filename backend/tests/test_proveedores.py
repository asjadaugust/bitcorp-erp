"""Tests para proveedores."""

import time

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from tests.conftest import obtener_token_admin

_TS = str(int(time.time()))[-6:]


async def _cliente_auth() -> AsyncClient:
    token = await obtener_token_admin()
    c = AsyncClient(transport=ASGITransport(app=app), base_url="http://test")
    c.headers["Authorization"] = f"Bearer {token}"
    return c


async def _crear_proveedor(c: AsyncClient, ruc: str, **kwargs: object) -> dict[str, object]:
    payload: dict[str, object] = {
        "ruc": ruc,
        "razon_social": f"Proveedor Test {ruc}",
        **kwargs,
    }
    resp = await c.post("/api/providers/", json=payload)
    return resp.json()


# ─── Listar ──────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_listar_proveedores() -> None:
    async with await _cliente_auth() as c:
        resp = await c.get("/api/providers/")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert "data" in datos
    assert "pagination" in datos


@pytest.mark.asyncio
async def test_listar_proveedores_busqueda() -> None:
    async with await _cliente_auth() as c:
        resp = await c.get("/api/providers/?search=Test")
    assert resp.status_code == 200
    assert resp.json()["success"] is True


# ─── CRUD ────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_crear_proveedor() -> None:
    async with await _cliente_auth() as c:
        resp = await c.post(
            "/api/providers/",
            json={"ruc": f"20{_TS}001", "razon_social": "Empresa Test SAC"},
        )
    assert resp.status_code == 201
    datos = resp.json()
    assert datos["success"] is True
    assert datos["data"]["id"] > 0


@pytest.mark.asyncio
async def test_crear_proveedor_ruc_duplicado() -> None:
    ruc = f"20{_TS}002"
    async with await _cliente_auth() as c:
        r1 = await c.post("/api/providers/", json={"ruc": ruc, "razon_social": "A SAC"})
        assert r1.status_code == 201
        r2 = await c.post("/api/providers/", json={"ruc": ruc, "razon_social": "B SAC"})
    assert r2.status_code == 409


@pytest.mark.asyncio
async def test_obtener_proveedor() -> None:
    async with await _cliente_auth() as c:
        r = await _crear_proveedor(c, f"20{_TS}003")
        prov_id = r["data"]["id"]
        resp = await c.get(f"/api/providers/{prov_id}")
    assert resp.status_code == 200
    assert resp.json()["data"]["id"] == prov_id


@pytest.mark.asyncio
async def test_proveedor_inexistente() -> None:
    async with await _cliente_auth() as c:
        resp = await c.get("/api/providers/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_actualizar_proveedor() -> None:
    async with await _cliente_auth() as c:
        r = await _crear_proveedor(c, f"20{_TS}004")
        prov_id = r["data"]["id"]
        resp = await c.put(
            f"/api/providers/{prov_id}",
            json={"nombre_comercial": "Marca Comercial"},
        )
    assert resp.status_code == 200
    assert resp.json()["data"]["nombre_comercial"] == "Marca Comercial"


@pytest.mark.asyncio
async def test_eliminar_proveedor() -> None:
    async with await _cliente_auth() as c:
        r = await _crear_proveedor(c, f"20{_TS}005")
        prov_id = r["data"]["id"]
        resp = await c.delete(f"/api/providers/{prov_id}")
    assert resp.status_code == 204


# ─── Contacts ────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_agregar_y_listar_contactos() -> None:
    async with await _cliente_auth() as c:
        r = await _crear_proveedor(c, f"20{_TS}006")
        prov_id = r["data"]["id"]
        r2 = await c.post(
            f"/api/providers/{prov_id}/contacts",
            json={"contact_name": "Juan Pérez", "contact_type": "general"},
        )
        assert r2.status_code == 201
        resp = await c.get(f"/api/providers/{prov_id}/contacts")
    assert resp.status_code == 200
    assert len(resp.json()["data"]) >= 1


# ─── Financial Info ──────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_agregar_y_listar_info_financiera() -> None:
    async with await _cliente_auth() as c:
        r = await _crear_proveedor(c, f"20{_TS}007")
        prov_id = r["data"]["id"]
        r2 = await c.post(
            f"/api/providers/{prov_id}/financial-info",
            json={
                "bank_name": "BCP",
                "account_number": "19120001234567",
                "currency": "PEN",
            },
        )
        assert r2.status_code == 201
        resp = await c.get(f"/api/providers/{prov_id}/financial-info")
    assert resp.status_code == 200
    assert len(resp.json()["data"]) >= 1
