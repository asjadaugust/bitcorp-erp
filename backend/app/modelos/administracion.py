"""Modelos SQLAlchemy para el schema 'administracion'.

Fase 1: CentroCosto.
Fase 4: CuentaPorPagar, ProgramacionPago, DetalleProgramacionPago.
Legacy: CajaChica, SolicitudCaja, MovimientoCaja, CuentaCajaBanco, FlujoCajaBanco,
        AdminCentroCosto, DetalleMovimientoContable.
"""

from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    SmallInteger,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.modelos.base import Base


class CentroCosto(Base):
    """Modelo para administracion.centro_costo."""

    __tablename__ = "centro_costo"
    __table_args__ = {"schema": "administracion"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    legacy_id: Mapped[str | None] = mapped_column(
        String(50), unique=True, nullable=True
    )
    codigo: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, index=True
    )
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
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class CuentaPorPagar(Base):
    """Modelo para administracion.cuenta_por_pagar."""

    __tablename__ = "cuenta_por_pagar"
    __table_args__ = {"schema": "administracion"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    legacy_id: Mapped[str | None] = mapped_column(
        String(50), unique=True, nullable=True
    )
    proveedor_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("proveedores.proveedor.id"), nullable=True
    )
    numero_factura: Mapped[str | None] = mapped_column(String(50), nullable=True)
    fecha_emision: Mapped[date | None] = mapped_column(Date, nullable=True)
    fecha_vencimiento: Mapped[date | None] = mapped_column(Date, nullable=True)
    monto_total: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    monto_pagado: Mapped[float] = mapped_column(
        Numeric(15, 2), default=0, nullable=False
    )
    saldo: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    moneda: Mapped[str] = mapped_column(String(10), default="PEN", nullable=False)
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
    legacy_id: Mapped[str | None] = mapped_column(
        String(50), unique=True, nullable=True
    )
    proveedor_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    proyecto_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    periodo: Mapped[str | None] = mapped_column(String(7), nullable=True)
    fecha_programada: Mapped[date | None] = mapped_column(Date, nullable=True)
    monto_total: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    estado: Mapped[str] = mapped_column(
        String(50), default="PROGRAMADO", nullable=False
    )
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


# ─── Legacy: Caja Chica ─────────────────────────────────────────────────


