"""Esquemas Pydantic para contratos."""

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field

# ─── Enums / Constants ──────────────────────────────────────────────────────

MODALIDADES = Literal[
    "MAQUINA_SECA_OPERADA",
    "MAQUINA_SECA_NO_OPERADA",
    "MAQUINA_SERVIDA_OPERADA",
    "MAQUINA_SERVIDA_NO_OPERADA",
]

TIPOS_TARIFA = Literal["HORA", "DIA", "MES"]

ESTADOS_CONTRATO = Literal[
    "SIN_CONTRATO",
    "EN_PROCESO",
    "VIGENTE",
    "VENCIDO",
    "RESUELTO",
    "LIQUIDADO",
    "CANCELADO",
]

MINIMO_POR = Literal["NINGUNO", "DIA", "SEMANA", "MES"]

TIPOS_OBLIGACION_ARRENDADOR = [
    "CONDICIONES_OPERATIVAS",
    "REPRESENTANTE_FRENTE",
    "POLIZA_TREC",
    "NORMAS_SEGURIDAD",
    "SOAT",
    "REPARACION_REEMPLAZO",
    "KIT_ANTIDERRAME",
    "DOCUMENTOS_VALIDOS",
    "REEMPLAZO_OPERADOR",
]

TIPOS_OBLIGACION_ARRENDATARIO = [
    "GUARDIANIA",
    "SENALIZACION_SEGURIDAD",
    "PAGOS_OPORTUNOS",
    "NO_TRASLADO_SIN_AUTORIZACION",
]

TIPOS_DOCUMENTO_REQUERIDO = [
    "POLIZA_TREC",
    "SOAT",
    "INSPECCION_TECNICA",
    "TARJETA_PROPIEDAD",
    "LICENCIA_CONDUCIR",
]

LEGALIZACION_PASOS = [
    {"numero": 1, "tipo": "PENDIENTE_FIRMA_PROVEEDOR"},
    {"numero": 2, "tipo": "EN_ENVIO_LIMA"},
    {"numero": 3, "tipo": "PENDIENTE_FIRMA_LEGAL"},
    {"numero": 4, "tipo": "LEGALIZADO"},
]


# ─── Output DTOs ────────────────────────────────────────────────────────────


class ContratoListaDto(BaseModel):
    id: int
    numero_contrato: str | None = None
    tipo: str
    equipo_id: int
    contrato_padre_id: int | None = None
    fecha_contrato: date | None = None
    fecha_inicio: date | None = None
    fecha_fin: date | None = None
    moneda: str
    tipo_tarifa: str | None = None
    tarifa: float | None = None
    modalidad: str | None = None
    estado: str
    proveedor_id: int | None = None
    incluye_motor: bool = False
    incluye_operador: bool = False
    horas_incluidas: int | None = None
    penalidad_exceso: float | None = None
    tenant_id: int | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    # Enriched from relationships
    equipo_codigo: str | None = None
    equipo_marca: str | None = None
    equipo_modelo: str | None = None
    proveedor_razon_social: str | None = None


class ContratoDetalleDto(ContratoListaDto):
    legacy_id: str | None = None
    costo_adicional_motor: float | None = None
    condiciones_especiales: str | None = None
    documento_url: str | None = None
    creado_por: int | None = None
    minimo_por: str | None = None
    cantidad_minima: float | None = None
    documento_acredita: str | None = None
    fecha_acreditada: date | None = None
    jurisdiccion: str | None = None
    plazo_texto: str | None = None
    motivo_resolucion: str | None = None
    fecha_resolucion: date | None = None
    monto_liquidacion: float | None = None
    causal_resolucion: str | None = None
    resuelto_por: int | None = None
    fecha_liquidacion: date | None = None
    liquidado_por: int | None = None
    observaciones_liquidacion: str | None = None
    # Children
    adendas: list["ContratoListaDto"] = []


class ContratoAnexoDto(BaseModel):
    id: int
    contrato_id: int
    tipo_anexo: str
    orden: int
    concepto: str
    incluido: bool
    observaciones: str | None = None


class ContratoDocumentoRequeridoDto(BaseModel):
    id: int
    contrato_id: int
    tipo_documento: str
    provider_document_id: int | None = None
    estado: str
    fecha_vencimiento: date | None = None
    observaciones: str | None = None


class ContratoObligacionDto(BaseModel):
    id: int
    contrato_id: int
    tipo_obligacion: str
    estado: str
    fecha_compromiso: date | None = None
    observaciones: str | None = None


class ContratoObligacionArrendatarioDto(BaseModel):
    id: int
    contrato_id: int
    tipo_obligacion: str
    estado: str
    fecha_compromiso: date | None = None
    observaciones: str | None = None


class ContratoLegalizacionPasoDto(BaseModel):
    id: int
    contrato_id: int
    numero_paso: int
    tipo_paso: str
    completado: bool
    fecha_completado: datetime | None = None
    completado_por: int | None = None
    observaciones: str | None = None


# ─── Input DTOs ─────────────────────────────────────────────────────────────


class ContratoCrear(BaseModel):
    numero_contrato: str = Field(..., min_length=1, max_length=50)
    equipo_id: int
    fecha_contrato: date
    fecha_inicio: date
    fecha_fin: date
    moneda: str = "PEN"
    tipo_tarifa: TIPOS_TARIFA | None = None
    tarifa: float | None = None
    modalidad: MODALIDADES | None = None
    costo_adicional_motor: float | None = None
    horas_incluidas: int | None = None
    penalidad_exceso: float | None = None
    condiciones_especiales: str | None = None
    documento_url: str | None = None
    proveedor_id: int | None = None
    minimo_por: MINIMO_POR | None = None
    cantidad_minima: float | None = None


class ContratoActualizar(BaseModel):
    numero_contrato: str | None = None
    fecha_contrato: date | None = None
    fecha_inicio: date | None = None
    fecha_fin: date | None = None
    moneda: str | None = None
    tipo_tarifa: TIPOS_TARIFA | None = None
    tarifa: float | None = None
    modalidad: MODALIDADES | None = None
    incluye_motor: bool | None = None
    incluye_operador: bool | None = None
    costo_adicional_motor: float | None = None
    horas_incluidas: int | None = None
    penalidad_exceso: float | None = None
    condiciones_especiales: str | None = None
    documento_url: str | None = None
    estado: ESTADOS_CONTRATO | None = None
    proveedor_id: int | None = None
    minimo_por: MINIMO_POR | None = None
    cantidad_minima: float | None = None


class AdendaCrear(BaseModel):
    contrato_padre_id: int
    numero_contrato: str = Field(..., min_length=1, max_length=50)
    fecha_fin: date
    fecha_contrato: date | None = None


class ResolverContrato(BaseModel):
    causal_resolucion: str
    motivo_resolucion: str
    fecha_resolucion: date
    monto_liquidacion: float | None = None


class LiquidarContrato(BaseModel):
    fecha_liquidacion: date
    monto_liquidacion: float | None = None
    observaciones_liquidacion: str | None = None


class AnexoItem(BaseModel):
    concepto: str
    incluido: bool
    observaciones: str | None = None


class ActualizarDocumentoRequerido(BaseModel):
    provider_document_id: int | None = None
    estado: str | None = None
    fecha_vencimiento: date | None = None
    observaciones: str | None = None


class ActualizarObligacion(BaseModel):
    estado: str | None = None
    fecha_compromiso: date | None = None
    observaciones: str | None = None


class CompletarPasoLegalizacion(BaseModel):
    observaciones: str | None = None
