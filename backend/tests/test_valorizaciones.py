"""Tests para valorizaciones y pagos."""

import time
from datetime import date

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


async def _crear_equipo(c: AsyncClient, codigo: str) -> int:
    resp = await c.post("/api/equipment/", json={"codigo_equipo": codigo})
    assert resp.status_code == 201, f"Failed to create equipment: {resp.text}"
    return resp.json()["data"]["id"]


async def _crear_valorizacion(
    c: AsyncClient,
    equipo_id: int,
    periodo: str = "2026-01",
    **kwargs: object,
) -> dict[str, object]:
    """Helper: crear valorización y retornar respuesta."""
    payload: dict[str, object] = {
        "equipo_id": equipo_id,
        "periodo": periodo,
        "fecha_inicio": "2026-01-01",
        "fecha_fin": "2026-01-31",
        "costo_base": 5000,
        **kwargs,
    }
    resp = await c.post("/api/valuations/", json=payload)
    return resp.json()


# ─── Listar ──────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_listar_valorizaciones() -> None:
    """Debe retornar lista paginada de valorizaciones."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/valuations/")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert "data" in datos
    assert "pagination" in datos


@pytest.mark.asyncio
async def test_listar_valorizaciones_filtro_estado() -> None:
    """Debe filtrar por estado."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/valuations/?estado=BORRADOR")
    assert resp.status_code == 200
    assert resp.json()["success"] is True


@pytest.mark.asyncio
async def test_listar_valorizaciones_paginacion() -> None:
    """Debe paginar correctamente."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/valuations/?page=1&limit=5")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["pagination"]["page"] == 1
    assert datos["pagination"]["limit"] == 5


# ─── CRUD: Crear ─────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_crear_valorizacion() -> None:
    """Debe crear una valorización nueva."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-VAL-{_TS}-001")
        resp = await c.post(
            "/api/valuations/",
            json={
                "equipo_id": eq_id,
                "periodo": "2026-01",
                "fecha_inicio": "2026-01-01",
                "fecha_fin": "2026-01-31",
                "costo_base": 5000,
                "igv_porcentaje": 18,
            },
        )
    assert resp.status_code == 201
    datos = resp.json()
    assert datos["success"] is True
    assert datos["data"]["id"] > 0


@pytest.mark.asyncio
async def test_crear_valorizacion_auto_calc_totales() -> None:
    """Debe auto-calcular IGV y total_con_igv."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-VAL-{_TS}-002")
        data = await _crear_valorizacion(c, eq_id, costo_base=10000)
        val_id = data["data"]["id"]
        resp = await c.get(f"/api/valuations/{val_id}")
    datos = resp.json()["data"]
    # 10000 * 18% = 1800 IGV → total_con_igv = 11800
    assert datos["total_valorizado"] == 10000.0
    assert datos["igv_monto"] == 1800.0
    assert datos["total_con_igv"] == 11800.0


@pytest.mark.asyncio
async def test_crear_valorizacion_fechas_invalidas() -> None:
    """Debe rechazar fecha_fin <= fecha_inicio."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-VAL-{_TS}-003")
        resp = await c.post(
            "/api/valuations/",
            json={
                "equipo_id": eq_id,
                "periodo": "2026-01",
                "fecha_inicio": "2026-01-31",
                "fecha_fin": "2026-01-01",
            },
        )
    assert resp.status_code == 400


# ─── CRUD: Obtener ───────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_obtener_valorizacion_por_id() -> None:
    """Debe obtener valorización por ID."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-VGET-{_TS}")
        data = await _crear_valorizacion(c, eq_id)
        val_id = data["data"]["id"]
        resp = await c.get(f"/api/valuations/{val_id}")
    assert resp.status_code == 200
    datos = resp.json()["data"]
    assert datos["id"] == val_id
    assert datos["periodo"] == "2026-01"


@pytest.mark.asyncio
async def test_valorizacion_inexistente() -> None:
    """Debe retornar 404."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/valuations/99999")
    assert resp.status_code == 404


