"""Esquemas Pydantic para vales de combustible."""

from datetime import date, datetime

from pydantic import BaseModel, Field


class ValeCombustibleListaDto(BaseModel):
    id: int
    codigo: str
    equipo_id: int
    fecha: date
    numero_vale: str
    tipo_combustible: str
    cantidad_galones: float
    monto_total: float | None = None
    estado: str


class ValeCombustibleDetalleDto(ValeCombustibleListaDto):
    parte_diario_id: int | None = None
    proyecto_id: int | None = None
    precio_unitario: float | None = None
    proveedor: str | None = None
    observaciones: str | None = None
    creado_por: int | None = None
    created_at: datetime | None = None


class ValeCombustibleCrear(BaseModel):
    equipo_id: int
    fecha: date
    numero_vale: str = Field(..., min_length=1, max_length=50)
    tipo_combustible: str = "DIESEL"
    cantidad_galones: float = Field(..., gt=0)
    precio_unitario: float | None = None
    parte_diario_id: int | None = None
    proyecto_id: int | None = None
    proveedor: str | None = None
    observaciones: str | None = None


class ValeCombustibleActualizar(BaseModel):
    fecha: date | None = None
    numero_vale: str | None = None
    tipo_combustible: str | None = None
    cantidad_galones: float | None = None
    precio_unitario: float | None = None
    proveedor: str | None = None
    observaciones: str | None = None
