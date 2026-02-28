"""Modelos SQLAlchemy para el schema 'equipo'.

Fase 1: TipoEquipo, PrecalentamientoConfig, ConfiguracionCombustible.
Los modelos de Equipo, Contrato, etc. se agregarán en Fase 2.
"""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.modelos.base import Base


class TipoEquipo(Base):
    """Modelo para equipo.tipo_equipo."""

    __tablename__ = "tipo_equipo"
    __table_args__ = {"schema": "equipo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    codigo: Mapped[str] = mapped_column(String(5), unique=True, nullable=False)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    categoria_prd: Mapped[str] = mapped_column(String(30), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class PrecalentamientoConfig(Base):
    """Modelo para equipo.precalentamiento_config."""

    __tablename__ = "precalentamiento_config"
    __table_args__ = {"schema": "equipo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tipo_equipo_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("equipo.tipo_equipo.id"), unique=True, nullable=False
    )
    horas_precalentamiento: Mapped[float] = mapped_column(
        Numeric(4, 2), default=0, nullable=False
    )
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    tipo_equipo: Mapped[TipoEquipo] = relationship("TipoEquipo", lazy="joined")


class ConfiguracionCombustible(Base):
    """Modelo para equipo.configuracion_combustible."""

    __tablename__ = "configuracion_combustible"
    __table_args__ = {"schema": "equipo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    precio_manipuleo: Mapped[float] = mapped_column(
        Numeric(10, 2), default=0.8, nullable=False
    )
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    updated_by: Mapped[int | None] = mapped_column(Integer, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
