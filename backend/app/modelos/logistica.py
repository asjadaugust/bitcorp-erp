"""Modelos SQLAlchemy para el schema 'logistica'.

Fase 5: Producto, Movimiento, DetalleMovimiento.
Columns match database/archive/manual-sql-deprecated/014_create_logistics_schema.sql.
"""

from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.modelos.base import Base


class Producto(Base):
    """Modelo para logistica.producto."""

    __tablename__ = "producto"
    __table_args__ = {"schema": "logistica"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    legacy_id: Mapped[str | None] = mapped_column(String(50), unique=True, nullable=True)
    codigo: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    categoria: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    unidad_medida: Mapped[str | None] = mapped_column(String(20), nullable=True)
    stock_actual: Mapped[float] = mapped_column(Numeric(12, 3), default=0, nullable=False)
    stock_minimo: Mapped[float | None] = mapped_column(Numeric(12, 3), nullable=True)
    precio_unitario: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )


class Movimiento(Base):
    """Modelo para logistica.movimiento."""

    __tablename__ = "movimiento"
    __table_args__ = {"schema": "logistica"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    legacy_id: Mapped[str | None] = mapped_column(String(50), unique=True, nullable=True)
    proyecto_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    fecha: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    tipo_movimiento: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    numero_documento: Mapped[str | None] = mapped_column(String(50), nullable=True)
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)
    estado: Mapped[str] = mapped_column(
        String(20), default="pendiente", nullable=False, index=True
    )
    creado_por: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    aprobado_por: Mapped[int | None] = mapped_column(Integer, nullable=True)
    aprobado_en: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )


class DetalleMovimiento(Base):
    """Modelo para logistica.detalle_movimiento."""

    __tablename__ = "detalle_movimiento"
    __table_args__ = {"schema": "logistica"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    movimiento_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("logistica.movimiento.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    producto_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("logistica.producto.id"),
        nullable=False,
        index=True,
    )
    cantidad: Mapped[float] = mapped_column(Numeric(12, 3), nullable=False)
    precio_unitario: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    monto_total: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
