"""Tests para Insumos (Recursos Maestros) — presupuestos module."""

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


def _insumo_payload(**overrides) -> dict:
    uid = uuid4().hex[:8]
    base = {
        "codigo": f"INS-{uid}",
        "nombre": f"Insumo Test {uid}",
        "unidad_medida": "und",
        "tipo": "MATERIAL",
        "precio_unitario": 25.50,
    }
    base.update(overrides)
    return base


# ── CRUD ─────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_insumos_listar() -> None:
    """Debe retornar lista paginada de insumos."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/insumos/")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert "pagination" in datos


@pytest.mark.asyncio
async def test_insumos_crear() -> None:
    """Debe crear un nuevo insumo."""
    async with await _cliente_auth() as c:
        resp = await c.post("/api/insumos/", json=_insumo_payload())
    assert resp.status_code == 201
    datos = resp.json()
    assert datos["success"] is True
    assert "id" in datos["data"]


@pytest.mark.asyncio
async def test_insumos_crear_codigo_duplicado() -> None:
    """Debe retornar 409 para código duplicado."""
    payload = _insumo_payload()
    async with await _cliente_auth() as c:
        await c.post("/api/insumos/", json=payload)
        resp = await c.post("/api/insumos/", json=payload)
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_insumos_obtener_por_id() -> None:
    """Debe retornar detalle de insumo."""
    async with await _cliente_auth() as c:
        create_resp = await c.post("/api/insumos/", json=_insumo_payload())
        insumo_id = create_resp.json()["data"]["id"]
        resp = await c.get(f"/api/insumos/{insumo_id}")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert datos["data"]["id"] == insumo_id


@pytest.mark.asyncio
async def test_insumos_obtener_inexistente() -> None:
    """Debe retornar 404 para insumo inexistente."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/insumos/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_insumos_actualizar() -> None:
    """Debe actualizar un insumo existente."""
    async with await _cliente_auth() as c:
        create_resp = await c.post("/api/insumos/", json=_insumo_payload())
        insumo_id = create_resp.json()["data"]["id"]
        resp = await c.put(
            f"/api/insumos/{insumo_id}",
            json={"nombre": "Insumo Actualizado", "precio_unitario": 99.99},
        )
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True


@pytest.mark.asyncio
async def test_insumos_eliminar() -> None:
    """Debe eliminar (soft delete) un insumo."""
    async with await _cliente_auth() as c:
        create_resp = await c.post("/api/insumos/", json=_insumo_payload())
        insumo_id = create_resp.json()["data"]["id"]
        resp = await c.delete(f"/api/insumos/{insumo_id}")
    assert resp.status_code == 204


# ── Filtros ──────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_insumos_filtrar_por_tipo() -> None:
    """Debe filtrar insumos por tipo."""
    async with await _cliente_auth() as c:
        await c.post("/api/insumos/", json=_insumo_payload(tipo="MANO_OBRA"))
        resp = await c.get("/api/insumos/?tipo=MANO_OBRA")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True


@pytest.mark.asyncio
async def test_insumos_busqueda() -> None:
    """Debe buscar insumos por texto."""
    uid = uuid4().hex[:8]
    async with await _cliente_auth() as c:
        await c.post("/api/insumos/", json=_insumo_payload(nombre=f"BusquedaUnica{uid}"))
        resp = await c.get(f"/api/insumos/?search=BusquedaUnica{uid}")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert datos["pagination"]["total"] >= 1


# ── Dropdown ─────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_insumos_dropdown() -> None:
    """Debe retornar opciones para dropdown."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/insumos/dropdown")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert isinstance(datos["data"], list)


# ── Auth ─────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_insumos_sin_auth() -> None:
    """Debe retornar 401 sin autenticación."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.get("/api/insumos/")
    assert resp.status_code == 401


# ── Tipos válidos ────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_insumos_crear_todos_tipos() -> None:
    """Debe poder crear insumos de cada tipo válido."""
    tipos = ["MANO_OBRA", "MATERIAL", "EQUIPO", "SUBCONTRATO"]
    async with await _cliente_auth() as c:
        for tipo in tipos:
            resp = await c.post("/api/insumos/", json=_insumo_payload(tipo=tipo))
            assert resp.status_code == 201, f"Falló para tipo {tipo}"
