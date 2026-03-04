"""Modelos SQLAlchemy para el schema 'sst'.

Fase 5: Incidente.
Legacy: ListaActoCondicionInseguro, SeguimientoInspeccionSsoma,
        SeguimientoInspeccion, ReporteActoCondicion.
Columns match 001_init_schema.sql sst.incidente.
"""

from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.modelos.base import Base


class Incidente(Base):
    """Modelo para sst.incidente."""

    __tablename__ = "incidente"
    __table_args__ = {"schema": "sst"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    legacy_id: Mapped[str | None] = mapped_column(
        String(50), unique=True, nullable=True
    )
    fecha_incidente: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, index=True
    )
    tipo_incidente: Mapped[str | None] = mapped_column(
        String(100), nullable=True, index=True
    )
    severidad: Mapped[str | None] = mapped_column(String(50), nullable=True)
    ubicacion: Mapped[str | None] = mapped_column(Text, nullable=True)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    acciones_tomadas: Mapped[str | None] = mapped_column(Text, nullable=True)
    proyecto_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("proyectos.edt.id"), nullable=True, index=True
    )
    reportado_por: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("sistema.usuario.id"), nullable=True
    )
    estado: Mapped[str] = mapped_column(
        String(50), default="ABIERTO", nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )


# ─── Legacy: SST Tables ─────────────────────────────────────────────────


class ListaActoCondicionInseguro(Base):
    """Modelo para sst.lista_acto_condicion_inseguro (from tbl_C02000)."""

    __tablename__ = "lista_acto_condicion_inseguro"
    __table_args__ = {"schema": "sst"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    legacy_id: Mapped[str | None] = mapped_column(
        String(50), unique=True, nullable=True
    )
    codigo: Mapped[str | None] = mapped_column(String(5), nullable=True)
    acto_condicion: Mapped[str | None] = mapped_column(String(100), nullable=True)
    categoria: Mapped[str | None] = mapped_column(String(20), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class SeguimientoInspeccionSsoma(Base):
    """Modelo para sst.seguimiento_inspeccion_ssoma (from tbl_C02091)."""

    __tablename__ = "seguimiento_inspeccion_ssoma"
    __table_args__ = {"schema": "sst"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    legacy_id: Mapped[str | None] = mapped_column(
        String(50), unique=True, nullable=True
    )
    fecha_hallazgo: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    lugar_hallazgo: Mapped[str | None] = mapped_column(String(50), nullable=True)
    tipo_inspeccion: Mapped[str | None] = mapped_column(String(20), nullable=True)
    inspector_dni: Mapped[str | None] = mapped_column(String(8), nullable=True)
    inspector: Mapped[str | None] = mapped_column(String(100), nullable=True)
    descripcion_hallazgo: Mapped[str | None] = mapped_column(String(250), nullable=True)
    link_foto: Mapped[str | None] = mapped_column(String(250), nullable=True)
    nivel_riesgo: Mapped[str | None] = mapped_column(String(10), nullable=True)
    causas_hallazgo: Mapped[str | None] = mapped_column(String(250), nullable=True)
    responsable_subsanacion: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )
    fecha_subsanacion: Mapped[date | None] = mapped_column(Date, nullable=True)
    estado: Mapped[str | None] = mapped_column(String(20), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class SeguimientoInspeccion(Base):
    """Modelo para sst.seguimiento_inspeccion (from tbl_C020911)."""

    __tablename__ = "seguimiento_inspeccion"
    __table_args__ = {"schema": "sst"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    legacy_id: Mapped[str | None] = mapped_column(
        String(50), unique=True, nullable=True
    )
    fecha: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    inspector_dni: Mapped[str | None] = mapped_column(String(10), nullable=True)
    inspector: Mapped[str | None] = mapped_column(String(100), nullable=True)
    descripcion_inspeccion: Mapped[str | None] = mapped_column(
        String(250), nullable=True
    )
    link_evidencia: Mapped[str | None] = mapped_column(String(200), nullable=True)
    fecha_proxima_inspeccion: Mapped[date | None] = mapped_column(Date, nullable=True)
    avance_estimado: Mapped[int | None] = mapped_column(Integer, nullable=True)
    seguimiento_ssoma_legacy_id: Mapped[str | None] = mapped_column(
        String(50), nullable=True
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


class ReporteActoCondicion(Base):
    """Modelo para sst.reporte_acto_condicion (from tbl_C02105)."""

    __tablename__ = "reporte_acto_condicion"
    __table_args__ = {"schema": "sst"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    legacy_id: Mapped[str | None] = mapped_column(
        String(50), unique=True, nullable=True
    )
    fecha_registro: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    registrado_por_dni: Mapped[str | None] = mapped_column(String(8), nullable=True)
    registrado_por: Mapped[str | None] = mapped_column(String(60), nullable=True)
    modificado_por: Mapped[str | None] = mapped_column(String(100), nullable=True)
    fecha_modificacion: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    unidad_operativa_legacy_id: Mapped[str | None] = mapped_column(
        String(10), nullable=True
    )
    reportado_por_dni: Mapped[str | None] = mapped_column(String(8), nullable=True)
    reportado_por_nombre: Mapped[str | None] = mapped_column(String(60), nullable=True)
    cargo: Mapped[str | None] = mapped_column(String(50), nullable=True)
    empresa_reportante: Mapped[str | None] = mapped_column(String(100), nullable=True)
    fecha_evento: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    lugar: Mapped[str | None] = mapped_column(String(30), nullable=True)
    empresa: Mapped[str | None] = mapped_column(String(50), nullable=True)
    sistema_gestion: Mapped[str | None] = mapped_column(String(20), nullable=True)
    tipo_reporte: Mapped[str | None] = mapped_column(String(20), nullable=True)
    codigo_acto_condicion: Mapped[str | None] = mapped_column(String(10), nullable=True)
    acto_condicion: Mapped[str | None] = mapped_column(String(100), nullable=True)
    dano_a: Mapped[str | None] = mapped_column(String(200), nullable=True)
    descripcion: Mapped[str | None] = mapped_column(String(200), nullable=True)
    como_actue: Mapped[str | None] = mapped_column(String(200), nullable=True)
    estado: Mapped[str | None] = mapped_column(String(10), nullable=True)
    por_que_1: Mapped[str | None] = mapped_column(String(100), nullable=True)
    por_que_2: Mapped[str | None] = mapped_column(String(100), nullable=True)
    por_que_3: Mapped[str | None] = mapped_column(String(100), nullable=True)
    por_que_4: Mapped[str | None] = mapped_column(String(100), nullable=True)
    por_que_5: Mapped[str | None] = mapped_column(String(100), nullable=True)
    accion_correctiva: Mapped[str | None] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
