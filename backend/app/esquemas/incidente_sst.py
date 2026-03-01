"""Esquemas Pydantic para incidentes SST (seguridad)."""

from pydantic import BaseModel, Field


class IncidenteListaDto(BaseModel):
    id: int
    fecha_incidente: str
    tipo_incidente: str | None = None
    severidad: str | None = None
    ubicacion: str | None = None
    estado: str
    created_at: str


class IncidenteDetalleDto(BaseModel):
    id: int
    fecha_incidente: str
    tipo_incidente: str | None = None
    severidad: str | None = None
    ubicacion: str | None = None
    descripcion: str | None = None
    acciones_tomadas: str | None = None
    proyecto_id: int | None = None
    reportado_por: int | None = None
    estado: str
    created_at: str
    updated_at: str


class IncidenteCrear(BaseModel):
    fecha_incidente: str
    tipo_incidente: str | None = Field(None, max_length=100)
    severidad: str | None = Field(None, max_length=50)
    ubicacion: str | None = None
    descripcion: str | None = None
    acciones_tomadas: str | None = None
    proyecto_id: int | None = None


class IncidenteActualizar(BaseModel):
    tipo_incidente: str | None = Field(None, max_length=100)
    severidad: str | None = Field(None, max_length=50)
    ubicacion: str | None = None
    descripcion: str | None = None
    acciones_tomadas: str | None = None
    estado: str | None = Field(None, max_length=50)
