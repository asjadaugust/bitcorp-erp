"""Tests para contratos."""

import time
from datetime import date, timedelta

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from tests.conftest import obtener_token_admin

# Unique suffix per test run to avoid collisions
_TS = str(int(time.time()))[-6:]


async def _cliente_auth() -> AsyncClient:
    token = await obtener_token_admin()
    c = AsyncClient(transport=ASGITransport(app=app), base_url="http://test")
    c.headers["Authorization"] = f"Bearer {token}"
    return c


async def _crear_equipo(c: AsyncClient, codigo: str) -> int:
    """Helper: crear equipo y retornar su ID."""
    resp = await c.post("/api/equipment/", json={"codigo_equipo": codigo})
    assert resp.status_code == 201, f"Failed to create equipment: {resp.text}"
    return resp.json()["data"]["id"]


async def _crear_contrato(
    c: AsyncClient, numero: str, equipo_id: int, **kwargs: object
) -> dict[str, object]:
    """Helper: crear contrato y retornar respuesta."""
    today = date.today()
    payload: dict[str, object] = {
        "numero_contrato": numero,
        "equipo_id": equipo_id,
        "fecha_contrato": str(today),
        "fecha_inicio": str(today),
        "fecha_fin": str(today + timedelta(days=365)),
        "moneda": "PEN",
        **kwargs,
    }
    resp = await c.post("/api/contracts/", json=payload)
    return resp.json()


# ─── Listar ──────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_listar_contratos() -> None:
    """Debe retornar lista paginada de contratos."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/contracts/")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert "data" in datos
    assert "pagination" in datos


@pytest.mark.asyncio
async def test_listar_contratos_con_filtro_estado() -> None:
    """Debe filtrar contratos por estado."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/contracts/?estado=ACTIVO")
    assert resp.status_code == 200
    assert resp.json()["success"] is True


@pytest.mark.asyncio
async def test_listar_contratos_paginacion() -> None:
    """Debe paginar correctamente."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/contracts/?page=1&limit=5")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["pagination"]["page"] == 1
    assert datos["pagination"]["limit"] == 5


# ─── Contar activos ─────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_contar_activos() -> None:
    """Debe retornar count de contratos activos."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/contracts/stats/count")
    assert resp.status_code == 200
    datos = resp.json()
    assert "count" in datos["data"]


# ─── CRUD ────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_crear_contrato() -> None:
    """Debe crear un contrato nuevo."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-CNT-{_TS}-001")
        resp = await c.post(
            "/api/contracts/",
            json={
                "numero_contrato": f"CNT-{_TS}-001",
                "equipo_id": eq_id,
                "fecha_contrato": "2026-01-01",
                "fecha_inicio": "2026-01-01",
                "fecha_fin": "2027-01-01",
                "moneda": "PEN",
                "tarifa": 5000,
                "modalidad": "ALQUILER_PURO",
            },
        )
    assert resp.status_code == 201
    datos = resp.json()
    assert datos["success"] is True
    assert datos["data"]["id"] > 0


@pytest.mark.asyncio
async def test_crear_contrato_numero_duplicado() -> None:
    """Debe rechazar número de contrato duplicado."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-CDUP-{_TS}")
        data = await _crear_contrato(c, f"CNT-DUP-{_TS}", eq_id)
        assert data["success"] is True
        # Try duplicate
        eq_id2 = await _crear_equipo(c, f"T-CDUP2-{_TS}")
        resp = await c.post(
            "/api/contracts/",
            json={
                "numero_contrato": f"CNT-DUP-{_TS}",
                "equipo_id": eq_id2,
                "fecha_contrato": "2026-01-01",
                "fecha_inicio": "2026-06-01",
                "fecha_fin": "2027-06-01",
            },
        )
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_crear_contrato_fechas_invalidas() -> None:
    """Debe rechazar fecha_fin <= fecha_inicio."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-CDATE-{_TS}")
        resp = await c.post(
            "/api/contracts/",
            json={
                "numero_contrato": f"CNT-DATE-{_TS}",
                "equipo_id": eq_id,
                "fecha_contrato": "2026-01-01",
                "fecha_inicio": "2026-06-01",
                "fecha_fin": "2026-01-01",
            },
        )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_obtener_contrato_por_id() -> None:
    """Debe obtener contrato por ID."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-CGET-{_TS}")
        data = await _crear_contrato(c, f"CNT-GET-{_TS}", eq_id, tarifa=5000)
        contrato_id = data["data"]["id"]
        resp = await c.get(f"/api/contracts/{contrato_id}")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["data"]["id"] == contrato_id
    assert datos["data"]["numero_contrato"] == f"CNT-GET-{_TS}"


