"""Esquemas Pydantic para evaluacion de proveedor."""

from pydantic import BaseModel


# --- CriterioSeleccionEvaluacion (read-only) ---


class CriterioSeleccionEvaluacionDto(BaseModel):
    id: int
    seleccion_evaluacion: str | None = None
    proveedor_de: str | None = None
    aspecto: str | None = None
    aspecto_peso: float | None = None
    criterio_seleccion: str | None = None
    criterio_seleccion_peso: float | None = None
    parametro: str | None = None
    punto: float | None = None
    puntaje: float | None = None


# --- EvaluacionProveedor ---


class EvaluacionProveedorListaDto(BaseModel):
    id: int
    ruc: str | None = None
    razon_social: str | None = None
    puntaje: float | None = None
    resultado: str | None = None
    accion: str | None = None
    fecha_evaluacion: str | None = None


class EvaluacionProveedorDetalleDto(BaseModel):
    id: int
    legacy_id: str | None = None
    ruc: str | None = None
    razon_social: str | None = None
    precio: str | None = None
    plazo_pago: str | None = None
    calidad: str | None = None
    plazo_cumplimiento: str | None = None
    ubicacion: str | None = None
    atencion_cliente: str | None = None
    sgc: str | None = None
    sgsst: str | None = None
    sga: str | None = None
    puntaje: float | None = None
    resultado: str | None = None
    accion: str | None = None
    parametro_valor: str | None = None
    observacion: str | None = None
    fecha_evaluacion: str | None = None
    evaluado_por: str | None = None
    created_at: str | None = None
    updated_at: str | None = None


class EvaluacionProveedorCrear(BaseModel):
    ruc: str | None = None
    razon_social: str | None = None
    precio: str | None = None
    plazo_pago: str | None = None
    calidad: str | None = None
    plazo_cumplimiento: str | None = None
    ubicacion: str | None = None
    atencion_cliente: str | None = None
    sgc: str | None = None
    sgsst: str | None = None
    sga: str | None = None
    puntaje: float | None = None
    observacion: str | None = None
    fecha_evaluacion: str | None = None
    evaluado_por: str | None = None


class EvaluacionProveedorActualizar(BaseModel):
    ruc: str | None = None
    razon_social: str | None = None
    precio: str | None = None
    plazo_pago: str | None = None
    calidad: str | None = None
    plazo_cumplimiento: str | None = None
    ubicacion: str | None = None
    atencion_cliente: str | None = None
    sgc: str | None = None
    sgsst: str | None = None
    sga: str | None = None
    puntaje: float | None = None
    observacion: str | None = None
    fecha_evaluacion: str | None = None
    evaluado_por: str | None = None
