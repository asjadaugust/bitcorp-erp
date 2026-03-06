"""Servicio para EDT (Estructura de Desglose de Trabajo)."""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.core.excepciones import ConflictoError, NoEncontradoError
from app.esquemas.edt import (
    EdtActualizar,
    EdtCrear,
    EdtDetalleDto,
    EdtDropdownDto,
    EdtListaDto,
)
from app.modelos.proyectos import Edt

logger = obtener_logger(__name__)


def _a_lista_dto(e: Edt) -> EdtListaDto:
    return EdtListaDto(
        id=e.id,
        codigo=e.codigo,
        nombre=e.nombre,
        codigo_alfanumerico=e.codigo_alfanumerico,
        unidad_medida=e.unidad_medida,
        estado=e.estado,
        created_at=e.created_at.isoformat(),
    )


def _a_detalle_dto(e: Edt) -> EdtDetalleDto:
    return EdtDetalleDto(
        id=e.id,
        codigo=e.codigo,
        nombre=e.nombre,
        codigo_alfanumerico=e.codigo_alfanumerico,
        unidad_medida=e.unidad_medida,
        unidad_operativa_id=e.unidad_operativa_id,
        estado=e.estado,
        created_at=e.created_at.isoformat(),
        updated_at=e.updated_at.isoformat(),
    )


class ServicioEdt:
    """Servicio para gestión de EDT."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def listar(
        self,
        *,
        estado: str | None = None,
        busqueda: str | None = None,
        pagina: int = 1,
        limite: int = 20,
    ) -> tuple[list[EdtListaDto], int]:
        """Listar EDT items con filtros y paginación."""
        consulta = select(Edt).where(Edt.is_active.is_(True))

        if estado:
            consulta = consulta.where(Edt.estado == estado)
        if busqueda:
            patron = f"%{busqueda}%"
            consulta = consulta.where(
                Edt.nombre.ilike(patron) | Edt.codigo.ilike(patron)
            )

        consulta_conteo = select(func.count()).select_from(consulta.subquery())
        resultado_conteo = await self.db.execute(consulta_conteo)
        total: int = resultado_conteo.scalar_one()

        consulta = consulta.order_by(Edt.codigo)
        offset = (pagina - 1) * limite
        consulta = consulta.offset(offset).limit(limite)

        resultado = await self.db.execute(consulta)
        entidades = list(resultado.scalars().all())

        logger.info("edt_listados", total=total)
        return [_a_lista_dto(e) for e in entidades], total

    async def obtener_por_id(self, edt_id: int) -> EdtDetalleDto:
        """Obtener EDT por ID."""
        resultado = await self.db.execute(
            select(Edt).where(Edt.id == edt_id, Edt.is_active.is_(True))
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("EDT", edt_id)
        return _a_detalle_dto(entidad)

    async def crear(self, datos: EdtCrear) -> EdtDetalleDto:
        """Crear un nuevo EDT item."""
        existente = await self.db.execute(
            select(Edt).where(Edt.codigo == datos.codigo)
        )
        if existente.scalars().first():
            raise ConflictoError(f"Ya existe un EDT con código '{datos.codigo}'")

        entidad = Edt(
            codigo=datos.codigo,
            nombre=datos.nombre,
            codigo_alfanumerico=datos.codigo_alfanumerico,
            unidad_medida=datos.unidad_medida,
            estado=datos.estado,
        )
        self.db.add(entidad)
        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("edt_creado", id=entidad.id, codigo=entidad.codigo)
        return _a_detalle_dto(entidad)

    async def actualizar(self, edt_id: int, datos: EdtActualizar) -> EdtDetalleDto:
        """Actualizar un EDT item existente."""
        resultado = await self.db.execute(
            select(Edt).where(Edt.id == edt_id, Edt.is_active.is_(True))
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("EDT", edt_id)

        campos = datos.model_dump(exclude_unset=True)
        for campo, valor in campos.items():
            setattr(entidad, campo, valor)

        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("edt_actualizado", id=edt_id)
        return _a_detalle_dto(entidad)

    async def eliminar(self, edt_id: int) -> None:
        """Eliminar (soft delete) un EDT item."""
        resultado = await self.db.execute(
            select(Edt).where(Edt.id == edt_id, Edt.is_active.is_(True))
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("EDT", edt_id)

        entidad.is_active = False
        await self.db.commit()
        logger.info("edt_eliminado", id=edt_id)

    async def listar_dropdown(self) -> list[EdtDropdownDto]:
        """Listar EDT items para dropdown (sin paginación)."""
        resultado = await self.db.execute(
            select(Edt)
            .where(Edt.is_active.is_(True))
            .order_by(Edt.codigo)
        )
        entidades = list(resultado.scalars().all())
        return [
            EdtDropdownDto(
                id=e.id,
                codigo=e.codigo,
                codigo_alfanumerico=e.codigo_alfanumerico,
                nombre=e.nombre,
            )
            for e in entidades
        ]
