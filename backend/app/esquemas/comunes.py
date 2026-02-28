"""Esquemas comunes de respuesta API.

Replica exactamente el contrato de API del BFF Node.js:
  - { success: true, data: T }
  - { success: true, data: T[], pagination: {...} }
  - { success: false, error: { code, message, details? } }
"""

from typing import Any, Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class ErrorApi(BaseModel):
    code: str
    message: str
    details: Any | None = None


class MetaPaginacion(BaseModel):
    page: int
    limit: int
    total: int
    total_pages: int


class RespuestaApi(BaseModel, Generic[T]):
    """Respuesta estándar de API."""

    success: bool = True
    data: T | None = None
    error: ErrorApi | None = None
    meta: Any | None = None


class RespuestaPaginada(BaseModel, Generic[T]):
    """Respuesta paginada de API."""

    success: bool = True
    data: list[T]
    pagination: MetaPaginacion