# ─── CRUD: Actualizar ────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_actualizar_valorizacion() -> None:
    """Debe actualizar campos y recalcular totales."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-VUPD-{_TS}")
        data = await _crear_valorizacion(c, eq_id, costo_base=5000)
        val_id = data["data"]["id"]
        resp = await c.put(
            f"/api/valuations/{val_id}",
            json={"costo_base": 8000, "observaciones": "Ajustado"},
        )
    assert resp.status_code == 200
    datos = resp.json()["data"]
    assert datos["costo_base"] == 8000.0
    assert datos["observaciones"] == "Ajustado"
    assert datos["total_valorizado"] == 8000.0


# ─── CRUD: Eliminar ──────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_eliminar_valorizacion() -> None:
    """Debe eliminar una valorización."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-VDEL-{_TS}")
        data = await _crear_valorizacion(c, eq_id)
        val_id = data["data"]["id"]
        resp = await c.delete(f"/api/valuations/{val_id}")
    assert resp.status_code == 204


# ─── Workflow: BORRADOR → PENDIENTE → EN_REVISION → VALIDADO → APROBADO ─


@pytest.mark.asyncio
async def test_workflow_completo() -> None:
    """Debe completar el flujo completo de aprobación."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-VWF-{_TS}")
        data = await _crear_valorizacion(c, eq_id, costo_base=5000)
        val_id = data["data"]["id"]

        # BORRADOR → PENDIENTE
        r1 = await c.post(f"/api/valuations/{val_id}/submit-draft")
        assert r1.status_code == 200
        assert r1.json()["data"]["estado"] == "PENDIENTE"

        # PENDIENTE → EN_REVISION
        r2 = await c.post(f"/api/valuations/{val_id}/submit-review")
        assert r2.status_code == 200
        assert r2.json()["data"]["estado"] == "EN_REVISION"

        # EN_REVISION → VALIDADO
        r3 = await c.post(f"/api/valuations/{val_id}/validate")
        assert r3.status_code == 200
        assert r3.json()["data"]["estado"] == "VALIDADO"

        # VALIDADO → APROBADO
        r4 = await c.post(f"/api/valuations/{val_id}/approve")
        assert r4.status_code == 200
        assert r4.json()["data"]["estado"] == "APROBADO"

        # APROBADO → PAGADO
        r5 = await c.post(f"/api/valuations/{val_id}/mark-paid")
        assert r5.status_code == 200
        assert r5.json()["data"]["estado"] == "PAGADO"


@pytest.mark.asyncio
async def test_enviar_borrador_estado_invalido() -> None:
    """Debe rechazar enviar borrador si no está en BORRADOR."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-VWF2-{_TS}")
        data = await _crear_valorizacion(c, eq_id)
        val_id = data["data"]["id"]
        await c.post(f"/api/valuations/{val_id}/submit-draft")
        # Try again
        resp = await c.post(f"/api/valuations/{val_id}/submit-draft")
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_rechazar_valorizacion() -> None:
    """Debe rechazar una valorización pendiente."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-VREJ-{_TS}")
        data = await _crear_valorizacion(c, eq_id)
        val_id = data["data"]["id"]
        await c.post(f"/api/valuations/{val_id}/submit-draft")
        resp = await c.post(
            f"/api/valuations/{val_id}/reject",
            json={"reason": "Montos incorrectos"},
        )
    assert resp.status_code == 200
    assert resp.json()["data"]["estado"] == "RECHAZADO"
    assert resp.json()["data"]["observaciones"] == "Montos incorrectos"


@pytest.mark.asyncio
async def test_reabrir_valorizacion() -> None:
    """Debe reabrir una valorización rechazada."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-VREO-{_TS}")
        data = await _crear_valorizacion(c, eq_id)
        val_id = data["data"]["id"]
        await c.post(f"/api/valuations/{val_id}/submit-draft")
        await c.post(
            f"/api/valuations/{val_id}/reject",
            json={"reason": "Error"},
        )
        resp = await c.post(f"/api/valuations/{val_id}/reopen")
    assert resp.status_code == 200
    assert resp.json()["data"]["estado"] == "BORRADOR"


