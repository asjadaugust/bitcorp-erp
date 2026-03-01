"""Modelos SQLAlchemy para el schema 'public'.

Fase 4: Notificacion.
"""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.modelos.base import Base


class Notificacion(Base):
    """Modelo para public.notificaciones."""

    __tablename__ = "notificaciones"
    __table_args__ = {"schema": "public"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    legacy_id: Mapped[str | None] = mapped_column(String(50), unique=True, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    usuario_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    tipo: Mapped[str] = mapped_column(String(50), nullable=False)
    titulo: Mapped[str] = mapped_column(String(255), nullable=False)
    mensaje: Mapped[str] = mapped_column(Text, nullable=False)
    leido: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    leido_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )
