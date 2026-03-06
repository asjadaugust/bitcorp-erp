"""Esquemas Pydantic para Presupuesto y Partidas."""

from pydantic import BaseModel, Field


# ── Partida DTOs ──────────────────────────────────────────────────────────────

class PartidaDto(BaseModel):
    id: int
    presupuesto_id: int
    edt_id: int | None = None
    apu_id: int | None = None
    codigo: str
    descripcion: str
    unidad_medida: str
    metrado: float
    precio_unitario: float
    parcial: float
    fase: str | None = None
    orden: int


class PartidaCrear(BaseModel):
    edt_id: int | None = None
    apu_id: int | None = None
    codigo: str = Field(..., max_length=20)
    descripcion: str = Field(..., max_length=255)
    unidad_medida: str = Field(..., max_length=10)
    metrado: float = Field(0, ge=0)
    precio_unitario: float = Field(0, ge=0)
    fase: str | None = Field(None, max_length=100)
    orden: int = 0


class PartidaActualizar(BaseModel):
    edt_id: int | None = None
    apu_id: int | None = None
    descripcion: str | None = Field(None, max_length=255)
    unidad_medida: str | None = Field(None, max_length=10)
    metrado: float | None = Field(None, ge=0)
    precio_unitario: float | None = Field(None, ge=0)
    fase: str | None = Field(None, max_length=100)
    orden: int | None = None


# ── Presupuesto DTOs ─────────────────────────────────────────────────────────

class PresupuestoListaDto(BaseModel):
    id: int
    proyecto_id: int
    codigo: str
    nombre: str
    fecha: str
    version: int
    estado: str
    total_presupuestado: float
    created_at: str


class PresupuestoDetalleDto(BaseModel):
    id: int
    proyecto_id: int
    codigo: str
    nombre: str
    descripcion: str | None = None
    fecha: str
    version: int
    estado: str
    total_presupuestado: float
    created_at: str
    updated_at: str
    partidas: list[PartidaDto] = []


class PresupuestoCrear(BaseModel):
    proyecto_id: int
    codigo: str = Field(..., max_length=50)
    nombre: str = Field(..., max_length=255)
    descripcion: str | None = None
    fecha: str = Field(..., description="ISO date YYYY-MM-DD")
    version: int = 1
    estado: str = Field("BORRADOR", max_length=20)


class PresupuestoActualizar(BaseModel):
    nombre: str | None = Field(None, max_length=255)
    descripcion: str | None = None
    fecha: str | None = None
    version: int | None = None
    estado: str | None = Field(None, max_length=20)


# ── Resumen por fase ─────────────────────────────────────────────────────────

class FaseResumenDto(BaseModel):
    fase: str
    cantidad_partidas: int
    subtotal: float


class PresupuestoResumenDto(BaseModel):
    presupuesto_id: int
    codigo: str
    nombre: str
    fases: list[FaseResumenDto] = []
    total: float = 0
