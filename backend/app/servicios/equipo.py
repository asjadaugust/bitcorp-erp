"""Servicio para equipos.

Replica EquipmentService del BFF Node.js.
"""

from typing import Any

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.core.excepciones import ConflictoError, NoEncontradoError
from app.esquemas.equipo import (
    EquipoActualizar,
    EquipoCrear,
    EquipoDetalleDto,
    EquipoEstadisticasDto,
    EquipoListaDto,
)
from app.modelos.equipo import Equipo, TipoEquipo
from app.modelos.proveedores import Proveedor

logger = obtener_logger(__name__)


# ─── Valid sort fields (API snake_case → DB column) ───────────────────────

_CAMPOS_ORDENAMIENTO: dict[str, str] = {
    "codigo_equipo": "codigo_equipo",
    "categoria": "categoria",
    "marca": "marca",
    "modelo": "modelo",
    "placa": "placa",
    "estado": "estado",
    "anio_fabricacion": "anio_fabricacion",
    "created_at": "created_at",
    "updated_at": "updated_at",
}


def _a_lista_dto(e: Equipo) -> EquipoListaDto:
    return EquipoListaDto(
        id=e.id,
        codigo_equipo=e.codigo_equipo,
        tipo_proveedor=e.tipo_proveedor,
        categoria=e.categoria,
        placa=e.placa,
        marca=e.marca,
        modelo=e.modelo,
        estado=e.estado,
        medidor_uso=e.medidor_uso,
        anio_fabricacion=e.anio_fabricacion,
        is_active=e.is_active,
        proveedor_id=e.proveedor_id,
        proveedor_razon_social=(
            e.proveedor.razon_social if e.proveedor else None
        ),
        tipo_equipo_id=e.tipo_equipo_id,
        tipo_equipo_nombre=(
            e.tipo_equipo_rel.nombre if e.tipo_equipo_rel else None
        ),
        categoria_prd=(
            e.tipo_equipo_rel.categoria_prd if e.tipo_equipo_rel else None
        ),
    )


def _a_detalle_dto(e: Equipo) -> EquipoDetalleDto:
    return EquipoDetalleDto(
        id=e.id,
        codigo_equipo=e.codigo_equipo,
        tipo_proveedor=e.tipo_proveedor,
        categoria=e.categoria,
        placa=e.placa,
        marca=e.marca,
        modelo=e.modelo,
        estado=e.estado,
        medidor_uso=e.medidor_uso,
        anio_fabricacion=e.anio_fabricacion,
        is_active=e.is_active,
        proveedor_id=e.proveedor_id,
        proveedor_razon_social=(
            e.proveedor.razon_social if e.proveedor else None
        ),
        tipo_equipo_id=e.tipo_equipo_id,
        tipo_equipo_nombre=(
            e.tipo_equipo_rel.nombre if e.tipo_equipo_rel else None
        ),
        categoria_prd=(
            e.tipo_equipo_rel.categoria_prd if e.tipo_equipo_rel else None
        ),
        legacy_id=e.legacy_id,
        numero_serie_equipo=e.numero_serie_equipo,
        numero_chasis=e.numero_chasis,
        numero_serie_motor=e.numero_serie_motor,
        potencia_neta=float(e.potencia_neta) if e.potencia_neta is not None else None,
        tipo_motor=e.tipo_motor,
        fecha_venc_poliza=e.fecha_venc_poliza,
        fecha_venc_soat=e.fecha_venc_soat,
        fecha_venc_citv=e.fecha_venc_citv,
        created_at=e.created_at,
        updated_at=e.updated_at,
    )