# ─── Conformidad ─────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_registrar_conformidad() -> None:
    """Debe registrar conformidad del proveedor."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-VCON-{_TS}")
        data = await _crear_valorizacion(c, eq_id)
        val_id = data["data"]["id"]
        resp = await c.post(
            f"/api/valuations/{val_id}/conformidad",
            json={"fecha": "2026-01-15", "observaciones": "Conforme"},
        )
    assert resp.status_code == 200
    datos = resp.json()["data"]
    assert datos["conformidad_proveedor"] is True
    assert datos["conformidad_observaciones"] == "Conforme"


# ─── Recalculate ─────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_recalcular_valorizacion() -> None:
    """Debe recalcular totales."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-VREC-{_TS}")
        data = await _crear_valorizacion(c, eq_id, costo_base=10000)
        val_id = data["data"]["id"]
        # Update base without recalc
        await c.put(
            f"/api/valuations/{val_id}",
            json={"costo_base": 20000},
        )
        # Recalculate
        resp = await c.post(f"/api/valuations/{val_id}/recalculate")
    assert resp.status_code == 200
    datos = resp.json()["data"]
    assert datos["total_valorizado"] == 20000.0
    assert datos["igv_monto"] == 3600.0
    assert datos["total_con_igv"] == 23600.0


# ─── Documentos de pago ──────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_documentos_pago_crud() -> None:
    """Debe CRUD de documentos de pago."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-VDOC-{_TS}")
        data = await _crear_valorizacion(c, eq_id)
        val_id = data["data"]["id"]

        # Create
        r1 = await c.post(
            f"/api/valuations/{val_id}/payment-documents",
            json={"tipo_documento": "FACTURA", "numero": "F001-00001"},
        )
        assert r1.status_code == 201
        doc_id = r1.json()["data"]["id"]

        # List
        r2 = await c.get(f"/api/valuations/{val_id}/payment-documents")
        assert r2.status_code == 200
        assert len(r2.json()["data"]) >= 1

        # Update
        r3 = await c.put(
            f"/api/valuations/payment-documents/{doc_id}",
            json={"estado": "APROBADO"},
        )
        assert r3.status_code == 200
        assert r3.json()["data"]["estado"] == "APROBADO"


@pytest.mark.asyncio
async def test_verificar_documentos_completos() -> None:
    """Debe verificar si documentos están completos."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-VCHK-{_TS}")
        data = await _crear_valorizacion(c, eq_id)
        val_id = data["data"]["id"]
        resp = await c.get(
            f"/api/valuations/{val_id}/payment-documents/check"
        )
    assert resp.status_code == 200
    datos = resp.json()["data"]
    assert "complete" in datos


# ─── Pagos (Registro de Pago) ───────────────────────────────────────────


async def _crear_valorizacion_aprobada(
    c: AsyncClient, suffix: str
) -> int:
    """Helper: crear valorización y aprobarla."""
    eq_id = await _crear_equipo(c, f"T-PAG-{_TS}-{suffix}")
    data = await _crear_valorizacion(c, eq_id, costo_base=10000)
    val_id = data["data"]["id"]
    await c.post(f"/api/valuations/{val_id}/submit-draft")
    await c.post(f"/api/valuations/{val_id}/submit-review")
    await c.post(f"/api/valuations/{val_id}/validate")
    await c.post(f"/api/valuations/{val_id}/approve")
    return val_id


@pytest.mark.asyncio
async def test_crear_pago() -> None:
    """Debe crear un pago para valorización aprobada."""
    async with await _cliente_auth() as c:
        val_id = await _crear_valorizacion_aprobada(c, "P01")
        resp = await c.post(
            "/api/payments/",
            json={
                "valorizacion_id": val_id,
                "fecha_pago": str(date.today()),
                "monto_pagado": 5000,
                "metodo_pago": "TRANSFERENCIA",
            },
        )
    assert resp.status_code == 201
    datos = resp.json()
    assert datos["success"] is True
    assert datos["data"]["id"] > 0


@pytest.mark.asyncio
async def test_crear_pago_valorizacion_no_aprobada() -> None:
    """Debe rechazar pago si valorización no está aprobada."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-PNOK-{_TS}")
        data = await _crear_valorizacion(c, eq_id)
        val_id = data["data"]["id"]
        resp = await c.post(
            "/api/payments/",
            json={
                "valorizacion_id": val_id,
                "fecha_pago": str(date.today()),
                "monto_pagado": 1000,
                "metodo_pago": "EFECTIVO",
            },
        )
    assert resp.status_code == 422  # ReglaDeNegocioError


@pytest.mark.asyncio
async def test_listar_pagos() -> None:
    """Debe listar pagos."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/payments/")
    assert resp.status_code == 200
    assert resp.json()["success"] is True


