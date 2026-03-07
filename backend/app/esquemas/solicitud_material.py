"""Esquemas Pydantic para solicitud material, requerimiento y cotizacion logistica."""

from pydantic import BaseModel

# --- Categoria ---


class CategoriaDto(BaseModel):
    id: int
    codigo: str | None = None
    nombre: str | None = None
    descripcion: str | None = None


# --- SolicitudMaterial ---


class DetalleSolicitudMaterialDto(BaseModel):
    id: int
    solicitud_legacy_id: str | None = None
    producto_legacy_id: str | None = None
    producto: str | None = None
    cantidad: float | None = None
    unidad_medida: str | None = None
    fecha_requerida: str | None = None
    marca_sugerida: str | None = None
    descripcion: str | None = None
    link: str | None = None
    estatus: str | None = None


class DetalleSolicitudMaterialCrear(BaseModel):
    producto: str | None = None
    cantidad: float | None = None
    unidad_medida: str | None = None
    fecha_requerida: str | None = None
    marca_sugerida: str | None = None
    descripcion: str | None = None
    link: str | None = None
    estatus: str | None = None


class SolicitudMaterialListaDto(BaseModel):
    id: int
    motivo: str | None = None
    fecha_solicitud: str | None = None
    solicitado_por: str | None = None


class SolicitudMaterialDetalleDto(BaseModel):
    id: int
    legacy_id: str | None = None
    motivo: str | None = None
    fecha_solicitud: str | None = None
    solicitado_por: str | None = None
    created_at: str | None = None
    updated_at: str | None = None
    detalles: list[DetalleSolicitudMaterialDto] = []


class SolicitudMaterialCrear(BaseModel):
    motivo: str | None = None
    fecha_solicitud: str | None = None
    solicitado_por: str | None = None
    detalles: list[DetalleSolicitudMaterialCrear] = []


class SolicitudMaterialActualizar(BaseModel):
    motivo: str | None = None
    fecha_solicitud: str | None = None
    solicitado_por: str | None = None


# --- Requerimiento ---


class DetalleRequerimientoDto(BaseModel):
    id: int
    requerimiento_legacy_id: str | None = None
    producto_legacy_id: str | None = None
    producto: str | None = None
    cantidad: float | None = None
    unidad_medida: str | None = None
    fecha_requerida: str | None = None
    marca_sugerida: str | None = None
    descripcion: str | None = None
    link: str | None = None
    estatus: str | None = None


class DetalleRequerimientoCrear(BaseModel):
    producto: str | None = None
    cantidad: float | None = None
    unidad_medida: str | None = None
    fecha_requerida: str | None = None
    marca_sugerida: str | None = None
    descripcion: str | None = None
    link: str | None = None
    estatus: str | None = None


class RequerimientoListaDto(BaseModel):
    id: int
    numero_requerimiento: int | None = None
    motivo: str | None = None
    fecha_requerimiento: str | None = None
    solicitado_por: str | None = None


class RequerimientoDetalleDto(BaseModel):
    id: int
    legacy_id: str | None = None
    numero_requerimiento: int | None = None
    motivo: str | None = None
    fecha_requerimiento: str | None = None
    solicitado_por: str | None = None
    created_at: str | None = None
    updated_at: str | None = None
    detalles: list[DetalleRequerimientoDto] = []


class RequerimientoCrear(BaseModel):
    motivo: str | None = None
    fecha_requerimiento: str | None = None
    solicitado_por: str | None = None
    detalles: list[DetalleRequerimientoCrear] = []


class RequerimientoActualizar(BaseModel):
    motivo: str | None = None
    fecha_requerimiento: str | None = None
    solicitado_por: str | None = None


# --- CotizacionLogistica ---


class CotizacionLogisticaDto(BaseModel):
    id: int
    numero_cotizacion: int | None = None
