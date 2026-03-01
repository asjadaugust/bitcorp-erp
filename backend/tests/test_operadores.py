"""Tests para operadores."""

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


async def _crear_operador(c: AsyncClient, dni: str, **kwargs: object) -> dict[str, object]:
    payload: dict[str, object] = {
        "dni": dni,
        "nombres": "Test",
        "apellido_paterno": "Operador",
        **kwargs,
    }
    resp = await c.post("/api/operators/", json=payload)
    return resp.json()


# ─── Listar ──────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_listar_operadores() -> None:
    async with await _cliente_auth() as c:
        resp = await c.get("/api/operators/")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert "data" in datos
    assert "pagination" in datos


@pytest.mark.asyncio
async def test_listar_operadores_con_busqueda() -> None:
    async with await _cliente_auth() as c:
        resp = await c.get("/api/operators/?search=Test")
    assert resp.status_code == 200
    assert resp.json()["success"] is True


@pytest.mark.asyncio
async def test_listar_operadores_paginacion() -> None:
    async with await _cliente_auth() as c:
        resp = await c.get("/api/operators/?page=1&limit=5")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["pagination"]["page"] == 1
    assert datos["pagination"]["limit"] == 5


# ─── CRUD ────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_crear_operador() -> None:
    async with await _cliente_auth() as c:
        resp = await c.post(
            "/api/operators/",
            json={
                "dni": f"OP{_TS}01",
                "nombres": "Juan",
                "apellido_paterno": "Pérez",
                "cargo": "Operador",
            },
        )
    assert resp.status_code == 201
    datos = resp.json()
    assert datos["success"] is True
    assert datos["data"]["id"] > 0


@pytest.mark.asyncio
async def test_crear_operador_dni_duplicado() -> None:
    dni = f"DUP{_TS}01"
    async with await _cliente_auth() as c:
        r1 = await c.post(
            "/api/operators/",
            json={"dni": dni, "nombres": "A", "apellido_paterno": "B"},
        )
        assert r1.status_code == 201
        r2 = await c.post(
            "/api/operators/",
            json={"dni": dni, "nombres": "C", "apellido_paterno": "D"},
        )
    assert r2.status_code == 409


@pytest.mark.asyncio
async def test_obtener_operador_por_id() -> None:
    async with await _cliente_auth() as c:
        create_resp = await _crear_operador(c, f"GET{_TS}01")
        operador_id = create_resp["data"]["id"]
        resp = await c.get(f"/api/operators/{operador_id}")
    assert resp.status_code == 200
    assert resp.json()["data"]["id"] == operador_id


@pytest.mark.asyncio
async def test_operador_inexistente() -> None:
    async with await _cliente_auth() as c:
        resp = await c.get("/api/operators/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_actualizar_operador() -> None:
    async with await _cliente_auth() as c:
        r = await _crear_operador(c, f"UPD{_TS}01")
        operador_id = r["data"]["id"]
        resp = await c.put(
            f"/api/operators/{operador_id}",
            json={"cargo": "Jefe de Equipo"},
        )
    assert resp.status_code == 200
    assert resp.json()["data"]["cargo"] == "Jefe de Equipo"


@pytest.mark.asyncio
async def test_eliminar_operador() -> None:
    async with await _cliente_auth() as c:
        r = await _crear_operador(c, f"DEL{_TS}01")
        operador_id = r["data"]["id"]
        resp = await c.delete(f"/api/operators/{operador_id}")
    assert resp.status_code == 204


# ─── Certificaciones ────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_agregar_y_listar_certificaciones() -> None:
    async with await _cliente_auth() as c:
        r = await _crear_operador(c, f"CRT{_TS}01")
        oid = r["data"]["id"]
        r2 = await c.post(
            f"/api/operators/{oid}/certifications",
            json={"nombre_certificacion": "Operación Grúa", "estado": "VIGENTE"},
        )
        assert r2.status_code == 201
        resp = await c.get(f"/api/operators/{oid}/certifications")
    assert resp.status_code == 200
    assert len(resp.json()["data"]) >= 1


@pytest.mark.asyncio
async def test_eliminar_certificacion() -> None:
    async with await _cliente_auth() as c:
        r = await _crear_operador(c, f"CRD{_TS}01")
        oid = r["data"]["id"]
        r2 = await c.post(
            f"/api/operators/{oid}/certifications",
            json={"nombre_certificacion": "Temp Cert"},
        )
        cert_id = r2.json()["data"]["id"]
        resp = await c.delete(f"/api/operators/{oid}/certifications/{cert_id}")
    assert resp.status_code == 204


# ─── Habilidades ────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_agregar_y_listar_habilidades() -> None:
    async with await _cliente_auth() as c:
        r = await _crear_operador(c, f"HAB{_TS}01")
        oid = r["data"]["id"]
        r2 = await c.post(
            f"/api/operators/{oid}/skills",
            json={"tipo_equipo": "Excavadora", "nivel_habilidad": "AVANZADO"},
        )
        assert r2.status_code == 201
        resp = await c.get(f"/api/operators/{oid}/skills")
    assert resp.status_code == 200
    assert len(resp.json()["data"]) >= 1


# ─── Disponibilidad ─────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_establecer_y_obtener_disponibilidad() -> None:
    async with await _cliente_auth() as c:
        r = await _crear_operador(c, f"DSP{_TS}01")
        oid = r["data"]["id"]
        r2 = await c.post(
            f"/api/operators/{oid}/disponibilidad",
            json={"fecha": "2026-03-15", "disponible": True},
        )
        assert r2.status_code == 200
        resp = await c.get(f"/api/operators/{oid}/availability")
    assert resp.status_code == 200
    assert len(resp.json()["data"]) >= 1


@pytest.mark.asyncio
async def test_disponibilidad_upsert() -> None:
    async with await _cliente_auth() as c:
        r = await _crear_operador(c, f"UPS{_TS}01")
        oid = r["data"]["id"]
        await c.post(
            f"/api/operators/{oid}/disponibilidad",
            json={"fecha": "2026-03-20", "disponible": True},
        )
        r2 = await c.post(
            f"/api/operators/{oid}/disponibilidad",
            json={"fecha": "2026-03-20", "disponible": False, "observacion": "Enfermo"},
        )
    assert r2.status_code == 200
    assert r2.json()["data"]["disponible"] is False


# ─── Programación mensual ───────────────────────────────────────────────


@pytest.mark.asyncio
async def test_programacion_mensual() -> None:
    async with await _cliente_auth() as c:
        resp = await c.get("/api/operators/programacion?mes=2026-03")
    assert resp.status_code == 200
    assert isinstance(resp.json()["data"], list)


# ─── Rendimiento ────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_obtener_rendimiento() -> None:
    async with await _cliente_auth() as c:
        r = await _crear_operador(c, f"PRF{_TS}01")
        oid = r["data"]["id"]
        resp = await c.get(f"/api/operators/{oid}/performance")
    assert resp.status_code == 200
    datos = resp.json()["data"]
    assert "total_partes" in datos
    assert "eficiencia" in datos


# ─── Auth ────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_operadores_sin_auth() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.get("/api/operators/")
    assert resp.status_code == 401
