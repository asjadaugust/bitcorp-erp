"""Modelos SQLAlchemy para el schema 'administracion'.

Fase 1: CentroCosto.
"""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.modelos.base import Base


class CentroCosto(Base):
    """Modelo para administracion.centro_costo."""

    __tablename__ = "centro_costo"
    __table_args__ = {"schema": "administracion"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    legacy_id: Mapped[str | None] = mapped_column(String(50), unique=True, nullable=True)
    codigo: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    proyecto_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    presupuesto: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    tenant_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
