"""Esquemas Pydantic para permisos, roles y asignaciones."""

from pydantic import BaseModel, Field

# ─── Permiso ────────────────────────────────────────────────────────────────


class PermisoDto(BaseModel):
    id: int
    proceso: str | None = None
    modulo: str | None = None
    permiso: str | None = None
    is_active: bool = True


class PermisoCrear(BaseModel):
    proceso: str = Field(..., max_length=50)
    modulo: str = Field(..., max_length=50)
    permiso: str = Field(..., max_length=50)


class PermisoActualizar(BaseModel):
    proceso: str | None = Field(None, max_length=50)
    modulo: str | None = Field(None, max_length=50)
    permiso: str | None = Field(None, max_length=50)


# ─── Rol-Permiso ────────────────────────────────────────────────────────────


class RolPermisoDto(BaseModel):
    id: int
    rol_id: int | None = None
    permiso_id: int | None = None


class RolPermisoAsignar(BaseModel):
    permiso_id: int


# ─── Usuario-Rol-UnidadOperativa ─────────────────────────────────────────


class UsuarioRolUoDto(BaseModel):
    id: int
    usuario_id: int | None = None
    rol_id: int | None = None
    unidad_operativa_id: int | None = None


class UsuarioRolUoCrear(BaseModel):
    usuario_id: int
    rol_id: int
    unidad_operativa_id: int


# ─── Componente-UnidadOperativa ──────────────────────────────────────────


class ComponenteUoDto(BaseModel):
    id: int
    codigo: str | None = None
    componente: str | None = None
    unidad_operativa_id: int | None = None
