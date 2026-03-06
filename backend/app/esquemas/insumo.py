"""Esquemas Pydantic para Insumo (Recurso Maestro)."""

from pydantic import BaseModel, Field


class InsumoListaDto(BaseModel):
    id: int
    codigo: str
    nombre: str
    unidad_medida: str
    tipo: str
    precio_unitario: float
    created_at: str


class InsumoDetalleDto(BaseModel):
    id: int
    codigo: str
    nombre: str
    unidad_medida: str
    tipo: str
    precio_unitario: float
    equipo_tipo_id: int | None = None
    created_at: str
    updated_at: str


class InsumoCrear(BaseModel):
    codigo: str = Field(..., max_length=20)
    nombre: str = Field(..., max_length=255)
    unidad_medida: str = Field(..., max_length=10)
    tipo: str = Field(..., max_length=20)
    precio_unitario: float = Field(0, ge=0)
    equipo_tipo_id: int | None = None


class InsumoActualizar(BaseModel):
    nombre: str | None = Field(None, max_length=255)
    unidad_medida: str | None = Field(None, max_length=10)
    tipo: str | None = Field(None, max_length=20)
    precio_unitario: float | None = Field(None, ge=0)
    equipo_tipo_id: int | None = None


class InsumoDropdownDto(BaseModel):
    id: int
    codigo: str
    nombre: str
    unidad_medida: str
    tipo: str
    precio_unitario: float
