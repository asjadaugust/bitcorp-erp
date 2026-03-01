"""Esquemas Pydantic para tareas programadas."""

from pydantic import BaseModel, Field


class TareaProgramadaListaDto(BaseModel):
    id: int
    title: str
    task_type: str | None = "maintenance"
    start_date: str
    end_date: str | None = None
    priority: str | None = "medium"
    status: str | None = "pending"
    equipo_id: int | None = None
    trabajador_id: int | None = None
    created_at: str


class TareaProgramadaDetalleDto(BaseModel):
    id: int
    title: str
    description: str | None = None
    task_type: str | None = "maintenance"
    start_date: str
    end_date: str | None = None
    all_day: bool | None = False
    recurrence: str | None = None
    duration_minutes: int | None = 120
    priority: str | None = "medium"
    status: str | None = "pending"
    equipo_id: int | None = None
    trabajador_id: int | None = None
    proyecto_id: int | None = None
    completion_date: str | None = None
    completion_notes: str | None = None
    creado_por: int | None = None
    created_at: str
    updated_at: str


class TareaProgramadaCrear(BaseModel):
    title: str = Field(..., max_length=255)
    description: str | None = None
    task_type: str = Field("maintenance", max_length=50)
    start_date: str
    end_date: str | None = None
    all_day: bool = False
    priority: str = Field("medium", max_length=20)
    equipo_id: int
    trabajador_id: int | None = None
    proyecto_id: int | None = None
    duration_minutes: int = 120


class TareaProgramadaActualizar(BaseModel):
    title: str | None = Field(None, max_length=255)
    description: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    priority: str | None = Field(None, max_length=20)
    equipo_id: int | None = None
    trabajador_id: int | None = None
    proyecto_id: int | None = None
