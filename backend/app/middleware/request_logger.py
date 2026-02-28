"""Middleware de logging de solicitudes con ID de correlación."""

import time
import uuid

import structlog
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from app.config.logging import obtener_logger

logger = obtener_logger(__name__)


class MiddlewareLogSolicitud(BaseHTTPMiddleware):
    """Agrega correlation_id a cada solicitud y registra tiempos de respuesta."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        id_correlacion = request.headers.get("x-correlation-id", str(uuid.uuid4()))
        inicio = time.perf_counter()

        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(
            correlation_id=id_correlacion,
            method=request.method,
            path=str(request.url.path),
        )

        response = await call_next(request)

        duracion_ms = round((time.perf_counter() - inicio) * 1000, 2)

        logger.info(
            "solicitud_completada",
            status_code=response.status_code,
            duracion_ms=duracion_ms,
        )

        response.headers["x-correlation-id"] = id_correlacion
        return response
