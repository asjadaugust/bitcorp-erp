"""Esquemas Pydantic para caja y banco (bank cash flow)."""

from pydantic import BaseModel


# --- CuentaCajaBanco ---


class CuentaCajaBancoListaDto(BaseModel):
    id: int
    numero_cuenta: str | None = None
    cuenta: str | None = None
    acceso_proyecto: str | None = None
    estatus: str | None = None


class CuentaCajaBancoDetalleDto(BaseModel):
    id: int
    legacy_id: str | None = None
    numero_cuenta: str | None = None
    cuenta: str | None = None
    acceso_proyecto: str | None = None
    unidad_operativa_id: int | None = None
    estatus: str | None = None
    created_at: str | None = None
    updated_at: str | None = None


class CuentaCajaBancoCrear(BaseModel):
    numero_cuenta: str | None = None
    cuenta: str | None = None
    acceso_proyecto: str | None = None
    unidad_operativa_id: int | None = None
    estatus: str | None = None


class CuentaCajaBancoActualizar(BaseModel):
    numero_cuenta: str | None = None
    cuenta: str | None = None
    acceso_proyecto: str | None = None
    unidad_operativa_id: int | None = None
    estatus: str | None = None


# --- FlujoCajaBanco ---


class FlujoCajaBancoListaDto(BaseModel):
    id: int
    tipo_movimiento: str | None = None
    fecha_movimiento: str | None = None
    cuenta_origen: str | None = None
    numero_cuenta_origen: str | None = None
    concepto: str | None = None
    moneda: str | None = None
    total: float | None = None
    voucher: str | None = None


class FlujoCajaBancoDetalleDto(BaseModel):
    id: int
    legacy_id: str | None = None
    tipo_movimiento: str | None = None
    fecha_movimiento: str | None = None
    numero_cuenta_origen: str | None = None
    cuenta_origen: str | None = None
    numero_cuenta_destino: str | None = None
    cuenta_destino: str | None = None
    concepto: str | None = None
    moneda: str | None = None
    total: float | None = None
    total_letra: str | None = None
    voucher: str | None = None
    link_voucher: str | None = None
    unidad_operativa_id: int | None = None
    registrado_por: str | None = None
    fecha_registro: str | None = None
    actualizado_por: str | None = None
    fecha_actualizacion: str | None = None
    created_at: str | None = None
    updated_at: str | None = None
    detalles: list["DetalleMovimientoContableDto"] = []


class FlujoCajaBancoCrear(BaseModel):
    tipo_movimiento: str | None = None
    fecha_movimiento: str | None = None
    numero_cuenta_origen: str | None = None
    cuenta_origen: str | None = None
    numero_cuenta_destino: str | None = None
    cuenta_destino: str | None = None
    concepto: str | None = None
    moneda: str | None = None
    total: float | None = None
    total_letra: str | None = None
    voucher: str | None = None
    link_voucher: str | None = None


class FlujoCajaBancoActualizar(BaseModel):
    tipo_movimiento: str | None = None
    fecha_movimiento: str | None = None
    numero_cuenta_origen: str | None = None
    cuenta_origen: str | None = None
    numero_cuenta_destino: str | None = None
    cuenta_destino: str | None = None
    concepto: str | None = None
    moneda: str | None = None
    total: float | None = None
    total_letra: str | None = None
    voucher: str | None = None
    link_voucher: str | None = None


# --- DetalleMovimientoContable ---


class DetalleMovimientoContableDto(BaseModel):
    id: int
    movimiento_legacy_id: str | None = None
    item: int | None = None
    programacion_legacy_id: str | None = None
    cuenta_por_pagar_legacy_id: str | None = None
    concepto: str | None = None
    clasificacion: str | None = None
    monto: float | None = None
    created_at: str | None = None
    updated_at: str | None = None


class DetalleMovimientoContableCrear(BaseModel):
    concepto: str | None = None
    clasificacion: str | None = None
    monto: float | None = None


# --- AdminCentroCosto ---


class AdminCentroCostoDto(BaseModel):
    id: int
    cuenta_por_pagar_legacy_id: str | None = None
    item: int | None = None
    codigo_componente: str | None = None
    codigo_centro_costo: str | None = None
    centro_costo: str | None = None
    porcentaje: int | None = None
    monto_final: float | None = None
