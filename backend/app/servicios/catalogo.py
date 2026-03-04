"""Servicio para catálogos SUNAT (solo lectura)."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.esquemas.catalogo import (
    TipoComprobanteDto,
    TipoMedioPagoDto,
    TipoOperacionDto,
    UnidadMedidaDto,
)
from app.modelos.catalogo import (
    TipoComprobante,
    TipoMedioPago,
    TipoOperacion,
    UnidadMedida,
)

logger = obtener_logger(__name__)


class ServicioCatalogo:
    """Servicio de solo lectura para tablas de catálogo SUNAT."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def listar_tipos_medio_pago(self) -> list[TipoMedioPagoDto]:
        """Listar todos los tipos de medio de pago activos."""
        resultado = await self.db.execute(
            select(TipoMedioPago)
            .where(TipoMedioPago.is_active == True)  # noqa: E712
            .order_by(TipoMedioPago.nombre.asc())
        )
        entidades = list(resultado.scalars().all())
        logger.info("tipos_medio_pago_listados", total=len(entidades))
        return [
            TipoMedioPagoDto(
                id=e.id,
                codigo=e.codigo,
                nombre=e.nombre,
                is_active=e.is_active,
            )
            for e in entidades
        ]

    async def listar_unidades_medida(self) -> list[UnidadMedidaDto]:
        """Listar todas las unidades de medida activas."""
        resultado = await self.db.execute(
            select(UnidadMedida)
            .where(UnidadMedida.is_active == True)  # noqa: E712
            .order_by(UnidadMedida.nombre.asc())
        )
        entidades = list(resultado.scalars().all())
        logger.info("unidades_medida_listadas", total=len(entidades))
        return [
            UnidadMedidaDto(
                id=e.id,
                codigo=e.codigo,
                nombre=e.nombre,
                abreviatura=e.abreviatura,
                is_active=e.is_active,
            )
            for e in entidades
        ]

    async def listar_tipos_comprobante(self) -> list[TipoComprobanteDto]:
        """Listar todos los tipos de comprobante activos."""
        resultado = await self.db.execute(
            select(TipoComprobante)
            .where(TipoComprobante.is_active == True)  # noqa: E712
            .order_by(TipoComprobante.nombre.asc())
        )
        entidades = list(resultado.scalars().all())
        logger.info("tipos_comprobante_listados", total=len(entidades))
        return [
            TipoComprobanteDto(
                id=e.id,
                codigo=e.codigo,
                nombre=e.nombre,
                is_active=e.is_active,
            )
            for e in entidades
        ]

    async def listar_tipos_operacion(self) -> list[TipoOperacionDto]:
        """Listar todos los tipos de operación activos."""
        resultado = await self.db.execute(
            select(TipoOperacion)
            .where(TipoOperacion.is_active == True)  # noqa: E712
            .order_by(TipoOperacion.nombre.asc())
        )
        entidades = list(resultado.scalars().all())
        logger.info("tipos_operacion_listados", total=len(entidades))
        return [
            TipoOperacionDto(
                id=e.id,
                codigo=e.codigo,
                nombre=e.nombre,
                ingreso_salida=e.ingreso_salida,
                is_active=e.is_active,
            )
            for e in entidades
        ]
