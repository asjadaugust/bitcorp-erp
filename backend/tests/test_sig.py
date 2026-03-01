"""Tests para SIG / documentos."""

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


@pytest.mark.asyncio
async def test_sig_listar_documentos() -> None:
    """Debe retornar lista paginada de documentos."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/sig/documents")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["success"] is True
    assert "pagination" in datos


@pytest.mark.asyncio
async def test_sig_listar_filtro_tipo() -> None:
    """Debe filtrar documentos por tipo."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/sig/documents?tipo_documento=PROCEDIMIENTO")
    assert resp.status_code == 200
    assert resp.json()["success"] is True


@pytest.mark.asyncio
async def test_sig_crear_documento() -> None:
    """Debe crear un nuevo documento."""
    async with await _cliente_auth() as c:
        resp = await c.post(
            "/api/sig/documents",
            json={
                "codigo": f"SIG-T-{uuid4().hex[:8]}",
                "titulo": f"Procedimiento de Prueba {uuid4().hex[:6]}",
                "tipo_documento": "PROCEDIMIENTO",
                "version": "1.0",
            },
        )
    assert resp.status_code == 201
    datos = resp.json()
    assert datos["success"] is True
    assert "id" in datos["data"]


@pytest.mark.asyncio
async def test_sig_crear_codigo_duplicado() -> None:
    """Debe retornar 409 para código duplicado."""
    async with await _cliente_auth() as c:
        payload = {
            "codigo": f"SIG-D-{uuid4().hex[:8]}",
            "titulo": "Documento Dup",
        }
        await c.post("/api/sig/documents", json=payload)
        resp = await c.post("/api/sig/documents", json=payload)
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_sig_obtener_inexistente() -> None:
    """Debe retornar 404 para documento inexistente."""
    async with await _cliente_auth() as c:
        resp = await c.get("/api/sig/documents/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_sig_eliminar_inexistente() -> None:
    """Debe retornar 404 al eliminar documento inexistente."""
    async with await _cliente_auth() as c:
        resp = await c.delete("/api/sig/documents/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_sig_sin_auth() -> None:
    """Debe retornar 401 sin autenticación."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.get("/api/sig/documents")
    assert resp.status_code == 401
