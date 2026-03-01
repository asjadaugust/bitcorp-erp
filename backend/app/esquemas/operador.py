"""Esquemas Pydantic para operadores (trabajadores/RRHH).

Replica los DTOs del módulo de operadores del BFF Node.js.
"""

from datetime import date, datetime

from pydantic import BaseModel, Field

# ─── Output DTOs ──────────────────────────────────────────────────────────


class OperadorListaDto(BaseModel):
    id: int
    dni: str
    nombres: str
    apellido_paterno: str
    apellido_materno: str | None = None
    cargo: str | None = None
    especialidad: str | None = None
    telefono: str | None = None
    correo_electronico: str | None = None
    tipo_contrato: str | None = None
    licencia_conducir: str | None = None
    is_active: bool


class OperadorDetalleDto(OperadorListaDto):
    legacy_id: str | None = None
    fecha_nacimiento: date | None = None
    direccion: str | None = None
    fecha_ingreso: date | None = None
    fecha_cese: date | None = None
    unidad_operativa_id: int | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class CertificacionDto(BaseModel):
    id: int
    trabajador_id: int
    nombre_certificacion: str
    numero_certificacion: str | None = None
    fecha_emision: date | None = None
    fecha_vencimiento: date | None = None
    entidad_emisora: str | None = None
    estado: str
    created_at: datetime | None = None


class HabilidadDto(BaseModel):
    id: int
    trabajador_id: int
    tipo_equipo: str
    nivel_habilidad: str
    anios_experiencia: float
    ultima_verificacion: date | None = None
    created_at: datetime | None = None


class DisponibilidadDto(BaseModel):
    id: int
    trabajador_id: int
    fecha: date
    disponible: bool
    observacion: str | None = None


class RendimientoDto(BaseModel):
    total_partes: int = 0
    aprobados: int = 0
    rechazados: int = 0
    eficiencia: float = 0.0


# ─── Input DTOs ───────────────────────────────────────────────────────────


class OperadorCrear(BaseModel):
    dni: str = Field(..., min_length=1, max_length=20)
    nombres: str = Field(..., min_length=1, max_length=100)
    apellido_paterno: str = Field(..., min_length=1, max_length=100)
    apellido_materno: str | None = None
    fecha_nacimiento: date | None = None
    telefono: str | None = None
    correo_electronico: str | None = None
    direccion: str | None = None
    tipo_contrato: str | None = None
    fecha_ingreso: date | None = None
    cargo: str | None = None
    especialidad: str | None = None
    licencia_conducir: str | None = None
    unidad_operativa_id: int | None = None


class OperadorActualizar(BaseModel):
    nombres: str | None = None
    apellido_paterno: str | None = None
    apellido_materno: str | None = None
    fecha_nacimiento: date | None = None
    telefono: str | None = None
    correo_electronico: str | None = None
    direccion: str | None = None
    tipo_contrato: str | None = None
    fecha_ingreso: date | None = None
    fecha_cese: date | None = None
    cargo: str | None = None
    especialidad: str | None = None
    licencia_conducir: str | None = None
    unidad_operativa_id: int | None = None


class CertificacionCrear(BaseModel):
    nombre_certificacion: str = Field(..., min_length=1, max_length=200)
    numero_certificacion: str | None = None
    fecha_emision: date | None = None
    fecha_vencimiento: date | None = None
    entidad_emisora: str | None = None
    estado: str = "VIGENTE"


class HabilidadCrear(BaseModel):
    tipo_equipo: str = Field(..., min_length=1, max_length=100)
    nivel_habilidad: str = "PRINCIPIANTE"
    anios_experiencia: float = 0
    ultima_verificacion: date | None = None


class DisponibilidadEstablecer(BaseModel):
    fecha: date
    disponible: bool
    observacion: str | None = None
