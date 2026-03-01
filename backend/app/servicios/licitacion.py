"""Servicio para licitaciones.
"""

from datetime import date

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.core.excepciones import ConflictoError, NoEncontradoError, ReglaDeNegocioError
from app.esquemas.licitacion import (
    LicitacionActualizar,
    LicitacionCrear,
    LicitacionDetalleDto,
    LicitacionListaDto,
)
from app.modelos.licitacion import Licitacion

logger = obtener_logger(__name__)

# Valid state transitions
_TRANSICIONES_VALIDAS: dict[str, list[str]] = {
    "PUBLICADO": ["EVALUACION", "CANCELADO"],
    "EVALUACION": ["ADJUDICADO", "DESIERTO", "CANCELADO"],
    "ADJUDICADO": ["CANCELADO"],
    "DESIERTO": [],
    "CANCELADO": [],
}


def _fecha_str(val: date | None) -> str | None:
    return val.isoformat() if val else None


def _a_lista_dto(e: Licitacion) -> LicitacionListaDto:
    return LicitacionListaDto(
        id=e.id,
        codigo=e.codigo,
        nombre=e.nombre,
        entidad_convocante=e.entidad_convocante,
        monto_referencial=float(e.monto_referencial) if e.monto_referencial else None,
        estado=e.estado,
        fecha_convocatoria=_fecha_str(e.fecha_convocatoria),
        fecha_presentacion=_fecha_str(e.fecha_presentacion),
        created_at=e.created_at.isoformat(),
    )


def _a_detalle_dto(e: Licitacion) -> LicitacionDetalleDto:
    return LicitacionDetalleDto(
        id=e.id,
        codigo=e.codigo,
        nombre=e.nombre,
        entidad_convocante=e.entidad_convocante,
        monto_referencial=float(e.monto_referencial) if e.monto_referencial else None,
        fecha_convocatoria=_fecha_str(e.fecha_convocatoria),
        fecha_presentacion=_fecha_str(e.fecha_presentacion),
        estado=e.estado,
        observaciones=e.observaciones,
        created_at=e.created_at.isoformat(),
        updated_at=e.updated_at.isoformat(),
    )


def _parse_date(val: str | None) -> date | None:
    if not val:
        return None
    return date.fromisoformat(val)


class ServicioLicitacion:
    """Servicio para gestión de licitaciones."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def listar(
        self,
        *,
        estado: str | None = None,
        busqueda: str | None = None,
        pagina: int = 1,
        limite: int = 20,
    ) -> tuple[list[LicitacionListaDto], int]:
        """Listar licitaciones con filtros y paginación."""
        consulta = select(Licitacion)

        if estado:
            consulta = consulta.where(Licitacion.estado == estado)
        if busqueda:
            patron = f"%{busqueda}%"
            consulta = consulta.where(
                Licitacion.nombre.ilike(patron) | Licitacion.codigo.ilike(patron)
            )

        consulta_conteo = select(func.count()).select_from(consulta.subquery())
        resultado_conteo = await self.db.execute(consulta_conteo)
        total: int = resultado_conteo.scalar_one()

        consulta = consulta.order_by(Licitacion.created_at.desc())
        offset = (pagina - 1) * limite
        consulta = consulta.offset(offset).limit(limite)

        resultado = await self.db.execute(consulta)
        entidades = list(resultado.scalars().all())

        logger.info("licitaciones_listadas", total=total)
        return [_a_lista_dto(e) for e in entidades], total

    async def obtener_por_id(self, licitacion_id: int) -> LicitacionDetalleDto:
        """Obtener licitación por ID."""
        resultado = await self.db.execute(
            select(Licitacion).where(Licitacion.id == licitacion_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("Licitacion", licitacion_id)
        return _a_detalle_dto(entidad)

    async def crear(self, datos: LicitacionCrear) -> LicitacionDetalleDto:
        """Crear una nueva licitación."""
        existente = await self.db.execute(
            select(Licitacion).where(Licitacion.codigo == datos.codigo)
        )
        if existente.scalars().first():
            raise ConflictoError(f"Ya existe una licitación con código '{datos.codigo}'")

        entidad = Licitacion(
            codigo=datos.codigo,
            nombre=datos.nombre,
            entidad_convocante=datos.entidad_convocante,
            monto_referencial=datos.monto_referencial,
            fecha_convocatoria=_parse_date(datos.fecha_convocatoria),
            fecha_presentacion=_parse_date(datos.fecha_presentacion),
            observaciones=datos.observaciones,
        )
        self.db.add(entidad)
        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("licitacion_creada", id=entidad.id)
        return _a_detalle_dto(entidad)

    async def actualizar(
        self, licitacion_id: int, datos: LicitacionActualizar
    ) -> LicitacionDetalleDto:
        """Actualizar una licitación existente."""
        resultado = await self.db.execute(
            select(Licitacion).where(Licitacion.id == licitacion_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("Licitacion", licitacion_id)

        campos = datos.model_dump(exclude_unset=True)
        for campo, valor in campos.items():
            if campo in ("fecha_convocatoria", "fecha_presentacion"):
                setattr(entidad, campo, _parse_date(valor))
            else:
                setattr(entidad, campo, valor)

        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("licitacion_actualizada", id=licitacion_id)
        return _a_detalle_dto(entidad)

    async def eliminar(self, licitacion_id: int) -> None:
        """Eliminar una licitación (hard delete)."""
        resultado = await self.db.execute(
            select(Licitacion).where(Licitacion.id == licitacion_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("Licitacion", licitacion_id)

        await self.db.delete(entidad)
        await self.db.commit()
        logger.info("licitacion_eliminada", id=licitacion_id)

    async def cambiar_estado(
        self, licitacion_id: int, nuevo_estado: str
    ) -> LicitacionDetalleDto:
        """Cambiar estado de una licitación con validación."""
        resultado = await self.db.execute(
            select(Licitacion).where(Licitacion.id == licitacion_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("Licitacion", licitacion_id)

        estados_permitidos = _TRANSICIONES_VALIDAS.get(entidad.estado, [])
        if nuevo_estado not in estados_permitidos:
            raise ReglaDeNegocioError.estado_invalido(
                "licitación", entidad.estado, "transicionar", estados_permitidos
            )

        entidad.estado = nuevo_estado
        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info(
            "licitacion_transicion", id=licitacion_id, nuevo_estado=nuevo_estado
        )
        return _a_detalle_dto(entidad)
