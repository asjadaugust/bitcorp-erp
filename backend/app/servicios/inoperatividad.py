"""Servicio para períodos de inoperatividad."""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.core.excepciones import NoEncontradoError, ReglaDeNegocioError
from app.esquemas.inoperatividad import (
    AplicarPenalidad,
    InoperatividadActualizar,
    InoperatividadCrear,
    InoperatividadDetalleDto,
    InoperatividadListaDto,
    ResolverInoperatividad,
)
from app.modelos.equipo import PeriodoInoperatividad

logger = obtener_logger(__name__)


def _a_lista_dto(p: PeriodoInoperatividad) -> InoperatividadListaDto:
    return InoperatividadListaDto(
        id=p.id, equipo_id=p.equipo_id, fecha_inicio=p.fecha_inicio,
        fecha_fin=p.fecha_fin, dias_inoperativo=p.dias_inoperativo,
        motivo=p.motivo, estado=p.estado, excede_plazo=p.excede_plazo,
        penalidad_aplicada=p.penalidad_aplicada,
    )


def _a_detalle_dto(p: PeriodoInoperatividad) -> InoperatividadDetalleDto:
    return InoperatividadDetalleDto(
        id=p.id, equipo_id=p.equipo_id, fecha_inicio=p.fecha_inicio,
        fecha_fin=p.fecha_fin, dias_inoperativo=p.dias_inoperativo,
        motivo=p.motivo, estado=p.estado, excede_plazo=p.excede_plazo,
        penalidad_aplicada=p.penalidad_aplicada,
        contrato_id=p.contrato_id, dias_plazo=p.dias_plazo,
        monto_penalidad=float(p.monto_penalidad) if p.monto_penalidad else None,
        observaciones_penalidad=p.observaciones_penalidad,
        resuelto_por=p.resuelto_por, creado_por=p.creado_por,
        created_at=p.created_at,
    )


class ServicioInoperatividad:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def listar(
        self, tenant_id: int, *, estado: str | None = None, page: int = 1, limit: int = 10,
    ) -> tuple[list[InoperatividadListaDto], int]:
        stmt = select(PeriodoInoperatividad)
        if estado:
            stmt = stmt.where(PeriodoInoperatividad.estado == estado)
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await self.db.execute(count_stmt)).scalar_one()
        stmt = stmt.order_by(PeriodoInoperatividad.fecha_inicio.desc())
        stmt = stmt.offset((page - 1) * limit).limit(limit)
        result = await self.db.execute(stmt)
        return [_a_lista_dto(p) for p in result.scalars().all()], total

    async def listar_por_equipo(
        self, tenant_id: int, equipo_id: int
    ) -> list[InoperatividadListaDto]:
        stmt = select(PeriodoInoperatividad).where(
            PeriodoInoperatividad.equipo_id == equipo_id,
        ).order_by(PeriodoInoperatividad.fecha_inicio.desc())
        result = await self.db.execute(stmt)
        return [_a_lista_dto(p) for p in result.scalars().all()]

    async def obtener_por_id(self, tenant_id: int, per_id: int) -> InoperatividadDetalleDto:
        result = await self.db.execute(
            select(PeriodoInoperatividad).where(PeriodoInoperatividad.id == per_id)
        )
        p = result.scalars().first()
        if not p:
            raise NoEncontradoError("Periodo de inoperatividad", per_id)
        return _a_detalle_dto(p)

    async def crear(
        self, tenant_id: int, datos: InoperatividadCrear, user_id: int
    ) -> InoperatividadDetalleDto:
        p = PeriodoInoperatividad(**datos.model_dump(), creado_por=user_id)
        self.db.add(p)
        await self.db.commit()
        await self.db.refresh(p)
        return _a_detalle_dto(p)

    async def actualizar(
        self, tenant_id: int, per_id: int, datos: InoperatividadActualizar
    ) -> InoperatividadDetalleDto:
        result = await self.db.execute(
            select(PeriodoInoperatividad).where(PeriodoInoperatividad.id == per_id)
        )
        p = result.scalars().first()
        if not p:
            raise NoEncontradoError("Periodo de inoperatividad", per_id)
        if p.estado != "ACTIVO":
            raise ReglaDeNegocioError.estado_invalido(
                "Periodo", p.estado, "actualizar", ["ACTIVO"]
            )
        for campo, valor in datos.model_dump(exclude_unset=True).items():
            setattr(p, campo, valor)
        await self.db.commit()
        await self.db.refresh(p)
        return _a_detalle_dto(p)

    async def resolver(
        self, tenant_id: int, per_id: int, datos: ResolverInoperatividad, user_id: int
    ) -> InoperatividadDetalleDto:
        result = await self.db.execute(
            select(PeriodoInoperatividad).where(PeriodoInoperatividad.id == per_id)
        )
        p = result.scalars().first()
        if not p:
            raise NoEncontradoError("Periodo de inoperatividad", per_id)
        if p.estado != "ACTIVO":
            raise ReglaDeNegocioError.estado_invalido(
                "Periodo", p.estado, "resolver", ["ACTIVO"]
            )
        p.estado = "RESUELTO"
        p.fecha_fin = datos.fecha_fin
        p.dias_inoperativo = (datos.fecha_fin - p.fecha_inicio).days
        p.excede_plazo = p.dias_inoperativo >= p.dias_plazo
        p.resuelto_por = user_id
        if datos.observaciones_penalidad:
            p.observaciones_penalidad = datos.observaciones_penalidad
        await self.db.commit()
        await self.db.refresh(p)
        return _a_detalle_dto(p)

    async def aplicar_penalidad(
        self, tenant_id: int, per_id: int, datos: AplicarPenalidad
    ) -> InoperatividadDetalleDto:
        result = await self.db.execute(
            select(PeriodoInoperatividad).where(PeriodoInoperatividad.id == per_id)
        )
        p = result.scalars().first()
        if not p:
            raise NoEncontradoError("Periodo de inoperatividad", per_id)
        if p.estado != "RESUELTO":
            raise ReglaDeNegocioError.estado_invalido(
                "Periodo", p.estado, "penalizar", ["RESUELTO"]
            )
        if not p.excede_plazo:
            raise ReglaDeNegocioError(
                "No se puede aplicar penalidad: el periodo no excede el plazo",
                "PLAZO_NOT_EXCEEDED",
            )
        p.estado = "PENALIZADO"
        p.penalidad_aplicada = True
        p.monto_penalidad = datos.monto_penalidad
        if datos.observaciones_penalidad:
            p.observaciones_penalidad = datos.observaciones_penalidad
        await self.db.commit()
        await self.db.refresh(p)
        return _a_detalle_dto(p)
