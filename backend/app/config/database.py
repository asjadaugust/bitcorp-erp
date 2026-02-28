from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config.settings import configuracion

motor = create_async_engine(
    configuracion.database_url,
    pool_size=configuracion.db_pool_size,
    pool_timeout=configuracion.db_pool_timeout,
    pool_pre_ping=True,
    echo=configuracion.es_desarrollo,
)

fabrica_sesion = async_sessionmaker(
    motor,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def obtener_sesion_db() -> AsyncSession:  # type: ignore[misc]
    """Generador de sesiones de base de datos para inyección de dependencias."""
    async with fabrica_sesion() as sesion:
        try:
            yield sesion
        finally:
            await sesion.close()