@pytest.mark.asyncio
async def test_contrato_inexistente() -> None:
    """Debe retornar 404 para contrato inexistente."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/contracts/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_obtener_por_numero() -> None:
    """Debe obtener contrato por número."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-CNUM-{_TS}")
        await _crear_contrato(c, f"CNT-NUM-{_TS}", eq_id)
        resp = await c.get(f"/api/contracts/numero/CNT-NUM-{_TS}")
    assert resp.status_code == 200
    assert resp.json()["data"]["numero_contrato"] == f"CNT-NUM-{_TS}"


@pytest.mark.asyncio
async def test_actualizar_contrato() -> None:
    """Debe actualizar un contrato."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-CUPD-{_TS}")
        data = await _crear_contrato(c, f"CNT-UPD-{_TS}", eq_id, tarifa=5000)
        contrato_id = data["data"]["id"]
        resp = await c.put(
            f"/api/contracts/{contrato_id}",
            json={"tarifa": 6000, "modalidad": "TANTO_ALZADO"},
        )
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["data"]["tarifa"] == 6000.0
    assert datos["data"]["modalidad"] == "TANTO_ALZADO"


@pytest.mark.asyncio
async def test_eliminar_contrato() -> None:
    """Debe eliminar (soft delete) un contrato."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-CDEL-{_TS}")
        data = await _crear_contrato(c, f"CNT-DEL-{_TS}", eq_id)
        contrato_id = data["data"]["id"]
        resp = await c.delete(f"/api/contracts/{contrato_id}")
    assert resp.status_code == 204


# ─── Adendas ─────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_crear_adenda() -> None:
    """Debe crear adenda y actualizar parent fecha_fin."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-CADN-{_TS}")
        data = await _crear_contrato(
            c, f"CNT-ADN-{_TS}", eq_id,
            fecha_inicio="2026-01-01", fecha_fin="2026-12-31",
        )
        parent_id = data["data"]["id"]

        # Create addendum
        resp = await c.post(
            "/api/contracts/addendums",
            json={
                "contrato_padre_id": parent_id,
                "numero_contrato": f"CNT-ADN-{_TS}-AD01",
                "fecha_fin": "2027-06-30",
            },
        )
    assert resp.status_code == 201
    assert resp.json()["data"]["id"] > 0


@pytest.mark.asyncio
async def test_listar_adendas() -> None:
    """Debe listar adendas de un contrato."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-CADN2-{_TS}")
        data = await _crear_contrato(
            c, f"CNT-ADN2-{_TS}", eq_id,
            fecha_inicio="2026-01-01", fecha_fin="2026-12-31",
        )
        parent_id = data["data"]["id"]

        # Create addendum
        await c.post(
            "/api/contracts/addendums",
            json={
                "contrato_padre_id": parent_id,
                "numero_contrato": f"CNT-ADN2-{_TS}-AD01",
                "fecha_fin": "2027-06-30",
            },
        )
        resp = await c.get(f"/api/contracts/{parent_id}/addendums")
    assert resp.status_code == 200
    assert len(resp.json()["data"]) >= 1


# ─── Overlap check ──────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_contrato_solapamiento() -> None:
    """Debe rechazar contrato solapado para mismo equipo."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-COVLP-{_TS}")
        await _crear_contrato(
            c, f"CNT-OVL1-{_TS}", eq_id,
            fecha_inicio="2026-01-01", fecha_fin="2026-12-31",
        )
        # Try overlapping
        resp = await c.post(
            "/api/contracts/",
            json={
                "numero_contrato": f"CNT-OVL2-{_TS}",
                "equipo_id": eq_id,
                "fecha_contrato": "2026-06-01",
                "fecha_inicio": "2026-06-01",
                "fecha_fin": "2027-06-01",
            },
        )
    assert resp.status_code == 422  # BusinessRuleError


# ─── Resolver / Liquidar ────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_resolver_contrato() -> None:
    """Debe resolver contrato ACTIVO → RESUELTO."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-CRES-{_TS}")
        data = await _crear_contrato(c, f"CNT-RES-{_TS}", eq_id)
        contrato_id = data["data"]["id"]
        resp = await c.post(
            f"/api/contracts/{contrato_id}/resolver",
            json={
                "causal_resolucion": "INCUMPLIMIENTO",
                "motivo_resolucion": "No cumplió con las obligaciones",
                "fecha_resolucion": "2026-06-15",
            },
        )
    assert resp.status_code == 200
    assert resp.json()["data"]["estado"] == "RESUELTO"


