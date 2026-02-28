"""Punto de entrada de la aplicación FastAPI BitCorp ERP."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from datetime import UTC, datetime
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse
from sqlalchemy import text
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.router import router_api
from app.config.database import motor
from app.config.logging import configurar_logging, obtener_logger
from app.config.redis import cerrar_redis, inicializar_redis, obtener_redis
from app.config.settings import configuracion
from app.core.excepciones import ErrorAplicacion
from app.middleware.error_handler import (
    manejar_error_aplicacion,
    manejar_error_generico,
    manejar_error_http,
    manejar_error_validacion,
)
from app.middleware.request_logger import MiddlewareLogSolicitud
from app.middleware.tenant import MiddlewareTenant

logger = obtener_logger(__name__)


@asynccontextmanager
async def ciclo_vida(app: FastAPI) -> AsyncIterator[None]:
    """Eventos de inicio y cierre de la aplicación."""
    configurar_logging()
    logger.info(
        "iniciando_aplicacion", entorno=configuracion.environment, puerto=configuracion.port
    )

    await inicializar_redis()
    logger.info("redis_conectado")

    yield

    logger.info("cerrando_aplicacion")
    await cerrar_redis()
    await motor.dispose()


app = FastAPI(
    title="BitCorp ERP API",
    version="2.0.0",
    description="Backend FastAPI para BitCorp ERP",
    docs_url="/docs",
    redoc_url="/redoc",
    default_response_class=ORJSONResponse,
    lifespan=ciclo_vida,
)

# --- Middleware (orden inverso de ejecución) ---
app.add_middleware(MiddlewareTenant)
app.add_middleware(MiddlewareLogSolicitud)
app.add_middleware(
    CORSMiddleware,
    allow_origins=configuracion.origenes_cors,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Manejadores de excepciones ---


async def _manejar_error_app(request: Request, exc: Exception) -> ORJSONResponse:
    assert isinstance(exc, ErrorAplicacion)
    return await manejar_error_aplicacion(request, exc)


async def _manejar_error_val(request: Request, exc: Exception) -> ORJSONResponse:
    assert isinstance(exc, RequestValidationError)
    return await manejar_error_validacion(request, exc)


async def _manejar_error_http_wrapper(request: Request, exc: Exception) -> ORJSONResponse:
    assert isinstance(exc, StarletteHTTPException)
    return await manejar_error_http(request, exc)


app.add_exception_handler(ErrorAplicacion, _manejar_error_app)
app.add_exception_handler(RequestValidationError, _manejar_error_val)
app.add_exception_handler(StarletteHTTPException, _manejar_error_http_wrapper)
app.add_exception_handler(Exception, manejar_error_generico)

# --- Routers ---
app.include_router(router_api)


# --- Health check ---
@app.get("/health")
async def health_check() -> ORJSONResponse:
    """Verificación de salud del servicio."""
    verificaciones: dict[str, Any] = {
        "status": "OK",
        "timestamp": datetime.now(UTC).isoformat(),
        "services": {},
    }

    # Verificar base de datos
    try:
        async with motor.connect() as conn:
            resultado = await conn.execute(text("SELECT 1"))
            resultado.fetchone()
        verificaciones["services"]["database"] = "OK"
    except Exception as e:
        verificaciones["services"]["database"] = f"ERROR: {e}"
        verificaciones["status"] = "DEGRADED"

    # Verificar Redis
    try:
        cliente = obtener_redis()
        resultado_ping = cliente.ping()
        # redis.asyncio.ping() returns Awaitable[bool] | bool
        if hasattr(resultado_ping, "__await__"):
            pong = await resultado_ping
        else:
            pong = resultado_ping
        if pong:
            verificaciones["services"]["redis"] = "OK"
        else:
            verificaciones["services"]["redis"] = "ERROR: no pong"
            verificaciones["status"] = "DEGRADED"
    except Exception as e:
        verificaciones["services"]["redis"] = f"ERROR: {e}"
        verificaciones["status"] = "DEGRADED"

    estado_http = 200 if verificaciones["status"] == "OK" else 503
    return ORJSONResponse(status_code=estado_http, content=verificaciones)
