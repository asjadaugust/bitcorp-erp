"""Esquemas Pydantic para equipos.

Replica los DTOs de equipment.dto.ts del BFF Node.js.
"""

from datetime import date, datetime
from enum import StrEnum

from pydantic import BaseModel, Field


class EstadoEquipo(StrEnum):
    DISPONIBLE = "DISPONIBLE"
    EN_USO = "EN_USO"
    MANTENIMIENTO = "MANTENIMIENTO"
    RETIRADO = "RETIRADO"


# ─── Output DTOs ──────────────────────────────────────────────────────────


class EquipoListaDto(BaseModel):
    id: int
    codigo_equipo: str
    tipo_proveedor: str | None = None
    categoria: str | None = None
    placa: str | None = None
    marca: str | None = None
    modelo: str | None = None
    estado: str
    medidor_uso: str | None = None
    anio_fabricacion: int | None = None
    is_active: bool
    proveedor_id: int | None = None
    proveedor_razon_social: str | None = None
    tipo_equipo_id: int | None = None
    tipo_equipo_nombre: str | None = None
    categoria_prd: str | None = None


class EquipoDetalleDto(EquipoListaDto):
    legacy_id: str | None = None
    numero_serie_equipo: str | None = None
    numero_chasis: str | None = None
    numero_serie_motor: str | None = None
    potencia_neta: float | None = None
    tipo_motor: str | None = None
    fecha_venc_poliza: date | None = None
    fecha_venc_soat: date | None = None
    fecha_venc_citv: date | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class EquipoEstadisticasDto(BaseModel):
    total: int = 0
    disponible: int = 0
    en_uso: int = 0
    mantenimiento: int = 0
    retirado: int = 0


# ─── Input DTOs ───────────────────────────────────────────────────────────


class EquipoCrear(BaseModel):
    codigo_equipo: str = Field(..., min_length=1, max_length=50)
    categoria: str | None = None
    marca: str | None = None
    modelo: str | None = None
    numero_serie_equipo: str | None = None
    numero_chasis: str | None = None
    numero_serie_motor: str | None = None
    placa: str | None = None
    anio_fabricacion: int | None = None
    potencia_neta: float | None = None
    tipo_motor: str | None = None
    medidor_uso: str | None = None
    estado: str | None = None
    tipo_proveedor: str | None = None
    tipo_equipo_id: int | None = None
    proveedor_id: int | None = None
    fecha_venc_poliza: date | None = None
    fecha_venc_soat: date | None = None
    fecha_venc_citv: date | None = None


class EquipoActualizar(BaseModel):
    codigo_equipo: str | None = None
    categoria: str | None = None
    marca: str | None = None
    modelo: str | None = None
    numero_serie_equipo: str | None = None
    numero_chasis: str | None = None
    numero_serie_motor: str | None = None
    placa: str | None = None
    anio_fabricacion: int | None = None
    potencia_neta: float | None = None
    tipo_motor: str | None = None
    medidor_uso: str | None = None
    estado: str | None = None
    tipo_proveedor: str | None = None
    tipo_equipo_id: int | None = None
    proveedor_id: int | None = None
    fecha_venc_poliza: date | None = None
    fecha_venc_soat: date | None = None
    fecha_venc_citv: date | None = None


class CambioEstado(BaseModel):
    estado: str


class AsignarEquipo(BaseModel):
    proyecto_id: int
    observaciones: str | None = None


class TransferirEquipo(BaseModel):
    proyecto_destino_id: int
    observaciones: str | None = None


# ─── Query params ─────────────────────────────────────────────────────────


class FiltrosEquipo(BaseModel):
    estado: str | None = None
    categoria: str | None = None
    categoria_prd: str | None = None
    marca: str | None = None
    equipment_type_id: int | None = None
    provider_id: int | None = None
    search: str | None = None
    is_active: bool = True
    sort_by: str = "codigo_equipo"
    sort_order: str = "ASC"
