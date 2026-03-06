"""Modelos SQLAlchemy para el schema 'presupuestos'.

Contiene cinco tablas:
- presupuestos.insumo — Recursos (mano de obra, materiales, equipos, subcontratos)
- presupuestos.apu — Analisis de Precios Unitarios
- presupuestos.apu_insumo — Lineas de APU (soporta recursión via sub_apu_id)
- presupuestos.presupuesto — Presupuestos de obra
- presupuestos.presupuesto_partida — Partidas del presupuesto
"""

from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.modelos.base import Base


class Insumo(Base):
    """Recurso maestro (mano de obra, material, equipo, subcontrato)."""

    __tablename__ = "insumo"
    __table_args__ = {"schema": "presupuestos"}

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    codigo: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    unidad_medida: Mapped[str] = mapped_column(String(10), nullable=False)
    tipo: Mapped[str] = mapped_column(String(20), nullable=False)
    precio_unitario: Mapped[float] = mapped_column(
        Numeric(15, 4), nullable=False, default=0
    )
    equipo_tipo_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    tenant_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )


class Apu(Base):
    """Analisis de Precios Unitarios."""

    __tablename__ = "apu"
    __table_args__ = {"schema": "presupuestos"}

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    codigo: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    unidad_medida: Mapped[str] = mapped_column(String(10), nullable=False)
    rendimiento: Mapped[float] = mapped_column(
        Numeric(12, 4), nullable=False, default=1
    )
    jornada: Mapped[float] = mapped_column(
        Numeric(4, 2), nullable=False, default=8.0
    )
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    tenant_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )


class ApuInsumo(Base):
    """Linea de APU — soporta recursión via sub_apu_id."""

    __tablename__ = "apu_insumo"
    __table_args__ = (
        CheckConstraint(
            "insumo_id IS NOT NULL OR sub_apu_id IS NOT NULL",
            name="ck_apu_insumo_ref",
        ),
        {"schema": "presupuestos"},
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    apu_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    insumo_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    sub_apu_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    tipo: Mapped[str] = mapped_column(String(20), nullable=False)
    cantidad: Mapped[float] = mapped_column(Numeric(12, 4), nullable=False, default=1)
    precio: Mapped[float | None] = mapped_column(Numeric(15, 4), nullable=True)
    aporte: Mapped[float | None] = mapped_column(Numeric(12, 6), nullable=True)
    es_porcentaje: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    porcentaje: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    orden: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    tenant_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)


class Presupuesto(Base):
    """Presupuesto de obra."""

    __tablename__ = "presupuesto"
    __table_args__ = {"schema": "presupuestos"}

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    proyecto_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    codigo: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    fecha: Mapped[date] = mapped_column(Date, nullable=False)
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    estado: Mapped[str] = mapped_column(
        String(20), default="BORRADOR", nullable=False
    )
    total_presupuestado: Mapped[float] = mapped_column(
        Numeric(15, 2), nullable=False, default=0
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    tenant_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )


class PresupuestoPartida(Base):
    """Partida del presupuesto."""

    __tablename__ = "presupuesto_partida"
    __table_args__ = {"schema": "presupuestos"}

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    presupuesto_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    edt_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    apu_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    codigo: Mapped[str] = mapped_column(String(20), nullable=False)
    descripcion: Mapped[str] = mapped_column(String(255), nullable=False)
    unidad_medida: Mapped[str] = mapped_column(String(10), nullable=False)
    metrado: Mapped[float] = mapped_column(Numeric(15, 4), nullable=False, default=0)
    precio_unitario: Mapped[float] = mapped_column(
        Numeric(15, 4), nullable=False, default=0
    )
    parcial: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False, default=0)
    fase: Mapped[str | None] = mapped_column(String(100), nullable=True)
    orden: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    tenant_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
