"""Modelos SQLAlchemy para checklists (schema 'equipo').

Fase 5: ChecklistPlantilla, ChecklistItem, ChecklistInspeccion, ChecklistResultado.
Columns match 005_create_checklist_tables.sql.
"""

from datetime import date, datetime, time

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    Time,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.modelos.base import Base


class ChecklistPlantilla(Base):
    """Modelo para equipo.checklist_plantilla."""

    __tablename__ = "checklist_plantilla"
    __table_args__ = {"schema": "equipo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    codigo: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    tipo_equipo: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    frecuencia: Mapped[str | None] = mapped_column(String(50), nullable=True)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )
    created_by: Mapped[int | None] = mapped_column(Integer, nullable=True)


class ChecklistItem(Base):
    """Modelo para equipo.checklist_item."""

    __tablename__ = "checklist_item"
    __table_args__ = {"schema": "equipo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    plantilla_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("equipo.checklist_plantilla.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    orden: Mapped[int] = mapped_column(Integer, nullable=False)
    categoria: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    descripcion: Mapped[str] = mapped_column(Text, nullable=False)
    tipo_verificacion: Mapped[str] = mapped_column(
        String(50), default="VISUAL", nullable=True
    )
    valor_esperado: Mapped[str | None] = mapped_column(String(100), nullable=True)
    es_critico: Mapped[bool] = mapped_column(Boolean, default=False, nullable=True, index=True)
    requiere_foto: Mapped[bool] = mapped_column(Boolean, default=False, nullable=True)
    instrucciones: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )


class ChecklistInspeccion(Base):
    """Modelo para equipo.checklist_inspeccion."""

    __tablename__ = "checklist_inspeccion"
    __table_args__ = {"schema": "equipo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    codigo: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    plantilla_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("equipo.checklist_plantilla.id"),
        nullable=False,
    )
    equipo_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("equipo.equipo.id"), nullable=False, index=True
    )
    trabajador_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("rrhh.trabajador.id"), nullable=False, index=True
    )
    fecha_inspeccion: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    hora_inicio: Mapped[time | None] = mapped_column(Time, nullable=True)
    hora_fin: Mapped[time | None] = mapped_column(Time, nullable=True)
    ubicacion: Mapped[str | None] = mapped_column(String(255), nullable=True)
    horometro_inicial: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    odometro_inicial: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    estado: Mapped[str] = mapped_column(
        String(50), default="EN_PROGRESO", nullable=False, index=True
    )
    resultado_general: Mapped[str | None] = mapped_column(
        String(50), nullable=True, index=True
    )
    items_conforme: Mapped[int] = mapped_column(Integer, default=0, nullable=True)
    items_no_conforme: Mapped[int] = mapped_column(Integer, default=0, nullable=True)
    items_total: Mapped[int] = mapped_column(Integer, default=0, nullable=True)
    observaciones_generales: Mapped[str | None] = mapped_column(Text, nullable=True)
    requiere_mantenimiento: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=True
    )
    equipo_operativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )
    completado_en: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class ChecklistResultado(Base):
    """Modelo para equipo.checklist_resultado."""

    __tablename__ = "checklist_resultado"
    __table_args__ = {"schema": "equipo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    inspeccion_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("equipo.checklist_inspeccion.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    item_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("equipo.checklist_item.id"),
        nullable=False,
    )
    conforme: Mapped[bool | None] = mapped_column(Boolean, nullable=True, index=True)
    valor_medido: Mapped[str | None] = mapped_column(String(100), nullable=True)
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)
    accion_requerida: Mapped[str | None] = mapped_column(String(50), nullable=True)
    foto_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )
