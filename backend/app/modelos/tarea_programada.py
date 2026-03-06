"""Modelos SQLAlchemy para tareas programadas (schema 'equipo').

Fase 5: TareaProgramada.
Columns match 001_init_schema.sql equipo.tarea_programada.
"""

from datetime import date, datetime, time

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    Time,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.modelos.base import Base


class TareaProgramada(Base):
    """Modelo para equipo.tarea_programada."""

    __tablename__ = "tarea_programada"
    __table_args__ = {"schema": "equipo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    programa_mantenimiento_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    equipo_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("equipo.equipo.id"), nullable=False
    )
    trabajador_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("rrhh.trabajador.id"), nullable=True
    )
    task_type: Mapped[str] = mapped_column(
        String(50), default="maintenance", nullable=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    start_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    end_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    all_day: Mapped[bool] = mapped_column(Boolean, default=False, nullable=True)
    recurrence: Mapped[str | None] = mapped_column(String(50), nullable=True)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=120, nullable=True)
    priority: Mapped[str] = mapped_column(String(20), default="medium", nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=True)
    completion_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completion_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    maintenance_record_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    creado_por: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("sistema.usuario.id"), nullable=True
    )
    asignado_por: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("sistema.usuario.id"), nullable=True
    )
    proyecto_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("proyectos.proyectos.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )
