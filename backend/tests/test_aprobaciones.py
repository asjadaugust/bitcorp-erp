"""Tests para el motor de aprobaciones."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from tests.conftest import obtener_token_admin


async def _cliente_auth() -> AsyncClient:
    token = await obtener_token_admin()
    c = AsyncClient(transport=ASGITransport(app=app), base_url="http://test")
    c.headers["Authorization"] = f"Bearer {token}"
    return c


# --- Templates ---


@pytest.mark.asyncio
async def test_plantillas_listar() -> None:
    """Debe retornar lista paginada de plantillas."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/approvals/templates")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert "pagination" in datos


@pytest.mark.asyncio
async def test_plantillas_listar_filtro_module() -> None:
    """Debe filtrar por module_name."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/approvals/templates?module_name=daily_report")
    assert resp.status_code == 200
    assert resp.json()["success"] is True


@pytest.mark.asyncio
async def test_plantillas_obtener_inexistente() -> None:
    """Debe retornar 404 para plantilla inexistente."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/approvals/templates/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_plantillas_crear() -> None:
    """Debe crear plantilla con pasos."""
    async with await _cliente_auth() as c:
        resp = await c.post(
            "/api/approvals/templates",
            json={
                "nombre": "Test Plantilla",
                "module_name": "daily_report",
                "descripcion": "Plantilla de prueba",
                "pasos": [
                    {
                        "paso_numero": 1,
                        "nombre_paso": "Revisión Jefe",
                        "tipo_aprobador": "ROLE",
                        "rol": "JEFE_EQUIPO",
                        "logica_aprobacion": "FIRST_APPROVES",
                        "es_opcional": False,
                    },
                    {
                        "paso_numero": 2,
                        "nombre_paso": "Aprobación Director",
                        "tipo_aprobador": "ROLE",
                        "rol": "DIRECTOR",
                        "logica_aprobacion": "FIRST_APPROVES",
                        "es_opcional": False,
                    },
                ],
            },
        )
    assert resp.status_code == 201
    datos = resp.json()
    assert datos["success"] is True
    assert "id" in datos["data"]


@pytest.mark.asyncio
async def test_plantillas_activar_inexistente() -> None:
    """Debe retornar 404 al activar inexistente."""
    async with await _cliente_auth() as c:
        resp = await c.post("/api/approvals/templates/99999/activate")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_plantillas_archivar_inexistente() -> None:
    """Debe retornar 404 al archivar inexistente."""
    async with await _cliente_auth() as c:
        resp = await c.post("/api/approvals/templates/99999/archive")
    assert resp.status_code == 404


# --- Dashboard ---


@pytest.mark.asyncio
async def test_dashboard_recibidos() -> None:
    """Debe retornar lista de solicitudes recibidas."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/approvals/dashboard/recibidos")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert isinstance(datos["data"], list)


@pytest.mark.asyncio
async def test_dashboard_enviados() -> None:
    """Debe retornar lista de solicitudes enviadas."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/approvals/dashboard/enviados")
    assert resp.status_code == 200
    assert isinstance(resp.json()["data"], list)


@pytest.mark.asyncio
async def test_dashboard_stats() -> None:
    """Debe retornar estadísticas."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/approvals/dashboard/stats")
    assert resp.status_code == 200
    d = resp.json()["data"]
    for campo in ["pendientes_recibidos", "pendientes_enviados", "aprobados", "rechazados"]:
        assert campo in d
    assert isinstance(d["pendientes_recibidos"], int)


# --- Requests ---


@pytest.mark.asyncio
async def test_solicitudes_listar() -> None:
    """Debe retornar lista paginada de solicitudes."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/approvals/requests")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert "pagination" in datos


