"""Esquemas Pydantic para documentos SIG."""

from pydantic import BaseModel, Field


class DocumentoSigListaDto(BaseModel):
    id: int
    codigo: str
    titulo: str
    tipo_documento: str | None = None
    iso_standard: str | None = None
    version: str | None = None
    estado: str
    created_at: str


class DocumentoSigDetalleDto(BaseModel):
    id: int
    codigo: str
    titulo: str
    tipo_documento: str | None = None
    iso_standard: str | None = None
    version: str | None = None
    fecha_emision: str | None = None
    fecha_revision: str | None = None
    archivo_url: str | None = None
    estado: str
    creado_por: int | None = None
    created_at: str
    updated_at: str


class DocumentoSigCrear(BaseModel):
    codigo: str = Field(..., max_length=50)
    titulo: str = Field(..., max_length=255)
    tipo_documento: str | None = Field(None, max_length=100)
    iso_standard: str | None = Field(None, max_length=50)
    version: str | None = Field(None, max_length=20)
    fecha_emision: str | None = None
    fecha_revision: str | None = None
    archivo_url: str | None = None


class DocumentoSigActualizar(BaseModel):
    titulo: str | None = Field(None, max_length=255)
    tipo_documento: str | None = Field(None, max_length=100)
    iso_standard: str | None = Field(None, max_length=50)
    version: str | None = Field(None, max_length=20)
    fecha_emision: str | None = None
    fecha_revision: str | None = None
    archivo_url: str | None = None
    estado: str | None = Field(None, max_length=50)
