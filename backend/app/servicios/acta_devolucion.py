"""Servicio para actas de devolución."""

from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.core.excepciones import NoEncontradoError, ReglaDeNegocioError
from app.esquemas.acta_devolucion import (
    ActaDevolucionActualizar,
    ActaDevolucionCrear,
    ActaDevolucionDetalleDto,
    ActaDevolucionListaDto,
)
from app.modelos.equipo import ActaDevolucion

logger = obtener_logger(__name__)


def _a_lista_dto(a: ActaDevolucion) -> ActaDevolucionListaDto:
    return ActaDevolucionListaDto(
        id=a.id, codigo=a.codigo, equipo_id=a.equipo_id,
        fecha_devolucion=a.fecha_devolucion, tipo=a.tipo,
        estado=a.estado, condicion_equipo=a.condicion_equipo, is_active=a.is_active,
    )


def _a_detalle_dto(a: ActaDevolucion) -> ActaDevolucionDetalleDto:
    return ActaDevolucionDetalleDto(
        id=a.id, codigo=a.codigo, equipo_id=a.equipo_id,
        fecha_devolucion=a.fecha_devolucion, tipo=a.tipo,
        estado=a.estado, condicion_equipo=a.condicion_equipo, is_active=a.is_active,
        contrato_id=a.contrato_id, proyecto_id=a.proyecto_id,
        horometro_devolucion=float(a.horometro_devolucion) if a.horometro_devolucion else None,
        kilometraje_devolucion=(
            float(a.kilometraje_devolucion) if a.kilometraje_devolucion else None
        ),
        observaciones=a.observaciones, observaciones_fisicas=a.observaciones_fisicas,
        recibido_por=a.recibido_por, entregado_por=a.entregado_por,
        firma_recibido=a.firma_recibido, firma_entregado=a.firma_entregado,
        fecha_firma=a.fecha_firma, creado_por=a.creado_por, created_at=a.created_at,
    )


async def _generar_codigo(db: AsyncSession) -> str:
    result = await db.execute(select(func.count()).select_from(ActaDevolucion))
    count = result.scalar_one()
    return f"ADV-{count + 1:04d}"


class ServicioActaDevolucion:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def listar(
        self, tenant_id: int, *, estado: str | None = None, page: int = 1, limit: int = 10,
    ) -> tuple[list[ActaDevolucionListaDto], int]:
        stmt = select(ActaDevolucion).where(ActaDevolucion.is_active.is_(True))
        if estado:
            stmt = stmt.where(ActaDevolucion.estado == estado)
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await self.db.execute(count_stmt)).scalar_one()
        stmt = stmt.order_by(ActaDevolucion.created_at.desc())
        stmt = stmt.offset((page - 1) * limit).limit(limit)
        result = await self.db.execute(stmt)
        return [_a_lista_dto(a) for a in result.scalars().all()], total

    async def obtener_por_id(self, tenant_id: int, acta_id: int) -> ActaDevolucionDetalleDto:
        result = await self.db.execute(
            select(ActaDevolucion).where(ActaDevolucion.id == acta_id)
        )
        a = result.scalars().first()
        if not a:
            raise NoEncontradoError("Acta de devolución", acta_id)
        return _a_detalle_dto(a)

    async def crear(
        self, tenant_id: int, datos: ActaDevolucionCrear, user_id: int
    ) -> ActaDevolucionDetalleDto:
        codigo = await _generar_codigo(self.db)
        a = ActaDevolucion(codigo=codigo, **datos.model_dump(), creado_por=user_id)
        self.db.add(a)
        await self.db.commit()
        await self.db.refresh(a)
        return _a_detalle_dto(a)

    async def actualizar(
        self, tenant_id: int, acta_id: int, datos: ActaDevolucionActualizar
    ) -> ActaDevolucionDetalleDto:
        result = await self.db.execute(
            select(ActaDevolucion).where(ActaDevolucion.id == acta_id)
        )
        a = result.scalars().first()
        if not a:
            raise NoEncontradoError("Acta de devolución", acta_id)
        if a.estado not in ("BORRADOR", "PENDIENTE"):
            raise ReglaDeNegocioError.estado_invalido(
                "Acta", a.estado, "actualizar", ["BORRADOR", "PENDIENTE"]
            )
        for campo, valor in datos.model_dump(exclude_unset=True).items():
            setattr(a, campo, valor)
        await self.db.commit()
        await self.db.refresh(a)
        return _a_detalle_dto(a)

    async def firmar(
        self, tenant_id: int, acta_id: int, user_id: int
    ) -> ActaDevolucionDetalleDto:
        result = await self.db.execute(
            select(ActaDevolucion).where(ActaDevolucion.id == acta_id)
        )
        a = result.scalars().first()
        if not a:
            raise NoEncontradoError("Acta de devolución", acta_id)
        if a.estado not in ("BORRADOR", "PENDIENTE"):
            raise ReglaDeNegocioError.estado_invalido(
                "Acta", a.estado, "firmar", ["BORRADOR", "PENDIENTE"]
            )
        a.estado = "FIRMADO"
        a.fecha_firma = datetime.now(UTC)
        await self.db.commit()
        await self.db.refresh(a)
        return _a_detalle_dto(a)

    async def anular(self, tenant_id: int, acta_id: int) -> ActaDevolucionDetalleDto:
        result = await self.db.execute(
            select(ActaDevolucion).where(ActaDevolucion.id == acta_id)
        )
        a = result.scalars().first()
        if not a:
            raise NoEncontradoError("Acta de devolución", acta_id)
        if a.estado == "ANULADO":
            raise ReglaDeNegocioError.estado_invalido(
                "Acta", a.estado, "anular", ["BORRADOR", "PENDIENTE", "FIRMADO"]
            )
        a.estado = "ANULADO"
        await self.db.commit()
        await self.db.refresh(a)
        return _a_detalle_dto(a)
