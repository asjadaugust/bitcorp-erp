"""Servicio para valorizaciones de equipo.
"""

from datetime import date, datetime
from typing import Any

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.core.excepciones import (
    ConflictoError,
    NoEncontradoError,
    ValidacionError,
)
from app.esquemas.valorizacion import (
    DocumentoPagoActualizar,
    DocumentoPagoCrear,
    DocumentoPagoDto,
    ValorizacionActualizar,
    ValorizacionCrear,
    ValorizacionDetalleDto,
    ValorizacionListaDto,
)
from app.modelos.equipo import (
    ValorizacionDocumentoPago,
    ValorizacionEquipo,
)

logger = obtener_logger(__name__)


# ─── Sort fields ──────────────────────────────────────────────────────────

_CAMPOS_ORDENAMIENTO: dict[str, str] = {
    "periodo": "periodo",
    "fecha_inicio": "fecha_inicio",
    "fecha_fin": "fecha_fin",
    "estado": "estado",
    "created_at": "created_at",
    "total_valorizado": "total_valorizado",
    "total_con_igv": "total_con_igv",
    "numero_valorizacion": "numero_valorizacion",
}


# ─── DTO converters ──────────────────────────────────────────────────────


def _num(val: float | None) -> float | None:
    return float(val) if val is not None else None


def _a_lista_dto(v: ValorizacionEquipo) -> ValorizacionListaDto:
    return ValorizacionListaDto(
        id=v.id,
        equipo_id=v.equipo_id,
        contrato_id=v.contrato_id,
        proyecto_id=v.proyecto_id,
        periodo=v.periodo,
        fecha_inicio=v.fecha_inicio,
        fecha_fin=v.fecha_fin,
        dias_trabajados=v.dias_trabajados,
        horas_trabajadas=_num(v.horas_trabajadas),
        costo_base=_num(v.costo_base),
        total_valorizado=_num(v.total_valorizado),
        total_con_igv=float(v.total_con_igv),
        numero_valorizacion=v.numero_valorizacion,
        estado=v.estado,
        conformidad_proveedor=v.conformidad_proveedor,
        created_at=v.created_at,
        updated_at=v.updated_at,
        tenant_id=v.tenant_id,
        codigo_equipo=(
            v.equipo_rel.codigo_equipo if v.equipo_rel else None
        ),
        equipo_marca=v.equipo_rel.marca if v.equipo_rel else None,
        equipo_modelo=v.equipo_rel.modelo if v.equipo_rel else None,
        numero_contrato=(
            v.contrato_rel.numero_contrato if v.contrato_rel else None
        ),
    )


def _a_detalle_dto(v: ValorizacionEquipo) -> ValorizacionDetalleDto:
    return ValorizacionDetalleDto(
        id=v.id,
        equipo_id=v.equipo_id,
        contrato_id=v.contrato_id,
        proyecto_id=v.proyecto_id,
        periodo=v.periodo,
        fecha_inicio=v.fecha_inicio,
        fecha_fin=v.fecha_fin,
        dias_trabajados=v.dias_trabajados,
        horas_trabajadas=_num(v.horas_trabajadas),
        costo_base=_num(v.costo_base),
        total_valorizado=_num(v.total_valorizado),
        total_con_igv=float(v.total_con_igv),
        numero_valorizacion=v.numero_valorizacion,
        estado=v.estado,
        conformidad_proveedor=v.conformidad_proveedor,
        created_at=v.created_at,
        updated_at=v.updated_at,
        tenant_id=v.tenant_id,
        codigo_equipo=(
            v.equipo_rel.codigo_equipo if v.equipo_rel else None
        ),
        equipo_marca=v.equipo_rel.marca if v.equipo_rel else None,
        equipo_modelo=v.equipo_rel.modelo if v.equipo_rel else None,
        numero_contrato=(
            v.contrato_rel.numero_contrato if v.contrato_rel else None
        ),
        # Detail-only
        legacy_id=v.legacy_id,
        combustible_consumido=_num(v.combustible_consumido),
        costo_combustible=_num(v.costo_combustible),
        cargos_adicionales=_num(v.cargos_adicionales),
        tipo_cambio=_num(v.tipo_cambio),
        descuento_porcentaje=float(v.descuento_porcentaje),
        descuento_monto=float(v.descuento_monto),
        igv_porcentaje=float(v.igv_porcentaje),
        igv_monto=float(v.igv_monto),
        importe_manipuleo=_num(v.importe_manipuleo),
        importe_gasto_obra=_num(v.importe_gasto_obra),
        importe_adelanto=_num(v.importe_adelanto),
        importe_exceso_combustible=_num(v.importe_exceso_combustible),
        observaciones=v.observaciones,
        creado_por=v.creado_por,
        aprobado_por=v.aprobado_por,
        aprobado_en=v.aprobado_en,
        validado_por=v.validado_por,
        validado_en=v.validado_en,
        conformidad_fecha=v.conformidad_fecha,
        conformidad_observaciones=v.conformidad_observaciones,
    )


