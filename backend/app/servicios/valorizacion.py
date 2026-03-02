"""Servicio para valorizaciones de equipo.
"""

import calendar
from datetime import date, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.core.excepciones import (
    ConflictoError,
    NoEncontradoError,
    ReglaDeNegocioError,
    ValidacionError,
)
from app.esquemas.valorizacion import (
    AnalisisCombustibleDto,
    CombustibleDetalleDto,
    CombustibleDetalleItemDto,
    ContratoResumenDto,
    DocumentoPagoActualizar,
    DocumentoPagoCrear,
    DocumentoPagoDto,
    EquipoResumenDto,
    ParteDetalleDto,
    ProveedorResumenDto,
    ResumenAcumuladoItemDto,
    ValorizacionActualizar,
    ValorizacionCrear,
    ValorizacionDetalleDto,
    ValorizacionListaDto,
    ValorizacionResumenDto,
)
from app.modelos.equipo import (
    AdelantoAmortizacion,
    AnalisisCombustible,
    ContratoAdenda,
    Equipo,
    GastoEnObra,
    ParteDiario,
    ValeCombustible,
    ValorizacionDocumentoPago,
    ValorizacionEquipo,
)
from app.modelos.proveedores import Proveedor

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
    eq = v.equipo_rel
    ct = v.contrato_rel
    prov = ct.proveedor if ct else None
    igv = float(v.igv_monto) if v.igv_monto is not None else round(float(v.total_con_igv) - float(v.total_valorizado or 0), 2)
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
        igv_monto=igv,
        total_con_igv=float(v.total_con_igv),
        numero_valorizacion=v.numero_valorizacion,
        estado=v.estado,
        conformidad_proveedor=v.conformidad_proveedor,
        created_at=v.created_at,
        updated_at=v.updated_at,
        tenant_id=v.tenant_id,
        codigo_equipo=eq.codigo_equipo if eq else None,
        equipo_marca=eq.marca if eq else None,
        equipo_modelo=eq.modelo if eq else None,
        numero_contrato=ct.numero_contrato if ct else None,
        equipo=EquipoResumenDto(
            id=eq.id,
            codigo=eq.codigo_equipo,
            nombre=eq.tipo_equipo_rel.nombre if (eq and eq.tipo_equipo_rel) else None,
            marca=eq.marca,
            modelo=eq.modelo,
        ) if eq else None,
        contrato=ContratoResumenDto(
            id=ct.id,
            codigo=ct.numero_contrato,
            proveedor=ProveedorResumenDto(
                id=prov.id,
                razon_social=prov.razon_social,
                ruc=prov.ruc,
            ) if prov else None,
        ) if ct else None,
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
        periodo_desde: str | None = None,
        periodo_hasta: str | None = None,
        proveedor: str | None = None,
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
        if periodo_desde:
            stmt = stmt.where(ValorizacionEquipo.periodo >= periodo_desde)
        if periodo_hasta:
            stmt = stmt.where(ValorizacionEquipo.periodo <= periodo_hasta)
        if proveedor:
            patron = f"%{proveedor}%"
            stmt = stmt.join(
                ContratoAdenda,
                ValorizacionEquipo.contrato_id == ContratoAdenda.id,
                isouter=True,
            ).join(
                Proveedor,
                ContratoAdenda.proveedor_id == Proveedor.id,
                isouter=True,
            ).where(
                or_(
                    Proveedor.razon_social.ilike(patron),
                    Proveedor.ruc.ilike(patron),
                )
            )
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

        Legacy formula (correct):
          ValorizaciónBruta = costo_base (= cantidad × tarifa)
          TotalDescuento = combustible + manipuleo + gasto_obra + adelanto + exceso
          ValorizaciónNeta = ValorizaciónBruta − TotalDescuento
        """
        base = float(val.costo_base or 0)
        comb = float(val.costo_combustible or 0)
        manipuleo = float(val.importe_manipuleo or 0)
        gasto = float(val.importe_gasto_obra or 0)
        adelanto = float(val.importe_adelanto or 0)
        exceso = float(val.importe_exceso_combustible or 0)

        total_descuento = comb + manipuleo + gasto + adelanto + exceso
        val.descuento_monto = round(total_descuento, 2)
        total = round(base - total_descuento, 2)
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

    # ─── Valorizar (calculation engine) ──────────────────────────────

    async def valorizar(
        self, tenant_id: int, val_id: int
    ) -> ValorizacionDetalleDto:
        """Execute the full valuation calculation engine.

        Steps:
        1. Load context (contract, equipment)
        2. Aggregate daily reports for the period
        3. Compute 5 discount types
        4. Final calculation: base - discounts
        5. Link daily reports + fuel vouchers to this valuation
        """
        val = await self._obtener_o_404(tenant_id, val_id)
        if val.estado != "BORRADOR":
            raise ReglaDeNegocioError(
                f"Solo se puede valorizar en estado BORRADOR (actual: {val.estado})"
            )
        if not val.contrato_id:
            raise ReglaDeNegocioError("La valorización debe tener un contrato asociado")

        # ── Step 1: Load context ────────────────────────────────────
        contrato = await self._cargar_contrato(tenant_id, val.contrato_id)
        equipo = await self._cargar_equipo(val.equipo_id)

        tarifa = float(contrato.tarifa or 0)
        tipo_tarifa = (contrato.tipo_tarifa or "HORA").upper()
        minimo_por = (contrato.minimo_por or "").upper()
        cantidad_minima = float(contrato.cantidad_minima or 0)
        modalidad = (contrato.modalidad or "").upper()
        precio_manipuleo = float(contrato.precio_manipuleo or 0)
        medidor = (equipo.medidor_uso or "HOROMETRO").upper()

        es_maquina_seca = "SECA" in modalidad

        # ── Step 2: Aggregate daily reports ─────────────────────────
        reportes = await self._cargar_reportes(
            val.equipo_id, val.fecha_inicio, val.fecha_fin
        )

        total_efectiva = Decimal(0)
        total_minima = Decimal(0)
        dias_trabajados = 0

        for r in reportes:
            if medidor == "ODOMETRO":
                inicio = Decimal(str(r.odometro_inicial or 0))
                final = Decimal(str(r.odometro_final or 0))
            else:
                inicio = Decimal(str(r.horometro_inicial or 0))
                final = Decimal(str(r.horometro_final or 0))

            diferencia = max(Decimal(0), final - inicio)
            precalent = Decimal(str(r.horas_precalentamiento or 0))

            if tipo_tarifa in ("HORA", "H-M"):
                cant_efectiva = max(Decimal(0), diferencia - precalent)

                if minimo_por == "MES":
                    days_in_m = calendar.monthrange(
                        r.fecha.year, r.fecha.month
                    )[1]
                    min_per_day = Decimal(str(cantidad_minima)) / days_in_m
                elif minimo_por == "SEMANA":
                    min_per_day = Decimal(str(cantidad_minima)) / 7
                elif minimo_por == "DIA":
                    min_per_day = Decimal(str(cantidad_minima))
                else:
                    min_per_day = Decimal(0)
                cant_minima = max(Decimal(0), min_per_day)
            else:
                # DIA or MES tariff: each report = 1 unit
                cant_efectiva = max(Decimal(0), Decimal(1) - precalent)
                cant_minima = Decimal(1)

            total_efectiva += cant_efectiva
            total_minima += cant_minima

            if diferencia > 0:
                dias_trabajados += 1

        cantidad_a_valorizar = float(max(total_efectiva, total_minima))
        costo_base = round(cantidad_a_valorizar * tarifa, 2)

        # ── Step 3: Compute discounts ───────────────────────────────

        # 3a. Combustible
        vales = await self._cargar_vales(
            val.equipo_id, val.fecha_inicio, val.fecha_fin
        )
        total_galones = Decimal(0)
        total_comb_importe = Decimal(0)
        for v in vales:
            gln = Decimal(str(v.cantidad_galones or 0))
            pu = Decimal(str(v.precio_unitario or 0))
            total_galones += gln
            total_comb_importe += gln * pu

        desc_combustible = 0.0 if es_maquina_seca else float(total_comb_importe)

        # 3b. Manipuleo
        desc_manipuleo = round(float(total_galones) * precio_manipuleo, 2)

        # 3c. Gasto en obra
        gasto_result = await self.db.execute(
            select(func.coalesce(func.sum(GastoEnObra.importe_sin_igv), 0)).where(
                GastoEnObra.valorizacion_id == val_id,
            )
        )
        desc_gasto_obra = float(gasto_result.scalar_one())

        # 3d. Adelantos (amortization rows linked to this valuation)
        adelanto_result = await self.db.execute(
            select(
                func.coalesce(func.sum(func.abs(AdelantoAmortizacion.monto)), 0)
            ).where(
                AdelantoAmortizacion.valorizacion_id == val_id,
                AdelantoAmortizacion.tipo_operacion == "AMORTIZACION",
            )
        )
        desc_adelanto = float(adelanto_result.scalar_one())

        # 3e. Fuel excess analysis
        total_horas_uso = float(total_efectiva)
        desc_exceso, analisis_data = self._calcular_exceso_combustible(
            medidor, total_galones, total_horas_uso, vales
        )

        # ── Step 4: Final calculation ───────────────────────────────
        total_descuento = (
            desc_combustible + desc_manipuleo + desc_gasto_obra
            + desc_adelanto + desc_exceso
        )
        total_valorizado = round(costo_base - total_descuento, 2)
        igv_pct = float(val.igv_porcentaje or 18)
        igv_monto = round(total_valorizado * igv_pct / 100, 2)
        total_con_igv = round(total_valorizado + igv_monto, 2)

        # ── Step 5: Update valuation + link records ─────────────────
        val.dias_trabajados = dias_trabajados
        val.horas_trabajadas = round(cantidad_a_valorizar, 4)
        val.costo_base = costo_base
        val.costo_combustible = round(desc_combustible, 2)
        val.combustible_consumido = round(float(total_galones), 2)
        val.importe_manipuleo = round(desc_manipuleo, 2)
        val.importe_gasto_obra = round(desc_gasto_obra, 2)
        val.importe_adelanto = round(desc_adelanto, 2)
        val.importe_exceso_combustible = round(desc_exceso, 2)
        val.descuento_monto = round(total_descuento, 2)
        val.total_valorizado = total_valorizado
        val.igv_monto = igv_monto
        val.total_con_igv = total_con_igv

        # Link daily reports
        for r in reportes:
            r.valorizacion_id = val_id

        # Link fuel vouchers
        for v in vales:
            v.valorizacion_id = val_id

        # Persist fuel analysis
        await self._guardar_analisis_combustible(val_id, analisis_data, medidor)

        await self.db.commit()
        val = await self._recargar(val_id)
        logger.info(
            "valorizacion_valorizada",
            id=val_id,
            cantidad=cantidad_a_valorizar,
            bruta=costo_base,
            desc=total_descuento,
            neta=total_valorizado,
        )
        return _a_detalle_dto(val)

    # ─── Valorizar helper methods ─────────────────────────────────────

    async def _cargar_contrato(
        self, tenant_id: int, contrato_id: int
    ) -> ContratoAdenda:
        result = await self.db.execute(
            select(ContratoAdenda).where(
                ContratoAdenda.id == contrato_id,
                ContratoAdenda.tenant_id == tenant_id,
            )
        )
        c = result.scalars().first()
        if not c:
            raise NoEncontradoError("Contrato", contrato_id)
        return c

    async def _cargar_equipo(self, equipo_id: int) -> Equipo:
        result = await self.db.execute(
            select(Equipo).where(Equipo.id == equipo_id)
        )
        e = result.scalars().first()
        if not e:
            raise NoEncontradoError("Equipo", equipo_id)
        return e

    async def _cargar_reportes(
        self, equipo_id: int, fecha_inicio: date, fecha_fin: date
    ) -> list[ParteDiario]:
        result = await self.db.execute(
            select(ParteDiario)
            .where(
                ParteDiario.equipo_id == equipo_id,
                ParteDiario.fecha >= fecha_inicio,
                ParteDiario.fecha <= fecha_fin,
            )
            .order_by(ParteDiario.fecha.asc())
        )
        return list(result.scalars().all())

    async def _cargar_vales(
        self, equipo_id: int, fecha_inicio: date, fecha_fin: date
    ) -> list[ValeCombustible]:
        result = await self.db.execute(
            select(ValeCombustible)
            .where(
                ValeCombustible.equipo_id == equipo_id,
                ValeCombustible.fecha >= fecha_inicio,
                ValeCombustible.fecha <= fecha_fin,
            )
            .order_by(ValeCombustible.fecha.asc())
        )
        return list(result.scalars().all())

    def _calcular_exceso_combustible(
        self,
        medidor: str,
        total_galones: Decimal,
        total_uso: float,
        vales: list[ValeCombustible],
    ) -> tuple[float, dict[str, Any]]:
        """Calculate fuel excess and return (importe_exceso, analysis_data)."""
        if total_uso <= 0 or float(total_galones) <= 0:
            return 0.0, {
                "consumo_combustible": float(total_galones),
                "total_uso": total_uso,
                "rendimiento": 0,
                "ratio_control": 0,
                "diferencia": 0,
                "exceso": 0,
                "precio_unitario": 0,
                "importe_exceso": 0,
            }

        gal_f = float(total_galones)
        # Average price from vouchers
        total_monto = sum(
            float(v.cantidad_galones or 0) * float(v.precio_unitario or 0)
            for v in vales
        )
        precio_prom = total_monto / gal_f if gal_f > 0 else 0

        if medidor == "ODOMETRO":
            # rendimiento = km / gal
            rendimiento = total_uso / gal_f if gal_f > 0 else 0
            # ratio_control defaults to rendimiento (user can override)
            ratio_control = rendimiento
            exceso = gal_f - (total_uso / ratio_control) if ratio_control > 0 else 0
        else:
            # HOROMETRO: rendimiento = gal / H-M
            rendimiento = gal_f / total_uso if total_uso > 0 else 0
            ratio_control = rendimiento
            exceso = gal_f - (total_uso * ratio_control) if ratio_control > 0 else 0

        exceso = max(0, exceso)
        importe_exceso = round(exceso * precio_prom, 4)

        return importe_exceso, {
            "consumo_combustible": gal_f,
            "total_uso": total_uso,
            "rendimiento": round(rendimiento, 4),
            "ratio_control": round(ratio_control, 4),
            "diferencia": round(gal_f - (total_uso * ratio_control) if medidor != "ODOMETRO" else gal_f - (total_uso / ratio_control if ratio_control > 0 else 0), 4),
            "exceso": round(exceso, 4),
            "precio_unitario": round(precio_prom, 4),
            "importe_exceso": round(importe_exceso, 4),
        }

    async def _guardar_analisis_combustible(
        self, val_id: int, data: dict[str, Any], medidor: str
    ) -> None:
        """Upsert fuel analysis for this valuation."""
        result = await self.db.execute(
            select(AnalisisCombustible).where(
                AnalisisCombustible.valorizacion_id == val_id
            )
        )
        existing = result.scalars().first()
        if existing:
            existing.consumo_combustible = data["consumo_combustible"]
            existing.tipo_horometro_odometro = medidor
            existing.total_uso = data["total_uso"]
            existing.rendimiento = data["rendimiento"]
            existing.ratio_control = data["ratio_control"]
            existing.diferencia = data["diferencia"]
            existing.exceso_combustible = data["exceso"]
            existing.precio_unitario = data["precio_unitario"]
            existing.importe_exceso = data["importe_exceso"]
        else:
            analisis = AnalisisCombustible(
                valorizacion_id=val_id,
                consumo_combustible=data["consumo_combustible"],
                tipo_horometro_odometro=medidor,
                total_uso=data["total_uso"],
                rendimiento=data["rendimiento"],
                ratio_control=data["ratio_control"],
                diferencia=data["diferencia"],
                exceso_combustible=data["exceso"],
                precio_unitario=data["precio_unitario"],
                importe_exceso=data["importe_exceso"],
            )
            self.db.add(analisis)

    # ─── Detail data endpoints ────────────────────────────────────────

    async def obtener_resumen(
        self, tenant_id: int, val_id: int
    ) -> ValorizacionResumenDto:
        """Tab 1: Full financial summary with provider/equipment/contract info."""
        val = await self._obtener_o_404(tenant_id, val_id)

        # Load related entities
        equipo = val.equipo_rel
        contrato = val.contrato_rel
        proveedor = contrato.proveedor if contrato else None

        return ValorizacionResumenDto(
            id=val.id,
            numero_valorizacion=val.numero_valorizacion,
            estado=val.estado,
            # Provider
            proveedor_ruc=proveedor.ruc if proveedor else None,
            proveedor_razon_social=proveedor.razon_social if proveedor else None,
            proveedor_direccion=proveedor.direccion if proveedor else None,
            # Equipment
            codigo_equipo=equipo.codigo_equipo if equipo else None,
            tipo_equipo=None,
            placa=equipo.placa if equipo else None,
            marca=equipo.marca if equipo else None,
            modelo=equipo.modelo if equipo else None,
            medidor_uso=equipo.medidor_uso if equipo else None,
            # Contract
            numero_contrato=contrato.numero_contrato if contrato else None,
            tipo_documento=contrato.tipo if contrato else None,
            modalidad=contrato.modalidad if contrato else None,
            tipo_tarifa=contrato.tipo_tarifa if contrato else None,
            tarifa=float(contrato.tarifa) if contrato and contrato.tarifa else None,
            minimo_por=contrato.minimo_por if contrato else None,
            cantidad_minima=float(contrato.cantidad_minima) if contrato and contrato.cantidad_minima else None,
            moneda=contrato.moneda if contrato else None,
            tipo_cambio=_num(val.tipo_cambio),
            precio_manipuleo=float(contrato.precio_manipuleo) if contrato else None,
            # Financial
            cantidad_a_valorizar=float(val.horas_trabajadas or 0),
            precio_unitario=float(contrato.tarifa) if contrato and contrato.tarifa else 0,
            valorizacion_bruta=float(val.costo_base or 0),
            descuento_combustible=float(val.costo_combustible or 0),
            descuento_manipuleo=float(val.importe_manipuleo or 0),
            descuento_gasto_obra=float(val.importe_gasto_obra or 0),
            descuento_adelanto=float(val.importe_adelanto or 0),
            descuento_exceso_combustible=float(val.importe_exceso_combustible or 0),
            total_descuento=float(val.descuento_monto or 0),
            valorizacion_neta=float(val.total_valorizado or 0),
            igv_porcentaje=float(val.igv_porcentaje),
            igv_monto=float(val.igv_monto),
            total_con_igv=float(val.total_con_igv),
            # Period
            fecha_inicio=val.fecha_inicio,
            fecha_fin=val.fecha_fin,
            periodo=val.periodo,
        )

    async def obtener_resumen_acumulado(
        self, tenant_id: int, val_id: int
    ) -> list[ResumenAcumuladoItemDto]:
        """Tab 2: All valuations for the same contract/equipment."""
        val = await self._obtener_o_404(tenant_id, val_id)
        if not val.contrato_id:
            return []

        result = await self.db.execute(
            select(ValorizacionEquipo)
            .where(
                ValorizacionEquipo.contrato_id == val.contrato_id,
                ValorizacionEquipo.equipo_id == val.equipo_id,
                ValorizacionEquipo.tenant_id == tenant_id,
            )
            .order_by(ValorizacionEquipo.fecha_inicio.asc())
        )
        vals = list(result.scalars().unique().all())

        # Derive unit and rate from contract
        contrato = val.contrato_rel
        tipo_tarifa = (contrato.tipo_tarifa or "HORA").upper() if contrato else "HORA"
        if tipo_tarifa in ("HORA", "H-M"):
            unidad = "H-M"
        elif tipo_tarifa == "DIA":
            unidad = "DÍA"
        else:
            unidad = tipo_tarifa
        tarifa = float(contrato.tarifa or 0) if contrato else 0

        return [
            ResumenAcumuladoItemDto(
                id=v.id,
                numero_valorizacion=v.numero_valorizacion,
                periodo=v.periodo,
                fecha_inicio=v.fecha_inicio,
                fecha_fin=v.fecha_fin,
                cantidad=float(v.horas_trabajadas or 0),
                unidad_medida=unidad,
                precio_unitario=tarifa,
                valorizacion_bruta=float(v.costo_base or 0),
                total_descuento=float(v.descuento_monto or 0),
                valorizacion_neta=float(v.total_valorizado or 0),
                estado=v.estado,
            )
            for v in vals
        ]

    async def obtener_partes_detalle(
        self, tenant_id: int, val_id: int
    ) -> list[ParteDetalleDto]:
        """Tab 3: Daily reports with computed columns."""
        val = await self._obtener_o_404(tenant_id, val_id)

        contrato = val.contrato_rel
        tipo_tarifa = (contrato.tipo_tarifa or "HORA").upper() if contrato else "HORA"
        minimo_por = (contrato.minimo_por or "").upper() if contrato else ""
        cantidad_minima = float(contrato.cantidad_minima or 0) if contrato else 0
        medidor = (val.equipo_rel.medidor_uso or "HOROMETRO").upper() if val.equipo_rel else "HOROMETRO"

        reportes = await self._cargar_reportes(
            val.equipo_id, val.fecha_inicio, val.fecha_fin
        )

        items = []
        for r in reportes:
            if medidor == "ODOMETRO":
                inicio = float(r.odometro_inicial or 0)
                final = float(r.odometro_final or 0)
            else:
                inicio = float(r.horometro_inicial or 0)
                final = float(r.horometro_final or 0)

            diferencia = max(0.0, final - inicio)
            precalent = float(r.horas_precalentamiento or 0)

            if tipo_tarifa in ("HORA", "H-M"):
                cant_efectiva = max(0.0, diferencia - precalent)
                if minimo_por == "MES":
                    days_in_m = calendar.monthrange(r.fecha.year, r.fecha.month)[1]
                    cant_min = cantidad_minima / days_in_m
                elif minimo_por == "SEMANA":
                    cant_min = cantidad_minima / 7
                elif minimo_por == "DIA":
                    cant_min = cantidad_minima
                else:
                    cant_min = 0.0
            else:
                cant_efectiva = max(0.0, 1.0 - precalent)
                cant_min = 1.0

            # Operator info from joined trabajador
            op_dni = None
            op_nombre = None
            if r.trabajador:
                op_dni = r.trabajador.dni
                parts = [
                    r.trabajador.apellido_paterno or "",
                    r.trabajador.apellido_materno or "",
                    r.trabajador.nombres or "",
                ]
                op_nombre = " ".join(p for p in parts if p)

            items.append(ParteDetalleDto(
                id=r.id,
                numero_parte=r.numero_parte,
                fecha=r.fecha,
                operador_dni=op_dni,
                operador_nombre=op_nombre,
                turno=r.turno,
                horometro_inicial=float(r.horometro_inicial) if r.horometro_inicial else None,
                horometro_final=float(r.horometro_final) if r.horometro_final else None,
                odometro_inicial=float(r.odometro_inicial) if r.odometro_inicial else None,
                odometro_final=float(r.odometro_final) if r.odometro_final else None,
                diferencia=round(diferencia, 2),
                horas_precalentamiento=round(precalent, 2),
                cantidad_efectiva=round(cant_efectiva, 4),
                cantidad_minima=round(cant_min, 4),
                estado=r.estado,
            ))
        return items

    async def obtener_combustible_detalle(
        self, tenant_id: int, val_id: int
    ) -> CombustibleDetalleDto:
        """Tab 4: Fuel vouchers with summary."""
        val = await self._obtener_o_404(tenant_id, val_id)

        vales = await self._cargar_vales(
            val.equipo_id, val.fecha_inicio, val.fecha_fin
        )

        items = []
        total_gln = 0.0
        total_imp = 0.0
        for v in vales:
            gln = float(v.cantidad_galones or 0)
            pu = float(v.precio_unitario or 0)
            monto = float(v.monto_total or 0) or round(gln * pu, 2)
            items.append(CombustibleDetalleItemDto(
                id=v.id,
                fecha=v.fecha,
                numero_vale=v.numero_vale,
                tipo_combustible=v.tipo_combustible,
                cantidad_galones=gln,
                precio_unitario=pu,
                monto_total=monto,
                proveedor=v.proveedor,
                observaciones=v.observaciones,
            ))
            total_gln += gln
            total_imp += monto

        precio_prom = total_imp / total_gln if total_gln > 0 else 0
        total_horas = float(val.horas_trabajadas or 0)
        ratio = total_gln / total_horas if total_horas > 0 else 0

        return CombustibleDetalleDto(
            items=items,
            total_galones=round(total_gln, 2),
            precio_promedio=round(precio_prom, 2),
            total_importe=round(total_imp, 2),
            ratio=round(ratio, 4),
        )

    async def obtener_analisis_combustible(
        self, tenant_id: int, val_id: int
    ) -> list[AnalisisCombustibleDto]:
        """Tab 7: Fuel excess analysis rows."""
        await self._obtener_o_404(tenant_id, val_id)
        result = await self.db.execute(
            select(AnalisisCombustible).where(
                AnalisisCombustible.valorizacion_id == val_id
            )
        )
        rows = list(result.scalars().all())
        return [
            AnalisisCombustibleDto(
                id=a.id,
                valorizacion_id=a.valorizacion_id,
                consumo_combustible=float(a.consumo_combustible),
                tipo_horometro_odometro=a.tipo_horometro_odometro,
                lectura_inicio=float(a.lectura_inicio),
                lectura_final=float(a.lectura_final),
                total_uso=float(a.total_uso),
                rendimiento=float(a.rendimiento),
                ratio_control=float(a.ratio_control),
                diferencia=float(a.diferencia),
                exceso_combustible=float(a.exceso_combustible),
                precio_unitario=float(a.precio_unitario),
                importe_exceso=float(a.importe_exceso),
                created_at=a.created_at,
            )
            for a in rows
        ]

    async def actualizar_analisis(
        self, tenant_id: int, analisis_id: int,
        ratio_control: float | None, precio_unitario: float | None
    ) -> AnalisisCombustibleDto:
        """Update ratio_control and/or precio_unitario, recalculate excess."""
        result = await self.db.execute(
            select(AnalisisCombustible).where(AnalisisCombustible.id == analisis_id)
        )
        a = result.scalars().first()
        if not a:
            raise NoEncontradoError("AnalisisCombustible", analisis_id)

        # Verify ownership
        await self._obtener_o_404(tenant_id, a.valorizacion_id)

        if ratio_control is not None:
            a.ratio_control = ratio_control
        if precio_unitario is not None:
            a.precio_unitario = precio_unitario

        # Recalculate excess
        rc = float(a.ratio_control)
        pu = float(a.precio_unitario)
        gal = float(a.consumo_combustible)
        uso = float(a.total_uso)
        tipo = (a.tipo_horometro_odometro or "HOROMETRO").upper()

        if tipo == "ODOMETRO" and rc > 0:
            exceso = gal - (uso / rc)
        elif rc > 0:
            exceso = gal - (uso * rc)
        else:
            exceso = 0

        exceso = max(0, exceso)
        a.exceso_combustible = round(exceso, 4)
        a.importe_exceso = round(exceso * pu, 4)
        a.diferencia = round(gal - (uso * rc if tipo != "ODOMETRO" else (uso / rc if rc > 0 else 0)), 4)

        await self.db.commit()
        await self.db.refresh(a)
        return AnalisisCombustibleDto(
            id=a.id,
            valorizacion_id=a.valorizacion_id,
            consumo_combustible=float(a.consumo_combustible),
            tipo_horometro_odometro=a.tipo_horometro_odometro,
            lectura_inicio=float(a.lectura_inicio),
            lectura_final=float(a.lectura_final),
            total_uso=float(a.total_uso),
            rendimiento=float(a.rendimiento),
            ratio_control=float(a.ratio_control),
            diferencia=float(a.diferencia),
            exceso_combustible=float(a.exceso_combustible),
            precio_unitario=float(a.precio_unitario),
            importe_exceso=float(a.importe_exceso),
            created_at=a.created_at,
        )

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
