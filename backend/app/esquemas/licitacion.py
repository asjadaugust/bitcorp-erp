"""Esquemas Pydantic para licitaciones."""

from pydantic import BaseModel, Field


class LicitacionListaDto(BaseModel):
    id: int
    codigo: str
    nombre: str
    entidad_convocante: str | None = None
    monto_referencial: float | None = None
    estado: str
    fecha_convocatoria: str | None = None
    fecha_presentacion: str | None = None
    created_at: str


class LicitacionDetalleDto(BaseModel):
    id: int
    codigo: str
    nombre: str
    entidad_convocante: str | None = None
    monto_referencial: float | None = None
    fecha_convocatoria: str | None = None
    fecha_presentacion: str | None = None
    estado: str
    observaciones: str | None = None
    created_at: str
    updated_at: str


class LicitacionCrear(BaseModel):
    codigo: str = Field(..., max_length=50)
    nombre: str = Field(..., max_length=255)
    entidad_convocante: str | None = Field(None, max_length=255)
    monto_referencial: float | None = None
    fecha_convocatoria: str | None = None
    fecha_presentacion: str | None = None
    observaciones: str | None = None


class LicitacionActualizar(BaseModel):
    nombre: str | None = Field(None, max_length=255)
    entidad_convocante: str | None = Field(None, max_length=255)
    monto_referencial: float | None = None
    fecha_convocatoria: str | None = None
    fecha_presentacion: str | None = None
    observaciones: str | None = None


class TransicionEstado(BaseModel):
    nuevo_estado: str = Field(..., max_length=50)
