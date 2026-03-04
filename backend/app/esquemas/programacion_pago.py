"""Esquemas Pydantic para programación de pagos."""

from pydantic import BaseModel, Field


class DetalleProgramacionPagoDto(BaseModel):
    id: int
    programacion_pago_id: int
    valorizacion_id: int | None = None
    concepto: str | None = None
    monto: float | None = None


class ProgramacionPagoListaDto(BaseModel):
    id: int
    proveedor_id: int | None = None
    proyecto_id: int | None = None
    periodo: str | None = None
    fecha_programada: str | None = None
    monto_total: float | None = None
    estado: str | None = None


class ProgramacionPagoDetalleDto(BaseModel):
    id: int
    proveedor_id: int | None = None
    proyecto_id: int | None = None
    periodo: str | None = None
    fecha_programada: str | None = None
    monto_total: float | None = None
    estado: str | None = None
    observaciones: str | None = None
    detalles: list[DetalleProgramacionPagoDto] = []
    created_at: str
    updated_at: str


class ProgramacionPagoCrear(BaseModel):
    proveedor_id: int | None = None
    proyecto_id: int | None = None
    periodo: str | None = Field(None, max_length=7)
    fecha_programada: str | None = None
    monto_total: float | None = Field(None, ge=0)
    observaciones: str | None = None


class ProgramacionPagoActualizar(BaseModel):
    fecha_programada: str | None = None
    monto_total: float | None = Field(None, ge=0)
    observaciones: str | None = None


class DetallePagoCrear(BaseModel):
    valorizacion_id: int | None = None
    concepto: str | None = Field(None, max_length=255)
    monto: float | None = Field(None, ge=0)
