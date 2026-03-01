"""Esquemas Pydantic para logística / inventario."""

from pydantic import BaseModel, Field


class ProductoListaDto(BaseModel):
    id: int
    codigo: str
    nombre: str
    categoria: str | None = None
    unidad_medida: str | None = None
    stock_actual: float
    stock_minimo: float | None = None
    precio_unitario: float | None = None
    is_active: bool
    created_at: str


class ProductoDetalleDto(BaseModel):
    id: int
    codigo: str
    nombre: str
    descripcion: str | None = None
    categoria: str | None = None
    unidad_medida: str | None = None
    stock_actual: float
    stock_minimo: float | None = None
    precio_unitario: float | None = None
    is_active: bool
    created_at: str
    updated_at: str


class MovimientoListaDto(BaseModel):
    id: int
    tipo_movimiento: str
    fecha: str
    numero_documento: str | None = None
    estado: str
    created_at: str


class MovimientoDetalleDto(BaseModel):
    id: int
    proyecto_id: int | None = None
    fecha: str
    tipo_movimiento: str
    numero_documento: str | None = None
    observaciones: str | None = None
    estado: str
    creado_por: int | None = None
    created_at: str
    updated_at: str


class DetalleMovimientoDto(BaseModel):
    id: int
    movimiento_id: int
    producto_id: int
    cantidad: float
    precio_unitario: float
    monto_total: float | None = None
    observaciones: str | None = None


class MovimientoCrear(BaseModel):
    tipo_movimiento: str = Field(..., max_length=50)
    fecha: str
    numero_documento: str | None = Field(None, max_length=50)
    proyecto_id: int | None = None
    observaciones: str | None = None
    detalles: list[dict] | None = None