def _doc_a_dto(d: ValorizacionDocumentoPago) -> DocumentoPagoDto:
    return DocumentoPagoDto(
        id=d.id,
        valorizacion_id=d.valorizacion_id,
        tipo_documento=d.tipo_documento,
        numero=d.numero,
        fecha_documento=d.fecha_documento,
        archivo_url=d.archivo_url,
        estado=d.estado,
        observaciones=d.observaciones,
    )


class ServicioValorizacion:
    """Servicio para gestión de valorizaciones de equipo."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ─── Helpers ──────────────────────────────────────────────────────

    async def _recargar(self, val_id: int) -> ValorizacionEquipo:
        """Re-query valuation with eager relationships."""
        result = await self.db.execute(
            select(ValorizacionEquipo).where(ValorizacionEquipo.id == val_id)
        )
        v = result.scalars().unique().first()
        if not v:
            raise NoEncontradoError("Valorizacion", val_id)
        return v

    async def _obtener_o_404(
        self, tenant_id: int, val_id: int
    ) -> ValorizacionEquipo:
        """Get valuation or raise 404."""
        result = await self.db.execute(
            select(ValorizacionEquipo).where(
                ValorizacionEquipo.id == val_id,
                ValorizacionEquipo.tenant_id == tenant_id,
            )
        )
        v = result.scalars().unique().first()
        if not v:
            raise NoEncontradoError("Valorizacion", val_id)
        return v

    # ─── Listar ───────────────────────────────────────────────────────

    async def listar(
        self,
        tenant_id: int,
        *,
        estado: str | None = None,
        equipo_id: int | None = None,
        contrato_id: int | None = None,
        proyecto_id: int | None = None,
        periodo: str | None = None,
        search: str | None = None,
        sort_by: str = "created_at",
        sort_order: str = "DESC",
        page: int = 1,
        limit: int = 10,
    ) -> tuple[list[ValorizacionListaDto], int]:
        """Listar valorizaciones con filtros y paginación."""
        stmt = select(ValorizacionEquipo).where(
            ValorizacionEquipo.tenant_id == tenant_id
        )

        if estado:
            stmt = stmt.where(ValorizacionEquipo.estado == estado)
        if equipo_id:
            stmt = stmt.where(ValorizacionEquipo.equipo_id == equipo_id)
        if contrato_id:
            stmt = stmt.where(ValorizacionEquipo.contrato_id == contrato_id)
        if proyecto_id:
            stmt = stmt.where(ValorizacionEquipo.proyecto_id == proyecto_id)
        if periodo:
            stmt = stmt.where(ValorizacionEquipo.periodo == periodo)
        if search:
            patron = f"%{search}%"
            stmt = stmt.where(
                or_(
                    ValorizacionEquipo.numero_valorizacion.ilike(patron),
                    ValorizacionEquipo.observaciones.ilike(patron),
                )
            )

        # Count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar_one()

        # Sort
        col_name = _CAMPOS_ORDENAMIENTO.get(sort_by, "created_at")
        col = getattr(ValorizacionEquipo, col_name, ValorizacionEquipo.created_at)
        order = col.desc() if sort_order.upper() == "DESC" else col.asc()
        stmt = stmt.order_by(order)

        # Paginate
        offset = (page - 1) * limit
        stmt = stmt.offset(offset).limit(limit)

        result = await self.db.execute(stmt)
        items = list(result.scalars().unique().all())

        logger.info("valorizaciones_listadas", total=total, page=page)
        return [_a_lista_dto(v) for v in items], total

    # ─── Obtener por ID ───────────────────────────────────────────────

    async def obtener_por_id(
        self, tenant_id: int, val_id: int
    ) -> ValorizacionDetalleDto:
        """Obtener valorización por ID."""
        v = await self._obtener_o_404(tenant_id, val_id)
        return _a_detalle_dto(v)

    # ─── Crear ────────────────────────────────────────────────────────

    async def crear(
        self,
        tenant_id: int,
        datos: ValorizacionCrear,
        creado_por: int,
    ) -> ValorizacionDetalleDto:
        """Crear nueva valorización."""
        if datos.fecha_fin <= datos.fecha_inicio:
            raise ValidacionError("fecha_fin debe ser posterior a fecha_inicio")

        val = ValorizacionEquipo(
            equipo_id=datos.equipo_id,
            contrato_id=datos.contrato_id,
            proyecto_id=datos.proyecto_id,
            periodo=datos.periodo,
            fecha_inicio=datos.fecha_inicio,
            fecha_fin=datos.fecha_fin,
            dias_trabajados=datos.dias_trabajados,
            horas_trabajadas=datos.horas_trabajadas,
            combustible_consumido=datos.combustible_consumido,
            costo_base=datos.costo_base,
            costo_combustible=datos.costo_combustible,
            cargos_adicionales=datos.cargos_adicionales,
            total_valorizado=datos.total_valorizado,
            numero_valorizacion=datos.numero_valorizacion,
            tipo_cambio=datos.tipo_cambio,
            descuento_porcentaje=datos.descuento_porcentaje,
            descuento_monto=datos.descuento_monto,
            igv_porcentaje=datos.igv_porcentaje,
            importe_manipuleo=datos.importe_manipuleo,
            importe_gasto_obra=datos.importe_gasto_obra,
            importe_adelanto=datos.importe_adelanto,
            importe_exceso_combustible=datos.importe_exceso_combustible,
            observaciones=datos.observaciones,
            estado=datos.estado,
            creado_por=creado_por,
            tenant_id=tenant_id,
        )

        # Auto-compute totals if not provided
        self._recalcular_totales(val)

        self.db.add(val)
        await self.db.flush()
        await self.db.commit()

        val = await self._recargar(val.id)
        logger.info("valorizacion_creada", id=val.id)
        return _a_detalle_dto(val)

    # ─── Actualizar ───────────────────────────────────────────────────

    async def actualizar(
        self,
        tenant_id: int,
        val_id: int,
        datos: ValorizacionActualizar,
    ) -> ValorizacionDetalleDto:
        """Actualizar valorización existente."""
        val = await self._obtener_o_404(tenant_id, val_id)

        campos = datos.model_dump(exclude_unset=True)
        for campo, valor in campos.items():
            setattr(val, campo, valor)

        self._recalcular_totales(val)
        await self.db.commit()

        val = await self._recargar(val_id)
        logger.info("valorizacion_actualizada", id=val_id)
        return _a_detalle_dto(val)

    # ─── Eliminar ────────────────────────────────────────────────────

    async def eliminar(self, tenant_id: int, val_id: int) -> None:
        """Eliminar valorización."""
        val = await self._obtener_o_404(tenant_id, val_id)
        await self.db.delete(val)
        await self.db.commit()
        logger.info("valorizacion_eliminada", id=val_id)

    # ─── Workflow transitions ─────────────────────────────────────────

    async def enviar_borrador(
        self, tenant_id: int, val_id: int
    ) -> ValorizacionDetalleDto:
        """BORRADOR → PENDIENTE."""
        val = await self._obtener_o_404(tenant_id, val_id)
        if val.estado != "BORRADOR":
            raise ConflictoError(
                f"Solo se puede enviar un borrador (actual: {val.estado})"
            )
        val.estado = "PENDIENTE"
        await self.db.commit()
        val = await self._recargar(val_id)
        logger.info("valorizacion_enviada", id=val_id)
        return _a_detalle_dto(val)

    async def enviar_a_revision(
        self, tenant_id: int, val_id: int
    ) -> ValorizacionDetalleDto:
        """PENDIENTE → EN_REVISION."""
        val = await self._obtener_o_404(tenant_id, val_id)
        if val.estado != "PENDIENTE":
            raise ConflictoError(
                f"Solo se puede enviar a revisión desde PENDIENTE (actual: {val.estado})"
            )
        val.estado = "EN_REVISION"
        await self.db.commit()
        val = await self._recargar(val_id)
        logger.info("valorizacion_en_revision", id=val_id)
        return _a_detalle_dto(val)

    async def validar(
        self, tenant_id: int, val_id: int, validado_por: int
    ) -> ValorizacionDetalleDto:
        """EN_REVISION → VALIDADO."""
        val = await self._obtener_o_404(tenant_id, val_id)
        if val.estado != "EN_REVISION":
            raise ConflictoError(
                f"Solo se puede validar desde EN_REVISION (actual: {val.estado})"
            )
        val.estado = "VALIDADO"
        val.validado_por = validado_por
        val.validado_en = datetime.now()  # noqa: DTZ005
        await self.db.commit()
        val = await self._recargar(val_id)
        logger.info("valorizacion_validada", id=val_id)
        return _a_detalle_dto(val)

    async def aprobar(
        self, tenant_id: int, val_id: int, aprobado_por: int
    ) -> ValorizacionDetalleDto:
        """VALIDADO → APROBADO."""
        val = await self._obtener_o_404(tenant_id, val_id)
        if val.estado != "VALIDADO":
            raise ConflictoError(
                f"Solo se puede aprobar desde VALIDADO (actual: {val.estado})"
            )
        val.estado = "APROBADO"
        val.aprobado_por = aprobado_por
        val.aprobado_en = datetime.now()  # noqa: DTZ005
        await self.db.commit()
        val = await self._recargar(val_id)
        logger.info("valorizacion_aprobada", id=val_id)
        return _a_detalle_dto(val)

    async def rechazar(
        self, tenant_id: int, val_id: int, reason: str
    ) -> ValorizacionDetalleDto:
        """Any reviewable → RECHAZADO."""
        val = await self._obtener_o_404(tenant_id, val_id)
        estados_rechazables = {
            "PENDIENTE", "EN_REVISION", "VALIDADO",
        }
        if val.estado not in estados_rechazables:
            raise ConflictoError(
                f"No se puede rechazar desde estado {val.estado}"
            )
        val.estado = "RECHAZADO"
        val.observaciones = reason
        await self.db.commit()
        val = await self._recargar(val_id)
        logger.info("valorizacion_rechazada", id=val_id)
        return _a_detalle_dto(val)

    async def reabrir(
        self, tenant_id: int, val_id: int
    ) -> ValorizacionDetalleDto:
        """RECHAZADO → BORRADOR."""
        val = await self._obtener_o_404(tenant_id, val_id)
        if val.estado != "RECHAZADO":
            raise ConflictoError(
                f"Solo se puede reabrir desde RECHAZADO (actual: {val.estado})"
            )
        val.estado = "BORRADOR"
        val.observaciones = None
        await self.db.commit()
        val = await self._recargar(val_id)
        logger.info("valorizacion_reabierta", id=val_id)
        return _a_detalle_dto(val)

    async def marcar_pagado(
        self, tenant_id: int, val_id: int
    ) -> ValorizacionDetalleDto:
        """APROBADO → PAGADO."""
        val = await self._obtener_o_404(tenant_id, val_id)
        if val.estado != "APROBADO":
            raise ConflictoError(
                f"Solo se puede marcar como pagado desde APROBADO (actual: {val.estado})"
            )
        val.estado = "PAGADO"
        await self.db.commit()
        val = await self._recargar(val_id)
        logger.info("valorizacion_pagada", id=val_id)
        return _a_detalle_dto(val)

    # ─── Conformidad del proveedor ────────────────────────────────────

    async def registrar_conformidad(
        self,
        tenant_id: int,
        val_id: int,
        fecha: date | None = None,
        observaciones: str | None = None,
    ) -> ValorizacionDetalleDto:
        """Registrar conformidad del proveedor."""
        val = await self._obtener_o_404(tenant_id, val_id)
        val.conformidad_proveedor = True
        val.conformidad_fecha = datetime.now()  # noqa: DTZ005
        if fecha:
            val.conformidad_fecha = datetime.combine(fecha, datetime.min.time())
        if observaciones:
            val.conformidad_observaciones = observaciones
        await self.db.commit()
        val = await self._recargar(val_id)
        logger.info("conformidad_registrada", id=val_id)
        return _a_detalle_dto(val)

    # ─── Recalcular totales ──────────────────────────────────────────

    def _recalcular_totales(self, val: ValorizacionEquipo) -> None:
        """Recalcular totales de la valorización.

        total_valorizado = costo_base + costo_combustible + cargos_adicionales
                         + importe_manipuleo + importe_gasto_obra
                         + importe_adelanto + importe_exceso_combustible
                         - descuento_monto
        igv_monto = total_valorizado * igv_porcentaje / 100
        total_con_igv = total_valorizado + igv_monto
        """
        base = float(val.costo_base or 0)
        comb = float(val.costo_combustible or 0)
        cargos = float(val.cargos_adicionales or 0)
        manipuleo = float(val.importe_manipuleo or 0)
        gasto = float(val.importe_gasto_obra or 0)
        adelanto = float(val.importe_adelanto or 0)
        exceso = float(val.importe_exceso_combustible or 0)
        desc = float(val.descuento_monto or 0)

        total = base + comb + cargos + manipuleo + gasto + adelanto + exceso - desc
        val.total_valorizado = total

        igv_pct = float(val.igv_porcentaje or 18)
        igv = round(total * igv_pct / 100, 2)
        val.igv_monto = igv
        val.total_con_igv = round(total + igv, 2)

    async def recalcular(
        self, tenant_id: int, val_id: int
    ) -> ValorizacionDetalleDto:
        """Recalcular totales de una valorización."""
        val = await self._obtener_o_404(tenant_id, val_id)
        self._recalcular_totales(val)
        await self.db.commit()
        val = await self._recargar(val_id)
        logger.info("valorizacion_recalculada", id=val_id)
        return _a_detalle_dto(val)

    # ─── Documentos de pago ──────────────────────────────────────────

    async def listar_documentos(
        self, tenant_id: int, val_id: int
    ) -> list[DocumentoPagoDto]:
        """Listar documentos de pago de una valorización."""
        await self._obtener_o_404(tenant_id, val_id)
        result = await self.db.execute(
            select(ValorizacionDocumentoPago)
            .where(ValorizacionDocumentoPago.valorizacion_id == val_id)
            .order_by(ValorizacionDocumentoPago.id.asc())
        )
        return [_doc_a_dto(d) for d in result.scalars().all()]

    async def crear_documento(
        self, tenant_id: int, val_id: int, datos: DocumentoPagoCrear
    ) -> DocumentoPagoDto:
        """Crear documento de pago."""
        await self._obtener_o_404(tenant_id, val_id)
        doc = ValorizacionDocumentoPago(
            valorizacion_id=val_id,
            tipo_documento=datos.tipo_documento,
            numero=datos.numero,
            fecha_documento=datos.fecha_documento,
            archivo_url=datos.archivo_url,
            estado=datos.estado,
            observaciones=datos.observaciones,
        )
        self.db.add(doc)
        await self.db.commit()
        await self.db.refresh(doc)
        logger.info("documento_pago_creado", id=doc.id, val_id=val_id)
        return _doc_a_dto(doc)

    async def actualizar_documento(
        self, tenant_id: int, doc_id: int, datos: DocumentoPagoActualizar
    ) -> DocumentoPagoDto:
        """Actualizar documento de pago."""
        result = await self.db.execute(
            select(ValorizacionDocumentoPago)
            .join(
                ValorizacionEquipo,
                ValorizacionDocumentoPago.valorizacion_id == ValorizacionEquipo.id,
            )
            .where(
                ValorizacionDocumentoPago.id == doc_id,
                ValorizacionEquipo.tenant_id == tenant_id,
            )
        )
        doc = result.scalars().first()
        if not doc:
            raise NoEncontradoError("DocumentoPago", doc_id)

        campos = datos.model_dump(exclude_unset=True)
        for campo, valor in campos.items():
            setattr(doc, campo, valor)

        await self.db.commit()
        await self.db.refresh(doc)
        logger.info("documento_pago_actualizado", id=doc_id)
        return _doc_a_dto(doc)

    async def verificar_documentos_completos(
        self, tenant_id: int, val_id: int
    ) -> dict[str, Any]:
        """Verificar si todos los documentos están completos."""
        await self._obtener_o_404(tenant_id, val_id)
        result = await self.db.execute(
            select(ValorizacionDocumentoPago)
            .where(ValorizacionDocumentoPago.valorizacion_id == val_id)
        )
        docs = list(result.scalars().all())
        all_complete = all(d.estado != "PENDIENTE" for d in docs)
        return {"complete": all_complete and len(docs) > 0, "total": len(docs)}
