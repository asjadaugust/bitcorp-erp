"""Servicio para solicitud material, requerimiento y cotizacion logistica."""

from datetime import date

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.core.excepciones import NoEncontradoError
from app.esquemas.solicitud_material import (
    CategoriaDto,
    CotizacionLogisticaDto,
    DetalleRequerimientoDto,
    DetalleSolicitudMaterialDto,
    RequerimientoActualizar,
    RequerimientoCrear,
    RequerimientoDetalleDto,
    RequerimientoListaDto,
    SolicitudMaterialActualizar,
    SolicitudMaterialCrear,
    SolicitudMaterialDetalleDto,
    SolicitudMaterialListaDto,
)
from app.modelos.logistica import (
    Categoria,
    CotizacionLogistica,
    DetalleRequerimiento,
    DetalleSolicitudMaterial,
    Requerimiento,
    SolicitudMaterial,
)

logger = obtener_logger(__name__)


# --- Mappers ---


def _categoria_a_dto(e: Categoria) -> CategoriaDto:
    return CategoriaDto(
        id=e.id,
        codigo=e.codigo,
        nombre=e.nombre,
        descripcion=e.descripcion,
    )


def _solicitud_a_lista_dto(e: SolicitudMaterial) -> SolicitudMaterialListaDto:
    return SolicitudMaterialListaDto(
        id=e.id,
        motivo=e.motivo,
        fecha_solicitud=e.fecha_solicitud.isoformat() if e.fecha_solicitud else None,
        solicitado_por=e.solicitado_por,
    )


def _detalle_solicitud_a_dto(
    e: DetalleSolicitudMaterial,
) -> DetalleSolicitudMaterialDto:
    return DetalleSolicitudMaterialDto(
        id=e.id,
        solicitud_legacy_id=e.solicitud_legacy_id,
        producto_legacy_id=e.producto_legacy_id,
        producto=e.producto,
        cantidad=float(e.cantidad) if e.cantidad is not None else None,
        unidad_medida=e.unidad_medida,
        fecha_requerida=e.fecha_requerida.isoformat() if e.fecha_requerida else None,
        marca_sugerida=e.marca_sugerida,
        descripcion=e.descripcion,
        link=e.link,
        estatus=e.estatus,
    )


def _requerimiento_a_lista_dto(e: Requerimiento) -> RequerimientoListaDto:
    return RequerimientoListaDto(
        id=e.id,
        numero_requerimiento=e.numero_requerimiento,
        motivo=e.motivo,
        fecha_requerimiento=(
            e.fecha_requerimiento.isoformat() if e.fecha_requerimiento else None
        ),
        solicitado_por=e.solicitado_por,
    )


def _detalle_requerimiento_a_dto(e: DetalleRequerimiento) -> DetalleRequerimientoDto:
    return DetalleRequerimientoDto(
        id=e.id,
        requerimiento_legacy_id=e.requerimiento_legacy_id,
        producto_legacy_id=e.producto_legacy_id,
        producto=e.producto,
        cantidad=float(e.cantidad) if e.cantidad is not None else None,
        unidad_medida=e.unidad_medida,
        fecha_requerida=e.fecha_requerida.isoformat() if e.fecha_requerida else None,
        marca_sugerida=e.marca_sugerida,
        descripcion=e.descripcion,
        link=e.link,
        estatus=e.estatus,
    )


def _cotizacion_a_dto(e: CotizacionLogistica) -> CotizacionLogisticaDto:
    return CotizacionLogisticaDto(
        id=e.id,
        numero_cotizacion=e.numero_cotizacion,
    )


