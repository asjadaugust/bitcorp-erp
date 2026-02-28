"""Esquemas Pydantic para configuración de precalentamiento."""

from pydantic import BaseModel, Field


class PrecalentamientoConfigDto(BaseModel):
    id: int
    tipo_equipo_id: int
    tipo_equipo_codigo: str
    tipo_equipo_nombre: str
    categoria_prd: str
    horas_precalentamiento: float
    activo: bool
    updated_at: str


class PrecalentamientoHorasDto(BaseModel):
    tipo_equipo_id: int
    horas_precalentamiento: float


class PrecalentamientoActualizar(BaseModel):
    horas_precalentamiento: float = Field(..., ge=0)
