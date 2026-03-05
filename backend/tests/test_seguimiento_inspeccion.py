"""Tests para SST inspecciones SSOMA y reportes acto/condicion."""

import uuid

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from tests.conftest import obtener_token_admin


def _uid() -> str:
    return uuid.uuid4().hex[:8]


async def _cliente_auth() -> AsyncClient:
    token = await obtener_token_admin()
    c = AsyncClient(transport=ASGITransport(app=app), base_url="http://test")
    c.headers["Authorization"] = f"Bearer {token}"
    return c


@pytest.mark.asyncio
async def test_inspeccion_ssoma_crud() -> None:
    """Debe crear, listar, obtener, actualizar y eliminar inspección SSOMA."""
    uid = _uid()
    async with await _cliente_auth() as c:
        # Create
        resp = await c.post(
            "/api/sst/inspecciones",
            json={
                "fecha_hallazgo": "2026-02-15T09:00:00",
                "lugar_hallazgo": f"Zona-{uid}",
                "tipo_inspeccion": "PROGRAMADA",
                "inspector_dni": "12345678",
                "inspector": f"Inspector-{uid}",
                "descripcion_hallazgo": "Hallazgo de prueba",
                "nivel_riesgo": "ALTO",
                "estado": "ABIERTO",
            },
        )
        assert resp.status_code == 201
        datos = resp.json()
        assert datos["success"] is True
        inspeccion_id = datos["data"]["id"]

        # List (paginated)
        resp = await c.get("/api/sst/inspecciones")
        assert resp.status_code == 200
        datos = resp.json()
        assert datos["success"] is True
        assert "pagination" in datos

        # Get detail (verify empty seguimientos)
        resp = await c.get(f"/api/sst/inspecciones/{inspeccion_id}")
        assert resp.status_code == 200
        datos = resp.json()
        assert datos["success"] is True
        assert datos["data"]["id"] == inspeccion_id
        assert datos["data"]["seguimientos"] == []
        assert datos["data"]["lugar_hallazgo"] == f"Zona-{uid}"

        # Update
        resp = await c.put(
            f"/api/sst/inspecciones/{inspeccion_id}",
            json={"estado": "CERRADO", "nivel_riesgo": "BAJO"},
        )
        assert resp.status_code == 200
        datos = resp.json()
        assert datos["data"]["estado"] == "CERRADO"
        assert datos["data"]["nivel_riesgo"] == "BAJO"

        # Delete
        resp = await c.delete(f"/api/sst/inspecciones/{inspeccion_id}")
        assert resp.status_code == 204

        # Verify deleted
        resp = await c.get(f"/api/sst/inspecciones/{inspeccion_id}")
        assert resp.status_code == 404


@pytest.mark.asyncio
async def test_seguimiento_nested() -> None:
    """Debe crear inspección, agregar seguimientos, y verificar anidación."""
    uid = _uid()
    async with await _cliente_auth() as c:
        # Create parent inspection
        resp = await c.post(
            "/api/sst/inspecciones",
            json={
                "fecha_hallazgo": "2026-02-20T10:00:00",
                "lugar_hallazgo": f"Obra-{uid}",
                "tipo_inspeccion": "NO_PROGRAMADA",
                "nivel_riesgo": "MEDIO",
                "estado": "ABIERTO",
            },
        )
        assert resp.status_code == 201
        inspeccion_id = resp.json()["data"]["id"]

        # Add seguimiento 1
        resp = await c.post(
            f"/api/sst/inspecciones/{inspeccion_id}/seguimientos",
            json={
                "fecha": "2026-02-21T08:00:00",
                "inspector": f"Seg1-{uid}",
                "descripcion_inspeccion": "Primera revisión",
                "avance_estimado": 30,
            },
        )
        assert resp.status_code == 201
        seg1_id = resp.json()["data"]["id"]

        # Add seguimiento 2
        resp = await c.post(
            f"/api/sst/inspecciones/{inspeccion_id}/seguimientos",
            json={
                "fecha": "2026-02-25T14:00:00",
                "inspector": f"Seg2-{uid}",
                "descripcion_inspeccion": "Segunda revisión",
                "avance_estimado": 70,
            },
        )
        assert resp.status_code == 201

        # Verify detail has 2 seguimientos
        resp = await c.get(f"/api/sst/inspecciones/{inspeccion_id}")
        assert resp.status_code == 200
        datos = resp.json()["data"]
        assert len(datos["seguimientos"]) == 2

        # Delete first seguimiento
        resp = await c.delete(
            f"/api/sst/inspecciones/{inspeccion_id}/seguimientos/{seg1_id}"
        )
        assert resp.status_code == 204

        # Verify has 1 seguimiento now
        resp = await c.get(f"/api/sst/inspecciones/{inspeccion_id}")
        assert resp.status_code == 200
        datos = resp.json()["data"]
        assert len(datos["seguimientos"]) == 1

        # Cleanup
        await c.delete(f"/api/sst/inspecciones/{inspeccion_id}")


