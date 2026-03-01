"""Tests para equipos."""

import time

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from tests.conftest import obtener_token_admin

# Unique suffix per test run to avoid collisions with previous runs
_TS = str(int(time.time()))[-6:]


async def _cliente_auth() -> AsyncClient:
    token = await obtener_token_admin()
    c = AsyncClient(transport=ASGITransport(app=app), base_url="http://test")
    c.headers["Authorization"] = f"Bearer {token}"
    return c


async def _crear_equipo(c: AsyncClient, codigo: str, **kwargs: object) -> dict[str, object]:
    """Helper: crear un equipo y retornar la respuesta completa."""
    payload: dict[str, object] = {"codigo_equipo": codigo, **kwargs}
    resp = await c.post("/api/equipment/", json=payload)
    return resp.json()


# ─── Listar ──────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_listar_equipos() -> None:
    """Debe retornar lista paginada de equipos."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/equipment/")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert "data" in datos
    assert "pagination" in datos


@pytest.mark.asyncio
async def test_listar_equipos_con_filtro_estado() -> None:
    """Debe filtrar equipos por estado."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/equipment/?estado=DISPONIBLE")
    assert resp.status_code == 200
    assert resp.json()["success"] is True


@pytest.mark.asyncio
async def test_listar_equipos_con_busqueda() -> None:
    """Debe buscar equipos por texto."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/equipment/?search=CAT")
    assert resp.status_code == 200
    assert resp.json()["success"] is True


@pytest.mark.asyncio
async def test_listar_equipos_paginacion() -> None:
    """Debe paginar correctamente."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/equipment/?page=1&limit=5")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["pagination"]["page"] == 1
    assert datos["pagination"]["limit"] == 5


# ─── Disponibles ─────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_obtener_disponibles() -> None:
    """Debe retornar equipos disponibles."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/equipment/available")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert isinstance(datos["data"], list)


# ─── Tipos ───────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_obtener_tipos() -> None:
    """Debe retornar categorías distintas."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/equipment/types")
    assert resp.status_code == 200
    assert isinstance(resp.json()["data"], list)


# ─── Estadísticas ────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_obtener_estadisticas() -> None:
    """Debe retornar estadísticas de equipos."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/equipment/statistics")
    assert resp.status_code == 200
    datos = resp.json()
    for campo in ["total", "disponible", "en_uso", "mantenimiento", "retirado"]:
        assert campo in datos["data"]


# ─── CRUD ────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_crear_equipo() -> None:
    """Debe crear un equipo nuevo."""
    async with await _cliente_auth() as c:
        resp = await c.post(
            "/api/equipment/",
            json={
                "codigo_equipo": f"T-EQ-{_TS}-001",
                "marca": "Caterpillar",
                "modelo": "320D",
                "categoria": "MAQUINARIA_PESADA",
                "tipo_proveedor": "TERCERO",
            },
        )
    assert resp.status_code == 201
    datos = resp.json()
    assert datos["success"] is True
    assert datos["data"]["id"] > 0


@pytest.mark.asyncio
async def test_crear_equipo_codigo_duplicado() -> None:
    """Debe rechazar código duplicado."""
    codigo = f"T-DUP-{_TS}"
    async with await _cliente_auth() as c:
        r1 = await c.post("/api/equipment/", json={"codigo_equipo": codigo})
        assert r1.status_code == 201
        r2 = await c.post("/api/equipment/", json={"codigo_equipo": codigo})
    assert r2.status_code == 409


@pytest.mark.asyncio
async def test_obtener_equipo_por_id() -> None:
    """Debe obtener equipo por ID."""
    async with await _cliente_auth() as c:
        create_resp = await c.post(
            "/api/equipment/",
            json={"codigo_equipo": f"T-GET-{_TS}", "marca": "CAT"},
        )
        equipo_id = create_resp.json()["data"]["id"]
        resp = await c.get(f"/api/equipment/{equipo_id}")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["data"]["id"] == equipo_id
    assert datos["data"]["marca"] == "CAT"


@pytest.mark.asyncio
async def test_equipo_inexistente() -> None:
    """Debe retornar 404 para equipo inexistente."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/equipment/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_actualizar_equipo() -> None:
    """Debe actualizar un equipo."""
    async with await _cliente_auth() as c:
        r = await c.post(
            "/api/equipment/",
            json={"codigo_equipo": f"T-UPD-{_TS}", "marca": "Volvo"},
        )
        equipo_id = r.json()["data"]["id"]
        resp = await c.put(
            f"/api/equipment/{equipo_id}",
            json={"marca": "Caterpillar", "modelo": "345GC"},
        )
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["data"]["marca"] == "Caterpillar"
    assert datos["data"]["modelo"] == "345GC"


