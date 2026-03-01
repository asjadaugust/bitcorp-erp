"""Esquemas Pydantic para notificaciones."""

from pydantic import BaseModel, Field


class NotificacionListaDto(BaseModel):
    id: int
    usuario_id: int
    tipo: str
    titulo: str
    mensaje: str
    url: str | None = None
    leido: bool
    created_at: str


class NotificacionDetalleDto(BaseModel):
    id: int
    usuario_id: int
    tipo: str
    titulo: str
    mensaje: str
    url: str | None = None
    leido: bool
    leido_at: str | None = None
    data: dict | None = None
    created_at: str


class NotificacionCrear(BaseModel):
    usuario_id: int
    tipo: str = Field(..., max_length=50)
    titulo: str = Field(..., max_length=255)
    mensaje: str
    url: str | None = Field(None, max_length=500)
    data: dict | None = None
