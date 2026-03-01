"""Servicio para registros de pago.
"""

from datetime import date, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.core.excepciones import (
    ConflictoError,
    NoEncontradoError,
    ReglaDeNegocioError,
)
from app.esquemas.valorizacion import (
    PagoActualizar,
    PagoCrear,
    PagoDetalleDto,
    PagoListaDto,
    PagoResumenDto,
)
from app.modelos.equipo import RegistroPago, ValorizacionEquipo

logger = obtener_logger(__name__)


# ─── DTO converters ──────────────────────────────────────────────────────


def _num(val: float | None) -> float | None:
    return float(val) if val is not None else None


def _a_lista_dto(p: RegistroPago) -> PagoListaDto:
    return PagoListaDto(
        id=p.id,
        numero_pago=p.numero_pago,
        valorizacion_id=p.valorizacion_id,
        numero_valorizacion=(
            p.valorizacion.numero_valorizacion if p.valorizacion else None
        ),
        fecha_pago=p.fecha_pago,
        monto_pagado=float(p.monto_pagado),
        moneda=p.moneda,
        metodo_pago=p.metodo_pago,
        estado=p.estado,
        conciliado=p.conciliado,
        numero_operacion=p.numero_operacion,
        observaciones=p.observaciones,
        created_at=p.created_at,
    )


def _a_detalle_dto(p: RegistroPago) -> PagoDetalleDto:
    return PagoDetalleDto(
        id=p.id,
        numero_pago=p.numero_pago,
        valorizacion_id=p.valorizacion_id,
        numero_valorizacion=(
            p.valorizacion.numero_valorizacion if p.valorizacion else None
        ),
        fecha_pago=p.fecha_pago,
        monto_pagado=float(p.monto_pagado),
        moneda=p.moneda,
        metodo_pago=p.metodo_pago,
        estado=p.estado,
        conciliado=p.conciliado,
        numero_operacion=p.numero_operacion,
        observaciones=p.observaciones,
        created_at=p.created_at,
        contrato_id=p.contrato_id,
        proyecto_id=p.proyecto_id,
        tipo_cambio=_num(p.tipo_cambio),
        banco_origen=p.banco_origen,
        banco_destino=p.banco_destino,
        cuenta_origen=p.cuenta_origen,
        cuenta_destino=p.cuenta_destino,
        numero_cheque=p.numero_cheque,
        comprobante_tipo=p.comprobante_tipo,
        comprobante_numero=p.comprobante_numero,
        comprobante_fecha=p.comprobante_fecha,
        fecha_conciliacion=p.fecha_conciliacion,
        referencia_interna=p.referencia_interna,
        registrado_por_id=p.registrado_por_id,
        aprobado_por_id=p.aprobado_por_id,
        fecha_registro=p.fecha_registro,
        fecha_aprobacion=p.fecha_aprobacion,
        updated_at=p.updated_at,
    )


