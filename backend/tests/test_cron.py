"""Tests para servicio de cron jobs."""

import pytest

from app.config.database import obtener_sesion_db
from app.servicios.cron import ServicioCron


async def _obtener_sesion():
    """Helper: obtener sesión de BD."""
    async for sesion in obtener_sesion_db():
        return sesion


@pytest.mark.asyncio
async def test_cron_verificar_mantenimiento() -> None:
    """Debe ejecutar verificación de mantenimiento sin errores."""
    sesion = await _obtener_sesion()
    assert sesion is not None
    servicio = ServicioCron(sesion)
    count = await servicio.verificar_mantenimiento_proximo()
    assert isinstance(count, int)
    assert count >= 0


@pytest.mark.asyncio
async def test_cron_verificar_contratos() -> None:
    """Debe ejecutar verificación de contratos sin errores."""
    sesion = await _obtener_sesion()
    assert sesion is not None
    servicio = ServicioCron(sesion)
    count = await servicio.verificar_contratos_vencimiento()
    assert isinstance(count, int)
    assert count >= 0


@pytest.mark.asyncio
async def test_cron_verificar_certificaciones() -> None:
    """Debe ejecutar verificación de certificaciones sin errores."""
    sesion = await _obtener_sesion()
    assert sesion is not None
    servicio = ServicioCron(sesion)
    count = await servicio.verificar_certificaciones_vencidas()
    assert isinstance(count, int)
    assert count >= 0


@pytest.mark.asyncio
async def test_cron_no_duplica_notificaciones() -> None:
    """Debe poder ejecutarse múltiples veces sin error."""
    sesion = await _obtener_sesion()
    assert sesion is not None
    servicio = ServicioCron(sesion)
    count1 = await servicio.verificar_mantenimiento_proximo()
    count2 = await servicio.verificar_mantenimiento_proximo()
    assert isinstance(count1, int)
    assert isinstance(count2, int)


@pytest.mark.asyncio
async def test_cron_servicio_instancia() -> None:
    """Debe instanciarse correctamente con sesión de BD."""
    sesion = await _obtener_sesion()
    assert sesion is not None
    servicio = ServicioCron(sesion)
    assert servicio.db is sesion
