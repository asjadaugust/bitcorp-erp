"""Esquemas Pydantic para órdenes de alquiler."""

from datetime import date, datetime

from pydantic import BaseModel, Field


class OrdenAlquilerListaDto(BaseModel):
    id: int
    codigo: str
    proveedor_id: int
    descripcion_equipo: str
    fecha_orden: date
    tarifa_acordada: float
    tipo_tarifa: str
    moneda: str
    estado: str
    is_active: bool


class OrdenAlquilerDetalleDto(OrdenAlquilerListaDto):
    solicitud_equipo_id: int | None = None
    equipo_id: int | None = None
    proyecto_id: int | None = None
    fecha_inicio_estimada: date | None = None
    fecha_fin_estimada: date | None = None
    tipo_cambio: float | None = None
    horas_incluidas: float | None = None
    penalidad_exceso: float | None = None
    condiciones_especiales: str | None = None
    observaciones: str | None = None
    enviado_a: str | None = None
    fecha_envio: datetime | None = None
    confirmado_por: str | None = None
    fecha_confirmacion: datetime | None = None
    motivo_cancelacion: str | None = None
    creado_por: int | None = None
    created_at: datetime | None = None


class OrdenAlquilerCrear(BaseModel):
    proveedor_id: int
    descripcion_equipo: str = Field(..., min_length=1, max_length=255)
    fecha_orden: date
    tarifa_acordada: float = Field(..., gt=0)
    tipo_tarifa: str = "HORA"
    moneda: str = "PEN"
    solicitud_equipo_id: int | None = None
    equipo_id: int | None = None
    proyecto_id: int | None = None
    fecha_inicio_estimada: date | None = None
    fecha_fin_estimada: date | None = None
    tipo_cambio: float | None = None
    horas_incluidas: float | None = None
    penalidad_exceso: float | None = None
    condiciones_especiales: str | None = None
    observaciones: str | None = None


class OrdenAlquilerActualizar(BaseModel):
    descripcion_equipo: str | None = None
    tarifa_acordada: float | None = None
    tipo_tarifa: str | None = None
    moneda: str | None = None
    fecha_inicio_estimada: date | None = None
    fecha_fin_estimada: date | None = None
    horas_incluidas: float | None = None
    penalidad_exceso: float | None = None
    condiciones_especiales: str | None = None
    observaciones: str | None = None


class EnviarOrden(BaseModel):
    enviado_a: str | None = None


class ConfirmarOrden(BaseModel):
    confirmado_por: str | None = None


class CancelarOrden(BaseModel):
    motivo_cancelacion: str | None = None
