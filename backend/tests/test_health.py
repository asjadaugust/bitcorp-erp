"""Tests para el endpoint de salud."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_health_endpoint_responde():
    """El endpoint /health debe responder con status y timestamp."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as cliente:
        respuesta = await cliente.get("/health")

    # Puede ser 200 (OK) o 503 (DEGRADED si DB/Redis no están disponibles en tests)
    assert respuesta.status_code in (200, 503)

    datos = respuesta.json()
    assert "status" in datos
    assert "timestamp" in datos
    assert "services" in datos
    assert datos["status"] in ("OK", "DEGRADED")


@pytest.mark.asyncio
async def test_ruta_inexistente_retorna_404():
    """Las rutas inexistentes deben retornar el formato de error estándar."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as cliente:
        respuesta = await cliente.get("/api/ruta-que-no-existe")

    assert respuesta.status_code == 404
    datos = respuesta.json()
    assert datos["success"] is False
    assert "error" in datos
    assert "code" in datos["error"]
    assert "message" in datos["error"]
