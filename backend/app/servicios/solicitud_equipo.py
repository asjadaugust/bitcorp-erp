"""Servicio para solicitudes de equipo."""

from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.core.excepciones import NoEncontradoError, ReglaDeNegocioError
from app.esquemas.solicitud_equipo import (
    SolicitudEquipoActualizar,
    SolicitudEquipoCrear,
    SolicitudEquipoDetalleDto,
    SolicitudEquipoListaDto,
)
from app.modelos.equipo import SolicitudEquipo

logger = obtener_logger(__name__)


def _a_lista_dto(s: SolicitudEquipo) -> SolicitudEquipoListaDto:
    return SolicitudEquipoListaDto(
        id=s.id, codigo=s.codigo, tipo_equipo=s.tipo_equipo,
        cantidad=s.cantidad, fecha_requerida=s.fecha_requerida,
        prioridad=s.prioridad, estado=s.estado, is_active=s.is_active,
    )


def _a_detalle_dto(s: SolicitudEquipo) -> SolicitudEquipoDetalleDto:
    return SolicitudEquipoDetalleDto(
        id=s.id, codigo=s.codigo, tipo_equipo=s.tipo_equipo,
        cantidad=s.cantidad, fecha_requerida=s.fecha_requerida,
        prioridad=s.prioridad, estado=s.estado, is_active=s.is_active,
        proyecto_id=s.proyecto_id, descripcion=s.descripcion,
        justificacion=s.justificacion, observaciones=s.observaciones,
        aprobado_por=s.aprobado_por, fecha_aprobacion=s.fecha_aprobacion,
        creado_por=s.creado_por, created_at=s.created_at,
    )


async def _generar_codigo(db: AsyncSession) -> str:
    result = await db.execute(select(func.count()).select_from(SolicitudEquipo))
    count = result.scalar_one()
    return f"SEQ-{count + 1:04d}"


class ServicioSolicitudEquipo:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def listar(
        self, tenant_id: int, *, estado: str | None = None, page: int = 1, limit: int = 10,
    ) -> tuple[list[SolicitudEquipoListaDto], int]:
        stmt = select(SolicitudEquipo).where(SolicitudEquipo.is_active.is_(True))
        if estado:
            stmt = stmt.where(SolicitudEquipo.estado == estado)
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await self.db.execute(count_stmt)).scalar_one()
        stmt = stmt.order_by(SolicitudEquipo.created_at.desc())
        stmt = stmt.offset((page - 1) * limit).limit(limit)
        result = await self.db.execute(stmt)
        return [_a_lista_dto(s) for s in result.scalars().all()], total

    async def obtener_por_id(self, tenant_id: int, sol_id: int) -> SolicitudEquipoDetalleDto:
        result = await self.db.execute(
            select(SolicitudEquipo).where(SolicitudEquipo.id == sol_id)
        )
        s = result.scalars().first()
        if not s:
            raise NoEncontradoError("Solicitud de equipo", sol_id)
        return _a_detalle_dto(s)

    async def crear(
        self, tenant_id: int, datos: SolicitudEquipoCrear, user_id: int
    ) -> SolicitudEquipoDetalleDto:
        codigo = await _generar_codigo(self.db)
        s = SolicitudEquipo(codigo=codigo, **datos.model_dump(), creado_por=user_id)
        self.db.add(s)
        await self.db.commit()
        await self.db.refresh(s)
        return _a_detalle_dto(s)

    async def actualizar(
        self, tenant_id: int, sol_id: int, datos: SolicitudEquipoActualizar
    ) -> SolicitudEquipoDetalleDto:
        result = await self.db.execute(
            select(SolicitudEquipo).where(SolicitudEquipo.id == sol_id)
        )
        s = result.scalars().first()
        if not s:
            raise NoEncontradoError("Solicitud de equipo", sol_id)
        if s.estado != "BORRADOR":
            raise ReglaDeNegocioError.estado_invalido(
                "Solicitud", s.estado, "actualizar", ["BORRADOR"]
            )
        for campo, valor in datos.model_dump(exclude_unset=True).items():
            setattr(s, campo, valor)
        await self.db.commit()
        await self.db.refresh(s)
        return _a_detalle_dto(s)

    async def enviar(self, tenant_id: int, sol_id: int) -> SolicitudEquipoDetalleDto:
        result = await self.db.execute(
            select(SolicitudEquipo).where(SolicitudEquipo.id == sol_id)
        )
        s = result.scalars().first()
        if not s:
            raise NoEncontradoError("Solicitud de equipo", sol_id)
        if s.estado != "BORRADOR":
            raise ReglaDeNegocioError.estado_invalido(
                "Solicitud", s.estado, "enviar", ["BORRADOR"]
            )
        s.estado = "ENVIADO"
        await self.db.commit()
        await self.db.refresh(s)
        return _a_detalle_dto(s)

    async def aprobar(
        self, tenant_id: int, sol_id: int, user_id: int
    ) -> SolicitudEquipoDetalleDto:
        result = await self.db.execute(
            select(SolicitudEquipo).where(SolicitudEquipo.id == sol_id)
        )
        s = result.scalars().first()
        if not s:
            raise NoEncontradoError("Solicitud de equipo", sol_id)
        if s.estado != "ENVIADO":
            raise ReglaDeNegocioError.estado_invalido(
                "Solicitud", s.estado, "aprobar", ["ENVIADO"]
            )
        s.estado = "APROBADO"
        s.aprobado_por = user_id
        s.fecha_aprobacion = datetime.now(UTC)
        await self.db.commit()
        await self.db.refresh(s)
        return _a_detalle_dto(s)

    async def rechazar(self, tenant_id: int, sol_id: int) -> SolicitudEquipoDetalleDto:
        result = await self.db.execute(
            select(SolicitudEquipo).where(SolicitudEquipo.id == sol_id)
        )
        s = result.scalars().first()
        if not s:
            raise NoEncontradoError("Solicitud de equipo", sol_id)
        if s.estado != "ENVIADO":
            raise ReglaDeNegocioError.estado_invalido(
                "Solicitud", s.estado, "rechazar", ["ENVIADO"]
            )
        s.estado = "RECHAZADO"
        await self.db.commit()
        await self.db.refresh(s)
        return _a_detalle_dto(s)