@pytest.mark.asyncio
async def test_verificar_liquidacion() -> None:
    """Debe retornar check de liquidación."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-CLIQ-{_TS}")
        data = await _crear_contrato(c, f"CNT-LIQ-{_TS}", eq_id)
        contrato_id = data["data"]["id"]
        resp = await c.get(f"/api/contracts/{contrato_id}/liquidation-check")
    assert resp.status_code == 200
    datos = resp.json()["data"]
    assert "puede_liquidar" in datos
    assert "observaciones" in datos


# ─── Obligaciones del Arrendador ────────────────────────────────────────


@pytest.mark.asyncio
async def test_inicializar_obligaciones() -> None:
    """Debe inicializar 9 obligaciones del arrendador."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-COBL-{_TS}")
        data = await _crear_contrato(c, f"CNT-OBL-{_TS}", eq_id)
        contrato_id = data["data"]["id"]
        resp = await c.post(f"/api/contracts/{contrato_id}/obligaciones/initialize")
    assert resp.status_code == 200
    items = resp.json()["data"]
    assert len(items) == 9


@pytest.mark.asyncio
async def test_listar_obligaciones() -> None:
    """Debe listar obligaciones del arrendador."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-COBL2-{_TS}")
        data = await _crear_contrato(c, f"CNT-OBL2-{_TS}", eq_id)
        contrato_id = data["data"]["id"]
        await c.post(f"/api/contracts/{contrato_id}/obligaciones/initialize")
        resp = await c.get(f"/api/contracts/{contrato_id}/obligaciones")
    assert resp.status_code == 200
    assert len(resp.json()["data"]) == 9


@pytest.mark.asyncio
async def test_actualizar_obligacion() -> None:
    """Debe actualizar estado de obligación."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-COBL3-{_TS}")
        data = await _crear_contrato(c, f"CNT-OBL3-{_TS}", eq_id)
        contrato_id = data["data"]["id"]
        init_resp = await c.post(f"/api/contracts/{contrato_id}/obligaciones/initialize")
        obligacion_id = init_resp.json()["data"][0]["id"]
        resp = await c.put(
            f"/api/contracts/obligaciones/{obligacion_id}",
            json={"estado": "CUMPLIDA"},
        )
    assert resp.status_code == 200
    assert resp.json()["data"]["estado"] == "CUMPLIDA"


# ─── Obligaciones del Arrendatario ──────────────────────────────────────


@pytest.mark.asyncio
async def test_inicializar_obligaciones_arrendatario() -> None:
    """Debe inicializar 4 obligaciones del arrendatario."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-CART-{_TS}")
        data = await _crear_contrato(c, f"CNT-ART-{_TS}", eq_id)
        contrato_id = data["data"]["id"]
        resp = await c.post(
            f"/api/contracts/{contrato_id}/obligaciones-arrendatario/initialize"
        )
    assert resp.status_code == 200
    assert len(resp.json()["data"]) == 4


@pytest.mark.asyncio
async def test_actualizar_obligacion_arrendatario() -> None:
    """Debe actualizar obligación del arrendatario."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-CART2-{_TS}")
        data = await _crear_contrato(c, f"CNT-ART2-{_TS}", eq_id)
        contrato_id = data["data"]["id"]
        init_resp = await c.post(
            f"/api/contracts/{contrato_id}/obligaciones-arrendatario/initialize"
        )
        obligacion_id = init_resp.json()["data"][0]["id"]
        resp = await c.put(
            f"/api/contracts/obligaciones-arrendatario/{obligacion_id}",
            json={"estado": "INCUMPLIDA", "observaciones": "No cumplido"},
        )
    assert resp.status_code == 200
    assert resp.json()["data"]["estado"] == "INCUMPLIDA"


# ─── Documentos Requeridos ──────────────────────────────────────────────


