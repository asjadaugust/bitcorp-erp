"""Modelos SQLAlchemy para el schema 'administracion'.

Fase 1: CentroCosto.
Fase 4: CuentaPorPagar, ProgramacionPago, DetalleProgramacionPago.
"""

from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, Numeric, String, Text, func
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


class CuentaPorPagar(Base):
    """Modelo para administracion.cuenta_por_pagar."""

    __tablename__ = "cuenta_por_pagar"
    __table_args__ = {"schema": "administracion"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    legacy_id: Mapped[str | None] = mapped_column(String(50), unique=True, nullable=True)
    proveedor_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("proveedores.proveedor.id"), nullable=False
    )
    numero_factura: Mapped[str] = mapped_column(String(50), nullable=False)
    fecha_emision: Mapped[date] = mapped_column(Date, nullable=False)
    fecha_vencimiento: Mapped[date] = mapped_column(Date, nullable=False)
    monto_total: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    monto_pagado: Mapped[float] = mapped_column(Numeric(15, 2), default=0, nullable=False)
    saldo: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    moneda: Mapped[str] = mapped_column(String(3), default="PEN", nullable=False)
    estado: Mapped[str] = mapped_column(String(50), default="PENDIENTE", nullable=False)
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)
    tenant_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )


class ProgramacionPago(Base):
    """Modelo para administracion.programacion_pago."""

    __tablename__ = "programacion_pago"
    __table_args__ = {"schema": "administracion"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    legacy_id: Mapped[str | None] = mapped_column(String(50), unique=True, nullable=True)
    proveedor_id: Mapped[int] = mapped_column(Integer, nullable=False)
    proyecto_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    periodo: Mapped[str] = mapped_column(String(7), nullable=False)
    fecha_programada: Mapped[date | None] = mapped_column(Date, nullable=True)
    monto_total: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    estado: Mapped[str] = mapped_column(String(50), default="PROGRAMADO", nullable=False)
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )


class DetalleProgramacionPago(Base):
    """Modelo para administracion.detalle_programacion_pago."""

    __tablename__ = "detalle_programacion_pago"
    __table_args__ = {"schema": "administracion"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    programacion_pago_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("administracion.programacion_pago.id", ondelete="CASCADE"),
        nullable=False,
    )
    valorizacion_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    concepto: Mapped[str | None] = mapped_column(String(255), nullable=True)
    monto: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
