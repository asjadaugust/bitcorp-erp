"""Servicio para órdenes de alquiler."""

from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.core.excepciones import NoEncontradoError, ReglaDeNegocioError
from app.esquemas.orden_alquiler import (
    CancelarOrden,
    ConfirmarOrden,
    EnviarOrden,
    OrdenAlquilerActualizar,
    OrdenAlquilerCrear,
    OrdenAlquilerDetalleDto,
    OrdenAlquilerListaDto,
)
from app.modelos.equipo import OrdenAlquiler

logger = obtener_logger(__name__)


def _a_lista_dto(o: OrdenAlquiler) -> OrdenAlquilerListaDto:
    return OrdenAlquilerListaDto(
        id=o.id, codigo=o.codigo, proveedor_id=o.proveedor_id,
        descripcion_equipo=o.descripcion_equipo, fecha_orden=o.fecha_orden,
        tarifa_acordada=float(o.tarifa_acordada), tipo_tarifa=o.tipo_tarifa,
        moneda=o.moneda, estado=o.estado, is_active=o.is_active,
    )


def _a_detalle_dto(o: OrdenAlquiler) -> OrdenAlquilerDetalleDto:
    return OrdenAlquilerDetalleDto(
        id=o.id, codigo=o.codigo, proveedor_id=o.proveedor_id,
        descripcion_equipo=o.descripcion_equipo, fecha_orden=o.fecha_orden,
        tarifa_acordada=float(o.tarifa_acordada), tipo_tarifa=o.tipo_tarifa,
        moneda=o.moneda, estado=o.estado, is_active=o.is_active,
        solicitud_equipo_id=o.solicitud_equipo_id, equipo_id=o.equipo_id,
        proyecto_id=o.proyecto_id,
        fecha_inicio_estimada=o.fecha_inicio_estimada,
        fecha_fin_estimada=o.fecha_fin_estimada,
        tipo_cambio=float(o.tipo_cambio) if o.tipo_cambio else None,
        horas_incluidas=float(o.horas_incluidas) if o.horas_incluidas else None,
        penalidad_exceso=float(o.penalidad_exceso) if o.penalidad_exceso else None,
        condiciones_especiales=o.condiciones_especiales,
        observaciones=o.observaciones, enviado_a=o.enviado_a,
        fecha_envio=o.fecha_envio, confirmado_por=o.confirmado_por,
        fecha_confirmacion=o.fecha_confirmacion,
        motivo_cancelacion=o.motivo_cancelacion,
        creado_por=o.creado_por, created_at=o.created_at,
    )


async def _generar_codigo(db: AsyncSession) -> str:
    result = await db.execute(select(func.count()).select_from(OrdenAlquiler))
    count = result.scalar_one()
    return f"OAL-{count + 1:04d}"


class ServicioOrdenAlquiler:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def listar(
        self, tenant_id: int, *, estado: str | None = None, page: int = 1, limit: int = 10,
    ) -> tuple[list[OrdenAlquilerListaDto], int]:
        stmt = select(OrdenAlquiler).where(OrdenAlquiler.is_active.is_(True))
        if estado:
            stmt = stmt.where(OrdenAlquiler.estado == estado)
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await self.db.execute(count_stmt)).scalar_one()
        stmt = stmt.order_by(OrdenAlquiler.created_at.desc())
        stmt = stmt.offset((page - 1) * limit).limit(limit)
        result = await self.db.execute(stmt)
        return [_a_lista_dto(o) for o in result.scalars().all()], total

    async def obtener_por_id(self, tenant_id: int, orden_id: int) -> OrdenAlquilerDetalleDto:
        result = await self.db.execute(
            select(OrdenAlquiler).where(OrdenAlquiler.id == orden_id)
        )
        o = result.scalars().first()
        if not o:
            raise NoEncontradoError("Orden de alquiler", orden_id)
        return _a_detalle_dto(o)

    async def crear(
        self, tenant_id: int, datos: OrdenAlquilerCrear, user_id: int
    ) -> OrdenAlquilerDetalleDto:
        codigo = await _generar_codigo(self.db)
        o = OrdenAlquiler(codigo=codigo, **datos.model_dump(), creado_por=user_id)
        self.db.add(o)
        await self.db.commit()
        await self.db.refresh(o)
        return _a_detalle_dto(o)

    async def actualizar(
        self, tenant_id: int, orden_id: int, datos: OrdenAlquilerActualizar
    ) -> OrdenAlquilerDetalleDto:
        result = await self.db.execute(
            select(OrdenAlquiler).where(OrdenAlquiler.id == orden_id)
        )
        o = result.scalars().first()
        if not o:
            raise NoEncontradoError("Orden de alquiler", orden_id)
        if o.estado != "BORRADOR":
            raise ReglaDeNegocioError.estado_invalido(
                "Orden", o.estado, "actualizar", ["BORRADOR"]
            )
        for campo, valor in datos.model_dump(exclude_unset=True).items():
            setattr(o, campo, valor)
        await self.db.commit()
        await self.db.refresh(o)
        return _a_detalle_dto(o)

    async def enviar(
        self, tenant_id: int, orden_id: int, datos: EnviarOrden
    ) -> OrdenAlquilerDetalleDto:
        result = await self.db.execute(
            select(OrdenAlquiler).where(OrdenAlquiler.id == orden_id)
        )
        o = result.scalars().first()
        if not o:
            raise NoEncontradoError("Orden de alquiler", orden_id)
        if o.estado != "BORRADOR":
            raise ReglaDeNegocioError.estado_invalido(
                "Orden", o.estado, "enviar", ["BORRADOR"]
            )
        o.estado = "ENVIADO"
        o.enviado_a = datos.enviado_a
        o.fecha_envio = datetime.now(UTC)
        await self.db.commit()
        await self.db.refresh(o)
        return _a_detalle_dto(o)

    async def confirmar(
        self, tenant_id: int, orden_id: int, datos: ConfirmarOrden
    ) -> OrdenAlquilerDetalleDto:
        result = await self.db.execute(
            select(OrdenAlquiler).where(OrdenAlquiler.id == orden_id)
        )
        o = result.scalars().first()
        if not o:
            raise NoEncontradoError("Orden de alquiler", orden_id)
        if o.estado != "ENVIADO":
            raise ReglaDeNegocioError.estado_invalido(
                "Orden", o.estado, "confirmar", ["ENVIADO"]
            )
        o.estado = "CONFIRMADO"
        o.confirmado_por = datos.confirmado_por
        o.fecha_confirmacion = datetime.now(UTC)
        await self.db.commit()
        await self.db.refresh(o)
        return _a_detalle_dto(o)

    async def cancelar(
        self, tenant_id: int, orden_id: int, datos: CancelarOrden
    ) -> OrdenAlquilerDetalleDto:
        result = await self.db.execute(
            select(OrdenAlquiler).where(OrdenAlquiler.id == orden_id)
        )
        o = result.scalars().first()
        if not o:
            raise NoEncontradoError("Orden de alquiler", orden_id)
        if o.estado not in ("BORRADOR", "ENVIADO"):
            raise ReglaDeNegocioError.estado_invalido(
                "Orden", o.estado, "cancelar", ["BORRADOR", "ENVIADO"]
            )
        o.estado = "CANCELADO"
        o.motivo_cancelacion = datos.motivo_cancelacion
        await self.db.commit()
        await self.db.refresh(o)
        return _a_detalle_dto(o)