class ServicioEquipo:
    """Servicio para gestión de equipos."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ─── Listar (paginated, filtered, sorted) ─────────────────────────────

    async def listar(
        self,
        tenant_id: int,
        *,
        estado: str | None = None,
        categoria: str | None = None,
        categoria_prd: str | None = None,
        marca: str | None = None,
        equipment_type_id: int | None = None,
        provider_id: int | None = None,
        search: str | None = None,
        is_active: bool = True,
        sort_by: str = "codigo_equipo",
        sort_order: str = "ASC",
        page: int = 1,
        limit: int = 10,
    ) -> tuple[list[EquipoListaDto], int]:
        """Listar equipos con filtros, paginación y ordenamiento."""
        stmt = (
            select(Equipo)
            .outerjoin(Proveedor, Equipo.proveedor_id == Proveedor.id)
            .outerjoin(TipoEquipo, Equipo.tipo_equipo_id == TipoEquipo.id)
            .where(Equipo.tenant_id == tenant_id, Equipo.is_active == is_active)
        )

        if estado:
            stmt = stmt.where(Equipo.estado == estado)
        if categoria:
            stmt = stmt.where(Equipo.categoria == categoria)
        if categoria_prd:
            stmt = stmt.where(TipoEquipo.categoria_prd == categoria_prd)
        if marca:
            stmt = stmt.where(Equipo.marca.ilike(f"%{marca}%"))
        if equipment_type_id:
            stmt = stmt.where(Equipo.tipo_equipo_id == equipment_type_id)
        if provider_id:
            stmt = stmt.where(Equipo.proveedor_id == provider_id)
        if search:
            patron = f"%{search}%"
            stmt = stmt.where(
                or_(
                    Equipo.codigo_equipo.ilike(patron),
                    Equipo.marca.ilike(patron),
                    Equipo.modelo.ilike(patron),
                    Equipo.placa.ilike(patron),
                    Equipo.categoria.ilike(patron),
                )
            )

        # Count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar_one()

        # Sort
        col_name = _CAMPOS_ORDENAMIENTO.get(sort_by, "codigo_equipo")
        col = getattr(Equipo, col_name, Equipo.codigo_equipo)
        order = col.desc() if sort_order.upper() == "DESC" else col.asc()
        stmt = stmt.order_by(order)

        # Paginate
        offset = (page - 1) * limit
        stmt = stmt.offset(offset).limit(limit)

        result = await self.db.execute(stmt)
        equipos = list(result.scalars().unique().all())

        logger.info("equipos_listados", total=total, returned=len(equipos), page=page)
        return [_a_lista_dto(e) for e in equipos], total

    # ─── Obtener por ID ───────────────────────────────────────────────────

    async def obtener_por_id(self, tenant_id: int, equipo_id: int) -> EquipoDetalleDto:
        """Obtener un equipo por su ID."""
        result = await self.db.execute(
            select(Equipo).where(Equipo.id == equipo_id, Equipo.tenant_id == tenant_id)
        )
        equipo = result.scalars().first()
        if not equipo:
            raise NoEncontradoError("Equipo", equipo_id)
        return _a_detalle_dto(equipo)

    # ─── Crear ────────────────────────────────────────────────────────────

    async def crear(
        self, tenant_id: int, datos: EquipoCrear, creado_por: int
    ) -> EquipoDetalleDto:
        """Crear un nuevo equipo."""
        # Check uniqueness of codigo_equipo
        existente = await self.db.execute(
            select(Equipo).where(
                Equipo.codigo_equipo == datos.codigo_equipo,
                Equipo.tenant_id == tenant_id,
            )
        )
        if existente.scalars().first():
            raise ConflictoError(
                f"El código de equipo '{datos.codigo_equipo}' ya existe"
            )

        _ = creado_por  # Reserved for future audit column
        equipo = Equipo(
            codigo_equipo=datos.codigo_equipo,
            categoria=datos.categoria,
            marca=datos.marca,
            modelo=datos.modelo,
            numero_serie_equipo=datos.numero_serie_equipo,
            numero_chasis=datos.numero_chasis,
            numero_serie_motor=datos.numero_serie_motor,
            placa=datos.placa,
            anio_fabricacion=datos.anio_fabricacion,
            potencia_neta=datos.potencia_neta,
            tipo_motor=datos.tipo_motor,
            medidor_uso=datos.medidor_uso,
            estado=datos.estado or "DISPONIBLE",
            tipo_proveedor=datos.tipo_proveedor,
            tipo_equipo_id=datos.tipo_equipo_id,
            proveedor_id=datos.proveedor_id,
            fecha_venc_poliza=datos.fecha_venc_poliza,
            fecha_venc_soat=datos.fecha_venc_soat,
            fecha_venc_citv=datos.fecha_venc_citv,
            is_active=True,
            tenant_id=tenant_id,
        )
        self.db.add(equipo)
        await self.db.commit()
        await self.db.refresh(equipo)

        logger.info("equipo_creado", id=equipo.id, codigo=equipo.codigo_equipo)
        return _a_detalle_dto(equipo)

    # ─── Actualizar ──────────────────────────────────────────────────────

    async def actualizar(
        self, tenant_id: int, equipo_id: int, datos: EquipoActualizar, actualizado_por: int
    ) -> EquipoDetalleDto:
        """Actualizar un equipo existente."""
        result = await self.db.execute(
            select(Equipo).where(Equipo.id == equipo_id, Equipo.tenant_id == tenant_id)
        )
        equipo = result.scalars().first()
        if not equipo:
            raise NoEncontradoError("Equipo", equipo_id)

        # If changing codigo, check uniqueness
        if datos.codigo_equipo and datos.codigo_equipo != equipo.codigo_equipo:
            dup = await self.db.execute(
                select(Equipo).where(
                    Equipo.codigo_equipo == datos.codigo_equipo,
                    Equipo.tenant_id == tenant_id,
                    Equipo.id != equipo_id,
                )
            )
            if dup.scalars().first():
                raise ConflictoError(
                    f"El código de equipo '{datos.codigo_equipo}' ya existe"
                )

        _ = actualizado_por  # Reserved for future audit column
        campos_actualizar = datos.model_dump(exclude_unset=True)
        for campo, valor in campos_actualizar.items():
            setattr(equipo, campo, valor)

        await self.db.commit()
        await self.db.refresh(equipo)

        logger.info("equipo_actualizado", id=equipo_id)
        return _a_detalle_dto(equipo)

    # ─── Eliminar (soft delete) ──────────────────────────────────────────

    async def eliminar(self, tenant_id: int, equipo_id: int) -> None:
        """Eliminar (soft delete) un equipo."""
        result = await self.db.execute(
            select(Equipo).where(Equipo.id == equipo_id, Equipo.tenant_id == tenant_id)
        )
        equipo = result.scalars().first()
        if not equipo:
            raise NoEncontradoError("Equipo", equipo_id)

        equipo.is_active = False
        await self.db.commit()
        logger.info("equipo_eliminado", id=equipo_id)

    # ─── Cambiar estado ──────────────────────────────────────────────────

    async def cambiar_estado(
        self, tenant_id: int, equipo_id: int, nuevo_estado: str
    ) -> EquipoDetalleDto:
        """Cambiar el estado de un equipo."""
        result = await self.db.execute(
            select(Equipo).where(Equipo.id == equipo_id, Equipo.tenant_id == tenant_id)
        )
        equipo = result.scalars().first()
        if not equipo:
            raise NoEncontradoError("Equipo", equipo_id)

        old_estado = equipo.estado
        equipo.estado = nuevo_estado
        await self.db.commit()
        await self.db.refresh(equipo)

        logger.info(
            "equipo_estado_cambiado",
            id=equipo_id,
            old=old_estado,
            new=nuevo_estado,
        )
        return _a_detalle_dto(equipo)

    # ─── Estadísticas ────────────────────────────────────────────────────

    async def obtener_estadisticas(self, tenant_id: int) -> EquipoEstadisticasDto:
        """Obtener estadísticas de equipos por estado."""
        result = await self.db.execute(
            select(
                Equipo.estado,
                func.count().label("count"),
            )
            .where(Equipo.tenant_id == tenant_id, Equipo.is_active.is_(True))
            .group_by(Equipo.estado)
        )
        rows = result.all()

        stats = EquipoEstadisticasDto()
        for row in rows:
            estado_upper = (row[0] or "").upper()
            count = int(row[1])
            stats.total += count
            if estado_upper in ("DISPONIBLE", "AVAILABLE"):
                stats.disponible = count
            elif estado_upper in ("EN_USO", "IN_USE"):
                stats.en_uso = count
            elif estado_upper in ("MANTENIMIENTO", "MAINTENANCE"):
                stats.mantenimiento = count
            elif estado_upper in ("RETIRADO", "RETIRED"):
                stats.retirado = count

        logger.info("equipo_estadisticas", **stats.model_dump())
        return stats

    # ─── Tipos (categorías distintas) ────────────────────────────────────

    async def obtener_tipos(self, tenant_id: int) -> list[str]:
        """Obtener categorías distintas de equipos."""
        result = await self.db.execute(
            select(Equipo.categoria)
            .distinct()
            .where(
                Equipo.tenant_id == tenant_id,
                Equipo.categoria.is_not(None),
            )
            .order_by(Equipo.categoria.asc())
        )
        return [r for (r,) in result.all()]

    # ─── Disponibles ─────────────────────────────────────────────────────

    async def obtener_disponibles(self, tenant_id: int) -> list[EquipoListaDto]:
        """Obtener todos los equipos disponibles."""
        datos, _ = await self.listar(
            tenant_id, estado="DISPONIBLE", page=1, limit=9999
        )
        return datos

    # ─── Historial de asignaciones (stub) ────────────────────────────────

    async def historial_asignaciones(
        self, tenant_id: int, equipo_id: int
    ) -> list[dict[str, Any]]:
        """Obtener historial de asignaciones de un equipo (stub)."""
        logger.info("historial_asignaciones_stub", tenant_id=tenant_id, equipo_id=equipo_id)
        return []

    # ─── Disponibilidad por rango (stub) ─────────────────────────────────

    async def disponibilidad_rango(self, tenant_id: int) -> bool:
        """Verificar disponibilidad en rango de fechas (stub)."""
        logger.info("disponibilidad_rango_stub", tenant_id=tenant_id)
        return True

    # ─── Asignar (stub) ──────────────────────────────────────────────────

    async def asignar(
        self, tenant_id: int, equipo_id: int, datos: dict[str, Any]
    ) -> dict[str, Any]:
        """Asignar equipo a proyecto (stub)."""
        logger.info("asignar_equipo_stub", equipo_id=equipo_id)
        return {"id": equipo_id, **datos, "status": "assigned"}

    # ─── Transferir (stub) ───────────────────────────────────────────────

    async def transferir(
        self, tenant_id: int, equipo_id: int, datos: dict[str, Any]
    ) -> dict[str, Any]:
        """Transferir equipo entre proyectos (stub)."""
        logger.info("transferir_equipo_stub", equipo_id=equipo_id)
        return {"id": equipo_id, **datos, "status": "transferred"}
