"""Esquemas Pydantic para períodos de inoperatividad."""

from datetime import date, datetime

from pydantic import BaseModel, Field


class InoperatividadListaDto(BaseModel):
    id: int
    equipo_id: int
    fecha_inicio: date
    fecha_fin: date | None = None
    dias_inoperativo: int
    motivo: str
    estado: str
    excede_plazo: bool
    penalidad_aplicada: bool


class InoperatividadDetalleDto(InoperatividadListaDto):
    contrato_id: int | None = None
    dias_plazo: int
    monto_penalidad: float | None = None
    observaciones_penalidad: str | None = None
    resuelto_por: int | None = None
    creado_por: int | None = None
    created_at: datetime | None = None


class InoperatividadCrear(BaseModel):
    equipo_id: int
    fecha_inicio: date
    motivo: str = Field(..., min_length=1)
    contrato_id: int | None = None
    dias_plazo: int = 5


class InoperatividadActualizar(BaseModel):
    fecha_fin: date | None = None
    motivo: str | None = None
    dias_plazo: int | None = None


class ResolverInoperatividad(BaseModel):
    fecha_fin: date
    observaciones_penalidad: str | None = None


class AplicarPenalidad(BaseModel):
    monto_penalidad: float = Field(..., gt=0)
    observaciones_penalidad: str | None = None
