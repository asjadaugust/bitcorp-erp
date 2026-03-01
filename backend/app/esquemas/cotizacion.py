"""Esquemas Pydantic para cotizaciones de proveedor."""

from datetime import datetime

from pydantic import BaseModel, Field


class CotizacionListaDto(BaseModel):
    id: int
    codigo: str
    solicitud_equipo_id: int
    proveedor_id: int
    descripcion_equipo: str | None = None
    tarifa_propuesta: float
    tipo_tarifa: str
    moneda: str
    estado: str
    puntaje: int | None = None
    is_active: bool


class CotizacionDetalleDto(CotizacionListaDto):
    horas_incluidas: float | None = None
    penalidad_exceso: float | None = None
    plazo_entrega_dias: int | None = None
    condiciones_pago: str | None = None
    condiciones_especiales: str | None = None
    garantia: str | None = None
    disponibilidad: str | None = None
    observaciones: str | None = None
    motivo_seleccion: str | None = None
    evaluado_por: int | None = None
    fecha_evaluacion: datetime | None = None
    orden_alquiler_id: int | None = None
    creado_por: int | None = None
    created_at: datetime | None = None


class CotizacionCrear(BaseModel):
    solicitud_equipo_id: int
    proveedor_id: int
    descripcion_equipo: str | None = None
    tarifa_propuesta: float = Field(..., gt=0)
    tipo_tarifa: str = "HORA"
    moneda: str = "PEN"
    horas_incluidas: float | None = None
    penalidad_exceso: float | None = None
    plazo_entrega_dias: int | None = None
    condiciones_pago: str | None = None
    condiciones_especiales: str | None = None
    garantia: str | None = None
    disponibilidad: str | None = None
    observaciones: str | None = None


class CotizacionActualizar(BaseModel):
    descripcion_equipo: str | None = None
    tarifa_propuesta: float | None = None
    tipo_tarifa: str | None = None
    moneda: str | None = None
    horas_incluidas: float | None = None
    penalidad_exceso: float | None = None
    plazo_entrega_dias: int | None = None
    condiciones_pago: str | None = None
    condiciones_especiales: str | None = None
    garantia: str | None = None
    disponibilidad: str | None = None
    observaciones: str | None = None


class EvaluarCotizacion(BaseModel):
    puntaje: int = Field(..., ge=0, le=100)
    observaciones: str | None = None


class SeleccionarCotizacion(BaseModel):
    motivo_seleccion: str | None = None
