"""Servicio para gastos en obra de valorizaciones."""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.core.excepciones import NoEncontradoError
from app.esquemas.valorizacion import (
    GastoEnObraActualizar,
    GastoEnObraCrear,
    GastoEnObraDto,
)
from app.modelos.equipo import GastoEnObra, ValorizacionEquipo

logger = obtener_logger(__name__)

IGV_RATE = 1.18


def _a_dto(g: GastoEnObra) -> GastoEnObraDto:
    return GastoEnObraDto(
        id=g.id,
        valorizacion_id=g.valorizacion_id,
        fecha=g.fecha,
        proveedor=g.proveedor,
        concepto=g.concepto,
        tipo_documento=g.tipo_documento,
        numero_documento=g.numero_documento,
        importe=float(g.importe),
        incluye_igv=g.incluye_igv,
        importe_sin_igv=float(g.importe_sin_igv),
        created_at=g.created_at,
    )


def _calcular_sin_igv(importe: float, incluye_igv: bool) -> float:
    if incluye_igv:
        return round(importe / IGV_RATE, 2)
    return importe


class ServicioGastoEnObra:
    """CRUD para gastos en obra de una valorización."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def _verificar_valorizacion(
        self, tenant_id: int, val_id: int
    ) -> ValorizacionEquipo:
        result = await self.db.execute(
            select(ValorizacionEquipo).where(
                ValorizacionEquipo.id == val_id,
                ValorizacionEquipo.tenant_id == tenant_id,
            )
        )
        v = result.scalars().first()
        if not v:
            raise NoEncontradoError("Valorizacion", val_id)
        return v

    async def listar(
        self, tenant_id: int, val_id: int
    ) -> list[GastoEnObraDto]:
        await self._verificar_valorizacion(tenant_id, val_id)
        result = await self.db.execute(
            select(GastoEnObra)
            .where(
                GastoEnObra.valorizacion_id == val_id,
                GastoEnObra.tenant_id == tenant_id,
            )
            .order_by(GastoEnObra.fecha.asc())
        )
        return [_a_dto(g) for g in result.scalars().all()]

    async def crear(
        self, tenant_id: int, val_id: int, datos: GastoEnObraCrear
    ) -> GastoEnObraDto:
        await self._verificar_valorizacion(tenant_id, val_id)
        importe_sin_igv = _calcular_sin_igv(datos.importe, datos.incluye_igv)
        gasto = GastoEnObra(
            valorizacion_id=val_id,
            fecha=datos.fecha,
            proveedor=datos.proveedor,
            concepto=datos.concepto,
            tipo_documento=datos.tipo_documento,
            numero_documento=datos.numero_documento,
            importe=datos.importe,
            incluye_igv=datos.incluye_igv,
            importe_sin_igv=importe_sin_igv,
            tenant_id=tenant_id,
        )
        self.db.add(gasto)
        await self.db.commit()
        await self.db.refresh(gasto)
        logger.info("gasto_obra_creado", id=gasto.id, val_id=val_id)
        return _a_dto(gasto)

    async def actualizar(
        self, tenant_id: int, gasto_id: int, datos: GastoEnObraActualizar
    ) -> GastoEnObraDto:
        result = await self.db.execute(
            select(GastoEnObra).where(
                GastoEnObra.id == gasto_id,
                GastoEnObra.tenant_id == tenant_id,
            )
        )
        gasto = result.scalars().first()
        if not gasto:
            raise NoEncontradoError("GastoEnObra", gasto_id)

        campos = datos.model_dump(exclude_unset=True)
        for campo, valor in campos.items():
            setattr(gasto, campo, valor)

        # Recalculate importe_sin_igv
        importe = float(gasto.importe)
        incluye = gasto.incluye_igv
        gasto.importe_sin_igv = _calcular_sin_igv(importe, incluye)

        await self.db.commit()
        await self.db.refresh(gasto)
        logger.info("gasto_obra_actualizado", id=gasto_id)
        return _a_dto(gasto)

    async def eliminar(self, tenant_id: int, gasto_id: int) -> None:
        result = await self.db.execute(
            select(GastoEnObra).where(
                GastoEnObra.id == gasto_id,
                GastoEnObra.tenant_id == tenant_id,
            )
        )
        gasto = result.scalars().first()
        if not gasto:
            raise NoEncontradoError("GastoEnObra", gasto_id)
        await self.db.delete(gasto)
        await self.db.commit()
        logger.info("gasto_obra_eliminado", id=gasto_id)

    async def total_sin_igv(self, tenant_id: int, val_id: int) -> float:
        """Sum of importe_sin_igv for a valuation."""
        result = await self.db.execute(
            select(func.coalesce(func.sum(GastoEnObra.importe_sin_igv), 0)).where(
                GastoEnObra.valorizacion_id == val_id,
                GastoEnObra.tenant_id == tenant_id,
            )
        )
        return float(result.scalar_one())
