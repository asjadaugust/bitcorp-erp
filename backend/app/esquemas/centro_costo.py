"""Esquemas Pydantic para centros de costo."""

from pydantic import BaseModel, Field


class CentroCostoListaDto(BaseModel):
    id: int
    legacy_id: str | None = None
    codigo: str
    nombre: str
    proyecto_id: int | None = None
    presupuesto: float | None = None
    is_active: bool


class CentroCostoDetalleDto(BaseModel):
    id: int
    legacy_id: str | None = None
    codigo: str
    nombre: str
    descripcion: str | None = None
    proyecto_id: int | None = None
    presupuesto: float | None = None
    is_active: bool
    created_at: str
    updated_at: str


class CentroCostoCrear(BaseModel):
    codigo: str = Field(..., max_length=50)
    nombre: str = Field(..., max_length=255)
    descripcion: str | None = None
    proyecto_id: int | None = None
    presupuesto: float | None = Field(None, ge=0)
    is_active: bool = True


class CentroCostoActualizar(BaseModel):
    codigo: str | None = Field(None, max_length=50)
    nombre: str | None = Field(None, max_length=255)
    descripcion: str | None = None
    proyecto_id: int | None = None
    presupuesto: float | None = Field(None, ge=0)
    is_active: bool | None = None
