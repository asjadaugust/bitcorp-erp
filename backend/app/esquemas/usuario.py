"""Esquemas Pydantic para gestión de usuarios."""

from pydantic import BaseModel, EmailStr, Field


class UsuarioListaDto(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    nombres: str | None = None
    apellidos: str | None = None
    rol: str | None = None
    rol_nombre: str | None = None
    unidad_operativa_id: int | None = None
    unidad_operativa_nombre: str | None = None
    is_active: bool
    ultimo_acceso: str | None = None


class UsuarioDetalleDto(UsuarioListaDto):
    dni: str | None = None
    telefono: str | None = None
    roles: list[str] = []
    created_at: str
    updated_at: str


class UsuarioCrear(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)
    email: EmailStr
    first_name: str | None = None
    last_name: str | None = None
    dni: str | None = None
    phone: str | None = None
    rol_id: int
    unidad_operativa_id: int | None = None
    is_active: bool = True


class UsuarioActualizar(BaseModel):
    username: str | None = Field(None, min_length=3, max_length=50)
    email: EmailStr | None = None
    first_name: str | None = None
    last_name: str | None = None
    dni: str | None = None
    phone: str | None = None
    rol_id: int | None = None
    unidad_operativa_id: int | None = None
    is_active: bool | None = None


class CambiarPassword(BaseModel):
    new_password: str = Field(..., min_length=8)


class RolDto(BaseModel):
    id: int
    codigo: str
    nombre: str
    descripcion: str | None = None
