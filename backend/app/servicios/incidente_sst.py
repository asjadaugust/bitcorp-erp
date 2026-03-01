"""Servicio para incidentes SST (seguridad).

Replica SSTService del BFF Node.js.
"""

from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.core.excepciones import NoEncontradoError
from app.esquemas.incidente_sst import (
    IncidenteActualizar,
    IncidenteCrear,
    IncidenteDetalleDto,
    IncidenteListaDto,
)
from app.modelos.sst import Incidente

logger = obtener_logger(__name__)


def _a_lista_dto(e: Incidente) -> IncidenteListaDto:
    return IncidenteListaDto(
        id=e.id,
        fecha_incidente=e.fecha_incidente.isoformat(),
        tipo_incidente=e.tipo_incidente,
        severidad=e.severidad,
        ubicacion=e.ubicacion,
        estado=e.estado,
        created_at=e.created_at.isoformat(),
    )


def _a_detalle_dto(e: Incidente) -> IncidenteDetalleDto:
    return IncidenteDetalleDto(
        id=e.id,
        fecha_incidente=e.fecha_incidente.isoformat(),
        tipo_incidente=e.tipo_incidente,
        severidad=e.severidad,
        ubicacion=e.ubicacion,
        descripcion=e.descripcion,
        acciones_tomadas=e.acciones_tomadas,
        proyecto_id=e.proyecto_id,
        reportado_por=e.reportado_por,
        estado=e.estado,
        created_at=e.created_at.isoformat(),
        updated_at=e.updated_at.isoformat(),
    )


class ServicioIncidenteSST:
    """Servicio para gestión de incidentes de seguridad."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def listar(
        self,
        *,
        severidad: str | None = None,
        estado: str | None = None,
        pagina: int = 1,
        limite: int = 20,
    ) -> tuple[list[IncidenteListaDto], int]:
        """Listar incidentes con filtros y paginación."""
        consulta = select(Incidente)

        if severidad:
            consulta = consulta.where(Incidente.severidad == severidad)
        if estado:
            consulta = consulta.where(Incidente.estado == estado)

        consulta_conteo = select(func.count()).select_from(consulta.subquery())
        resultado_conteo = await self.db.execute(consulta_conteo)
        total: int = resultado_conteo.scalar_one()

        consulta = consulta.order_by(Incidente.fecha_incidente.desc())
        offset = (pagina - 1) * limite
        consulta = consulta.offset(offset).limit(limite)

        resultado = await self.db.execute(consulta)
        entidades = list(resultado.scalars().all())

        logger.info("incidentes_listados", total=total)
        return [_a_lista_dto(e) for e in entidades], total

    async def obtener_por_id(self, incidente_id: int) -> IncidenteDetalleDto:
        """Obtener incidente por ID."""
        resultado = await self.db.execute(
            select(Incidente).where(Incidente.id == incidente_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("Incidente", incidente_id)
        return _a_detalle_dto(entidad)

    async def crear(
        self, datos: IncidenteCrear, usuario_id: int
    ) -> IncidenteDetalleDto:
        """Crear un nuevo incidente."""
        entidad = Incidente(
            fecha_incidente=datetime.fromisoformat(datos.fecha_incidente),
            tipo_incidente=datos.tipo_incidente,
            severidad=datos.severidad,
            ubicacion=datos.ubicacion,
            descripcion=datos.descripcion,
            acciones_tomadas=datos.acciones_tomadas,
            proyecto_id=datos.proyecto_id,
            reportado_por=usuario_id,
        )
        self.db.add(entidad)
        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("incidente_creado", id=entidad.id)
        return _a_detalle_dto(entidad)

    async def actualizar(
        self, incidente_id: int, datos: IncidenteActualizar
    ) -> IncidenteDetalleDto:
        """Actualizar un incidente existente."""
        resultado = await self.db.execute(
            select(Incidente).where(Incidente.id == incidente_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("Incidente", incidente_id)

        campos = datos.model_dump(exclude_unset=True)
        for campo, valor in campos.items():
            setattr(entidad, campo, valor)

        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("incidente_actualizado", id=incidente_id)
        return _a_detalle_dto(entidad)

    async def eliminar(self, incidente_id: int) -> None:
        """Eliminar un incidente (hard delete — no is_active column)."""
        resultado = await self.db.execute(
            select(Incidente).where(Incidente.id == incidente_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("Incidente", incidente_id)

        await self.db.delete(entidad)
        await self.db.commit()
        logger.info("incidente_eliminado", id=incidente_id)
