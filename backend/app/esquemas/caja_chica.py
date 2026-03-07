"""Esquemas Pydantic para caja chica, solicitudes y movimientos."""

from pydantic import BaseModel

# ─── Caja Chica ──────────────────────────────────────────────────────────


class CajaChicaListaDto(BaseModel):
    id: int
    numero_caja: str | None = None
    saldo_inicial: float | None = None
    ingreso_total: float | None = None
    salida_total: float | None = None
    saldo_final: float | None = None
    fecha_apertura: str | None = None
    estatus: str | None = None


class CajaChicaDetalleDto(BaseModel):
    id: int
    legacy_id: str | None = None
    numero_caja: str | None = None
    saldo_inicial: float | None = None
    ingreso_total: float | None = None
    salida_total: float | None = None
    saldo_final: float | None = None
    fecha_apertura: str | None = None
    fecha_cierre: str | None = None
    estatus: str | None = None
    created_at: str | None = None
    updated_at: str | None = None
    solicitudes: list["SolicitudCajaListaDto"] = []
    movimientos: list["MovimientoCajaListaDto"] = []


class CajaChicaCrear(BaseModel):
    numero_caja: str | None = None
    saldo_inicial: float | None = None
    fecha_apertura: str | None = None


class CajaChicaActualizar(BaseModel):
    numero_caja: str | None = None
    saldo_inicial: float | None = None
    fecha_apertura: str | None = None


# ─── Solicitud Caja ─────────────────────────────────────────────────────


class SolicitudCajaListaDto(BaseModel):
    id: int
    fecha_solicitud: str | None = None
    dni_usuario: str | None = None
    nombre: str | None = None
    motivo: str | None = None
    monto_solicitado: float | None = None
    monto_rendido: float | None = None
    monto_devuelto_reembolsado: float | None = None
    estatus: str | None = None


class SolicitudCajaCrear(BaseModel):
    fecha_solicitud: str | None = None
    dni_usuario: str | None = None
    nombre: str | None = None
    motivo: str | None = None
    monto_solicitado: float | None = None


class SolicitudCajaActualizar(BaseModel):
    fecha_solicitud: str | None = None
    dni_usuario: str | None = None
    nombre: str | None = None
    motivo: str | None = None
    monto_solicitado: float | None = None
    monto_rendido: float | None = None
    estatus: str | None = None


# ─── Movimiento Caja ────────────────────────────────────────────────────


class MovimientoCajaListaDto(BaseModel):
    id: int
    fecha_movimiento: str | None = None
    numero_caja: str | None = None
    rubro: str | None = None
    detalle: str | None = None
    monto: float | None = None
    entrada_salida: str | None = None
    registrado_por: str | None = None


class MovimientoCajaDetalleDto(BaseModel):
    id: int
    legacy_id: str | None = None
    fecha_movimiento: str | None = None
    numero_caja: str | None = None
    rubro: str | None = None
    fecha: str | None = None
    ruc: str | None = None
    razon_social: str | None = None
    tipo_documento: str | None = None
    serie_documento: str | None = None
    numero_documento: str | None = None
    detalle: str | None = None
    monto: float | None = None
    entrada_salida: str | None = None
    numero_solicitud: int | None = None
    registrado_por: str | None = None
    fecha_registro: str | None = None
    aprobado_por: str | None = None
    created_at: str | None = None
    updated_at: str | None = None


class MovimientoCajaCrear(BaseModel):
    fecha_movimiento: str | None = None
    numero_caja: str | None = None
    rubro: str | None = None
    fecha: str | None = None
    ruc: str | None = None
    razon_social: str | None = None
    tipo_documento: str | None = None
    serie_documento: str | None = None
    numero_documento: str | None = None
    detalle: str | None = None
    monto: float | None = None
    entrada_salida: str | None = None
