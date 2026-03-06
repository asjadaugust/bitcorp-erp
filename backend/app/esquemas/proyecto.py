"""Esquemas Pydantic para proyectos."""

from pydantic import BaseModel, Field


class ProyectoListaDto(BaseModel):
    id: int
    codigo: str
    nombre: str
    ubicacion: str | None = None
    estado: str
    fecha_inicio: str | None = None
    fecha_fin: str | None = None
    cliente: str | None = None
    created_at: str


class ProyectoDetalleDto(BaseModel):
    id: int
    codigo: str
    nombre: str
    descripcion: str | None = None
    ubicacion: str | None = None
    fecha_inicio: str | None = None
    fecha_fin: str | None = None
    presupuesto: float | None = None
    estado: str
    cliente: str | None = None
    creado_por: int | None = None
    actualizado_por: int | None = None
    created_at: str
    updated_at: str


class ProyectoCrear(BaseModel):
    codigo: str = Field(..., max_length=50)
    nombre: str = Field(..., max_length=255)
    descripcion: str | None = None
    ubicacion: str | None = Field(None, max_length=255)
    fecha_inicio: str | None = None
    fecha_fin: str | None = None
    presupuesto: float | None = None
    estado: str = Field("PLANIFICACION", max_length=50)
    cliente: str | None = Field(None, max_length=255)


class ProyectoActualizar(BaseModel):
    nombre: str | None = Field(None, max_length=255)
    descripcion: str | None = None
    ubicacion: str | None = Field(None, max_length=255)
    fecha_inicio: str | None = None
    fecha_fin: str | None = None
    presupuesto: float | None = None
    estado: str | None = Field(None, max_length=50)
    cliente: str | None = Field(None, max_length=255)
