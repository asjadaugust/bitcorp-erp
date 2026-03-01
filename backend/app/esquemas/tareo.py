"""Esquemas Pydantic para tareos (timesheets)."""

from pydantic import BaseModel, Field


class TareoListaDto(BaseModel):
    id: int
    trabajador_id: int
    periodo: str
    total_dias_trabajados: int | None = 0
    total_horas: float | None = 0
    estado: str
    created_at: str


class TareoDetalleDto(BaseModel):
    id: int
    trabajador_id: int
    periodo: str
    total_dias_trabajados: int | None = 0
    total_horas: float | None = 0
    monto_calculado: float | None = None
    estado: str
    observaciones: str | None = None
    creado_por: int | None = None
    aprobado_por: int | None = None
    aprobado_en: str | None = None
    created_at: str
    updated_at: str


class DetalleTareoDto(BaseModel):
    id: int
    tareo_id: int
    proyecto_id: int | None = None
    fecha: str
    horas_trabajadas: float | None = None
    tarifa_hora: float | None = None
    monto: float | None = None
    observaciones: str | None = None


class TareoCrear(BaseModel):
    trabajador_id: int
    periodo: str = Field(..., max_length=7)
    observaciones: str | None = None


class TareoActualizar(BaseModel):
    total_dias_trabajados: int | None = None
    total_horas: float | None = None
    monto_calculado: float | None = None
    observaciones: str | None = None
