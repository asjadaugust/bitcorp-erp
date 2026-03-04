"""Modelos SQLAlchemy para el schema 'proyectos'.

Fase 2d: Stub model — FK target only, no service/router yet.
Columns match the actual live DB schema.
"""

from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.modelos.base import Base


class Edt(Base):
    """Modelo para proyectos.edt (Estructura de Desglose de Trabajo)."""

    __tablename__ = "edt"
    __table_args__ = {"schema": "proyectos"}

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    legacy_id: Mapped[str | None] = mapped_column(
        String(50), unique=True, nullable=True
    )
    codigo: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    ubicacion: Mapped[str | None] = mapped_column(String(255), nullable=True)
    fecha_inicio: Mapped[date | None] = mapped_column(Date, nullable=True)
    fecha_fin: Mapped[date | None] = mapped_column(Date, nullable=True)
    presupuesto: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    estado: Mapped[str] = mapped_column(
        String(50), default="PLANIFICACION", nullable=False
    )
    empresa_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    unidad_operativa_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cliente: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    creado_por: Mapped[int | None] = mapped_column(Integer, nullable=True)
    actualizado_por: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )
