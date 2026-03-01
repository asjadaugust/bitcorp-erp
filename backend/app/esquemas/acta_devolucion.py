"""Esquemas Pydantic para actas de devolución."""

from datetime import date, datetime

from pydantic import BaseModel


class ActaDevolucionListaDto(BaseModel):
    id: int
    codigo: str
    equipo_id: int
    fecha_devolucion: date
    tipo: str
    estado: str
    condicion_equipo: str
    is_active: bool


class ActaDevolucionDetalleDto(ActaDevolucionListaDto):
    contrato_id: int | None = None
    proyecto_id: int | None = None
    horometro_devolucion: float | None = None
    kilometraje_devolucion: float | None = None
    observaciones: str | None = None
    observaciones_fisicas: str | None = None
    recibido_por: int | None = None
    entregado_por: int | None = None
    firma_recibido: str | None = None
    firma_entregado: str | None = None
    fecha_firma: datetime | None = None
    creado_por: int | None = None
    created_at: datetime | None = None


class ActaDevolucionCrear(BaseModel):
    equipo_id: int
    fecha_devolucion: date
    tipo: str = "DEVOLUCION"
    condicion_equipo: str = "BUENO"
    contrato_id: int | None = None
    proyecto_id: int | None = None
    horometro_devolucion: float | None = None
    kilometraje_devolucion: float | None = None
    observaciones: str | None = None
    observaciones_fisicas: str | None = None


class ActaDevolucionActualizar(BaseModel):
    fecha_devolucion: date | None = None
    tipo: str | None = None
    condicion_equipo: str | None = None
    horometro_devolucion: float | None = None
    kilometraje_devolucion: float | None = None
    observaciones: str | None = None
    observaciones_fisicas: str | None = None
