"""Servicio para proyectos.
"""

from datetime import date
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.core.excepciones import ConflictoError, NoEncontradoError
from app.esquemas.proyecto import (
    ProyectoActualizar,
    ProyectoCrear,
    ProyectoDetalleDto,
    ProyectoListaDto,
)
from app.modelos.proyectos import Proyecto

logger = obtener_logger(__name__)


def _fecha_str(val: date | None) -> str | None:
    return val.isoformat() if val else None


def _a_lista_dto(e: Proyecto) -> ProyectoListaDto:
    return ProyectoListaDto(
        id=e.id,
        codigo=e.codigo,
        nombre=e.nombre,
        ubicacion=e.ubicacion,
        estado=e.estado,
        fecha_inicio=_fecha_str(e.fecha_inicio),
        fecha_fin=_fecha_str(e.fecha_fin),
        cliente=e.cliente,
        created_at=e.created_at.isoformat(),
    )


def _a_detalle_dto(e: Proyecto) -> ProyectoDetalleDto:
    return ProyectoDetalleDto(
        id=e.id,
        codigo=e.codigo,
        nombre=e.nombre,
        descripcion=e.descripcion,
        ubicacion=e.ubicacion,
        fecha_inicio=_fecha_str(e.fecha_inicio),
        fecha_fin=_fecha_str(e.fecha_fin),
        presupuesto=float(e.presupuesto) if e.presupuesto is not None else None,
        estado=e.estado,
        cliente=e.cliente,
        creado_por=e.creado_por,
        actualizado_por=e.actualizado_por,
        created_at=e.created_at.isoformat(),
        updated_at=e.updated_at.isoformat(),
    )


def _parse_date(val: str | None) -> date | None:
    if not val:
        return None
    return date.fromisoformat(val)


class ServicioProyecto:
    """Servicio para gestión de proyectos."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def listar(
        self,
        *,
        estado: str | None = None,
        busqueda: str | None = None,
        pagina: int = 1,
        limite: int = 20,
    ) -> tuple[list[ProyectoListaDto], int]:
        """Listar proyectos con filtros y paginación."""
        consulta = select(Proyecto).where(Proyecto.is_active.is_(True))

        if estado:
            consulta = consulta.where(Proyecto.estado == estado)
        if busqueda:
            patron = f"%{busqueda}%"
            consulta = consulta.where(
                Proyecto.nombre.ilike(patron) | Proyecto.codigo.ilike(patron)
            )

        consulta_conteo = select(func.count()).select_from(consulta.subquery())
        resultado_conteo = await self.db.execute(consulta_conteo)
        total: int = resultado_conteo.scalar_one()

        consulta = consulta.order_by(Proyecto.created_at.desc())
        offset = (pagina - 1) * limite
        consulta = consulta.offset(offset).limit(limite)

        resultado = await self.db.execute(consulta)
        entidades = list(resultado.scalars().all())

        logger.info("proyectos_listados", total=total)
        return [_a_lista_dto(e) for e in entidades], total

    async def obtener_por_id(self, proyecto_id: int) -> ProyectoDetalleDto:
        """Obtener proyecto por ID."""
        resultado = await self.db.execute(
            select(Proyecto).where(Proyecto.id == proyecto_id, Proyecto.is_active.is_(True))
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("Proyecto", proyecto_id)
        return _a_detalle_dto(entidad)

    async def crear(self, datos: ProyectoCrear, usuario_id: int) -> ProyectoDetalleDto:
        """Crear un nuevo proyecto."""
        existente = await self.db.execute(
            select(Proyecto).where(Proyecto.codigo == datos.codigo)
        )
        if existente.scalars().first():
            raise ConflictoError(f"Ya existe un proyecto con código '{datos.codigo}'")

        entidad = Proyecto(
            codigo=datos.codigo,
            nombre=datos.nombre,
            descripcion=datos.descripcion,
            ubicacion=datos.ubicacion,
            fecha_inicio=_parse_date(datos.fecha_inicio),
            fecha_fin=_parse_date(datos.fecha_fin),
            presupuesto=datos.presupuesto,
            estado=datos.estado,
            cliente=datos.cliente,
            creado_por=usuario_id,
        )
        self.db.add(entidad)
        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("proyecto_creado", id=entidad.id, codigo=entidad.codigo)
        return _a_detalle_dto(entidad)

    async def actualizar(
        self, proyecto_id: int, datos: ProyectoActualizar, usuario_id: int
    ) -> ProyectoDetalleDto:
        """Actualizar un proyecto existente."""
        resultado = await self.db.execute(
            select(Proyecto).where(Proyecto.id == proyecto_id, Proyecto.is_active.is_(True))
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("Proyecto", proyecto_id)

        campos = datos.model_dump(exclude_unset=True)
        for campo, valor in campos.items():
            if campo in ("fecha_inicio", "fecha_fin"):
                setattr(entidad, campo, _parse_date(valor))
            else:
                setattr(entidad, campo, valor)
        entidad.actualizado_por = usuario_id

        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("proyecto_actualizado", id=proyecto_id)
        return _a_detalle_dto(entidad)

    async def eliminar(self, proyecto_id: int) -> None:
        """Eliminar (soft delete) un proyecto."""
        resultado = await self.db.execute(
            select(Proyecto).where(Proyecto.id == proyecto_id, Proyecto.is_active.is_(True))
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("Proyecto", proyecto_id)

        entidad.is_active = False
        await self.db.commit()
        logger.info("proyecto_eliminado", id=proyecto_id)

    async def obtener_estadisticas(self, proyecto_id: int) -> dict[str, Any]:
        """Obtener estadísticas del proyecto."""
        resultado = await self.db.execute(
            select(Proyecto).where(Proyecto.id == proyecto_id, Proyecto.is_active.is_(True))
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("Proyecto", proyecto_id)

        return {
            "proyecto_id": proyecto_id,
            "codigo": entidad.codigo,
            "nombre": entidad.nombre,
            "estado": entidad.estado,
            "presupuesto": float(entidad.presupuesto) if entidad.presupuesto else None,
        }
