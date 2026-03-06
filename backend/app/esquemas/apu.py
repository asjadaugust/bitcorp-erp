"""Esquemas Pydantic para APU (Analisis de Precios Unitarios)."""

from pydantic import BaseModel, Field


# ── APU Insumo (line item) ────────────────────────────────────────────────────

class ApuInsumoDto(BaseModel):
    id: int
    apu_id: int
    insumo_id: int | None = None
    sub_apu_id: int | None = None
    tipo: str
    cantidad: float
    precio: float | None = None
    aporte: float | None = None
    es_porcentaje: bool = False
    porcentaje: float | None = None
    orden: int
    # Denormalized fields from insumo/sub-APU
    insumo_nombre: str | None = None
    insumo_unidad: str | None = None
    sub_apu_nombre: str | None = None
    costo: float = 0


class ApuInsumoCrear(BaseModel):
    insumo_id: int | None = None
    sub_apu_id: int | None = None
    tipo: str = Field(..., max_length=20)
    cantidad: float = Field(1, ge=0)
    precio: float | None = None
    aporte: float | None = None
    es_porcentaje: bool = False
    porcentaje: float | None = Field(None, ge=0, le=100)
    orden: int = 0


class ApuInsumoActualizar(BaseModel):
    cantidad: float | None = Field(None, ge=0)
    precio: float | None = None
    aporte: float | None = None
    es_porcentaje: bool | None = None
    porcentaje: float | None = Field(None, ge=0, le=100)
    orden: int | None = None


# ── APU header ────────────────────────────────────────────────────────────────

class ApuListaDto(BaseModel):
    id: int
    codigo: str
    nombre: str
    unidad_medida: str
    rendimiento: float
    precio_unitario: float = 0
    created_at: str


class ApuDetalleDto(BaseModel):
    id: int
    codigo: str
    nombre: str
    unidad_medida: str
    rendimiento: float
    jornada: float
    descripcion: str | None = None
    created_at: str
    updated_at: str
    # Grouped insumo lines
    mano_obra: list[ApuInsumoDto] = []
    materiales: list[ApuInsumoDto] = []
    equipos: list[ApuInsumoDto] = []
    herramientas: list[ApuInsumoDto] = []
    subcontratos: list[ApuInsumoDto] = []
    # Calculated totals
    total_mano_obra: float = 0
    total_materiales: float = 0
    total_equipos: float = 0
    total_herramientas: float = 0
    total_subcontratos: float = 0
    precio_unitario: float = 0


class ApuCrear(BaseModel):
    codigo: str = Field(..., max_length=20)
    nombre: str = Field(..., max_length=255)
    unidad_medida: str = Field(..., max_length=10)
    rendimiento: float = Field(1, gt=0)
    jornada: float = Field(8.0, gt=0)
    descripcion: str | None = None


class ApuActualizar(BaseModel):
    nombre: str | None = Field(None, max_length=255)
    unidad_medida: str | None = Field(None, max_length=10)
    rendimiento: float | None = Field(None, gt=0)
    jornada: float | None = Field(None, gt=0)
    descripcion: str | None = None


class ApuDropdownDto(BaseModel):
    id: int
    codigo: str
    nombre: str
    unidad_medida: str
    precio_unitario: float = 0


# ── Calculation result ────────────────────────────────────────────────────────

class ApuCalculoDto(BaseModel):
    apu_id: int
    codigo: str
    nombre: str
    unidad_medida: str
    rendimiento: float
    jornada: float
    mano_obra: list[ApuInsumoDto] = []
    materiales: list[ApuInsumoDto] = []
    equipos: list[ApuInsumoDto] = []
    herramientas: list[ApuInsumoDto] = []
    subcontratos: list[ApuInsumoDto] = []
    total_mano_obra: float = 0
    total_materiales: float = 0
    total_equipos: float = 0
    total_herramientas: float = 0
    total_subcontratos: float = 0
    precio_unitario: float = 0