@pytest.mark.asyncio
async def test_inspeccion_filtros() -> None:
    """Debe filtrar inspecciones por tipo_inspeccion y nivel_riesgo."""
    uid = _uid()[:6]
    async with await _cliente_auth() as c:
        # Create inspection with specific filters
        # nivel_riesgo is String(10), tipo_inspeccion is String(20)
        resp = await c.post(
            "/api/sst/inspecciones",
            json={
                "fecha_hallazgo": "2026-03-01T10:00:00",
                "lugar_hallazgo": f"Filtro-{uid}",
                "tipo_inspeccion": f"TIPO_{uid}",
                "nivel_riesgo": f"NR_{uid}",
                "estado": "ABIERTO",
            },
        )
        assert resp.status_code == 201
        inspeccion_id = resp.json()["data"]["id"]

        # Filter by tipo_inspeccion
        resp = await c.get(f"/api/sst/inspecciones?tipo_inspeccion=TIPO_{uid}")
        assert resp.status_code == 200
        datos = resp.json()
        assert datos["pagination"]["total"] >= 1
        assert any(i["tipo_inspeccion"] == f"TIPO_{uid}" for i in datos["data"])

        # Filter by nivel_riesgo
        resp = await c.get(f"/api/sst/inspecciones?nivel_riesgo=NR_{uid}")
        assert resp.status_code == 200
        datos = resp.json()
        assert datos["pagination"]["total"] >= 1

        # Cleanup
        await c.delete(f"/api/sst/inspecciones/{inspeccion_id}")


