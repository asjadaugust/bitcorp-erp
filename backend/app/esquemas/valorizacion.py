"""Esquemas Pydantic para valorizaciones y pagos.
"""

from datetime import date, datetime

from pydantic import BaseModel, Field

# ─── Valorizacion DTOs ────────────────────────────────────────────────────


class ValorizacionListaDto(BaseModel):
    """DTO para listado de valorizaciones."""

    id: int
    equipo_id: int
    contrato_id: int | None = None
    proyecto_id: int | None = None
    periodo: str
    fecha_inicio: date
    fecha_fin: date
    dias_trabajados: int | None = None
    horas_trabajadas: float | None = None
    costo_base: float | None = None
    total_valorizado: float | None = None
    total_con_igv: float = 0
    numero_valorizacion: str | None = None
    estado: str
    conformidad_proveedor: bool | None = False
    created_at: datetime | None = None
    updated_at: datetime | None = None
    tenant_id: int | None = None
    # Enriched fields
    codigo_equipo: str | None = None
    equipo_marca: str | None = None
    equipo_modelo: str | None = None
    numero_contrato: str | None = None


class ValorizacionDetalleDto(ValorizacionListaDto):
    """DTO para detalle de valorización."""

    legacy_id: str | None = None
    combustible_consumido: float | None = None
    costo_combustible: float | None = None
    cargos_adicionales: float | None = None
    tipo_cambio: float | None = None
    descuento_porcentaje: float = 0
    descuento_monto: float = 0
    igv_porcentaje: float = 18
    igv_monto: float = 0
    importe_manipuleo: float | None = None
    importe_gasto_obra: float | None = None
    importe_adelanto: float | None = None
    importe_exceso_combustible: float | None = None
    observaciones: str | None = None
    creado_por: int | None = None
    aprobado_por: int | None = None
    aprobado_en: datetime | None = None
    validado_por: int | None = None
    validado_en: datetime | None = None
    conformidad_fecha: datetime | None = None
    conformidad_observaciones: str | None = None


class ValorizacionCrear(BaseModel):
    """DTO para crear valorización."""

    equipo_id: int
    contrato_id: int | None = None
    proyecto_id: int | None = None
    periodo: str = Field(..., pattern=r"^\d{4}-\d{2}$")
    fecha_inicio: date
    fecha_fin: date
    dias_trabajados: int | None = None
    horas_trabajadas: float | None = None
    combustible_consumido: float | None = None
    costo_base: float | None = None
    costo_combustible: float | None = None
    cargos_adicionales: float | None = None
    total_valorizado: float | None = None
    numero_valorizacion: str | None = None
    tipo_cambio: float | None = None
    descuento_porcentaje: float = 0
    descuento_monto: float = 0
    igv_porcentaje: float = 18
    igv_monto: float | None = None
    total_con_igv: float | None = None
    importe_manipuleo: float | None = None
    importe_gasto_obra: float | None = None
    importe_adelanto: float | None = None
    importe_exceso_combustible: float | None = None
    observaciones: str | None = None
    estado: str = "BORRADOR"


class ValorizacionActualizar(BaseModel):
    """DTO para actualizar valorización."""

    equipo_id: int | None = None
    contrato_id: int | None = None
    proyecto_id: int | None = None
    periodo: str | None = None
    fecha_inicio: date | None = None
    fecha_fin: date | None = None
    dias_trabajados: int | None = None
    horas_trabajadas: float | None = None
    combustible_consumido: float | None = None
    costo_base: float | None = None
    costo_combustible: float | None = None
    cargos_adicionales: float | None = None
    total_valorizado: float | None = None
    numero_valorizacion: str | None = None
    tipo_cambio: float | None = None
    descuento_porcentaje: float | None = None
    descuento_monto: float | None = None
    igv_porcentaje: float | None = None
    igv_monto: float | None = None
    total_con_igv: float | None = None
    importe_manipuleo: float | None = None
    importe_gasto_obra: float | None = None
    importe_adelanto: float | None = None
    importe_exceso_combustible: float | None = None
    observaciones: str | None = None


class RechazarValorizacion(BaseModel):
    """DTO para rechazar valorización."""

    reason: str = Field(..., min_length=1)


class ConformidadDto(BaseModel):
    """DTO para registrar conformidad del proveedor."""

    fecha: date | None = None
    observaciones: str | None = None


