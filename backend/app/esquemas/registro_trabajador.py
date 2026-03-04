"""Esquemas Pydantic para registro de trabajador y comportamiento historico."""

from pydantic import BaseModel


# --- ComportamientoHistorico ---


class ComportamientoHistoricoDto(BaseModel):
    id: int
    cargo: str | None = None
    salario: float | None = None
    fecha_inicio: str | None = None
    fecha_fin: str | None = None
    numero_contrato: str | None = None


class ComportamientoHistoricoCrear(BaseModel):
    cargo: str | None = None
    salario: float | None = None
    fecha_inicio: str | None = None
    fecha_fin: str | None = None
    numero_contrato: str | None = None


class ComportamientoHistoricoActualizar(BaseModel):
    cargo: str | None = None
    salario: float | None = None
    fecha_inicio: str | None = None
    fecha_fin: str | None = None
    numero_contrato: str | None = None


# --- RegistroTrabajador ---


class RegistroTrabajadorListaDto(BaseModel):
    id: int
    trabajador_dni: str | None = None
    proveedor_ruc: str | None = None
    fecha_ingreso: str | None = None
    fecha_cese: str | None = None
    estatus: str | None = None
    sub_grupo: str | None = None


class RegistroTrabajadorDetalleDto(BaseModel):
    id: int
    legacy_id: str | None = None
    unidad_operativa_legacy_id: str | None = None
    trabajador_dni: str | None = None
    proveedor_ruc: str | None = None
    fecha_ingreso: str | None = None
    fecha_cese: str | None = None
    estatus: str | None = None
    fecha_registro: str | None = None
    registrado_por: str | None = None
    sub_grupo: str | None = None
    created_at: str | None = None
    updated_at: str | None = None
    comportamiento_historico: list[ComportamientoHistoricoDto] = []


class RegistroTrabajadorCrear(BaseModel):
    trabajador_dni: str | None = None
    proveedor_ruc: str | None = None
    fecha_ingreso: str | None = None
    fecha_cese: str | None = None
    estatus: str | None = None
    sub_grupo: str | None = None
    registrado_por: str | None = None


class RegistroTrabajadorActualizar(BaseModel):
    trabajador_dni: str | None = None
    proveedor_ruc: str | None = None
    fecha_ingreso: str | None = None
    fecha_cese: str | None = None
    estatus: str | None = None
    sub_grupo: str | None = None
    registrado_por: str | None = None


# --- EdtTareo ---


class EdtTareoDto(BaseModel):
    id: int
    edt_id: int | None = None
    tareo_id: int | None = None
    horas: float | None = None
