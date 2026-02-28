"""Servicio para configuración de combustible.

Replica CombustibleConfigService del BFF Node.js.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.esquemas.combustible import (
    CombustibleActualizar,
    CombustibleConfigDto,
    CombustiblePrecioDto,
)
from app.modelos.equipo import ConfiguracionCombustible

logger = obtener_logger(__name__)

PRECIO_MANIPULEO_POR_DEFECTO: float = 0.8


def _a_dto(entidad: ConfiguracionCombustible) -> CombustibleConfigDto:
    return CombustibleConfigDto(
        id=entidad.id,
        precio_manipuleo=float(entidad.precio_manipuleo),
        activo=entidad.activo,
        updated_by=entidad.updated_by,
        updated_at=entidad.updated_at.isoformat() if entidad.updated_at else None,
    )


class ServicioCombustible:
    """Servicio para configuración de tarifa de manipuleo de combustible."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def obtener(self) -> CombustibleConfigDto | None:
        """Obtener la configuración actual (primera fila activa)."""
        resultado = await self.db.execute(
            select(ConfiguracionCombustible)
            .where(ConfiguracionCombustible.activo.is_(True))
            .order_by(ConfiguracionCombustible.id.asc())
        )
        config = resultado.scalars().first()
        if not config:
            return None
        return _a_dto(config)

    async def obtener_precio_manipuleo(self) -> CombustiblePrecioDto:
        """Obtener solo la tarifa de manipuleo (fallback a 0.80)."""
        resultado = await self.db.execute(
            select(ConfiguracionCombustible)
            .where(ConfiguracionCombustible.activo.is_(True))
            .order_by(ConfiguracionCombustible.id.asc())
        )
        config = resultado.scalars().first()
        precio = (
            float(config.precio_manipuleo)
            if config
            else PRECIO_MANIPULEO_POR_DEFECTO
        )
        return CombustiblePrecioDto(precio_manipuleo=precio)

    async def actualizar(
        self, datos: CombustibleActualizar, usuario_id: int
    ) -> CombustibleConfigDto:
        """Actualizar la tarifa de manipuleo. Crea registro si no existe."""
        resultado = await self.db.execute(
            select(ConfiguracionCombustible)
            .where(ConfiguracionCombustible.activo.is_(True))
            .order_by(ConfiguracionCombustible.id.asc())
        )
        config = resultado.scalars().first()

        if not config:
            config = ConfiguracionCombustible(
                precio_manipuleo=datos.precio_manipuleo,
                activo=True,
                updated_by=usuario_id,
            )
            self.db.add(config)
        else:
            config.precio_manipuleo = datos.precio_manipuleo
            config.updated_by = usuario_id

        await self.db.commit()
        await self.db.refresh(config)

        logger.info(
            "combustible_config_actualizada",
            precio_manipuleo=datos.precio_manipuleo,
            usuario_id=usuario_id,
        )
        return _a_dto(config)
