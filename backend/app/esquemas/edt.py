"""Esquemas Pydantic para EDT (Estructura de Desglose de Trabajo)."""

from pydantic import BaseModel, Field


class EdtListaDto(BaseModel):
    id: int
    codigo: str
    nombre: str
    codigo_alfanumerico: str | None = None
    unidad_medida: str | None = None
    estado: str
    created_at: str


class EdtDetalleDto(BaseModel):
    id: int
    codigo: str
    nombre: str
    codigo_alfanumerico: str | None = None
    unidad_medida: str | None = None
    unidad_operativa_id: int | None = None
    estado: str
    created_at: str
    updated_at: str


class EdtCrear(BaseModel):
    codigo: str = Field(..., max_length=20)
    nombre: str = Field(..., max_length=255)
    codigo_alfanumerico: str | None = Field(None, max_length=10)
    unidad_medida: str | None = Field(None, max_length=10)
    estado: str = Field("ACTIVO", max_length=10)


class EdtActualizar(BaseModel):
    nombre: str | None = Field(None, max_length=255)
    codigo_alfanumerico: str | None = Field(None, max_length=10)
    unidad_medida: str | None = Field(None, max_length=10)
    estado: str | None = Field(None, max_length=10)


class EdtDropdownDto(BaseModel):
    id: int
    codigo: str
    codigo_alfanumerico: str | None = None
    nombre: str
