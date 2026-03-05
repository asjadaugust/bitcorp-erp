"""Servicio para inspecciones SSOMA y reportes acto/condicion."""

from datetime import date, datetime

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.core.excepciones import NoEncontradoError
from app.esquemas.inspeccion_ssoma import (
    ActoCondicionInseguroDto,
    InspeccionSsomaCrear,
    InspeccionSsomaActualizar,
    InspeccionSsomaDetalleDto,
    InspeccionSsomaListaDto,
    ReporteActoCondicionActualizar,
    ReporteActoCondicionCrear,
    ReporteActoCondicionDetalleDto,
    ReporteActoCondicionListaDto,
    SeguimientoInspeccionCrear,
    SeguimientoInspeccionDto,
)
from app.modelos.sst import (
    ListaActoCondicionInseguro,
    ReporteActoCondicion,
    SeguimientoInspeccion,
    SeguimientoInspeccionSsoma,
)

logger = obtener_logger(__name__)


def _iso(val: datetime | date | None) -> str | None:
    """Convert datetime/date to ISO string or None."""
    return val.isoformat() if val else None


def _a_seguimiento_dto(e: SeguimientoInspeccion) -> SeguimientoInspeccionDto:
    return SeguimientoInspeccionDto(
        id=e.id,
        fecha=_iso(e.fecha),
        inspector_dni=e.inspector_dni,
        inspector=e.inspector,
        descripcion_inspeccion=e.descripcion_inspeccion,
        link_evidencia=e.link_evidencia,
        fecha_proxima_inspeccion=_iso(e.fecha_proxima_inspeccion),
        avance_estimado=e.avance_estimado,
    )


def _a_inspeccion_lista_dto(e: SeguimientoInspeccionSsoma) -> InspeccionSsomaListaDto:
    return InspeccionSsomaListaDto(
        id=e.id,
        fecha_hallazgo=_iso(e.fecha_hallazgo),
        lugar_hallazgo=e.lugar_hallazgo,
        tipo_inspeccion=e.tipo_inspeccion,
        nivel_riesgo=e.nivel_riesgo,
        estado=e.estado,
        inspector=e.inspector,
    )


def _a_inspeccion_detalle_dto(
    e: SeguimientoInspeccionSsoma,
    seguimientos: list[SeguimientoInspeccionDto],
) -> InspeccionSsomaDetalleDto:
    return InspeccionSsomaDetalleDto(
        id=e.id,
        legacy_id=e.legacy_id,
        fecha_hallazgo=_iso(e.fecha_hallazgo),
        lugar_hallazgo=e.lugar_hallazgo,
        tipo_inspeccion=e.tipo_inspeccion,
        inspector_dni=e.inspector_dni,
        inspector=e.inspector,
        descripcion_hallazgo=e.descripcion_hallazgo,
        link_foto=e.link_foto,
        nivel_riesgo=e.nivel_riesgo,
        causas_hallazgo=e.causas_hallazgo,
        responsable_subsanacion=e.responsable_subsanacion,
        fecha_subsanacion=_iso(e.fecha_subsanacion),
        estado=e.estado,
        created_at=_iso(e.created_at),
        updated_at=_iso(e.updated_at),
        seguimientos=seguimientos,
    )


def _a_reporte_lista_dto(e: ReporteActoCondicion) -> ReporteActoCondicionListaDto:
    return ReporteActoCondicionListaDto(
        id=e.id,
        fecha_evento=_iso(e.fecha_evento),
        lugar=e.lugar,
        tipo_reporte=e.tipo_reporte,
        acto_condicion=e.acto_condicion,
        reportado_por_nombre=e.reportado_por_nombre,
        estado=e.estado,
    )


def _a_reporte_detalle_dto(e: ReporteActoCondicion) -> ReporteActoCondicionDetalleDto:
    return ReporteActoCondicionDetalleDto(
        id=e.id,
        legacy_id=e.legacy_id,
        reportado_por_dni=e.reportado_por_dni,
        reportado_por_nombre=e.reportado_por_nombre,
        cargo=e.cargo,
        empresa_reportante=e.empresa_reportante,
        fecha_evento=_iso(e.fecha_evento),
        lugar=e.lugar,
        empresa=e.empresa,
        sistema_gestion=e.sistema_gestion,
        tipo_reporte=e.tipo_reporte,
        codigo_acto_condicion=e.codigo_acto_condicion,
        acto_condicion=e.acto_condicion,
        dano_a=e.dano_a,
        descripcion=e.descripcion,
        como_actue=e.como_actue,
        por_que_1=e.por_que_1,
        por_que_2=e.por_que_2,
        por_que_3=e.por_que_3,
        por_que_4=e.por_que_4,
        por_que_5=e.por_que_5,
        accion_correctiva=e.accion_correctiva,
        estado=e.estado,
        registrado_por_dni=e.registrado_por_dni,
        registrado_por=e.registrado_por,
        fecha_registro=_iso(e.fecha_registro),
        created_at=_iso(e.created_at),
        updated_at=_iso(e.updated_at),
    )