@pytest.mark.asyncio
async def test_obtener_pago_por_id() -> None:
    """Debe obtener pago por ID."""
    async with await _cliente_auth() as c:
        val_id = await _crear_valorizacion_aprobada(c, "PG01")
        create_resp = await c.post(
            "/api/payments/",
            json={
                "valorizacion_id": val_id,
                "fecha_pago": str(date.today()),
                "monto_pagado": 3000,
                "metodo_pago": "EFECTIVO",
            },
        )
        pago_id = create_resp.json()["data"]["id"]
        resp = await c.get(f"/api/payments/{pago_id}")
    assert resp.status_code == 200
    datos = resp.json()["data"]
    assert datos["id"] == pago_id
    assert datos["monto_pagado"] == 3000.0


@pytest.mark.asyncio
async def test_cancelar_pago() -> None:
    """Debe cancelar (anular) un pago."""
    async with await _cliente_auth() as c:
        val_id = await _crear_valorizacion_aprobada(c, "PC01")
        create_resp = await c.post(
            "/api/payments/",
            json={
                "valorizacion_id": val_id,
                "fecha_pago": str(date.today()),
                "monto_pagado": 2000,
                "metodo_pago": "EFECTIVO",
            },
        )
        pago_id = create_resp.json()["data"]["id"]
        resp = await c.delete(f"/api/payments/{pago_id}")
    assert resp.status_code == 200
    assert resp.json()["data"]["estado"] == "ANULADO"


@pytest.mark.asyncio
async def test_reconciliar_pago() -> None:
    """Debe reconciliar un pago."""
    async with await _cliente_auth() as c:
        val_id = await _crear_valorizacion_aprobada(c, "PR01")
        create_resp = await c.post(
            "/api/payments/",
            json={
                "valorizacion_id": val_id,
                "fecha_pago": str(date.today()),
                "monto_pagado": 4000,
                "metodo_pago": "TRANSFERENCIA",
            },
        )
        pago_id = create_resp.json()["data"]["id"]
        resp = await c.post(
            f"/api/payments/{pago_id}/reconcile",
            json={"observaciones": "Conciliado OK"},
        )
    assert resp.status_code == 200
    datos = resp.json()["data"]
    assert datos["conciliado"] is True


@pytest.mark.asyncio
async def test_resumen_pagos() -> None:
    """Debe retornar resumen de pagos de una valorización."""
    async with await _cliente_auth() as c:
        val_id = await _crear_valorizacion_aprobada(c, "PS01")
        resp = await c.get(
            f"/api/payments/by-valuation/{val_id}/summary"
        )
    assert resp.status_code == 200
    datos = resp.json()["data"]
    assert datos["valorizacion_id"] == val_id
    assert datos["estado_pago"] == "SIN_PAGOS"
    assert datos["saldo_pendiente"] > 0


@pytest.mark.asyncio
async def test_listar_pagos_por_valorizacion() -> None:
    """Debe listar pagos de una valorización."""
    async with await _cliente_auth() as c:
        val_id = await _crear_valorizacion_aprobada(c, "PL01")
        # Create payment
        await c.post(
            "/api/payments/",
            json={
                "valorizacion_id": val_id,
                "fecha_pago": str(date.today()),
                "monto_pagado": 1000,
                "metodo_pago": "EFECTIVO",
            },
        )
        resp = await c.get(f"/api/payments/by-valuation/{val_id}")
    assert resp.status_code == 200
    datos = resp.json()["data"]
    assert len(datos) >= 1


# ─── Auth ────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_valorizaciones_sin_auth() -> None:
    """Debe retornar 401 sin token."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        resp = await c.get("/api/valuations/")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_pagos_sin_auth() -> None:
    """Debe retornar 401 sin token."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        resp = await c.get("/api/payments/")
    assert resp.status_code == 401
