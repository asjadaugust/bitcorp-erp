"""Modelos SQLAlchemy para el schema 'proyectos'.

Contiene dos tablas:
- proyectos.proyectos — Proyectos (unidades operativas)
- proyectos.edt — EDT (Estructura de Desglose de Trabajo) work items
"""

from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.modelos.base import Base


class Proyecto(Base):
    """Modelo para proyectos.proyectos (Proyectos / Unidades Operativas)."""

    __tablename__ = "proyectos"
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


class Edt(Base):
    """Modelo para proyectos.edt (EDT work items)."""

    __tablename__ = "edt"
    __table_args__ = {"schema": "proyectos"}

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    legacy_id: Mapped[str | None] = mapped_column(
        String(50), unique=True, nullable=True
    )
    codigo: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    unidad_medida: Mapped[str | None] = mapped_column(String(10), nullable=True)
    codigo_alfanumerico: Mapped[str | None] = mapped_column(String(10), nullable=True)
    unidad_operativa_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    estado: Mapped[str] = mapped_column(String(10), default="ACTIVO", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )
