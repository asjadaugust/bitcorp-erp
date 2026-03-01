import redis.asyncio as redis

from app.config.settings import configuracion

cliente_redis: redis.Redis | None = None


async def inicializar_redis() -> redis.Redis:
    """Inicializar conexión a Redis."""
    global cliente_redis
    cliente_redis = redis.from_url(
        configuracion.redis_url,
        decode_responses=True,
        socket_connect_timeout=3,
    )
    ping_result = cliente_redis.ping()
    if hasattr(ping_result, "__await__"):
        await ping_result
    return cliente_redis


async def cerrar_redis() -> None:
    """Cerrar conexión a Redis."""
    global cliente_redis
    if cliente_redis:
        await cliente_redis.close()
        cliente_redis = None


def obtener_redis() -> redis.Redis:
    """Obtener cliente Redis para inyección de dependencias."""
    if cliente_redis is None:
        raise RuntimeError("Redis no inicializado. Llame a inicializar_redis() primero.")
    return cliente_redis
