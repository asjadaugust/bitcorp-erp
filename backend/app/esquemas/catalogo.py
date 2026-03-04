"""Esquemas Pydantic para catálogos SUNAT."""

from pydantic import BaseModel


class TipoMedioPagoDto(BaseModel):
    id: int
    codigo: str
    nombre: str
    is_active: bool


class UnidadMedidaDto(BaseModel):
    id: int
    codigo: str
    nombre: str
    abreviatura: str | None = None
    is_active: bool


class TipoComprobanteDto(BaseModel):
    id: int
    codigo: str
    nombre: str
    is_active: bool


class TipoOperacionDto(BaseModel):
    id: int
    codigo: str | None = None
    nombre: str
    ingreso_salida: str | None = None
    is_active: bool
