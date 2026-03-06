"""Servicio para Insumo (Recurso Maestro)."""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.core.excepciones import ConflictoError, NoEncontradoError
from app.esquemas.insumo import (
    InsumoActualizar,
    InsumoCrear,
    InsumoDetalleDto,
    InsumoDropdownDto,
    InsumoListaDto,
)
from app.modelos.presupuestos import Insumo

logger = obtener_logger(__name__)


def _a_lista_dto(e: Insumo) -> InsumoListaDto:
    return InsumoListaDto(
        id=e.id,
        codigo=e.codigo,
        nombre=e.nombre,
        unidad_medida=e.unidad_medida,
        tipo=e.tipo,
        precio_unitario=float(e.precio_unitario),
        created_at=e.created_at.isoformat(),
    )


def _a_detalle_dto(e: Insumo) -> InsumoDetalleDto:
    return InsumoDetalleDto(
        id=e.id,
        codigo=e.codigo,
        nombre=e.nombre,
        unidad_medida=e.unidad_medida,
        tipo=e.tipo,
        precio_unitario=float(e.precio_unitario),
        equipo_tipo_id=e.equipo_tipo_id,
        created_at=e.created_at.isoformat(),
        updated_at=e.updated_at.isoformat(),
    )


class ServicioInsumo:
    """Servicio para gestión de Insumos."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def listar(
        self,
        *,
        tipo: str | None = None,
        busqueda: str | None = None,
        pagina: int = 1,
        limite: int = 20,
    ) -> tuple[list[InsumoListaDto], int]:
        """Listar insumos con filtros y paginación."""
        consulta = select(Insumo).where(Insumo.is_active.is_(True))

        if tipo:
            consulta = consulta.where(Insumo.tipo == tipo)
        if busqueda:
            patron = f"%{busqueda}%"
            consulta = consulta.where(
                Insumo.nombre.ilike(patron) | Insumo.codigo.ilike(patron)
            )

        consulta_conteo = select(func.count()).select_from(consulta.subquery())
        resultado_conteo = await self.db.execute(consulta_conteo)
        total: int = resultado_conteo.scalar_one()

        consulta = consulta.order_by(Insumo.codigo)
        offset = (pagina - 1) * limite
        consulta = consulta.offset(offset).limit(limite)

        resultado = await self.db.execute(consulta)
        entidades = list(resultado.scalars().all())

        logger.info("insumos_listados", total=total)
        return [_a_lista_dto(e) for e in entidades], total

    async def obtener_por_id(self, insumo_id: int) -> InsumoDetalleDto:
        """Obtener insumo por ID."""
        resultado = await self.db.execute(
            select(Insumo).where(Insumo.id == insumo_id, Insumo.is_active.is_(True))
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("Insumo", insumo_id)
        return _a_detalle_dto(entidad)

    async def crear(self, datos: InsumoCrear) -> InsumoDetalleDto:
        """Crear un nuevo insumo."""
        existente = await self.db.execute(
            select(Insumo).where(
                Insumo.codigo == datos.codigo, Insumo.is_active.is_(True)
            )
        )
        if existente.scalars().first():
            raise ConflictoError(f"Ya existe un insumo con código '{datos.codigo}'")

        entidad = Insumo(
            codigo=datos.codigo,
            nombre=datos.nombre,
            unidad_medida=datos.unidad_medida,
            tipo=datos.tipo,
            precio_unitario=datos.precio_unitario,
            equipo_tipo_id=datos.equipo_tipo_id,
            tenant_id=1,
        )
        self.db.add(entidad)
        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("insumo_creado", id=entidad.id, codigo=entidad.codigo)
        return _a_detalle_dto(entidad)

    async def actualizar(
        self, insumo_id: int, datos: InsumoActualizar
    ) -> InsumoDetalleDto:
        """Actualizar un insumo existente."""
        resultado = await self.db.execute(
            select(Insumo).where(Insumo.id == insumo_id, Insumo.is_active.is_(True))
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("Insumo", insumo_id)

        campos = datos.model_dump(exclude_unset=True)
        for campo, valor in campos.items():
            setattr(entidad, campo, valor)

        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("insumo_actualizado", id=insumo_id)
        return _a_detalle_dto(entidad)

    async def eliminar(self, insumo_id: int) -> None:
        """Eliminar (soft delete) un insumo."""
        resultado = await self.db.execute(
            select(Insumo).where(Insumo.id == insumo_id, Insumo.is_active.is_(True))
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("Insumo", insumo_id)

        entidad.is_active = False
        await self.db.commit()
        logger.info("insumo_eliminado", id=insumo_id)

    async def listar_dropdown(self) -> list[InsumoDropdownDto]:
        """Listar insumos para dropdown (sin paginación)."""
        resultado = await self.db.execute(
            select(Insumo)
            .where(Insumo.is_active.is_(True))
            .order_by(Insumo.tipo, Insumo.codigo)
        )
        entidades = list(resultado.scalars().all())
        return [
            InsumoDropdownDto(
                id=e.id,
                codigo=e.codigo,
                nombre=e.nombre,
                unidad_medida=e.unidad_medida,
                tipo=e.tipo,
                precio_unitario=float(e.precio_unitario),
            )
            for e in entidades
        ]
