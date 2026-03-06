"""Esquemas Pydantic para proveedores."""

from datetime import date, datetime

from pydantic import BaseModel, Field

# ─── Output DTOs ──────────────────────────────────────────────────────────


class ProveedorListaDto(BaseModel):
    id: int
    ruc: str
    razon_social: str
    nombre_comercial: str | None = None
    tipo_proveedor: str | None = None
    telefono: str | None = None
    correo_electronico: str | None = None
    is_active: bool


class ProveedorDetalleDto(ProveedorListaDto):
    legacy_id: str | None = None
    direccion: str | None = None
    estado_contribuyente: str | None = None
    condicion_contribuyente: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class ContactoProveedorDto(BaseModel):
    id: int
    proveedor_id: int
    nombre_contacto: str
    cargo: str | None = None
    telefono_principal: str | None = None
    telefono_secundario: str | None = None
    correo: str | None = None
    correo_secundario: str | None = None
    tipo_contacto: str
    es_principal: bool
    estado: str


class InfoFinancieraDto(BaseModel):
    id: int
    proveedor_id: int
    nombre_banco: str
    numero_cuenta: str
    cci: str | None = None
    nombre_titular: str | None = None
    tipo_cuenta: str | None = None
    moneda: str
    es_principal: bool
    estado: str


class DocumentoProveedorDto(BaseModel):
    id: int
    proveedor_id: int
    tipo_documento: str
    numero_documento: str | None = None
    fecha_emision: date | None = None
    fecha_vencimiento: date | None = None
    archivo_url: str | None = None
    observaciones: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class LogProveedorDto(BaseModel):
    id: int
    proveedor_id: int
    accion: str
    campo: str | None = None
    valor_anterior: str | None = None
    valor_nuevo: str | None = None
    observaciones: str | None = None
    usuario_id: int | None = None
    nombre_usuario: str | None = None
    created_at: datetime | None = None


# ─── Input DTOs ───────────────────────────────────────────────────────────


class ProveedorCrear(BaseModel):
    ruc: str = Field(..., min_length=11, max_length=11)
    razon_social: str = Field(..., min_length=1, max_length=255)
    nombre_comercial: str | None = None
    tipo_proveedor: str | None = None
    direccion: str | None = None
    telefono: str | None = None
    correo_electronico: str | None = None


class ProveedorActualizar(BaseModel):
    razon_social: str | None = None
    nombre_comercial: str | None = None
    tipo_proveedor: str | None = None
    direccion: str | None = None
    telefono: str | None = None
    correo_electronico: str | None = None


class ContactoCrear(BaseModel):
    nombre_contacto: str = Field(..., min_length=1, max_length=255)
    cargo: str | None = None
    telefono_principal: str | None = None
    telefono_secundario: str | None = None
    correo: str | None = None
    correo_secundario: str | None = None
    tipo_contacto: str = "general"
    es_principal: bool = False


class ContactoActualizar(BaseModel):
    nombre_contacto: str | None = None
    cargo: str | None = None
    telefono_principal: str | None = None
    telefono_secundario: str | None = None
    correo: str | None = None
    correo_secundario: str | None = None
    tipo_contacto: str | None = None
    es_principal: bool | None = None


class InfoFinancieraCrear(BaseModel):
    nombre_banco: str = Field(..., min_length=1, max_length=255)
    numero_cuenta: str = Field(..., min_length=1, max_length=50)
    cci: str | None = None
    nombre_titular: str | None = None
    tipo_cuenta: str | None = None
    moneda: str = "PEN"
    es_principal: bool = False


class InfoFinancieraActualizar(BaseModel):
    nombre_banco: str | None = None
    numero_cuenta: str | None = None
    cci: str | None = None
    nombre_titular: str | None = None
    tipo_cuenta: str | None = None
    moneda: str | None = None
    es_principal: bool | None = None


class DocumentoCrear(BaseModel):
    tipo_documento: str = Field(..., min_length=1, max_length=100)
    numero_documento: str | None = None
    fecha_emision: date | None = None
    fecha_vencimiento: date | None = None
    archivo_url: str | None = None
    observaciones: str | None = None


class DocumentoActualizar(BaseModel):
    tipo_documento: str | None = None
    numero_documento: str | None = None
    fecha_emision: date | None = None
    fecha_vencimiento: date | None = None
    archivo_url: str | None = None
    observaciones: str | None = None