@pytest.mark.asyncio
async def test_reporte_acto_condicion_crud() -> None:
    """Debe crear, listar, obtener, actualizar y eliminar reporte acto/condicion."""
    uid = _uid()
    async with await _cliente_auth() as c:
        # Create with all 5 sections
        resp = await c.post(
            "/api/sst/reportes-acto-condicion",
            json={
                # Section 1: Reporter info
                "reportado_por_dni": "87654321",
                "reportado_por_nombre": f"Reportero-{uid}",
                "cargo": "Ingeniero",
                "empresa_reportante": "BitCorp",
                # Section 2: Incident info
                "fecha_evento": "2026-03-01T15:00:00",
                "lugar": f"Lugar-{uid}",
                "empresa": "BitCorp SAC",
                "sistema_gestion": "SST",
                "tipo_reporte": "ACTO",
                "codigo_acto_condicion": "A001",
                "acto_condicion": "No uso de EPP",
                # Section 3: Damage
                "dano_a": "Personas",
                "descripcion": f"Desc-{uid}",
                "como_actue": "Se detuvo la actividad",
                # Section 4: 5-Why
                "por_que_1": "Falta de supervisión",
                "por_que_2": "Poco personal",
                "por_que_3": "Presupuesto limitado",
                "por_que_4": None,
                "por_que_5": None,
                # Section 5: Corrective action
                "accion_correctiva": "Capacitación inmediata",
                "estado": "PENDIENTE",
            },
        )
        assert resp.status_code == 201
        datos = resp.json()
        assert datos["success"] is True
        reporte_id = datos["data"]["id"]

        # List
        resp = await c.get("/api/sst/reportes-acto-condicion")
        assert resp.status_code == 200
        datos = resp.json()
        assert datos["success"] is True
        assert "pagination" in datos

        # Get detail (verify all sections)
        resp = await c.get(f"/api/sst/reportes-acto-condicion/{reporte_id}")
        assert resp.status_code == 200
        datos = resp.json()["data"]
        # Section 1
        assert datos["reportado_por_nombre"] == f"Reportero-{uid}"
        assert datos["cargo"] == "Ingeniero"
        # Section 2
        assert datos["tipo_reporte"] == "ACTO"
        assert datos["codigo_acto_condicion"] == "A001"
        # Section 3
        assert datos["dano_a"] == "Personas"
        assert datos["descripcion"] == f"Desc-{uid}"
        # Section 4
        assert datos["por_que_1"] == "Falta de supervisión"
        assert datos["por_que_3"] == "Presupuesto limitado"
        # Section 5
        assert datos["accion_correctiva"] == "Capacitación inmediata"
        assert datos["estado"] == "PENDIENTE"

        # Update
        resp = await c.put(
            f"/api/sst/reportes-acto-condicion/{reporte_id}",
            json={"estado": "CERRADO", "accion_correctiva": "Capacitación completada"},
        )
        assert resp.status_code == 200
        datos = resp.json()["data"]
        assert datos["estado"] == "CERRADO"
        assert datos["accion_correctiva"] == "Capacitación completada"

        # Delete
        resp = await c.delete(f"/api/sst/reportes-acto-condicion/{reporte_id}")
        assert resp.status_code == 204

        # Verify deleted
        resp = await c.get(f"/api/sst/reportes-acto-condicion/{reporte_id}")
        assert resp.status_code == 404


@pytest.mark.asyncio
async def test_acto_condicion_catalog() -> None:
    """Debe listar catalogo de actos/condiciones con campos requeridos."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/sst/actos-condicion")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    # Catalog may be empty in test DB, but should return list
    assert isinstance(datos["data"], list)
    # If items exist, verify structure
    if datos["data"]:
        item = datos["data"][0]
        assert "id" in item
        assert "codigo" in item
        assert "acto_condicion" in item
        assert "categoria" in item


@pytest.mark.asyncio
async def test_reporte_dano_semicolons() -> None:
    """Debe almacenar dano_a con separador punto y coma correctamente."""
    uid = _uid()
    async with await _cliente_auth() as c:
        resp = await c.post(
            "/api/sst/reportes-acto-condicion",
            json={
                "reportado_por_nombre": f"Tester-{uid}",
                "fecha_evento": "2026-03-02T09:00:00",
                "tipo_reporte": "CONDICION",
                "dano_a": "Personas;Equipos;Medio Ambiente",
                "estado": "PENDIENTE",
            },
        )
        assert resp.status_code == 201
        reporte_id = resp.json()["data"]["id"]

        resp = await c.get(f"/api/sst/reportes-acto-condicion/{reporte_id}")
        assert resp.status_code == 200
        datos = resp.json()["data"]
        assert datos["dano_a"] == "Personas;Equipos;Medio Ambiente"

        # Cleanup
        await c.delete(f"/api/sst/reportes-acto-condicion/{reporte_id}")


@pytest.mark.asyncio
async def test_sst_inspecciones_sin_auth() -> None:
    """Debe retornar 401 sin autenticación."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        resp = await c.get("/api/sst/inspecciones")
    assert resp.status_code == 401
