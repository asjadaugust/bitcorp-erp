"""Esquemas Pydantic para el motor de aprobaciones."""

from pydantic import BaseModel, Field

# --- Plantilla ---


class PlantillaPasoDto(BaseModel):
    id: int
    paso_numero: int
    nombre_paso: str
    tipo_aprobador: str
    rol: str | None = None
    usuario_id: int | None = None
    logica_aprobacion: str
    es_opcional: bool


class PlantillaPasoCrear(BaseModel):
    paso_numero: int = Field(..., ge=1)
    nombre_paso: str = Field(..., max_length=200)
    tipo_aprobador: str = Field(..., max_length=20)
    rol: str | None = None
    usuario_id: int | None = None
    logica_aprobacion: str = "FIRST_APPROVES"
    es_opcional: bool = False


class PlantillaListaDto(BaseModel):
    id: int
    nombre: str
    module_name: str
    proyecto_id: int | None = None
    version: int
    estado: str


class PlantillaDetalleDto(BaseModel):
    id: int
    nombre: str
    module_name: str
    proyecto_id: int | None = None
    version: int
    estado: str
    descripcion: str | None = None
    pasos: list[PlantillaPasoDto] = []
    created_at: str
    created_by: int | None = None


class PlantillaCrear(BaseModel):
    nombre: str = Field(..., max_length=200)
    module_name: str = Field(..., max_length=50)
    proyecto_id: int | None = None
    descripcion: str | None = None
    pasos: list[PlantillaPasoCrear] = []


# --- Solicitud ---


class PasoSolicitudDto(BaseModel):
    id: int
    paso_numero: int
    aprobador_id: int | None = None
    estado_paso: str
    accion_fecha: str | None = None
    comentario: str | None = None


class SolicitudListaDto(BaseModel):
    id: int
    module_name: str
    entity_id: int
    titulo: str
    estado: str
    paso_actual: int
    fecha_creacion: str
    usuario_solicitante_id: int


class SolicitudDetalleDto(BaseModel):
    id: int
    plantilla_id: int | None = None
    plantilla_version: int | None = None
    module_name: str
    entity_id: int
    proyecto_id: int | None = None
    usuario_solicitante_id: int
    titulo: str
    descripcion: str | None = None
    estado: str
    paso_actual: int
    pasos: list[PasoSolicitudDto] = []
    fecha_creacion: str
    fecha_completado: str | None = None


class SolicitudCrear(BaseModel):
    plantilla_id: int
    module_name: str = Field(..., max_length=50)
    entity_id: int
    proyecto_id: int | None = None
    titulo: str = Field(..., max_length=200)
    descripcion: str | None = None


class AccionAprobacion(BaseModel):
    comentario: str | None = None


# --- Adhoc ---


class AdhocListaDto(BaseModel):
    id: int
    titulo: str
    estado: str
    logica_aprobacion: str
    fecha_creacion: str
    usuario_solicitante_id: int


class AdhocDetalleDto(BaseModel):
    id: int
    titulo: str
    descripcion: str | None = None
    aprobadores: list | dict
    usuarios_cc: list | dict
    logica_aprobacion: str
    estado: str
    fecha_creacion: str
    fecha_completado: str | None = None
    archivos_adjuntos: list | dict | None = None
    usuario_solicitante_id: int


class AdhocCrear(BaseModel):
    titulo: str = Field(..., max_length=200)
    descripcion: str | None = None
    aprobadores: list[int]
    usuarios_cc: list[int] = []
    logica_aprobacion: str = "FIRST_APPROVES"
    archivos_adjuntos: list | None = None


class AdhocResponder(BaseModel):
    respuesta: str = Field(..., pattern="^(APROBADO|RECHAZADO)$")
    comentario: str | None = None


# --- Auditoría ---


class AuditoriaDto(BaseModel):
    id: int
    accion: str
    usuario_id: int
    paso_numero: int | None = None
    comentario: str | None = None
    timestamp: str
    metadata: dict | None = None


# --- Dashboard ---


class DashboardAprobacionesDto(BaseModel):
    pendientes_recibidos: int
    pendientes_enviados: int
    aprobados: int
    rechazados: int
