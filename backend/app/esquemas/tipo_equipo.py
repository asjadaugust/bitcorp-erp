"""Esquemas Pydantic para tipos de equipo."""

from pydantic import BaseModel


class TipoEquipoDto(BaseModel):
    id: int
    codigo: str
    nombre: str
    categoria_prd: str
    descripcion: str | None = None
    activo: bool


class CategoriaPrdDto(BaseModel):
    categoria_prd: str
    label: str
    tipos: list[TipoEquipoDto]