@pytest.mark.asyncio
async def test_inicializar_documentos_requeridos() -> None:
    """Debe inicializar 5 documentos requeridos."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-CDOC-{_TS}")
        data = await _crear_contrato(c, f"CNT-DOC-{_TS}", eq_id)
        contrato_id = data["data"]["id"]
        resp = await c.post(
            f"/api/contracts/{contrato_id}/required-documents/initialize"
        )
    assert resp.status_code == 200
    assert len(resp.json()["data"]) == 5


@pytest.mark.asyncio
async def test_actualizar_documento_requerido() -> None:
    """Debe actualizar documento requerido."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-CDOC2-{_TS}")
        data = await _crear_contrato(c, f"CNT-DOC2-{_TS}", eq_id)
        contrato_id = data["data"]["id"]
        init_resp = await c.post(
            f"/api/contracts/{contrato_id}/required-documents/initialize"
        )
        doc_id = init_resp.json()["data"][0]["id"]
        resp = await c.put(
            f"/api/contracts/required-documents/{doc_id}",
            json={"estado": "VIGENTE", "observaciones": "Documento al día"},
        )
    assert resp.status_code == 200
    assert resp.json()["data"]["estado"] == "VIGENTE"


# ─── Anexos ─────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_guardar_y_listar_anexos() -> None:
    """Debe guardar y listar anexos tipo A."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-CANX-{_TS}")
        data = await _crear_contrato(c, f"CNT-ANX-{_TS}", eq_id)
        contrato_id = data["data"]["id"]

        # Save annexes
        await c.put(
            f"/api/contracts/{contrato_id}/annexes/A",
            json=[
                {"concepto": "Condición 1", "incluido": True},
                {"concepto": "Condición 2", "incluido": False, "observaciones": "Pendiente"},
            ],
        )
        resp = await c.get(f"/api/contracts/{contrato_id}/annexes?tipo_anexo=A")
    assert resp.status_code == 200
    datos = resp.json()["data"]
    assert len(datos) == 2
    assert datos[0]["concepto"] == "Condición 1"


# ─── Legalización ───────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_iniciar_legalizacion() -> None:
    """Debe iniciar legalización con 4 pasos."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-CLEG-{_TS}")
        data = await _crear_contrato(c, f"CNT-LEG-{_TS}", eq_id)
        contrato_id = data["data"]["id"]
        resp = await c.post(f"/api/contracts/{contrato_id}/legalizacion/iniciar")
    assert resp.status_code == 200
    pasos = resp.json()["data"]
    assert len(pasos) == 4
    assert pasos[0]["tipo_paso"] == "PENDIENTE_FIRMA_PROVEEDOR"
    assert pasos[0]["completado"] is False


@pytest.mark.asyncio
async def test_completar_paso_legalizacion() -> None:
    """Debe completar paso de legalización en orden."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-CLEG2-{_TS}")
        data = await _crear_contrato(c, f"CNT-LEG2-{_TS}", eq_id)
        contrato_id = data["data"]["id"]
        await c.post(f"/api/contracts/{contrato_id}/legalizacion/iniciar")

        # Complete step 1
        resp = await c.post(
            f"/api/contracts/{contrato_id}/legalizacion/paso/1",
            json={"observaciones": "Firmado"},
        )
    assert resp.status_code == 200
    pasos = resp.json()["data"]
    assert pasos[0]["completado"] is True
    assert pasos[1]["completado"] is False


@pytest.mark.asyncio
async def test_completar_paso_fuera_de_orden() -> None:
    """Debe rechazar completar paso fuera de orden."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-CLEG3-{_TS}")
        data = await _crear_contrato(c, f"CNT-LEG3-{_TS}", eq_id)
        contrato_id = data["data"]["id"]
        await c.post(f"/api/contracts/{contrato_id}/legalizacion/iniciar")

        # Try to complete step 2 without step 1
        resp = await c.post(
            f"/api/contracts/{contrato_id}/legalizacion/paso/2",
            json={},
        )
    assert resp.status_code == 422  # BusinessRuleError


@pytest.mark.asyncio
async def test_revertir_paso_legalizacion() -> None:
    """Debe revertir último paso completado."""
    async with await _cliente_auth() as c:
        eq_id = await _crear_equipo(c, f"T-CLEG4-{_TS}")
        data = await _crear_contrato(c, f"CNT-LEG4-{_TS}", eq_id)
        contrato_id = data["data"]["id"]
        await c.post(f"/api/contracts/{contrato_id}/legalizacion/iniciar")

        # Complete step 1
        await c.post(
            f"/api/contracts/{contrato_id}/legalizacion/paso/1",
            json={},
        )
        # Revert step 1
        resp = await c.post(
            f"/api/contracts/{contrato_id}/legalizacion/paso/1/revertir",
        )
    assert resp.status_code == 200
    pasos = resp.json()["data"]
    assert pasos[0]["completado"] is False


# ─── Auth ───────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_contratos_sin_auth() -> None:
    """Debe retornar 401 sin token."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        resp = await c.get("/api/contracts/")
    assert resp.status_code == 401
