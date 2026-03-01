"""Modelos SQLAlchemy para el schema 'rrhh'.

Fase 2d: Stub model — FK target only, no service/router yet.
Fase 3: CertificacionOperador, HabilidadOperador, DisponibilidadOperador.
Columns match the actual live DB schema.
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
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

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


# ─── Operator Certifications ─────────────────────────────────────────────


class CertificacionOperador(Base):
    """Modelo para rrhh.operador_certificacion."""

    __tablename__ = "operador_certificacion"
    __table_args__ = {"schema": "rrhh"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    trabajador_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("rrhh.trabajador.id", ondelete="CASCADE"), nullable=False, index=True
    )
    nombre_certificacion: Mapped[str] = mapped_column(String(200), nullable=False)
    numero_certificacion: Mapped[str | None] = mapped_column(String(100), nullable=True)
    fecha_emision: Mapped[date | None] = mapped_column(Date, nullable=True)
    fecha_vencimiento: Mapped[date | None] = mapped_column(Date, nullable=True)
    entidad_emisora: Mapped[str | None] = mapped_column(String(200), nullable=True)
    estado: Mapped[str] = mapped_column(String(20), default="VIGENTE", nullable=False)
    tenant_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    trabajador: Mapped[Trabajador] = relationship("Trabajador", lazy="joined")


# ─── Operator Skills ─────────────────────────────────────────────────────


class HabilidadOperador(Base):
    """Modelo para rrhh.operador_habilidad."""

    __tablename__ = "operador_habilidad"
    __table_args__ = {"schema": "rrhh"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    trabajador_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("rrhh.trabajador.id", ondelete="CASCADE"), nullable=False, index=True
    )
    tipo_equipo: Mapped[str] = mapped_column(String(100), nullable=False)
    nivel_habilidad: Mapped[str] = mapped_column(String(20), default="PRINCIPIANTE", nullable=False)
    anios_experiencia: Mapped[float] = mapped_column(Numeric(4, 1), default=0, nullable=False)
    ultima_verificacion: Mapped[date | None] = mapped_column(Date, nullable=True)
    tenant_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    trabajador: Mapped[Trabajador] = relationship("Trabajador", lazy="joined")


# ─── Operator Availability ───────────────────────────────────────────────


class DisponibilidadOperador(Base):
    """Modelo para rrhh.disponibilidad_operador."""

    __tablename__ = "disponibilidad_operador"
    __table_args__ = (
        UniqueConstraint("trabajador_id", "fecha", "tenant_id", name="uq_disp_op_fecha"),
        {"schema": "rrhh"},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    trabajador_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("rrhh.trabajador.id"), nullable=False, index=True
    )
    fecha: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    disponible: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    observacion: Mapped[str | None] = mapped_column(Text, nullable=True)
    tenant_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
