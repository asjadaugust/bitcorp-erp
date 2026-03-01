"""Esquemas Pydantic para solicitudes de equipo."""

from datetime import date, datetime

from pydantic import BaseModel, Field


class SolicitudEquipoListaDto(BaseModel):
    id: int
    codigo: str
    tipo_equipo: str
    cantidad: int
    fecha_requerida: date
    prioridad: str
    estado: str
    is_active: bool


class SolicitudEquipoDetalleDto(SolicitudEquipoListaDto):
    proyecto_id: int | None = None
    descripcion: str | None = None
    justificacion: str | None = None
    observaciones: str | None = None
    aprobado_por: int | None = None
    fecha_aprobacion: datetime | None = None
    creado_por: int | None = None
    created_at: datetime | None = None


class SolicitudEquipoCrear(BaseModel):
    tipo_equipo: str = Field(..., min_length=1, max_length=150)
    cantidad: int = 1
    fecha_requerida: date
    prioridad: str = "MEDIA"
    proyecto_id: int | None = None
    descripcion: str | None = None
    justificacion: str | None = None
    observaciones: str | None = None


class SolicitudEquipoActualizar(BaseModel):
    tipo_equipo: str | None = None
    cantidad: int | None = None
    fecha_requerida: date | None = None
    prioridad: str | None = None
    proyecto_id: int | None = None
    descripcion: str | None = None
    justificacion: str | None = None
    observaciones: str | None = None
