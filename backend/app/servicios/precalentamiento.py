"""Servicio para configuración de precalentamiento.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.core.excepciones import NoEncontradoError
from app.esquemas.precalentamiento import (
    PrecalentamientoActualizar,
    PrecalentamientoConfigDto,
    PrecalentamientoHorasDto,
)
from app.modelos.equipo import PrecalentamientoConfig

logger = obtener_logger(__name__)


def _a_dto(entidad: PrecalentamientoConfig) -> PrecalentamientoConfigDto:
    tipo = entidad.tipo_equipo
    return PrecalentamientoConfigDto(
        id=entidad.id,
        tipo_equipo_id=entidad.tipo_equipo_id,
        tipo_equipo_codigo=tipo.codigo if tipo else "",
        tipo_equipo_nombre=tipo.nombre if tipo else "",
        categoria_prd=tipo.categoria_prd if tipo else "",
        horas_precalentamiento=float(entidad.horas_precalentamiento),
        activo=entidad.activo,
        updated_at=entidad.updated_at.isoformat() if entidad.updated_at else "",
    )


class ServicioPrecalentamiento:
    """Servicio para configuración de precalentamiento por tipo de equipo."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def listar(self) -> list[PrecalentamientoConfigDto]:
        """Listar todas las configuraciones de precalentamiento."""
        resultado = await self.db.execute(
            select(PrecalentamientoConfig).order_by(PrecalentamientoConfig.id.asc())
        )
        configs = list(resultado.scalars().all())

        logger.info("precalentamiento_configs_listadas", total=len(configs))
        return [_a_dto(c) for c in configs]

    async def obtener_por_tipo_equipo(
        self, tipo_equipo_id: int
    ) -> PrecalentamientoConfigDto | None:
        """Obtener configuración para un tipo de equipo específico."""
        resultado = await self.db.execute(
            select(PrecalentamientoConfig).where(
                PrecalentamientoConfig.tipo_equipo_id == tipo_equipo_id
            )
        )
        config = resultado.scalars().first()
        if not config:
            return None
        return _a_dto(config)

    async def obtener_horas(self, tipo_equipo_id: int) -> PrecalentamientoHorasDto:
        """Obtener solo las horas de precalentamiento (0 si no existe config)."""
        resultado = await self.db.execute(
            select(PrecalentamientoConfig).where(
                PrecalentamientoConfig.tipo_equipo_id == tipo_equipo_id,
                PrecalentamientoConfig.activo.is_(True),
            )
        )
        config = resultado.scalars().first()
        horas = float(config.horas_precalentamiento) if config else 0.0
        return PrecalentamientoHorasDto(
            tipo_equipo_id=tipo_equipo_id,
            horas_precalentamiento=horas,
        )

    async def actualizar(
        self, tipo_equipo_id: int, datos: PrecalentamientoActualizar
    ) -> PrecalentamientoConfigDto:
        """Actualizar las horas de precalentamiento para un tipo de equipo."""
        resultado = await self.db.execute(
            select(PrecalentamientoConfig).where(
                PrecalentamientoConfig.tipo_equipo_id == tipo_equipo_id
            )
        )
        config = resultado.scalars().first()
        if not config:
            raise NoEncontradoError("PrecalentamientoConfig", str(tipo_equipo_id))

        config.horas_precalentamiento = datos.horas_precalentamiento
        await self.db.commit()
        await self.db.refresh(config)

        logger.info(
            "precalentamiento_config_actualizada",
            tipo_equipo_id=tipo_equipo_id,
            horas=datos.horas_precalentamiento,
        )
        return _a_dto(config)
