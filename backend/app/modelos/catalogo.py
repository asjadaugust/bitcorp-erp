"""Modelos SQLAlchemy para el schema 'catalogo'.

Tablas de referencia SUNAT (catalogo tributario peruano).
Migradas desde las tablas legacy tbl_SUNAT01, tbl_SUNAT06, tbl_SUNAT10, tbl_SUNAT12.
"""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.modelos.base import Base


class TipoMedioPago(Base):
    """Modelo para catalogo.tipo_medio_pago (from tbl_SUNAT01_TipoMedioPago)."""

    __tablename__ = "tipo_medio_pago"
    __table_args__ = {"schema": "catalogo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    legacy_id: Mapped[str | None] = mapped_column(String(50), unique=True, nullable=True)
    codigo: Mapped[str] = mapped_column(String(10), unique=True, nullable=False)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    abreviatura: Mapped[str | None] = mapped_column(String(10), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class UnidadMedida(Base):
    """Modelo para catalogo.unidad_medida (from tbl_SUNAT06_UnidadMedida)."""

    __tablename__ = "unidad_medida"
    __table_args__ = {"schema": "catalogo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    legacy_id: Mapped[str | None] = mapped_column(String(50), unique=True, nullable=True)
    codigo: Mapped[str] = mapped_column(String(10), unique=True, nullable=False)
    nombre: Mapped[str] = mapped_column(String(50), nullable=False)
    abreviatura: Mapped[str | None] = mapped_column(String(10), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class TipoComprobante(Base):
    """Modelo para catalogo.tipo_comprobante (from tbl_SUNAT10_TipoComprobante)."""

    __tablename__ = "tipo_comprobante"
    __table_args__ = {"schema": "catalogo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    legacy_id: Mapped[str | None] = mapped_column(String(50), unique=True, nullable=True)
    codigo: Mapped[str] = mapped_column(String(10), unique=True, nullable=False)
    nombre: Mapped[str] = mapped_column(String(50), nullable=False)
    abreviatura: Mapped[str | None] = mapped_column(String(10), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class TipoOperacion(Base):
    """Modelo para catalogo.tipo_operacion (from tbl_SUNAT12_TipoOperacion)."""

    __tablename__ = "tipo_operacion"
    __table_args__ = {"schema": "catalogo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    legacy_id: Mapped[str | None] = mapped_column(String(50), unique=True, nullable=True)
    nombre: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    codigo: Mapped[str | None] = mapped_column(String(10), nullable=True)
    ingreso_salida: Mapped[str | None] = mapped_column(String(10), nullable=True)
    documento_interno: Mapped[str | None] = mapped_column(String(20), nullable=True)
    cliente_proveedor: Mapped[str | None] = mapped_column(String(10), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
