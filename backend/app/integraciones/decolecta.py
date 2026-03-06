"""Cliente para la API de Decolecta (consulta SUNAT)."""

import httpx

from app.config.logging import obtener_logger
from app.config.settings import configuracion
from app.core.excepciones import ServicioNoDisponibleError, SolicitudInvalidaError

logger = obtener_logger(__name__)


async def consultar_ruc(ruc: str) -> dict:
    """Consulta datos de un RUC en SUNAT via Decolecta."""
    token = configuracion.decolecta_api_token
    if not token:
        raise ServicioNoDisponibleError("Decolecta (token no configurado)")

    url = f"{configuracion.decolecta_api_url}/sunat/ruc"
    headers = {"Authorization": f"Bearer {token}"}
    params = {"numero": ruc}

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url, headers=headers, params=params)
    except httpx.RequestError as exc:
        logger.error("decolecta_request_error", error=str(exc))
        raise ServicioNoDisponibleError("Decolecta") from exc

    if resp.status_code != 200:
        logger.warning("decolecta_error", status=resp.status_code, body=resp.text[:200])
        if resp.status_code == 404:
            raise SolicitudInvalidaError(f"RUC '{ruc}' no encontrado en SUNAT")
        raise ServicioNoDisponibleError("Decolecta")

    data = resp.json()
    return {
        "razon_social": data.get("razonSocial") or data.get("razon_social"),
        "estado_contribuyente": data.get("estado") or data.get("estado_contribuyente"),
        "condicion_contribuyente": data.get("condicion") or data.get("condicion_contribuyente"),
        "direccion": data.get("direccion"),
        "nombre_comercial": data.get("nombreComercial") or data.get("nombre_comercial"),
    }
