"""Servicio para adelantos y amortizaciones de contratos."""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.core.excepciones import NoEncontradoError
from app.esquemas.valorizacion import (
    AdelantoActualizar,
    AdelantoAmortizacionDto,
    AdelantoCrear,
)
from app.modelos.equipo import AdelantoAmortizacion, ContratoAdenda

logger = obtener_logger(__name__)


def _a_dto(a: AdelantoAmortizacion) -> AdelantoAmortizacionDto:
    return AdelantoAmortizacionDto(
        id=a.id,
        contrato_id=None,
        equipo_id=a.equipo_id,
        valorizacion_id=a.valorizacion_id,
        tipo_operacion=a.tipo_operacion,
        fecha=a.fecha,
        numero_documento=a.numero_documento,
        concepto=a.concepto,
        numero_cuota=a.numero_cuota,
        monto=float(a.monto),
        created_at=a.created_at,
    )


class ServicioAdelanto:
    """CRUD para adelantos/amortizaciones."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def _verificar_contrato(
        self, tenant_id: int, contrato_id: int
    ) -> ContratoAdenda:
        result = await self.db.execute(
            select(ContratoAdenda).where(
                ContratoAdenda.id == contrato_id,
                ContratoAdenda.tenant_id == tenant_id,
            )
        )
        c = result.scalars().first()
        if not c:
            raise NoEncontradoError("Contrato", contrato_id)
        return c

    async def listar_por_contrato(
        self, tenant_id: int, contrato_id: int
    ) -> list[AdelantoAmortizacionDto]:
        # Get equipo_id from the contract, then query by equipo_id
        contrato = await self._verificar_contrato(tenant_id, contrato_id)
        result = await self.db.execute(
            select(AdelantoAmortizacion)
            .where(AdelantoAmortizacion.equipo_id == contrato.equipo_id)
            .order_by(AdelantoAmortizacion.fecha.asc())
        )
        return [_a_dto(a) for a in result.scalars().all()]

    async def listar_por_valorizacion(
        self, tenant_id: int, val_id: int
    ) -> list[AdelantoAmortizacionDto]:
        result = await self.db.execute(
            select(AdelantoAmortizacion)
            .where(AdelantoAmortizacion.valorizacion_id == val_id)
            .order_by(AdelantoAmortizacion.fecha.asc())
        )
        return [_a_dto(a) for a in result.scalars().all()]

    async def crear(
        self, tenant_id: int, contrato_id: int, datos: AdelantoCrear
    ) -> AdelantoAmortizacionDto:
        contrato = await self._verificar_contrato(tenant_id, contrato_id)
        adelanto = AdelantoAmortizacion(
            equipo_id=datos.equipo_id or contrato.equipo_id,
            valorizacion_id=datos.valorizacion_id,
            tipo_operacion=datos.tipo_operacion,
            fecha=datos.fecha,
            numero_documento=datos.numero_documento,
            concepto=datos.concepto,
            numero_cuota=datos.numero_cuota,
            monto=datos.monto,
        )
        self.db.add(adelanto)
        await self.db.commit()
        await self.db.refresh(adelanto)
        logger.info("adelanto_creado", id=adelanto.id)
        return _a_dto(adelanto)

    async def actualizar(
        self, tenant_id: int, adelanto_id: int, datos: AdelantoActualizar
    ) -> AdelantoAmortizacionDto:
        result = await self.db.execute(
            select(AdelantoAmortizacion).where(
                AdelantoAmortizacion.id == adelanto_id,
            )
        )
        adelanto = result.scalars().first()
        if not adelanto:
            raise NoEncontradoError("Adelanto", adelanto_id)

        campos = datos.model_dump(exclude_unset=True)
        for campo, valor in campos.items():
            setattr(adelanto, campo, valor)

        await self.db.commit()
        await self.db.refresh(adelanto)
        logger.info("adelanto_actualizado", id=adelanto_id)
        return _a_dto(adelanto)

    async def eliminar(self, tenant_id: int, adelanto_id: int) -> None:
        result = await self.db.execute(
            select(AdelantoAmortizacion).where(
                AdelantoAmortizacion.id == adelanto_id,
            )
        )
        adelanto = result.scalars().first()
        if not adelanto:
            raise NoEncontradoError("Adelanto", adelanto_id)
        await self.db.delete(adelanto)
        await self.db.commit()
        logger.info("adelanto_eliminado", id=adelanto_id)

    async def total_amortizacion_valorizacion(
        self, tenant_id: int, val_id: int
    ) -> float:
        """Sum of monto for AMORTIZACION rows linked to a valuation."""
        result = await self.db.execute(
            select(
                func.coalesce(func.sum(func.abs(AdelantoAmortizacion.monto)), 0)
            ).where(
                AdelantoAmortizacion.valorizacion_id == val_id,
                AdelantoAmortizacion.tipo_operacion == "AMORTIZACION",
            )
        )
        return float(result.scalar_one())