class MarcarPagadoDto(BaseModel):
    """DTO para marcar valorización como pagada."""

    fecha_pago: date
    referencia_pago: str | None = None
    metodo_pago: str | None = None


# ─── Documento de Pago DTOs ──────────────────────────────────────────────


class DocumentoPagoDto(BaseModel):
    """DTO de respuesta para documento de pago."""

    id: int
    valorizacion_id: int
    tipo_documento: str
    numero: str | None = None
    fecha_documento: date | None = None
    archivo_url: str | None = None
    estado: str
    observaciones: str | None = None


class DocumentoPagoCrear(BaseModel):
    """DTO para crear documento de pago."""

    tipo_documento: str
    numero: str | None = None
    fecha_documento: date | None = None
    archivo_url: str | None = None
    estado: str = "PENDIENTE"
    observaciones: str | None = None


class DocumentoPagoActualizar(BaseModel):
    """DTO para actualizar documento de pago."""

    tipo_documento: str | None = None
    numero: str | None = None
    fecha_documento: date | None = None
    archivo_url: str | None = None
    estado: str | None = None
    observaciones: str | None = None


# ─── Registro de Pago DTOs ───────────────────────────────────────────────


class PagoListaDto(BaseModel):
    """DTO para listado de pagos."""

    id: int
    numero_pago: str
    valorizacion_id: int
    numero_valorizacion: str | None = None
    fecha_pago: date
    monto_pagado: float
    moneda: str
    metodo_pago: str
    estado: str
    conciliado: bool
    numero_operacion: str | None = None
    observaciones: str | None = None
    created_at: datetime | None = None


class PagoDetalleDto(PagoListaDto):
    """DTO para detalle de pago."""

    contrato_id: int | None = None
    proyecto_id: int | None = None
    tipo_cambio: float | None = None
    banco_origen: str | None = None
    banco_destino: str | None = None
    cuenta_origen: str | None = None
    cuenta_destino: str | None = None
    numero_cheque: str | None = None
    comprobante_tipo: str | None = None
    comprobante_numero: str | None = None
    comprobante_fecha: date | None = None
    fecha_conciliacion: datetime | None = None
    referencia_interna: str | None = None
    registrado_por_id: int | None = None
    aprobado_por_id: int | None = None
    fecha_registro: datetime | None = None
    fecha_aprobacion: datetime | None = None
    updated_at: datetime | None = None


class PagoCrear(BaseModel):
    """DTO para crear pago."""

    valorizacion_id: int
    fecha_pago: date
    monto_pagado: float = Field(..., gt=0)
    moneda: str = "PEN"
    tipo_cambio: float | None = None
    metodo_pago: str  # TRANSFERENCIA, CHEQUE, EFECTIVO, etc.
    banco_origen: str | None = None
    banco_destino: str | None = None
    cuenta_origen: str | None = None
    cuenta_destino: str | None = None
    numero_operacion: str | None = None
    numero_cheque: str | None = None
    comprobante_tipo: str | None = None
    comprobante_numero: str | None = None
    comprobante_fecha: date | None = None
    estado: str = "CONFIRMADO"
    observaciones: str | None = None
    referencia_interna: str | None = None


class PagoActualizar(BaseModel):
    """DTO para actualizar pago."""

    fecha_pago: date | None = None
    monto_pagado: float | None = None
    moneda: str | None = None
    tipo_cambio: float | None = None
    metodo_pago: str | None = None
    banco_origen: str | None = None
    banco_destino: str | None = None
    cuenta_origen: str | None = None
    cuenta_destino: str | None = None
    numero_operacion: str | None = None
    numero_cheque: str | None = None
    comprobante_tipo: str | None = None
    comprobante_numero: str | None = None
    comprobante_fecha: date | None = None
    observaciones: str | None = None
    referencia_interna: str | None = None


class ReconciliarPagoDto(BaseModel):
    """DTO para reconciliar pago."""

    observaciones: str | None = None


class PagoResumenDto(BaseModel):
    """DTO para resumen de pagos de una valorización."""

    valorizacion_id: int
    numero_valorizacion: str | None = None
    monto_total_valorizacion: float
    estado_valorizacion: str
    cantidad_pagos: int
    total_pagado: float
    saldo_pendiente: float
    estado_pago: str  # SIN_PAGOS, PAGO_PARCIAL, PAGO_COMPLETO
    fecha_ultimo_pago: date | None = None
