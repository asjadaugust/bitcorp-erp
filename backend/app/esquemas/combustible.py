"""Esquemas Pydantic para configuración de combustible."""

from pydantic import BaseModel, Field


class CombustibleConfigDto(BaseModel):
    id: int | None = None
    precio_manipuleo: float
    activo: bool
    updated_by: int | None = None
    updated_at: str | None = None


class CombustiblePrecioDto(BaseModel):
    precio_manipuleo: float


class CombustibleActualizar(BaseModel):
    precio_manipuleo: float = Field(..., ge=0)
