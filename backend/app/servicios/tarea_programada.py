"""Servicio para tareas programadas.

Replica SchedulingService del BFF Node.js.
"""

from datetime import date, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.core.excepciones import NoEncontradoError, ReglaDeNegocioError
from app.esquemas.tarea_programada import (
    TareaProgramadaActualizar,
    TareaProgramadaCrear,
    TareaProgramadaDetalleDto,
    TareaProgramadaListaDto,
)
from app.modelos.tarea_programada import TareaProgramada

logger = obtener_logger(__name__)


def _fecha_str(val: date | datetime | None) -> str | None:
    return val.isoformat() if val else None


def _a_lista_dto(e: TareaProgramada) -> TareaProgramadaListaDto:
    return TareaProgramadaListaDto(
        id=e.id,
        title=e.title,
        task_type=e.task_type,
        start_date=e.start_date.isoformat(),
        end_date=_fecha_str(e.end_date),
        priority=e.priority,
        status=e.status,
        equipo_id=e.equipo_id,
        trabajador_id=e.trabajador_id,
        created_at=e.created_at.isoformat(),
    )


def _a_detalle_dto(e: TareaProgramada) -> TareaProgramadaDetalleDto:
    return TareaProgramadaDetalleDto(
        id=e.id,
        title=e.title,
        description=e.description,
        task_type=e.task_type,
        start_date=e.start_date.isoformat(),
        end_date=_fecha_str(e.end_date),
        all_day=e.all_day,
        recurrence=e.recurrence,
        duration_minutes=e.duration_minutes,
        priority=e.priority,
        status=e.status,
        equipo_id=e.equipo_id,
        trabajador_id=e.trabajador_id,
        proyecto_id=e.proyecto_id,
        completion_date=_fecha_str(e.completion_date),
        completion_notes=e.completion_notes,
        creado_por=e.creado_por,
        created_at=e.created_at.isoformat(),
        updated_at=e.updated_at.isoformat(),
    )


class ServicioTareaProgramada:
    """Servicio para gestión de tareas programadas."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def _obtener_entidad(self, tarea_id: int) -> TareaProgramada:
        resultado = await self.db.execute(
            select(TareaProgramada).where(TareaProgramada.id == tarea_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("Tarea Programada", tarea_id)
        return entidad

    async def listar(
        self,
        *,
        task_type: str | None = None,
        status: str | None = None,
        fecha_inicio: str | None = None,
        fecha_fin: str | None = None,
        pagina: int = 1,
        limite: int = 20,
    ) -> tuple[list[TareaProgramadaListaDto], int]:
        """Listar tareas programadas con filtros."""
        consulta = select(TareaProgramada)

        if task_type:
            consulta = consulta.where(TareaProgramada.task_type == task_type)
        if status:
            consulta = consulta.where(TareaProgramada.status == status)
        if fecha_inicio:
            consulta = consulta.where(
                TareaProgramada.start_date >= date.fromisoformat(fecha_inicio)
            )
        if fecha_fin:
            consulta = consulta.where(
                TareaProgramada.start_date <= date.fromisoformat(fecha_fin)
            )

        consulta_conteo = select(func.count()).select_from(consulta.subquery())
        resultado_conteo = await self.db.execute(consulta_conteo)
        total: int = resultado_conteo.scalar_one()

        consulta = consulta.order_by(TareaProgramada.start_date)
        offset = (pagina - 1) * limite
        consulta = consulta.offset(offset).limit(limite)

        resultado = await self.db.execute(consulta)
        entidades = list(resultado.scalars().all())

        logger.info("tareas_programadas_listadas", total=total)
        return [_a_lista_dto(e) for e in entidades], total

    async def obtener_por_id(self, tarea_id: int) -> TareaProgramadaDetalleDto:
        entidad = await self._obtener_entidad(tarea_id)
        return _a_detalle_dto(entidad)

    async def crear(
        self, datos: TareaProgramadaCrear, usuario_id: int
    ) -> TareaProgramadaDetalleDto:
        entidad = TareaProgramada(
            title=datos.title,
            description=datos.description,
            task_type=datos.task_type,
            start_date=date.fromisoformat(datos.start_date),
            end_date=date.fromisoformat(datos.end_date) if datos.end_date else None,
            all_day=datos.all_day,
            priority=datos.priority,
            duration_minutes=datos.duration_minutes,
            equipo_id=datos.equipo_id,
            trabajador_id=datos.trabajador_id,
            proyecto_id=datos.proyecto_id,
            creado_por=usuario_id,
        )
        self.db.add(entidad)
        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("tarea_programada_creada", id=entidad.id)
        return _a_detalle_dto(entidad)

    async def actualizar(
        self, tarea_id: int, datos: TareaProgramadaActualizar
    ) -> TareaProgramadaDetalleDto:
        entidad = await self._obtener_entidad(tarea_id)

        campos = datos.model_dump(exclude_unset=True)
        for campo, valor in campos.items():
            if campo in ("start_date", "end_date") and valor:
                setattr(entidad, campo, date.fromisoformat(valor))
            else:
                setattr(entidad, campo, valor)

        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("tarea_programada_actualizada", id=tarea_id)
        return _a_detalle_dto(entidad)

    async def completar(
        self, tarea_id: int, notas: str | None = None
    ) -> TareaProgramadaDetalleDto:
        entidad = await self._obtener_entidad(tarea_id)
        if entidad.status == "completed":
            raise ReglaDeNegocioError.estado_invalido(
                "tarea", entidad.status or "unknown", "completar", ["pending", "in_progress"]
            )

        entidad.status = "completed"
        entidad.completion_date = datetime.utcnow()
        entidad.completion_notes = notas
        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("tarea_programada_completada", id=tarea_id)
        return _a_detalle_dto(entidad)

    async def cancelar(self, tarea_id: int) -> TareaProgramadaDetalleDto:
        entidad = await self._obtener_entidad(tarea_id)
        if entidad.status in ("completed", "cancelled"):
            raise ReglaDeNegocioError.estado_invalido(
                "tarea", entidad.status or "unknown", "cancelar", ["pending", "in_progress"]
            )

        entidad.status = "cancelled"
        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("tarea_programada_cancelada", id=tarea_id)
        return _a_detalle_dto(entidad)

    async def eliminar(self, tarea_id: int) -> None:
        entidad = await self._obtener_entidad(tarea_id)
        await self.db.delete(entidad)
        await self.db.commit()
        logger.info("tarea_programada_eliminada", id=tarea_id)