@pytest.mark.asyncio
async def test_solicitudes_listar_filtro_estado() -> None:
    """Debe filtrar solicitudes por estado."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/approvals/requests?estado=PENDIENTE")
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_solicitudes_obtener_inexistente() -> None:
    """Debe retornar 404 para solicitud inexistente."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/approvals/requests/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_solicitudes_crear_plantilla_inexistente() -> None:
    """Debe retornar 404 al crear con plantilla inexistente."""
    async with await _cliente_auth() as c:
        resp = await c.post(
            "/api/approvals/requests",
            json={
                "plantilla_id": 99999,
                "module_name": "daily_report",
                "entity_id": 1,
                "titulo": "Test solicitud",
            },
        )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_solicitudes_aprobar_inexistente() -> None:
    """Debe retornar 404 al aprobar inexistente."""
    async with await _cliente_auth() as c:
        resp = await c.post("/api/approvals/requests/99999/approve")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_solicitudes_rechazar_inexistente() -> None:
    """Debe retornar 404 al rechazar inexistente."""
    async with await _cliente_auth() as c:
        resp = await c.post("/api/approvals/requests/99999/reject")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_solicitudes_cancelar_inexistente() -> None:
    """Debe retornar 404 al cancelar inexistente."""
    async with await _cliente_auth() as c:
        resp = await c.post("/api/approvals/requests/99999/cancel")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_solicitudes_auditoria_inexistente() -> None:
    """Debe retornar lista vacía para solicitud sin auditoría."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/approvals/requests/99999/audit")
    assert resp.status_code == 200
    assert isinstance(resp.json()["data"], list)


# --- Ad-hoc ---


@pytest.mark.asyncio
async def test_adhoc_listar() -> None:
    """Debe retornar lista paginada de ad-hoc."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/approvals/adhoc")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert "pagination" in datos


@pytest.mark.asyncio
async def test_adhoc_crear() -> None:
    """Debe crear solicitud ad-hoc."""
    async with await _cliente_auth() as c:
        resp = await c.post(
            "/api/approvals/adhoc",
            json={
                "titulo": "Aprobación de compra urgente",
                "descripcion": "Se requiere aprobación para compra de repuestos",
                "aprobadores": [1],
                "usuarios_cc": [],
                "logica_aprobacion": "FIRST_APPROVES",
            },
        )
    assert resp.status_code == 201
    datos = resp.json()
    assert datos["success"] is True
    assert "id" in datos["data"]


@pytest.mark.asyncio
async def test_adhoc_obtener_inexistente() -> None:
    """Debe retornar 404 para ad-hoc inexistente."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/approvals/adhoc/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_adhoc_responder_inexistente() -> None:
    """Debe retornar 404 al responder a inexistente."""
    async with await _cliente_auth() as c:
        resp = await c.post(
            "/api/approvals/adhoc/99999/respond",
            json={"respuesta": "APROBADO"},
        )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_adhoc_respuesta_invalida() -> None:
    """Debe rechazar respuesta inválida."""
    async with await _cliente_auth() as c:
        resp = await c.post(
            "/api/approvals/adhoc/99999/respond",
            json={"respuesta": "INVALIDO"},
        )
    assert resp.status_code in (400, 422)


# --- Auth ---


@pytest.mark.asyncio
async def test_adhoc_listar_filtro_estado() -> None:
    """Debe filtrar ad-hoc por estado."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/approvals/adhoc?estado=PENDIENTE")
    assert resp.status_code == 200
    assert resp.json()["success"] is True


@pytest.mark.asyncio
async def test_plantillas_crear_sin_pasos() -> None:
    """Debe crear plantilla sin pasos."""
    async with await _cliente_auth() as c:
        resp = await c.post(
            "/api/approvals/templates",
            json={
                "nombre": "Plantilla vacía",
                "module_name": "valorizacion",
            },
        )
    assert resp.status_code == 201
    assert resp.json()["data"]["id"] > 0


@pytest.mark.asyncio
async def test_aprobaciones_sin_auth() -> None:
    """Debe retornar 401 sin autenticación."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.get("/api/approvals/templates")
    assert resp.status_code == 401
