"""Esquemas Pydantic para valorizaciones y pagos.
"""

from datetime import date, datetime

from pydantic import BaseModel, Field

# ─── Nested summary DTOs ──────────────────────────────────────────────────


class ProveedorResumenDto(BaseModel):
    id: int
    razon_social: str | None = None
    ruc: str | None = None


class EquipoResumenDto(BaseModel):
    id: int
    codigo: str | None = None
    nombre: str | None = None
    marca: str | None = None
    modelo: str | None = None


class ContratoResumenDto(BaseModel):
    id: int
    codigo: str | None = None
    proveedor: ProveedorResumenDto | None = None


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
    igv_monto: float = 0
    total_con_igv: float = 0
    numero_valorizacion: str | None = None
    estado: str
    conformidad_proveedor: bool | None = False
    created_at: datetime | None = None
    updated_at: datetime | None = None
    tenant_id: int | None = None
    # Enriched flat fields (kept for compat)
    codigo_equipo: str | None = None
    equipo_marca: str | None = None
    equipo_modelo: str | None = None
    numero_contrato: str | None = None
    # Nested objects
    equipo: EquipoResumenDto | None = None
    contrato: ContratoResumenDto | None = None


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


# ─── Gasto en Obra DTOs ──────────────────────────────────────────────────


class GastoEnObraDto(BaseModel):
    """DTO de respuesta para gasto en obra."""

    id: int
    valorizacion_id: int
    fecha: date
    proveedor: str | None = None
    concepto: str | None = None
    tipo_documento: str | None = None
    numero_documento: str | None = None
    importe: float = 0
    incluye_igv: bool = False
    importe_sin_igv: float = 0
    created_at: datetime | None = None


class GastoEnObraCrear(BaseModel):
    """DTO para crear gasto en obra."""

    fecha: date
    proveedor: str | None = None
    concepto: str | None = None
    tipo_documento: str | None = None
    numero_documento: str | None = None
    importe: float = Field(..., ge=0)
    incluye_igv: bool = False


class GastoEnObraActualizar(BaseModel):
    """DTO para actualizar gasto en obra."""

    fecha: date | None = None
    proveedor: str | None = None
    concepto: str | None = None
    tipo_documento: str | None = None
    numero_documento: str | None = None
    importe: float | None = None
    incluye_igv: bool | None = None


# ─── Adelanto / Amortización DTOs ─────────────────────────────────────────


class AdelantoAmortizacionDto(BaseModel):
    """DTO de respuesta para adelanto/amortización."""

    id: int
    contrato_id: int | None = None
    equipo_id: int
    valorizacion_id: int | None = None
    tipo_operacion: str
    fecha: date
    numero_documento: str | None = None
    concepto: str | None = None
    numero_cuota: str | None = None
    monto: float = 0
    created_at: datetime | None = None


class AdelantoCrear(BaseModel):
    """DTO para crear adelanto/amortización."""

    equipo_id: int
    valorizacion_id: int | None = None
    tipo_operacion: str = Field(..., pattern=r"^(ADELANTO|AMORTIZACION)$")
    fecha: date
    numero_documento: str | None = None
    concepto: str | None = None
    numero_cuota: str | None = None
    monto: float = Field(..., ge=0)


class AdelantoActualizar(BaseModel):
    """DTO para actualizar adelanto/amortización."""

    valorizacion_id: int | None = None
    tipo_operacion: str | None = None
    fecha: date | None = None
    numero_documento: str | None = None
    concepto: str | None = None
    numero_cuota: str | None = None
    monto: float | None = None


# ─── Análisis Combustible DTOs ────────────────────────────────────────────


class AnalisisCombustibleDto(BaseModel):
    """DTO de respuesta para análisis de combustible."""

    id: int
    valorizacion_id: int
    consumo_combustible: float = 0
    tipo_horometro_odometro: str | None = None
    lectura_inicio: float = 0
    lectura_final: float = 0
    total_uso: float = 0
    rendimiento: float = 0
    ratio_control: float = 0
    diferencia: float = 0
    exceso_combustible: float = 0
    precio_unitario: float = 0
    importe_exceso: float = 0
    created_at: datetime | None = None


class AnalisisCombustibleActualizar(BaseModel):
    """DTO para actualizar ratio_control y precio_unitario."""

    ratio_control: float | None = None
    precio_unitario: float | None = None


# ─── Valorizar Detail DTOs ───────────────────────────────────────────────


class ValorizacionResumenDto(BaseModel):
    """DTO para tab 1 — resumen financiero completo."""

    id: int
    numero_valorizacion: str | None = None
    estado: str
    # Provider
    proveedor_ruc: str | None = None
    proveedor_razon_social: str | None = None
    proveedor_direccion: str | None = None
    # Equipment
    codigo_equipo: str | None = None
    tipo_equipo: str | None = None
    placa: str | None = None
    marca: str | None = None
    modelo: str | None = None
    medidor_uso: str | None = None
    # Contract
    numero_contrato: str | None = None
    tipo_documento: str | None = None
    modalidad: str | None = None
    tipo_tarifa: str | None = None
    tarifa: float | None = None
    minimo_por: str | None = None
    cantidad_minima: float | None = None
    moneda: str | None = None
    tipo_cambio: float | None = None
    precio_manipuleo: float | None = None
    # Financial
    cantidad_a_valorizar: float = 0
    precio_unitario: float = 0
    valorizacion_bruta: float = 0
    descuento_combustible: float = 0
    descuento_manipuleo: float = 0
    descuento_gasto_obra: float = 0
    descuento_adelanto: float = 0
    descuento_exceso_combustible: float = 0
    total_descuento: float = 0
    valorizacion_neta: float = 0
    igv_porcentaje: float = 18
    igv_monto: float = 0
    total_con_igv: float = 0
    # Period
    fecha_inicio: date | None = None
    fecha_fin: date | None = None
    periodo: str | None = None


class ResumenAcumuladoItemDto(BaseModel):
    """DTO para una fila del resumen acumulado."""

    id: int
    numero_valorizacion: str | None = None
    periodo: str
    fecha_inicio: date
    fecha_fin: date
    cantidad: float = 0
    unidad_medida: str | None = None
    precio_unitario: float | None = None
    valorizacion_bruta: float = 0
    total_descuento: float = 0
    valorizacion_neta: float = 0
    estado: str


class ParteDetalleDto(BaseModel):
    """DTO para un parte diario con columnas calculadas."""

    id: int
    numero_parte: int | None = None
    fecha: date
    operador_dni: str | None = None
    operador_nombre: str | None = None
    turno: str | None = None
    horometro_inicial: float | None = None
    horometro_final: float | None = None
    odometro_inicial: float | None = None
    odometro_final: float | None = None
    diferencia: float = 0
    horas_precalentamiento: float = 0
    cantidad_efectiva: float = 0
    cantidad_minima: float = 0
    estado: str | None = None


class CombustibleDetalleItemDto(BaseModel):
    """DTO para un vale de combustible en detalle."""

    id: int
    fecha: date
    numero_vale: str
    tipo_combustible: str
    cantidad_galones: float = 0
    precio_unitario: float = 0
    monto_total: float = 0
    proveedor: str | None = None
    observaciones: str | None = None


class CombustibleDetalleDto(BaseModel):
    """DTO para tab 4 — combustible con resumen."""

    items: list[CombustibleDetalleItemDto] = []
    total_galones: float = 0
    precio_promedio: float = 0
    total_importe: float = 0
    ratio: float = 0
