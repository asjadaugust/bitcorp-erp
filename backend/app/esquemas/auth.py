"""Esquemas Pydantic para autenticación."""

from pydantic import BaseModel, Field


class LoginSolicitud(BaseModel):
    username: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=1)


class RefreshTokenSolicitud(BaseModel):
    refresh_token: str


class UsuarioAuth(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    nombres: str | None = None
    apellidos: str | None = None
    roles: list[str]
    unidad_operativa_id: int | None = None
    unidad_operativa_nombre: str | None = None


class LoginRespuesta(BaseModel):
    user: UsuarioAuth
    access_token: str
    refresh_token: str


class MeRespuesta(BaseModel):
    user: UsuarioAuth
