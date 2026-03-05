"""Esquemas Pydantic para equipo EDT y combustible."""

from pydantic import BaseModel


# --- EquipoEdt ---


class EquipoEdtListaDto(BaseModel):
    id: int
    parte_diario_id: int | None = None
    edt_id: int | None = None
    porcentaje: float | None = None
    edt_nombre: str | None = None
    actividad: str | None = None


class EquipoEdtDetalleDto(BaseModel):
    id: int
    legacy_id: str | None = None
    parte_diario_legacy_id: str | None = None
    parte_diario_id: int | None = None
    edt_id: int | None = None
    porcentaje: float | None = None
    edt_nombre: str | None = None
    actividad: str | None = None
    created_at: str | None = None


class EquipoEdtCrear(BaseModel):
    parte_diario_id: int | None = None
    parte_diario_legacy_id: str | None = None
    edt_id: int | None = None
    porcentaje: float | None = None
    edt_nombre: str | None = None
    actividad: str | None = None


class EquipoEdtActualizar(BaseModel):
    edt_id: int | None = None
    porcentaje: float | None = None
    edt_nombre: str | None = None
    actividad: str | None = None


class ValidacionPorcentaje(BaseModel):
    valid: bool
    total: float


# --- EquipoCombustible ---


class EquipoCombustibleListaDto(BaseModel):
    id: int
    numero_vale_salida: int | None = None
    fecha: str | None = None
    cantidad: float | None = None
    precio_unitario_sin_igv: float | None = None
    importe: float | None = None
    comentario: str | None = None


class EquipoCombustibleDetalleDto(BaseModel):
    id: int
    legacy_id: str | None = None
    valorizacion_legacy_id: str | None = None
    numero_vale_salida: int | None = None
    fecha: str | None = None
    horometro_odometro: str | None = None
    inicial: float | None = None
    cantidad: float | None = None
    precio_unitario_sin_igv: float | None = None
    importe: float | None = None
    comentario: str | None = None
    created_at: str | None = None


class EquipoCombustibleCrear(BaseModel):
    valorizacion_legacy_id: str | None = None
    numero_vale_salida: int | None = None
    fecha: str | None = None
    horometro_odometro: str | None = None
    inicial: float | None = None
    cantidad: float | None = None
    precio_unitario_sin_igv: float | None = None
    comentario: str | None = None


class EquipoCombustibleActualizar(BaseModel):
    numero_vale_salida: int | None = None
    fecha: str | None = None
    horometro_odometro: str | None = None
    inicial: float | None = None
    cantidad: float | None = None
    precio_unitario_sin_igv: float | None = None
    comentario: str | None = None
