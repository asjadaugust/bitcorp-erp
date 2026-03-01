"""Esquemas Pydantic para mantenimiento de equipos."""

from datetime import date, datetime

from pydantic import BaseModel, Field


class MantenimientoListaDto(BaseModel):
    id: int
    equipo_id: int
    tipo_mantenimiento: str
    fecha_programada: date | None = None
    estado: str
    tecnico_responsable: str | None = None


class MantenimientoDetalleDto(MantenimientoListaDto):
    descripcion: str | None = None
    fecha_realizada: date | None = None
    costo_estimado: float | None = None
    costo_real: float | None = None
    observaciones: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class MantenimientoCrear(BaseModel):
    equipo_id: int
    tipo_mantenimiento: str = Field(..., pattern=r"^(PREVENTIVO|CORRECTIVO|PREDICTIVO)$")
    descripcion: str | None = None
    fecha_programada: date | None = None
    costo_estimado: float | None = None
    tecnico_responsable: str | None = None
    observaciones: str | None = None


class MantenimientoActualizar(BaseModel):
    tipo_mantenimiento: str | None = None
    descripcion: str | None = None
    fecha_programada: date | None = None
    costo_estimado: float | None = None
    costo_real: float | None = None
    tecnico_responsable: str | None = None
    observaciones: str | None = None
