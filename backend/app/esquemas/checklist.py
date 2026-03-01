"""Esquemas Pydantic para checklists."""

from pydantic import BaseModel, Field


class PlantillaChecklistListaDto(BaseModel):
    id: int
    codigo: str
    nombre: str
    tipo_equipo: str | None = None
    frecuencia: str | None = None
    activo: bool | None = True
    created_at: str


class PlantillaChecklistDetalleDto(BaseModel):
    id: int
    codigo: str
    nombre: str
    tipo_equipo: str | None = None
    descripcion: str | None = None
    frecuencia: str | None = None
    activo: bool | None = True
    created_by: int | None = None
    created_at: str
    updated_at: str


class ItemChecklistDto(BaseModel):
    id: int
    plantilla_id: int
    orden: int
    categoria: str | None = None
    descripcion: str
    tipo_verificacion: str | None = "VISUAL"
    es_critico: bool | None = False
    requiere_foto: bool | None = False


class InspeccionListaDto(BaseModel):
    id: int
    codigo: str
    equipo_id: int
    trabajador_id: int
    fecha_inspeccion: str
    estado: str
    resultado_general: str | None = None
    items_conforme: int | None = 0
    items_no_conforme: int | None = 0
    items_total: int | None = 0
    created_at: str


class InspeccionDetalleDto(BaseModel):
    id: int
    codigo: str
    plantilla_id: int
    equipo_id: int
    trabajador_id: int
    fecha_inspeccion: str
    estado: str
    resultado_general: str | None = None
    items_conforme: int | None = 0
    items_no_conforme: int | None = 0
    items_total: int | None = 0
    observaciones_generales: str | None = None
    requiere_mantenimiento: bool | None = False
    equipo_operativo: bool | None = True
    created_at: str
    updated_at: str


class PlantillaCrear(BaseModel):
    codigo: str = Field(..., max_length=50)
    nombre: str = Field(..., max_length=255)
    tipo_equipo: str | None = Field(None, max_length=100)
    descripcion: str | None = None
    frecuencia: str | None = Field(None, max_length=50)


class PlantillaActualizar(BaseModel):
    nombre: str | None = Field(None, max_length=255)
    tipo_equipo: str | None = Field(None, max_length=100)
    descripcion: str | None = None
    frecuencia: str | None = Field(None, max_length=50)
    activo: bool | None = None


class InspeccionCrear(BaseModel):
    plantilla_id: int
    equipo_id: int
    trabajador_id: int
    fecha_inspeccion: str | None = None
    ubicacion: str | None = Field(None, max_length=255)
    observaciones_generales: str | None = None
