"""Esquemas Pydantic para empleados (trabajadores)."""

from pydantic import BaseModel, Field


class EmpleadoListaDto(BaseModel):
    id: int
    dni: str
    nombres: str
    apellido_paterno: str
    apellido_materno: str | None = None
    cargo: str | None = None
    especialidad: str | None = None
    is_active: bool
    created_at: str


class EmpleadoDetalleDto(BaseModel):
    id: int
    dni: str
    nombres: str
    apellido_paterno: str
    apellido_materno: str | None = None
    fecha_nacimiento: str | None = None
    telefono: str | None = None
    correo_electronico: str | None = None
    direccion: str | None = None
    tipo_contrato: str | None = None
    fecha_ingreso: str | None = None
    fecha_cese: str | None = None
    cargo: str | None = None
    especialidad: str | None = None
    licencia_conducir: str | None = None
    is_active: bool
    created_at: str
    updated_at: str


class EmpleadoCrear(BaseModel):
    dni: str = Field(..., max_length=20)
    nombres: str = Field(..., max_length=100)
    apellido_paterno: str = Field(..., max_length=100)
    apellido_materno: str | None = Field(None, max_length=100)
    fecha_nacimiento: str | None = None
    telefono: str | None = Field(None, max_length=20)
    correo_electronico: str | None = Field(None, max_length=255)
    direccion: str | None = None
    tipo_contrato: str | None = Field(None, max_length=50)
    fecha_ingreso: str | None = None
    cargo: str | None = Field(None, max_length=100)
    especialidad: str | None = Field(None, max_length=100)
    licencia_conducir: str | None = Field(None, max_length=50)


class EmpleadoActualizar(BaseModel):
    nombres: str | None = Field(None, max_length=100)
    apellido_paterno: str | None = Field(None, max_length=100)
    apellido_materno: str | None = Field(None, max_length=100)
    telefono: str | None = Field(None, max_length=20)
    correo_electronico: str | None = Field(None, max_length=255)
    direccion: str | None = None
    tipo_contrato: str | None = Field(None, max_length=50)
    fecha_ingreso: str | None = None
    fecha_cese: str | None = None
    cargo: str | None = Field(None, max_length=100)
    especialidad: str | None = Field(None, max_length=100)
    licencia_conducir: str | None = Field(None, max_length=50)
