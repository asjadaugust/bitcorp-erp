"""Modelos SQLAlchemy para el schema 'sst'.

Fase 5: Incidente.
Columns match 001_init_schema.sql sst.incidente.
"""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.modelos.base import Base


class Incidente(Base):
    """Modelo para sst.incidente."""

    __tablename__ = "incidente"
    __table_args__ = {"schema": "sst"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    legacy_id: Mapped[str | None] = mapped_column(String(50), unique=True, nullable=True)
    fecha_incidente: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    tipo_incidente: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    severidad: Mapped[str | None] = mapped_column(String(50), nullable=True)
    ubicacion: Mapped[str | None] = mapped_column(Text, nullable=True)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    acciones_tomadas: Mapped[str | None] = mapped_column(Text, nullable=True)
    proyecto_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("proyectos.edt.id"), nullable=True, index=True
    )
    reportado_por: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("sistema.usuario.id"), nullable=True
    )
    estado: Mapped[str] = mapped_column(
        String(50), default="ABIERTO", nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )
