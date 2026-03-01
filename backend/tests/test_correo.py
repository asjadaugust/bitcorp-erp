"""Tests para servicio de correo electrónico."""

from unittest.mock import AsyncMock, patch

import pytest

from app.servicios.correo import ConfigCorreo, ServicioCorreo


@pytest.mark.asyncio
async def test_correo_construir_mensaje() -> None:
    """Debe construir un mensaje MIME correcto."""
    config = ConfigCorreo(
        from_email="test@bitcorp.pe", from_name="BitCorp Test"
    )
    servicio = ServicioCorreo(config)
    msg = servicio._construir_mensaje(
        "dest@test.com", "Asunto Test", "<h1>Body</h1>"
    )
    assert msg["To"] == "dest@test.com"
    assert msg["Subject"] == "Asunto Test"
    assert "BitCorp Test" in msg["From"]


@pytest.mark.asyncio
async def test_correo_enviar_con_mock() -> None:
    """Debe enviar correo usando aiosmtplib."""
    servicio = ServicioCorreo()
    with patch("aiosmtplib.send", new_callable=AsyncMock) as mock_send:
        resultado = await servicio.enviar_correo(
            "dest@test.com", "Test", "<p>Test</p>"
        )
    assert resultado is True
    mock_send.assert_called_once()


@pytest.mark.asyncio
async def test_correo_alerta_documento_vencido() -> None:
    """Debe construir y enviar alerta de documento vencido."""
    servicio = ServicioCorreo()
    with patch("aiosmtplib.send", new_callable=AsyncMock):
        resultado = await servicio.enviar_alerta_documento_vencido(
            "admin@test.com", "SOAT", "2026-04-01", "Excavadora EX-001"
        )
    assert resultado is True