class ServicioPago:
    """Servicio para gestión de registros de pago."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ─── Helpers ──────────────────────────────────────────────────────

    async def _generar_numero_pago(self) -> str:
        """Generar número de pago PAG-YYYY-NNNN."""
        year = date.today().year
        prefix = f"PAG-{year}-"
        result = await self.db.execute(
            select(func.count())
            .select_from(RegistroPago)
            .where(RegistroPago.numero_pago.like(f"{prefix}%"))
        )
        count = result.scalar_one()
        return f"{prefix}{count + 1:04d}"

    async def _recargar(self, pago_id: int) -> RegistroPago:
        """Re-query payment with eager relationships."""
        result = await self.db.execute(
            select(RegistroPago).where(RegistroPago.id == pago_id)
        )
        p = result.scalars().unique().first()
        if not p:
            raise NoEncontradoError("Pago", pago_id)
        return p

    async def _verificar_y_actualizar_estado_valorizacion(
        self, valorizacion_id: int
    ) -> None:
        """If fully paid, auto-mark valuation as PAGADO."""
        val_result = await self.db.execute(
            select(ValorizacionEquipo).where(
                ValorizacionEquipo.id == valorizacion_id
            )
        )
        val = val_result.scalars().first()
        if not val or val.estado not in ("APROBADO", "PAGADO"):
            return

        # Sum confirmed payments
        sum_result = await self.db.execute(
            select(func.coalesce(func.sum(RegistroPago.monto_pagado), 0))
            .where(
                RegistroPago.valorizacion_id == valorizacion_id,
                RegistroPago.estado == "CONFIRMADO",
            )
        )
        total_pagado = float(sum_result.scalar_one())
        total_con_igv = float(val.total_con_igv or 0)

        if total_pagado >= total_con_igv > 0 and val.estado == "APROBADO":
            val.estado = "PAGADO"
            logger.info(
                "valorizacion_auto_pagada",
                id=valorizacion_id,
                total_pagado=total_pagado,
            )

    # ─── Listar ───────────────────────────────────────────────────────

    async def listar(
        self,
        *,
        valorizacion_id: int | None = None,
        estado: str | None = None,
        conciliado: bool | None = None,
        metodo_pago: str | None = None,
        fecha_desde: date | None = None,
        fecha_hasta: date | None = None,
        moneda: str | None = None,
        page: int = 1,
        limit: int = 10,
    ) -> tuple[list[PagoListaDto], int]:
        """Listar pagos con filtros."""
        stmt = select(RegistroPago)

        if valorizacion_id:
            stmt = stmt.where(RegistroPago.valorizacion_id == valorizacion_id)
        if estado:
            stmt = stmt.where(RegistroPago.estado == estado)
        if conciliado is not None:
            stmt = stmt.where(RegistroPago.conciliado == conciliado)
        if metodo_pago:
            stmt = stmt.where(RegistroPago.metodo_pago == metodo_pago)
        if fecha_desde:
            stmt = stmt.where(RegistroPago.fecha_pago >= fecha_desde)
        if fecha_hasta:
            stmt = stmt.where(RegistroPago.fecha_pago <= fecha_hasta)
        if moneda:
            stmt = stmt.where(RegistroPago.moneda == moneda)

        # Count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar_one()

        # Sort + paginate
        stmt = stmt.order_by(RegistroPago.created_at.desc())
        offset = (page - 1) * limit
        stmt = stmt.offset(offset).limit(limit)

        result = await self.db.execute(stmt)
        items = list(result.scalars().unique().all())

        return [_a_lista_dto(p) for p in items], total

    # ─── Obtener por ID ───────────────────────────────────────────────

    async def obtener_por_id(self, pago_id: int) -> PagoDetalleDto:
        """Obtener pago por ID."""
        p = await self._recargar(pago_id)
        return _a_detalle_dto(p)

    # ─── Crear ────────────────────────────────────────────────────────

    async def crear(
        self, datos: PagoCrear, registrado_por: int
    ) -> PagoDetalleDto:
        """Crear registro de pago."""
        # Verify valuation exists and is payable
        val_result = await self.db.execute(
            select(ValorizacionEquipo).where(
                ValorizacionEquipo.id == datos.valorizacion_id
            )
        )
        val = val_result.scalars().first()
        if not val:
            raise NoEncontradoError("Valorizacion", datos.valorizacion_id)

        if val.estado not in ("APROBADO", "PAGADO"):
            raise ReglaDeNegocioError(
                "Solo se puede crear pagos para valorizaciones APROBADO o PAGADO"
            )

        numero = await self._generar_numero_pago()

        pago = RegistroPago(
            valorizacion_id=datos.valorizacion_id,
            contrato_id=val.contrato_id,
            proyecto_id=val.proyecto_id,
            numero_pago=numero,
            fecha_pago=datos.fecha_pago,
            monto_pagado=datos.monto_pagado,
            moneda=datos.moneda,
            tipo_cambio=datos.tipo_cambio,
            metodo_pago=datos.metodo_pago,
            banco_origen=datos.banco_origen,
            banco_destino=datos.banco_destino,
            cuenta_origen=datos.cuenta_origen,
            cuenta_destino=datos.cuenta_destino,
            numero_operacion=datos.numero_operacion,
            numero_cheque=datos.numero_cheque,
            comprobante_tipo=datos.comprobante_tipo,
            comprobante_numero=datos.comprobante_numero,
            comprobante_fecha=datos.comprobante_fecha,
            estado=datos.estado,
            observaciones=datos.observaciones,
            referencia_interna=datos.referencia_interna,
            registrado_por_id=registrado_por,
        )
        self.db.add(pago)
        await self.db.flush()

        # Check auto-completion
        await self._verificar_y_actualizar_estado_valorizacion(
            datos.valorizacion_id
        )
        await self.db.commit()

        pago = await self._recargar(pago.id)
        logger.info("pago_creado", id=pago.id, numero=numero)
        return _a_detalle_dto(pago)

    # ─── Actualizar ───────────────────────────────────────────────────

    async def actualizar(
        self, pago_id: int, datos: PagoActualizar
    ) -> PagoDetalleDto:
        """Actualizar registro de pago."""
        result = await self.db.execute(
            select(RegistroPago).where(RegistroPago.id == pago_id)
        )
        pago = result.scalars().first()
        if not pago:
            raise NoEncontradoError("Pago", pago_id)

        if pago.estado == "ANULADO":
            raise ConflictoError("No se puede modificar un pago anulado")

        campos = datos.model_dump(exclude_unset=True)
        for campo, valor in campos.items():
            setattr(pago, campo, valor)

        await self.db.commit()
        pago = await self._recargar(pago_id)
        logger.info("pago_actualizado", id=pago_id)
        return _a_detalle_dto(pago)

    # ─── Cancelar ────────────────────────────────────────────────────

    async def cancelar(
        self, pago_id: int, reason: str | None = None
    ) -> PagoDetalleDto:
        """Cancelar (anular) un pago."""
        result = await self.db.execute(
            select(RegistroPago).where(RegistroPago.id == pago_id)
        )
        pago = result.scalars().first()
        if not pago:
            raise NoEncontradoError("Pago", pago_id)

        if pago.estado == "ANULADO":
            raise ConflictoError("El pago ya está anulado")

        pago.estado = "ANULADO"
        if reason:
            pago.observaciones = reason

        await self.db.commit()
        pago = await self._recargar(pago_id)
        logger.info("pago_anulado", id=pago_id)
        return _a_detalle_dto(pago)

    # ─── Reconciliar ─────────────────────────────────────────────────

    async def reconciliar(
        self, pago_id: int, observaciones: str | None = None
    ) -> PagoDetalleDto:
        """Marcar pago como conciliado."""
        result = await self.db.execute(
            select(RegistroPago).where(RegistroPago.id == pago_id)
        )
        pago = result.scalars().first()
        if not pago:
            raise NoEncontradoError("Pago", pago_id)

        if pago.conciliado:
            raise ConflictoError("El pago ya está conciliado")

        pago.conciliado = True
        pago.fecha_conciliacion = datetime.now()  # noqa: DTZ005
        if observaciones:
            pago.observaciones = observaciones

        await self.db.commit()
        pago = await self._recargar(pago_id)
        logger.info("pago_conciliado", id=pago_id)
        return _a_detalle_dto(pago)

    # ─── Por valorización ────────────────────────────────────────────

    async def listar_por_valorizacion(
        self, valorizacion_id: int
    ) -> list[PagoListaDto]:
        """Listar pagos de una valorización."""
        result = await self.db.execute(
            select(RegistroPago)
            .where(RegistroPago.valorizacion_id == valorizacion_id)
            .order_by(RegistroPago.fecha_pago.desc())
        )
        return [_a_lista_dto(p) for p in result.scalars().unique().all()]

    # ─── Resumen de pagos ────────────────────────────────────────────

    async def resumen(self, valorizacion_id: int) -> PagoResumenDto:
        """Resumen de pagos de una valorización."""
        val_result = await self.db.execute(
            select(ValorizacionEquipo).where(
                ValorizacionEquipo.id == valorizacion_id
            )
        )
        val = val_result.scalars().first()
        if not val:
            raise NoEncontradoError("Valorizacion", valorizacion_id)

        # Sum confirmed payments
        sum_result = await self.db.execute(
            select(
                func.coalesce(func.sum(RegistroPago.monto_pagado), 0),
                func.count(),
                func.max(RegistroPago.fecha_pago),
            ).where(
                RegistroPago.valorizacion_id == valorizacion_id,
                RegistroPago.estado == "CONFIRMADO",
            )
        )
        row = sum_result.one()
        total_pagado = float(row[0])
        cantidad = int(row[1])
        ultima_fecha: date | None = row[2]

        monto_total = float(val.total_con_igv or 0)
        saldo = max(monto_total - total_pagado, 0)

        if cantidad == 0:
            estado_pago = "SIN_PAGOS"
        elif total_pagado >= monto_total > 0:
            estado_pago = "PAGO_COMPLETO"
        else:
            estado_pago = "PAGO_PARCIAL"

        return PagoResumenDto(
            valorizacion_id=valorizacion_id,
            numero_valorizacion=val.numero_valorizacion,
            monto_total_valorizacion=monto_total,
            estado_valorizacion=val.estado,
            cantidad_pagos=cantidad,
            total_pagado=total_pagado,
            saldo_pendiente=saldo,
            estado_pago=estado_pago,
            fecha_ultimo_pago=ultima_fecha,
        )