@pytest.mark.asyncio
async def test_eliminar_equipo() -> None:
    """Debe eliminar (soft delete) un equipo."""
    async with await _cliente_auth() as c:
        r = await c.post(
            "/api/equipment/",
            json={"codigo_equipo": f"T-DEL-{_TS}"},
        )
        equipo_id = r.json()["data"]["id"]
        resp = await c.delete(f"/api/equipment/{equipo_id}")
    assert resp.status_code == 204


@pytest.mark.asyncio
async def test_cambiar_estado() -> None:
    """Debe cambiar el estado de un equipo."""
    async with await _cliente_auth() as c:
        r = await c.post(
            "/api/equipment/",
            json={"codigo_equipo": f"T-ST-{_TS}"},
        )
        equipo_id = r.json()["data"]["id"]
        resp = await c.patch(
            f"/api/equipment/{equipo_id}/status",
            json={"estado": "EN_USO"},
        )
    assert resp.status_code == 200
    assert resp.json()["data"]["estado"] == "EN_USO"


# ─── Asignar / Transferir (stubs) ───────────────────────────────────────


@pytest.mark.asyncio
async def test_asignar_equipo_stub() -> None:
    """Debe retornar resultado stub de asignación."""
    async with await _cliente_auth() as c:
        r = await c.post(
            "/api/equipment/",
            json={"codigo_equipo": f"T-ASG-{_TS}"},
        )
        equipo_id = r.json()["data"]["id"]
        resp = await c.post(
            f"/api/equipment/{equipo_id}/assign",
            json={"proyecto_id": 1},
        )
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_transferir_equipo_stub() -> None:
    """Debe retornar resultado stub de transferencia."""
    async with await _cliente_auth() as c:
        r = await c.post(
            "/api/equipment/",
            json={"codigo_equipo": f"T-XFR-{_TS}"},
        )
        equipo_id = r.json()["data"]["id"]
        resp = await c.post(
            f"/api/equipment/{equipo_id}/transfer",
            json={"proyecto_destino_id": 2},
        )
    assert resp.status_code == 200


# ─── Historial de asignaciones (stub) ────────────────────────────────────


@pytest.mark.asyncio
async def test_historial_asignaciones_stub() -> None:
    """Debe retornar array vacío (stub)."""
    async with await _cliente_auth() as c:
        r = await c.post(
            "/api/equipment/",
            json={"codigo_equipo": f"T-HST-{_TS}"},
        )
        equipo_id = r.json()["data"]["id"]
        resp = await c.get(f"/api/equipment/{equipo_id}/assignment-history")
    assert resp.status_code == 200
    assert resp.json()["data"] == []


# ─── Disponibilidad por rango (stub) ────────────────────────────────────


@pytest.mark.asyncio
async def test_disponibilidad_rango_stub() -> None:
    """Debe retornar true (stub)."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/equipment/availability/range")
    assert resp.status_code == 200


# ─── Auth ────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_equipos_sin_auth() -> None:
    """Debe retornar 401 sin token."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.get("/api/equipment/")
    assert resp.status_code == 401
