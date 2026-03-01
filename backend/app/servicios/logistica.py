"""Servicio para logística / inventario.
"""

from datetime import date

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.core.excepciones import NoEncontradoError
from app.esquemas.logistica import (
    MovimientoCrear,
    MovimientoDetalleDto,
    MovimientoListaDto,
    ProductoDetalleDto,
    ProductoListaDto,
)
from app.modelos.logistica import Movimiento, Producto

logger = obtener_logger(__name__)


def _fecha_str(val: date | None) -> str | None:
    return val.isoformat() if val else None


def _a_producto_lista(e: Producto) -> ProductoListaDto:
    return ProductoListaDto(
        id=e.id,
        codigo=e.codigo,
        nombre=e.nombre,
        categoria=e.categoria,
        unidad_medida=e.unidad_medida,
        stock_actual=float(e.stock_actual),
        stock_minimo=float(e.stock_minimo) if e.stock_minimo is not None else None,
        precio_unitario=float(e.precio_unitario) if e.precio_unitario is not None else None,
        is_active=e.is_active,
        created_at=e.created_at.isoformat(),
    )


def _a_producto_detalle(e: Producto) -> ProductoDetalleDto:
    return ProductoDetalleDto(
        id=e.id,
        codigo=e.codigo,
        nombre=e.nombre,
        descripcion=e.descripcion,
        categoria=e.categoria,
        unidad_medida=e.unidad_medida,
        stock_actual=float(e.stock_actual),
        stock_minimo=float(e.stock_minimo) if e.stock_minimo is not None else None,
        precio_unitario=float(e.precio_unitario) if e.precio_unitario is not None else None,
        is_active=e.is_active,
        created_at=e.created_at.isoformat(),
        updated_at=e.updated_at.isoformat(),
    )


def _a_movimiento_lista(e: Movimiento) -> MovimientoListaDto:
    return MovimientoListaDto(
        id=e.id,
        tipo_movimiento=e.tipo_movimiento,
        fecha=e.fecha.isoformat(),
        numero_documento=e.numero_documento,
        estado=e.estado,
        created_at=e.created_at.isoformat(),
    )


def _a_movimiento_detalle(e: Movimiento) -> MovimientoDetalleDto:
    return MovimientoDetalleDto(
        id=e.id,
        proyecto_id=e.proyecto_id,
        fecha=e.fecha.isoformat(),
        tipo_movimiento=e.tipo_movimiento,
        numero_documento=e.numero_documento,
        observaciones=e.observaciones,
        estado=e.estado,
        creado_por=e.creado_por,
        created_at=e.created_at.isoformat(),
        updated_at=e.updated_at.isoformat(),
    )


class ServicioLogistica:
    """Servicio para gestión de inventario y logística."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ─── Productos ──────────────────────────────────────────────────────

    async def listar_productos(
        self,
        *,
        categoria: str | None = None,
        busqueda: str | None = None,
        pagina: int = 1,
        limite: int = 20,
    ) -> tuple[list[ProductoListaDto], int]:
        """Listar productos con filtros y paginación."""
        consulta = select(Producto).where(Producto.is_active.is_(True))

        if categoria:
            consulta = consulta.where(Producto.categoria == categoria)
        if busqueda:
            patron = f"%{busqueda}%"
            consulta = consulta.where(
                Producto.nombre.ilike(patron) | Producto.codigo.ilike(patron)
            )

        consulta_conteo = select(func.count()).select_from(consulta.subquery())
        resultado_conteo = await self.db.execute(consulta_conteo)
        total: int = resultado_conteo.scalar_one()

        consulta = consulta.order_by(Producto.nombre)
        offset = (pagina - 1) * limite
        consulta = consulta.offset(offset).limit(limite)

        resultado = await self.db.execute(consulta)
        entidades = list(resultado.scalars().all())

        logger.info("productos_listados", total=total)
        return [_a_producto_lista(e) for e in entidades], total

    async def obtener_producto(self, producto_id: int) -> ProductoDetalleDto:
        """Obtener producto por ID."""
        resultado = await self.db.execute(
            select(Producto).where(
                Producto.id == producto_id, Producto.is_active.is_(True)
            )
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("Producto", producto_id)
        return _a_producto_detalle(entidad)

    # ─── Movimientos ────────────────────────────────────────────────────

    async def listar_movimientos(
        self,
        *,
        tipo: str | None = None,
        fecha_inicio: str | None = None,
        fecha_fin: str | None = None,
        pagina: int = 1,
        limite: int = 20,
    ) -> tuple[list[MovimientoListaDto], int]:
        """Listar movimientos con filtros y paginación."""
        consulta = select(Movimiento)

        if tipo:
            consulta = consulta.where(Movimiento.tipo_movimiento == tipo)
        if fecha_inicio:
            consulta = consulta.where(Movimiento.fecha >= date.fromisoformat(fecha_inicio))
        if fecha_fin:
            consulta = consulta.where(Movimiento.fecha <= date.fromisoformat(fecha_fin))

        consulta_conteo = select(func.count()).select_from(consulta.subquery())
        resultado_conteo = await self.db.execute(consulta_conteo)
        total: int = resultado_conteo.scalar_one()

        consulta = consulta.order_by(Movimiento.created_at.desc())
        offset = (pagina - 1) * limite
        consulta = consulta.offset(offset).limit(limite)

        resultado = await self.db.execute(consulta)
        entidades = list(resultado.scalars().all())

        logger.info("movimientos_listados", total=total)
        return [_a_movimiento_lista(e) for e in entidades], total

    async def obtener_movimiento(self, movimiento_id: int) -> MovimientoDetalleDto:
        """Obtener movimiento por ID."""
        resultado = await self.db.execute(
            select(Movimiento).where(Movimiento.id == movimiento_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("Movimiento", movimiento_id)
        return _a_movimiento_detalle(entidad)

    async def crear_movimiento(
        self, datos: MovimientoCrear, usuario_id: int
    ) -> MovimientoDetalleDto:
        """Crear un nuevo movimiento de inventario."""
        entidad = Movimiento(
            tipo_movimiento=datos.tipo_movimiento,
            fecha=date.fromisoformat(datos.fecha),
            numero_documento=datos.numero_documento,
            proyecto_id=datos.proyecto_id,
            observaciones=datos.observaciones,
            creado_por=usuario_id,
        )
        self.db.add(entidad)
        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("movimiento_creado", id=entidad.id)
        return _a_movimiento_detalle(entidad)

    # ─── Stock ──────────────────────────────────────────────────────────

    async def obtener_stock(self) -> list[ProductoListaDto]:
        """Resumen de stock de todos los productos activos."""
        resultado = await self.db.execute(
            select(Producto)
            .where(Producto.is_active.is_(True))
            .order_by(Producto.nombre)
        )
        entidades = list(resultado.scalars().all())
        return [_a_producto_lista(e) for e in entidades]
