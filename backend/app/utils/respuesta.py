"""Helpers de respuesta API.
"""

import math
from typing import Any

from fastapi.responses import ORJSONResponse


def enviar_exito(datos: Any, meta: Any | None = None, estado: int = 200) -> ORJSONResponse:
    """Equivalente a sendSuccess(res, data, meta, status)."""
    cuerpo: dict[str, Any] = {"success": True, "data": datos}
    if meta is not None:
        cuerpo["meta"] = meta
    return ORJSONResponse(status_code=estado, content=cuerpo)


def enviar_creado(datos: Any, meta: Any | None = None) -> ORJSONResponse:
    """Equivalente a sendCreated(res, data, meta)."""
    return enviar_exito(datos, meta, 201)


def enviar_sin_contenido() -> ORJSONResponse:
    """Equivalente a sendNoContent(res)."""
    return ORJSONResponse(status_code=204, content={"success": True, "data": None})


def enviar_paginado(
    datos: list[Any],
    pagina: int,
    limite: int,
    total: int,
) -> ORJSONResponse:
    """Equivalente a sendPaginatedSuccess(res, data, {page, limit, total})."""
    total_paginas = math.ceil(total / limite) if limite > 0 else 0
    return ORJSONResponse(
        status_code=200,
        content={
            "success": True,
            "data": datos,
            "pagination": {
                "page": pagina,
                "limit": limite,
                "total": total,
                "total_pages": total_paginas,
            },
        },
    )


def enviar_error(
    estado: int,
    codigo: str,
    mensaje: str,
    detalles: Any | None = None,
) -> ORJSONResponse:
    """Equivalente a sendError(res, status, code, message, details)."""
    cuerpo_error: dict[str, Any] = {"code": codigo, "message": mensaje}
    if detalles is not None:
        cuerpo_error["details"] = detalles
    return ORJSONResponse(
        status_code=estado,
        content={"success": False, "error": cuerpo_error},
    )
