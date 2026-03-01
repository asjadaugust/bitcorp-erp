"""Esquemas Pydantic para cuentas por pagar."""

from pydantic import BaseModel, Field


class CuentaPorPagarListaDto(BaseModel):
    id: int
    proveedor_id: int
    numero_factura: str
    fecha_emision: str
    fecha_vencimiento: str
    monto_total: float
    monto_pagado: float
    saldo: float | None = None
    moneda: str
    estado: str


class CuentaPorPagarDetalleDto(BaseModel):
    id: int
    proveedor_id: int
    numero_factura: str
    fecha_emision: str
    fecha_vencimiento: str
    monto_total: float
    monto_pagado: float
    saldo: float | None = None
    moneda: str
    estado: str
    observaciones: str | None = None
    created_at: str
    updated_at: str


class CuentaPorPagarCrear(BaseModel):
    proveedor_id: int
    numero_factura: str = Field(..., max_length=50)
    fecha_emision: str
    fecha_vencimiento: str
    monto_total: float = Field(..., gt=0)
    moneda: str = Field("PEN", max_length=3)
    observaciones: str | None = None


class CuentaPorPagarActualizar(BaseModel):
    numero_factura: str | None = Field(None, max_length=50)
    fecha_vencimiento: str | None = None
    monto_pagado: float | None = Field(None, ge=0)
    estado: str | None = None
    observaciones: str | None = None