class ServicioSolicitudMaterial:
    """Servicio para gestion de solicitudes de material, requerimientos y cotizaciones."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # --- Categoria (read-only) ---

    async def listar_categorias(self) -> list[CategoriaDto]:
        """Listar todas las categorias."""
        resultado = await self.db.execute(select(Categoria).order_by(Categoria.id))
        entidades = list(resultado.scalars().all())
        logger.info("categorias_listadas", total=len(entidades))
        return [_categoria_a_dto(e) for e in entidades]

    # --- SolicitudMaterial ---

    async def listar_solicitudes(
        self, pagina: int = 1, limite: int = 20
    ) -> tuple[list[SolicitudMaterialListaDto], int]:
        """Listar solicitudes de material con paginacion."""
        consulta = select(SolicitudMaterial)
        consulta_count = select(func.count()).select_from(SolicitudMaterial)

        # Count
        resultado_count = await self.db.execute(consulta_count)
        total = resultado_count.scalar() or 0

        # Paginate
        consulta = consulta.order_by(SolicitudMaterial.id.desc())
        consulta = consulta.offset((pagina - 1) * limite).limit(limite)

        resultado = await self.db.execute(consulta)
        entidades = list(resultado.scalars().all())
        logger.info("solicitudes_material_listadas", total=total, pagina=pagina)
        return [_solicitud_a_lista_dto(e) for e in entidades], total

    async def obtener_solicitud(self, sol_id: int) -> SolicitudMaterialDetalleDto:
        """Obtener solicitud de material por ID con detalles."""
        resultado = await self.db.execute(
            select(SolicitudMaterial).where(SolicitudMaterial.id == sol_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("SolicitudMaterial", str(sol_id))

        # Fetch nested detalles via solicitud_legacy_id
        solicitud_key = entidad.legacy_id or str(entidad.id)
        res_det = await self.db.execute(
            select(DetalleSolicitudMaterial).where(
                DetalleSolicitudMaterial.solicitud_legacy_id == solicitud_key
            )
        )
        detalles = [_detalle_solicitud_a_dto(d) for d in res_det.scalars().all()]

        return SolicitudMaterialDetalleDto(
            id=entidad.id,
            legacy_id=entidad.legacy_id,
            motivo=entidad.motivo,
            fecha_solicitud=(
                entidad.fecha_solicitud.isoformat() if entidad.fecha_solicitud else None
            ),
            solicitado_por=entidad.solicitado_por,
            created_at=entidad.created_at.isoformat() if entidad.created_at else None,
            updated_at=entidad.updated_at.isoformat() if entidad.updated_at else None,
            detalles=detalles,
        )

    async def crear_solicitud(self, datos: SolicitudMaterialCrear) -> SolicitudMaterial:
        """Crear solicitud de material con lineas de detalle."""
        entidad = SolicitudMaterial(
            motivo=datos.motivo,
            fecha_solicitud=(
                date.fromisoformat(datos.fecha_solicitud)
                if datos.fecha_solicitud
                else None
            ),
            solicitado_por=datos.solicitado_por,
        )
        self.db.add(entidad)
        await self.db.flush()

        # Create detail lines
        solicitud_key = entidad.legacy_id or str(entidad.id)
        for det in datos.detalles:
            linea = DetalleSolicitudMaterial(
                solicitud_legacy_id=solicitud_key,
                producto=det.producto,
                cantidad=det.cantidad,
                unidad_medida=det.unidad_medida,
                fecha_requerida=(
                    date.fromisoformat(det.fecha_requerida)
                    if det.fecha_requerida
                    else None
                ),
                marca_sugerida=det.marca_sugerida,
                descripcion=det.descripcion,
                link=det.link,
                estatus=det.estatus,
            )
            self.db.add(linea)

        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("solicitud_material_creada", id=entidad.id)
        return entidad

    async def actualizar_solicitud(
        self, sol_id: int, datos: SolicitudMaterialActualizar
    ) -> SolicitudMaterial:
        """Actualizar una solicitud de material (solo header)."""
        resultado = await self.db.execute(
            select(SolicitudMaterial).where(SolicitudMaterial.id == sol_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("SolicitudMaterial", str(sol_id))

        campos = datos.model_dump(exclude_unset=True)
        if "fecha_solicitud" in campos and campos["fecha_solicitud"]:
            campos["fecha_solicitud"] = date.fromisoformat(campos["fecha_solicitud"])
        for campo, valor in campos.items():
            setattr(entidad, campo, valor)

        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("solicitud_material_actualizada", id=sol_id)
        return entidad

    async def eliminar_solicitud(self, sol_id: int) -> None:
        """Eliminar solicitud de material y sus lineas de detalle."""
        resultado = await self.db.execute(
            select(SolicitudMaterial).where(SolicitudMaterial.id == sol_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("SolicitudMaterial", str(sol_id))

        # Delete detail lines
        key = entidad.legacy_id or str(entidad.id)
        detalles = await self.db.execute(
            select(DetalleSolicitudMaterial).where(
                DetalleSolicitudMaterial.solicitud_legacy_id == key
            )
        )
        for d in detalles.scalars().all():
            await self.db.delete(d)

        await self.db.delete(entidad)
        await self.db.commit()
        logger.info("solicitud_material_eliminada", id=sol_id)

    # --- Requerimiento ---

    async def listar_requerimientos(
        self, pagina: int = 1, limite: int = 20
    ) -> tuple[list[RequerimientoListaDto], int]:
        """Listar requerimientos con paginacion."""
        consulta = select(Requerimiento)
        consulta_count = select(func.count()).select_from(Requerimiento)

        # Count
        resultado_count = await self.db.execute(consulta_count)
        total = resultado_count.scalar() or 0

        # Paginate
        consulta = consulta.order_by(Requerimiento.id.desc())
        consulta = consulta.offset((pagina - 1) * limite).limit(limite)

        resultado = await self.db.execute(consulta)
        entidades = list(resultado.scalars().all())
        logger.info("requerimientos_listados", total=total, pagina=pagina)
        return [_requerimiento_a_lista_dto(e) for e in entidades], total

    async def obtener_requerimiento(self, req_id: int) -> RequerimientoDetalleDto:
        """Obtener requerimiento por ID con detalles."""
        resultado = await self.db.execute(
            select(Requerimiento).where(Requerimiento.id == req_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("Requerimiento", str(req_id))

        # Fetch nested detalles via requerimiento_legacy_id
        requerimiento_key = entidad.legacy_id or str(entidad.id)
        res_det = await self.db.execute(
            select(DetalleRequerimiento).where(
                DetalleRequerimiento.requerimiento_legacy_id == requerimiento_key
            )
        )
        detalles = [_detalle_requerimiento_a_dto(d) for d in res_det.scalars().all()]

        return RequerimientoDetalleDto(
            id=entidad.id,
            legacy_id=entidad.legacy_id,
            numero_requerimiento=entidad.numero_requerimiento,
            motivo=entidad.motivo,
            fecha_requerimiento=(
                entidad.fecha_requerimiento.isoformat()
                if entidad.fecha_requerimiento
                else None
            ),
            solicitado_por=entidad.solicitado_por,
            created_at=entidad.created_at.isoformat() if entidad.created_at else None,
            updated_at=entidad.updated_at.isoformat() if entidad.updated_at else None,
            detalles=detalles,
        )

    async def crear_requerimiento(self, datos: RequerimientoCrear) -> Requerimiento:
        """Crear requerimiento con auto-increment numero_requerimiento y lineas de detalle."""
        # Auto-increment numero_requerimiento
        result = await self.db.execute(
            select(func.coalesce(func.max(Requerimiento.numero_requerimiento), 0))
        )
        next_num = result.scalar() + 1

        entidad = Requerimiento(
            numero_requerimiento=next_num,
            motivo=datos.motivo,
            fecha_requerimiento=(
                date.fromisoformat(datos.fecha_requerimiento)
                if datos.fecha_requerimiento
                else None
            ),
            solicitado_por=datos.solicitado_por,
        )
        self.db.add(entidad)
        await self.db.flush()

        # Create detail lines
        requerimiento_key = entidad.legacy_id or str(entidad.id)
        for det in datos.detalles:
            linea = DetalleRequerimiento(
                requerimiento_legacy_id=requerimiento_key,
                producto=det.producto,
                cantidad=det.cantidad,
                unidad_medida=det.unidad_medida,
                fecha_requerida=(
                    date.fromisoformat(det.fecha_requerida)
                    if det.fecha_requerida
                    else None
                ),
                marca_sugerida=det.marca_sugerida,
                descripcion=det.descripcion,
                link=det.link,
                estatus=det.estatus,
            )
            self.db.add(linea)

        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("requerimiento_creado", id=entidad.id, numero=next_num)
        return entidad

    async def actualizar_requerimiento(
        self, req_id: int, datos: RequerimientoActualizar
    ) -> Requerimiento:
        """Actualizar un requerimiento (solo header)."""
        resultado = await self.db.execute(
            select(Requerimiento).where(Requerimiento.id == req_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("Requerimiento", str(req_id))

        campos = datos.model_dump(exclude_unset=True)
        if "fecha_requerimiento" in campos and campos["fecha_requerimiento"]:
            campos["fecha_requerimiento"] = date.fromisoformat(
                campos["fecha_requerimiento"]
            )
        for campo, valor in campos.items():
            setattr(entidad, campo, valor)

        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("requerimiento_actualizado", id=req_id)
        return entidad

    async def eliminar_requerimiento(self, req_id: int) -> None:
        """Eliminar requerimiento y sus lineas de detalle."""
        resultado = await self.db.execute(
            select(Requerimiento).where(Requerimiento.id == req_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("Requerimiento", str(req_id))

        # Delete detail lines
        key = entidad.legacy_id or str(entidad.id)
        detalles = await self.db.execute(
            select(DetalleRequerimiento).where(
                DetalleRequerimiento.requerimiento_legacy_id == key
            )
        )
        for d in detalles.scalars().all():
            await self.db.delete(d)

        await self.db.delete(entidad)
        await self.db.commit()
        logger.info("requerimiento_eliminado", id=req_id)

    # --- CotizacionLogistica (read-only) ---

    async def listar_cotizaciones(self) -> list[CotizacionLogisticaDto]:
        """Listar todas las cotizaciones logisticas."""
        resultado = await self.db.execute(
            select(CotizacionLogistica).order_by(CotizacionLogistica.id.desc())
        )
        entidades = list(resultado.scalars().all())
        logger.info("cotizaciones_logistica_listadas", total=len(entidades))
        return [_cotizacion_a_dto(e) for e in entidades]
