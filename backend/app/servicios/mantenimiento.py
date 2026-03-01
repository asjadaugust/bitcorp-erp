"""Servicio para mantenimiento de equipos."""

from datetime import date

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.core.excepciones import NoEncontradoError, ReglaDeNegocioError
from app.esquemas.mantenimiento import (
    MantenimientoActualizar,
    MantenimientoCrear,
    MantenimientoDetalleDto,
    MantenimientoListaDto,
)
from app.modelos.equipo import ProgramaMantenimiento

logger = obtener_logger(__name__)


def _a_lista_dto(m: ProgramaMantenimiento) -> MantenimientoListaDto:
    return MantenimientoListaDto(
        id=m.id, equipo_id=m.equipo_id, tipo_mantenimiento=m.tipo_mantenimiento,
        fecha_programada=m.fecha_programada, estado=m.estado,
        tecnico_responsable=m.tecnico_responsable,
    )


def _a_detalle_dto(m: ProgramaMantenimiento) -> MantenimientoDetalleDto:
    return MantenimientoDetalleDto(
        id=m.id, equipo_id=m.equipo_id, tipo_mantenimiento=m.tipo_mantenimiento,
        fecha_programada=m.fecha_programada, estado=m.estado,
        tecnico_responsable=m.tecnico_responsable, descripcion=m.descripcion,
        fecha_realizada=m.fecha_realizada,
        costo_estimado=float(m.costo_estimado) if m.costo_estimado else None,
        costo_real=float(m.costo_real) if m.costo_real else None,
        observaciones=m.observaciones, created_at=m.created_at,
        updated_at=m.updated_at,
    )


class ServicioMantenimiento:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def listar(
        self, tenant_id: int, *, estado: str | None = None,
        tipo: str | None = None, page: int = 1, limit: int = 10,
    ) -> tuple[list[MantenimientoListaDto], int]:
        stmt = select(ProgramaMantenimiento).where(
            ProgramaMantenimiento.tenant_id == tenant_id
        )
        if estado:
            stmt = stmt.where(ProgramaMantenimiento.estado == estado)
        if tipo:
            stmt = stmt.where(ProgramaMantenimiento.tipo_mantenimiento == tipo)
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await self.db.execute(count_stmt)).scalar_one()
        stmt = stmt.order_by(ProgramaMantenimiento.fecha_programada.asc())
        stmt = stmt.offset((page - 1) * limit).limit(limit)
        result = await self.db.execute(stmt)
        return [_a_lista_dto(m) for m in result.scalars().all()], total

    async def obtener_vencidos(self, tenant_id: int) -> list[MantenimientoListaDto]:
        hoy = date.today()
        stmt = select(ProgramaMantenimiento).where(
            ProgramaMantenimiento.tenant_id == tenant_id,
            ProgramaMantenimiento.fecha_programada < hoy,
            ProgramaMantenimiento.estado.in_(["PROGRAMADO", "PENDIENTE"]),
        ).order_by(ProgramaMantenimiento.fecha_programada.asc())
        result = await self.db.execute(stmt)
        return [_a_lista_dto(m) for m in result.scalars().all()]

    async def listar_por_equipo(
        self, tenant_id: int, equipo_id: int
    ) -> list[MantenimientoListaDto]:
        stmt = select(ProgramaMantenimiento).where(
            ProgramaMantenimiento.tenant_id == tenant_id,
            ProgramaMantenimiento.equipo_id == equipo_id,
        ).order_by(ProgramaMantenimiento.fecha_programada.desc())
        result = await self.db.execute(stmt)
        return [_a_lista_dto(m) for m in result.scalars().all()]

    async def obtener_por_id(self, tenant_id: int, mant_id: int) -> MantenimientoDetalleDto:
        result = await self.db.execute(
            select(ProgramaMantenimiento).where(
                ProgramaMantenimiento.id == mant_id,
                ProgramaMantenimiento.tenant_id == tenant_id,
            )
        )
        m = result.scalars().first()
        if not m:
            raise NoEncontradoError("Mantenimiento", mant_id)
        return _a_detalle_dto(m)

    async def crear(
        self, tenant_id: int, datos: MantenimientoCrear
    ) -> MantenimientoDetalleDto:
        m = ProgramaMantenimiento(**datos.model_dump(), tenant_id=tenant_id)
        self.db.add(m)
        await self.db.commit()
        await self.db.refresh(m)
        return _a_detalle_dto(m)

    async def actualizar(
        self, tenant_id: int, mant_id: int, datos: MantenimientoActualizar
    ) -> MantenimientoDetalleDto:
        result = await self.db.execute(
            select(ProgramaMantenimiento).where(
                ProgramaMantenimiento.id == mant_id,
                ProgramaMantenimiento.tenant_id == tenant_id,
            )
        )
        m = result.scalars().first()
        if not m:
            raise NoEncontradoError("Mantenimiento", mant_id)
        for campo, valor in datos.model_dump(exclude_unset=True).items():
            setattr(m, campo, valor)
        await self.db.commit()
        await self.db.refresh(m)
        return _a_detalle_dto(m)

    async def iniciar(self, tenant_id: int, mant_id: int) -> MantenimientoDetalleDto:
        result = await self.db.execute(
            select(ProgramaMantenimiento).where(
                ProgramaMantenimiento.id == mant_id,
                ProgramaMantenimiento.tenant_id == tenant_id,
            )
        )
        m = result.scalars().first()
        if not m:
            raise NoEncontradoError("Mantenimiento", mant_id)
        if m.estado not in ("PROGRAMADO", "PENDIENTE"):
            raise ReglaDeNegocioError.estado_invalido(
                "Mantenimiento", m.estado, "iniciar", ["PROGRAMADO", "PENDIENTE"]
            )
        m.estado = "EN_PROCESO"
        await self.db.commit()
        await self.db.refresh(m)
        return _a_detalle_dto(m)

    async def completar(
        self, tenant_id: int, mant_id: int, costo_real: float | None = None
    ) -> MantenimientoDetalleDto:
        result = await self.db.execute(
            select(ProgramaMantenimiento).where(
                ProgramaMantenimiento.id == mant_id,
                ProgramaMantenimiento.tenant_id == tenant_id,
            )
        )
        m = result.scalars().first()
        if not m:
            raise NoEncontradoError("Mantenimiento", mant_id)
        if m.estado != "EN_PROCESO":
            raise ReglaDeNegocioError.estado_invalido(
                "Mantenimiento", m.estado, "completar", ["EN_PROCESO"]
            )
        m.estado = "COMPLETADO"
        m.fecha_realizada = date.today()
        if costo_real is not None:
            m.costo_real = costo_real
        await self.db.commit()
        await self.db.refresh(m)
        return _a_detalle_dto(m)

    async def cancelar(self, tenant_id: int, mant_id: int) -> MantenimientoDetalleDto:
        result = await self.db.execute(
            select(ProgramaMantenimiento).where(
                ProgramaMantenimiento.id == mant_id,
                ProgramaMantenimiento.tenant_id == tenant_id,
            )
        )
        m = result.scalars().first()
        if not m:
            raise NoEncontradoError("Mantenimiento", mant_id)
        if m.estado in ("COMPLETADO", "CANCELADO"):
            raise ReglaDeNegocioError.estado_invalido(
                "Mantenimiento", m.estado, "cancelar", ["PROGRAMADO", "PENDIENTE", "EN_PROCESO"]
            )
        m.estado = "CANCELADO"
        await self.db.commit()
        await self.db.refresh(m)
        return _a_detalle_dto(m)