def _parent_link_key(parent: SeguimientoInspeccionSsoma) -> str:
    """Return the key used to link children to this parent."""
    return parent.legacy_id if parent.legacy_id else str(parent.id)


class ServicioInspeccionSsoma:
    """Servicio para inspecciones SSOMA, seguimientos y reportes acto/condicion."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ── Catalogo actos/condiciones ──────────────────────────────────────

    async def listar_actos_condicion(self) -> list[ActoCondicionInseguroDto]:
        """Listar catalogo de actos/condiciones inseguras."""
        resultado = await self.db.execute(select(ListaActoCondicionInseguro))
        entidades = list(resultado.scalars().all())
        logger.info("actos_condicion_listados", total=len(entidades))
        return [
            ActoCondicionInseguroDto(
                id=e.id,
                codigo=e.codigo,
                acto_condicion=e.acto_condicion,
                categoria=e.categoria,
            )
            for e in entidades
        ]

    # ── Inspecciones SSOMA ──────────────────────────────────────────────

    async def listar_inspecciones(
        self,
        *,
        pagina: int = 1,
        limite: int = 20,
        tipo_inspeccion: str | None = None,
        nivel_riesgo: str | None = None,
        estado: str | None = None,
    ) -> tuple[list[InspeccionSsomaListaDto], int]:
        """Listar inspecciones con filtros y paginación."""
        consulta = select(SeguimientoInspeccionSsoma)

        if tipo_inspeccion:
            consulta = consulta.where(
                SeguimientoInspeccionSsoma.tipo_inspeccion == tipo_inspeccion
            )
        if nivel_riesgo:
            consulta = consulta.where(
                SeguimientoInspeccionSsoma.nivel_riesgo == nivel_riesgo
            )
        if estado:
            consulta = consulta.where(SeguimientoInspeccionSsoma.estado == estado)

        consulta_conteo = select(func.count()).select_from(consulta.subquery())
        resultado_conteo = await self.db.execute(consulta_conteo)
        total: int = resultado_conteo.scalar_one()

        consulta = consulta.order_by(SeguimientoInspeccionSsoma.id.desc())
        offset = (pagina - 1) * limite
        consulta = consulta.offset(offset).limit(limite)

        resultado = await self.db.execute(consulta)
        entidades = list(resultado.scalars().all())

        logger.info("inspecciones_ssoma_listadas", total=total)
        return [_a_inspeccion_lista_dto(e) for e in entidades], total

    async def obtener_inspeccion(self, inspeccion_id: int) -> InspeccionSsomaDetalleDto:
        """Obtener inspección SSOMA con seguimientos hijos."""
        resultado = await self.db.execute(
            select(SeguimientoInspeccionSsoma).where(
                SeguimientoInspeccionSsoma.id == inspeccion_id
            )
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("SeguimientoInspeccionSsoma", str(inspeccion_id))

        # Fetch child seguimientos
        link_key = _parent_link_key(entidad)
        resultado_segs = await self.db.execute(
            select(SeguimientoInspeccion).where(
                SeguimientoInspeccion.seguimiento_ssoma_legacy_id == link_key
            )
        )
        segs = list(resultado_segs.scalars().all())
        seguimientos_dto = [_a_seguimiento_dto(s) for s in segs]

        return _a_inspeccion_detalle_dto(entidad, seguimientos_dto)

    async def crear_inspeccion(
        self, datos: InspeccionSsomaCrear
    ) -> InspeccionSsomaDetalleDto:
        """Crear una nueva inspección SSOMA."""
        entidad = SeguimientoInspeccionSsoma(
            fecha_hallazgo=(
                datetime.fromisoformat(datos.fecha_hallazgo)
                if datos.fecha_hallazgo
                else None
            ),
            lugar_hallazgo=datos.lugar_hallazgo,
            tipo_inspeccion=datos.tipo_inspeccion,
            inspector_dni=datos.inspector_dni,
            inspector=datos.inspector,
            descripcion_hallazgo=datos.descripcion_hallazgo,
            link_foto=datos.link_foto,
            nivel_riesgo=datos.nivel_riesgo,
            causas_hallazgo=datos.causas_hallazgo,
            responsable_subsanacion=datos.responsable_subsanacion,
            fecha_subsanacion=(
                date.fromisoformat(datos.fecha_subsanacion)
                if datos.fecha_subsanacion
                else None
            ),
            estado=datos.estado,
        )
        self.db.add(entidad)
        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("inspeccion_ssoma_creada", id=entidad.id)
        return _a_inspeccion_detalle_dto(entidad, [])

    async def actualizar_inspeccion(
        self, inspeccion_id: int, datos: InspeccionSsomaActualizar
    ) -> InspeccionSsomaDetalleDto:
        """Actualizar una inspección SSOMA."""
        resultado = await self.db.execute(
            select(SeguimientoInspeccionSsoma).where(
                SeguimientoInspeccionSsoma.id == inspeccion_id
            )
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("SeguimientoInspeccionSsoma", str(inspeccion_id))

        campos = datos.model_dump(exclude_unset=True)
        for campo, valor in campos.items():
            if campo == "fecha_hallazgo" and valor is not None:
                valor = datetime.fromisoformat(valor)
            elif campo == "fecha_subsanacion" and valor is not None:
                valor = date.fromisoformat(valor)
            setattr(entidad, campo, valor)

        await self.db.commit()
        await self.db.refresh(entidad)

        # Re-fetch seguimientos
        link_key = _parent_link_key(entidad)
        resultado_segs = await self.db.execute(
            select(SeguimientoInspeccion).where(
                SeguimientoInspeccion.seguimiento_ssoma_legacy_id == link_key
            )
        )
        segs = list(resultado_segs.scalars().all())
        seguimientos_dto = [_a_seguimiento_dto(s) for s in segs]

        logger.info("inspeccion_ssoma_actualizada", id=inspeccion_id)
        return _a_inspeccion_detalle_dto(entidad, seguimientos_dto)

    async def eliminar_inspeccion(self, inspeccion_id: int) -> None:
        """Eliminar inspección SSOMA con cascade a seguimientos hijos."""
        resultado = await self.db.execute(
            select(SeguimientoInspeccionSsoma).where(
                SeguimientoInspeccionSsoma.id == inspeccion_id
            )
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("SeguimientoInspeccionSsoma", str(inspeccion_id))

        # Delete child seguimientos first
        link_key = _parent_link_key(entidad)
        await self.db.execute(
            delete(SeguimientoInspeccion).where(
                SeguimientoInspeccion.seguimiento_ssoma_legacy_id == link_key
            )
        )

        await self.db.delete(entidad)
        await self.db.commit()
        logger.info("inspeccion_ssoma_eliminada", id=inspeccion_id)

    # ── Seguimientos (child of inspection) ──────────────────────────────

    async def agregar_seguimiento(
        self, inspeccion_id: int, datos: SeguimientoInspeccionCrear
    ) -> SeguimientoInspeccionDto:
        """Agregar un seguimiento a una inspección SSOMA."""
        # Verify parent exists
        resultado = await self.db.execute(
            select(SeguimientoInspeccionSsoma).where(
                SeguimientoInspeccionSsoma.id == inspeccion_id
            )
        )
        parent = resultado.scalars().first()
        if not parent:
            raise NoEncontradoError("SeguimientoInspeccionSsoma", str(inspeccion_id))

        link_key = _parent_link_key(parent)
        entidad = SeguimientoInspeccion(
            fecha=(datetime.fromisoformat(datos.fecha) if datos.fecha else None),
            inspector_dni=datos.inspector_dni,
            inspector=datos.inspector,
            descripcion_inspeccion=datos.descripcion_inspeccion,
            link_evidencia=datos.link_evidencia,
            fecha_proxima_inspeccion=(
                date.fromisoformat(datos.fecha_proxima_inspeccion)
                if datos.fecha_proxima_inspeccion
                else None
            ),
            avance_estimado=datos.avance_estimado,
            seguimiento_ssoma_legacy_id=link_key,
        )
        self.db.add(entidad)
        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("seguimiento_agregado", id=entidad.id, inspeccion_id=inspeccion_id)
        return _a_seguimiento_dto(entidad)

    async def eliminar_seguimiento(self, seg_id: int) -> None:
        """Eliminar un seguimiento individual."""
        resultado = await self.db.execute(
            select(SeguimientoInspeccion).where(SeguimientoInspeccion.id == seg_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("SeguimientoInspeccion", str(seg_id))

        await self.db.delete(entidad)
        await self.db.commit()
        logger.info("seguimiento_eliminado", id=seg_id)

    # ── Reportes acto/condicion ─────────────────────────────────────────

    async def listar_reportes(
        self,
        *,
        pagina: int = 1,
        limite: int = 20,
        tipo_reporte: str | None = None,
        estado: str | None = None,
    ) -> tuple[list[ReporteActoCondicionListaDto], int]:
        """Listar reportes acto/condicion con filtros y paginación."""
        consulta = select(ReporteActoCondicion)

        if tipo_reporte:
            consulta = consulta.where(ReporteActoCondicion.tipo_reporte == tipo_reporte)
        if estado:
            consulta = consulta.where(ReporteActoCondicion.estado == estado)

        consulta_conteo = select(func.count()).select_from(consulta.subquery())
        resultado_conteo = await self.db.execute(consulta_conteo)
        total: int = resultado_conteo.scalar_one()

        consulta = consulta.order_by(ReporteActoCondicion.id.desc())
        offset = (pagina - 1) * limite
        consulta = consulta.offset(offset).limit(limite)

        resultado = await self.db.execute(consulta)
        entidades = list(resultado.scalars().all())

        logger.info("reportes_acto_condicion_listados", total=total)
        return [_a_reporte_lista_dto(e) for e in entidades], total

    async def obtener_reporte(self, reporte_id: int) -> ReporteActoCondicionDetalleDto:
        """Obtener reporte acto/condicion por ID."""
        resultado = await self.db.execute(
            select(ReporteActoCondicion).where(ReporteActoCondicion.id == reporte_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("ReporteActoCondicion", str(reporte_id))
        return _a_reporte_detalle_dto(entidad)

    async def crear_reporte(
        self, datos: ReporteActoCondicionCrear
    ) -> ReporteActoCondicionDetalleDto:
        """Crear un nuevo reporte acto/condicion."""
        entidad = ReporteActoCondicion(
            reportado_por_dni=datos.reportado_por_dni,
            reportado_por_nombre=datos.reportado_por_nombre,
            cargo=datos.cargo,
            empresa_reportante=datos.empresa_reportante,
            fecha_evento=(
                datetime.fromisoformat(datos.fecha_evento)
                if datos.fecha_evento
                else None
            ),
            lugar=datos.lugar,
            empresa=datos.empresa,
            sistema_gestion=datos.sistema_gestion,
            tipo_reporte=datos.tipo_reporte,
            codigo_acto_condicion=datos.codigo_acto_condicion,
            acto_condicion=datos.acto_condicion,
            dano_a=datos.dano_a,
            descripcion=datos.descripcion,
            como_actue=datos.como_actue,
            por_que_1=datos.por_que_1,
            por_que_2=datos.por_que_2,
            por_que_3=datos.por_que_3,
            por_que_4=datos.por_que_4,
            por_que_5=datos.por_que_5,
            accion_correctiva=datos.accion_correctiva,
            estado=datos.estado,
        )
        self.db.add(entidad)
        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("reporte_acto_condicion_creado", id=entidad.id)
        return _a_reporte_detalle_dto(entidad)

    async def actualizar_reporte(
        self, reporte_id: int, datos: ReporteActoCondicionActualizar
    ) -> ReporteActoCondicionDetalleDto:
        """Actualizar un reporte acto/condicion."""
        resultado = await self.db.execute(
            select(ReporteActoCondicion).where(ReporteActoCondicion.id == reporte_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("ReporteActoCondicion", str(reporte_id))

        campos = datos.model_dump(exclude_unset=True)
        for campo, valor in campos.items():
            if campo == "fecha_evento" and valor is not None:
                valor = datetime.fromisoformat(valor)
            setattr(entidad, campo, valor)

        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("reporte_acto_condicion_actualizado", id=reporte_id)
        return _a_reporte_detalle_dto(entidad)

    async def eliminar_reporte(self, reporte_id: int) -> None:
        """Eliminar un reporte acto/condicion."""
        resultado = await self.db.execute(
            select(ReporteActoCondicion).where(ReporteActoCondicion.id == reporte_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("ReporteActoCondicion", str(reporte_id))

        await self.db.delete(entidad)
        await self.db.commit()
        logger.info("reporte_acto_condicion_eliminado", id=reporte_id)
