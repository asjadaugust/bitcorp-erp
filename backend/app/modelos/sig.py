"""Modelos SQLAlchemy para el schema 'sig'.

Fase 5: DocumentoSig.
Columns match 001_init_schema.sql sig.documento.
"""

from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.modelos.base import Base


class DocumentoSig(Base):
    """Modelo para sig.documento."""

    __tablename__ = "documento"
    __table_args__ = {"schema": "sig"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    legacy_id: Mapped[str | None] = mapped_column(String(50), unique=True, nullable=True)
    codigo: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    titulo: Mapped[str] = mapped_column(String(255), nullable=False)
    tipo_documento: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    iso_standard: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    version: Mapped[str | None] = mapped_column(String(20), nullable=True)
    fecha_emision: Mapped[date | None] = mapped_column(Date, nullable=True)
    fecha_revision: Mapped[date | None] = mapped_column(Date, nullable=True)
    archivo_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    estado: Mapped[str] = mapped_column(
        String(50), default="VIGENTE", nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )
    creado_por: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("sistema.usuario.id"), nullable=True
    )