class CajaChica(Base):
    """Modelo para administracion.caja_chica (from tbl_C10001_CajaChica)."""

    __tablename__ = "caja_chica"
    __table_args__ = {"schema": "administracion"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    legacy_id: Mapped[str | None] = mapped_column(
        String(50), unique=True, nullable=True
    )
    numero_caja: Mapped[str | None] = mapped_column(String(10), nullable=True)
    saldo_inicial: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    ingreso_total: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    salida_total: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    saldo_final: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    fecha_apertura: Mapped[date | None] = mapped_column(Date, nullable=True)
    fecha_cierre: Mapped[date | None] = mapped_column(Date, nullable=True)
    estatus: Mapped[str | None] = mapped_column(String(20), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class SolicitudCaja(Base):
    """Modelo para administracion.solicitud_caja (from tbl_C10001_SolicitudCaja)."""

    __tablename__ = "solicitud_caja"
    __table_args__ = {"schema": "administracion"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    legacy_id: Mapped[str | None] = mapped_column(
        String(50), unique=True, nullable=True
    )
    fecha_solicitud: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    dni_usuario: Mapped[str | None] = mapped_column(String(8), nullable=True)
    nombre: Mapped[str | None] = mapped_column(String(50), nullable=True)
    motivo: Mapped[str | None] = mapped_column(String(100), nullable=True)
    monto_solicitado: Mapped[float | None] = mapped_column(
        Numeric(15, 2), nullable=True
    )
    monto_rendido: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    monto_devuelto_reembolsado: Mapped[float | None] = mapped_column(
        Numeric(15, 2), nullable=True
    )
    estatus: Mapped[str | None] = mapped_column(String(15), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class MovimientoCaja(Base):
    """Modelo para administracion.movimiento_caja (from tbl_C10001_MovimentoCaja)."""

    __tablename__ = "movimiento_caja"
    __table_args__ = {"schema": "administracion"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    legacy_id: Mapped[str | None] = mapped_column(
        String(50), unique=True, nullable=True
    )
    fecha_movimiento: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    numero_caja: Mapped[str | None] = mapped_column(String(10), nullable=True)
    rubro: Mapped[str | None] = mapped_column(String(50), nullable=True)
    fecha: Mapped[date | None] = mapped_column(Date, nullable=True)
    ruc: Mapped[str | None] = mapped_column(String(11), nullable=True)
    razon_social: Mapped[str | None] = mapped_column(String(50), nullable=True)
    tipo_documento: Mapped[str | None] = mapped_column(String(50), nullable=True)
    serie_documento: Mapped[str | None] = mapped_column(String(10), nullable=True)
    numero_documento: Mapped[str | None] = mapped_column(String(10), nullable=True)
    detalle: Mapped[str | None] = mapped_column(String(100), nullable=True)
    monto: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    entrada_salida: Mapped[str | None] = mapped_column(String(15), nullable=True)
    numero_solicitud: Mapped[int | None] = mapped_column(Integer, nullable=True)
    registrado_por: Mapped[str | None] = mapped_column(String(100), nullable=True)
    fecha_registro: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    aprobado_por: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


# ─── Legacy: Cuenta Caja Banco ──────────────────────────────────────────


class CuentaCajaBanco(Base):
    """Modelo para administracion.cuenta_caja_banco (from tbl_C04006)."""

    __tablename__ = "cuenta_caja_banco"
    __table_args__ = {"schema": "administracion"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    legacy_id: Mapped[str | None] = mapped_column(
        String(50), unique=True, nullable=True
    )
    numero_cuenta: Mapped[str | None] = mapped_column(String(20), nullable=True)
    cuenta: Mapped[str | None] = mapped_column(String(50), nullable=True)
    acceso_proyecto: Mapped[str | None] = mapped_column(String(2), nullable=True)
    unidad_operativa_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    estatus: Mapped[str | None] = mapped_column(String(10), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class FlujoCajaBanco(Base):
    """Modelo para administracion.flujo_caja_banco (from tbl_C04007)."""

    __tablename__ = "flujo_caja_banco"
    __table_args__ = {"schema": "administracion"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    legacy_id: Mapped[str | None] = mapped_column(
        String(50), unique=True, nullable=True
    )
    tipo_movimiento: Mapped[str | None] = mapped_column(String(7), nullable=True)
    fecha_movimiento: Mapped[date | None] = mapped_column(Date, nullable=True)
    numero_cuenta_origen: Mapped[str | None] = mapped_column(String(20), nullable=True)
    cuenta_origen: Mapped[str | None] = mapped_column(String(100), nullable=True)
    numero_cuenta_destino: Mapped[str | None] = mapped_column(String(20), nullable=True)
    cuenta_destino: Mapped[str | None] = mapped_column(String(100), nullable=True)
    concepto: Mapped[str | None] = mapped_column(String(200), nullable=True)
    moneda: Mapped[str | None] = mapped_column(String(10), nullable=True)
    total: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    total_letra: Mapped[str | None] = mapped_column(String(100), nullable=True)
    voucher: Mapped[str | None] = mapped_column(String(100), nullable=True)
    link_voucher: Mapped[str | None] = mapped_column(String(100), nullable=True)
    unidad_operativa_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    registrado_por: Mapped[str | None] = mapped_column(String(100), nullable=True)
    fecha_registro: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    actualizado_por: Mapped[str | None] = mapped_column(String(100), nullable=True)
    fecha_actualizacion: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class AdminCentroCosto(Base):
    """Modelo para administracion.admin_centro_costo (from tbl_C04003)."""

    __tablename__ = "admin_centro_costo"
    __table_args__ = {"schema": "administracion"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    cuenta_por_pagar_legacy_id: Mapped[str | None] = mapped_column(
        String(15), nullable=True
    )
    item: Mapped[int | None] = mapped_column(Integer, nullable=True)
    codigo_componente: Mapped[str | None] = mapped_column(String(7), nullable=True)
    codigo_centro_costo: Mapped[str | None] = mapped_column(String(12), nullable=True)
    centro_costo: Mapped[str | None] = mapped_column(String(60), nullable=True)
    porcentaje: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    monto_final: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class DetalleMovimientoContable(Base):
    """Modelo para administracion.detalle_movimiento_contable (from tbl_C04008)."""

    __tablename__ = "detalle_movimiento_contable"
    __table_args__ = {"schema": "administracion"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    movimiento_legacy_id: Mapped[str | None] = mapped_column(String(15), nullable=True)
    item: Mapped[int | None] = mapped_column(Integer, nullable=True)
    programacion_legacy_id: Mapped[str | None] = mapped_column(
        String(11), nullable=True
    )
    cuenta_por_pagar_legacy_id: Mapped[str | None] = mapped_column(
        String(15), nullable=True
    )
    concepto: Mapped[str | None] = mapped_column(String(50), nullable=True)
    clasificacion: Mapped[str | None] = mapped_column(String(30), nullable=True)
    monto: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
