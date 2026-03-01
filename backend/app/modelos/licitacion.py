"""Modelos SQLAlchemy para licitaciones (public schema).

Fase 5: Licitacion.
Columns match 001_init_schema.sql public.licitaciones.
"""

from datetime import date, datetime

from sqlalchemy import Date, DateTime, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.modelos.base import Base


class Licitacion(Base):
    """Modelo para public.licitaciones."""

    __tablename__ = "licitaciones"
    __table_args__ = {"schema": "public"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    legacy_id: Mapped[str | None] = mapped_column(String(50), unique=True, nullable=True)
    codigo: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    entidad_convocante: Mapped[str | None] = mapped_column(String(255), nullable=True)
    monto_referencial: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    fecha_convocatoria: Mapped[date | None] = mapped_column(Date, nullable=True)
    fecha_presentacion: Mapped[date | None] = mapped_column(Date, nullable=True)
    estado: Mapped[str] = mapped_column(
        String(50), default="PUBLICADO", nullable=False, index=True
    )
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )
