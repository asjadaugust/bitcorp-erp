"""Modelos SQLAlchemy para el schema 'rrhh'.

Fase 2d: Stub model — FK target only, no service/router yet.
Columns match the actual live DB schema.
"""

from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.modelos.base import Base


class Trabajador(Base):
    """Modelo para rrhh.trabajador."""

    __tablename__ = "trabajador"
    __table_args__ = {"schema": "rrhh"}

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    legacy_id: Mapped[str | None] = mapped_column(String(50), unique=True, nullable=True)
    dni: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    nombres: Mapped[str] = mapped_column(String(100), nullable=False)
    apellido_paterno: Mapped[str] = mapped_column(String(100), nullable=False)
    apellido_materno: Mapped[str | None] = mapped_column(String(100), nullable=True)
    fecha_nacimiento: Mapped[date | None] = mapped_column(Date, nullable=True)
    telefono: Mapped[str | None] = mapped_column(String(20), nullable=True)
    correo_electronico: Mapped[str | None] = mapped_column(String(255), nullable=True)
    direccion: Mapped[str | None] = mapped_column(Text, nullable=True)
    tipo_contrato: Mapped[str | None] = mapped_column(String(50), nullable=True)
    fecha_ingreso: Mapped[date | None] = mapped_column(Date, nullable=True)
    fecha_cese: Mapped[date | None] = mapped_column(Date, nullable=True)
    cargo: Mapped[str | None] = mapped_column(String(100), nullable=True)
    especialidad: Mapped[str | None] = mapped_column(String(100), nullable=True)
    licencia_conducir: Mapped[str | None] = mapped_column(String(50), nullable=True)
    unidad_operativa_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )
    tenant_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
