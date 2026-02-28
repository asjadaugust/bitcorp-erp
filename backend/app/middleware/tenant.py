"""Middleware de contexto de tenant (multi-tenencia).

Extrae id_empresa del JWT y lo hace disponible en el request state.
En el futuro, puede resolver una base de datos específica por empresa.
"""

import structlog
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from app.core.seguridad import verificar_token_acceso


class MiddlewareTenant(BaseHTTPMiddleware):
    """Resuelve el contexto de tenant desde el JWT para cada solicitud autenticada."""

    RUTAS_PUBLICAS = {"/health", "/docs", "/openapi.json", "/redoc"}

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        ruta = request.url.path

        # Saltar rutas públicas
        if ruta in self.RUTAS_PUBLICAS or ruta.startswith("/api/auth/login"):
            return await call_next(request)

        # Intentar extraer tenant del JWT (no bloquea si no hay token)
        auth_header = request.headers.get("authorization", "")
        if auth_header.startswith("Bearer "):
            try:
                token = auth_header[7:]
                payload = verificar_token_acceso(token)
                request.state.tenant_id = payload.id_empresa
                request.state.codigo_empresa = payload.codigo_empresa
                request.state.usuario_id = payload.id_usuario
                request.state.username = payload.username

                structlog.contextvars.bind_contextvars(
                    tenant_id=payload.id_empresa,
                    usuario_id=payload.id_usuario,
                    username=payload.username,
                )
            except Exception:
                pass

        return await call_next(request)
