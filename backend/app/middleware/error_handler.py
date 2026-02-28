"""Manejador global de excepciones.

Convierte todas las excepciones al formato estándar:
  { success: false, error: { code, message, details? } }
"""

from typing import Any

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import ORJSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config.logging import obtener_logger
from app.core.excepciones import ErrorAplicacion

logger = obtener_logger(__name__)


async def manejar_error_aplicacion(
    request: Request, exc: ErrorAplicacion
) -> ORJSONResponse:
    """Manejar excepciones de la aplicación (ErrorAplicacion y subclases)."""
    if not exc.es_operacional:
        logger.error(
            "error_no_operacional",
            codigo=exc.codigo,
            mensaje=exc.mensaje,
            path=str(request.url),
        )

    cuerpo: dict[str, Any] = {
        "success": False,
        "error": {
            "code": exc.codigo,
            "message": exc.mensaje,
        },
    }
    if exc.detalles is not None:
        cuerpo["error"]["details"] = exc.detalles

    return ORJSONResponse(status_code=exc.estado_http, content=cuerpo)


async def manejar_error_validacion(
    request: Request, exc: RequestValidationError
) -> ORJSONResponse:
    """Manejar errores de validación de Pydantic/FastAPI."""
    errores: list[dict[str, Any]] = []
    for error in exc.errors():
        campo = ".".join(str(loc) for loc in error["loc"] if loc != "body")
        errores.append({
            "field": campo,
            "message": error["msg"],
            "type": error["type"],
        })

    return ORJSONResponse(
        status_code=400,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Error de validación",
                "details": errores,
            },
        },
    )


async def manejar_error_http(
    request: Request, exc: StarletteHTTPException
) -> ORJSONResponse:
    """Manejar excepciones HTTP de Starlette (404, 405, etc.)."""
    return ORJSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": f"HTTP_{exc.status_code}",
                "message": str(exc.detail),
            },
        },
    )


async def manejar_error_generico(request: Request, exc: Exception) -> ORJSONResponse:
    """Manejar excepciones no capturadas."""
    logger.error(
        "error_no_capturado",
        tipo=type(exc).__name__,
        mensaje=str(exc),
        path=str(request.url),
        exc_info=True,
    )

    return ORJSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "Error interno del servidor",
            },
        },
    )
