"""Esquemas Pydantic para proveedores."""

from datetime import datetime

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
    provider_id: int
    contact_name: str
    position: str | None = None
    primary_phone: str | None = None
    secondary_phone: str | None = None
    email: str | None = None
    secondary_email: str | None = None
    contact_type: str
    is_primary: bool
    status: str


class InfoFinancieraDto(BaseModel):
    id: int
    provider_id: int
    bank_name: str
    account_number: str
    cci: str | None = None
    account_holder_name: str | None = None
    account_type: str | None = None
    currency: str
    is_primary: bool
    status: str


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
    contact_name: str = Field(..., min_length=1, max_length=255)
    position: str | None = None
    primary_phone: str | None = None
    secondary_phone: str | None = None
    email: str | None = None
    secondary_email: str | None = None
    contact_type: str = "general"
    is_primary: bool = False


class InfoFinancieraCrear(BaseModel):
    bank_name: str = Field(..., min_length=1, max_length=255)
    account_number: str = Field(..., min_length=1, max_length=50)
    cci: str | None = None
    account_holder_name: str | None = None
    account_type: str | None = None
    currency: str = "PEN"
    is_primary: bool = False
