"""Modelos SQLAlchemy para el schema 'aprobaciones'.

Fase 4: 7 modelos del motor de aprobaciones.
"""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.modelos.base import Base


class PlantillaAprobacion(Base):
    """Modelo para aprobaciones.plantilla_aprobacion."""

    __tablename__ = "plantilla_aprobacion"
    __table_args__ = {"schema": "aprobaciones"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    nombre: Mapped[str] = mapped_column(String(200), nullable=False)
    module_name: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    proyecto_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    estado: Mapped[str] = mapped_column(String(20), default="ACTIVO", nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    created_by: Mapped[int | None] = mapped_column(Integer, nullable=True)


class PlantillaPaso(Base):
    """Modelo para aprobaciones.plantilla_paso."""

    __tablename__ = "plantilla_paso"
    __table_args__ = {"schema": "aprobaciones"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    plantilla_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("aprobaciones.plantilla_aprobacion.id", ondelete="CASCADE"),
        nullable=False,
    )
    paso_numero: Mapped[int] = mapped_column(Integer, nullable=False)
    nombre_paso: Mapped[str] = mapped_column(String(200), nullable=False)
    tipo_aprobador: Mapped[str] = mapped_column(String(20), nullable=False)
    rol: Mapped[str | None] = mapped_column(String(50), nullable=True)
    usuario_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    logica_aprobacion: Mapped[str] = mapped_column(
        String(30), default="FIRST_APPROVES", nullable=False
    )
    es_opcional: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )


class SolicitudAprobacion(Base):
    """Modelo para aprobaciones.solicitud_aprobacion."""

    __tablename__ = "solicitud_aprobacion"
    __table_args__ = {"schema": "aprobaciones"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    plantilla_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("aprobaciones.plantilla_aprobacion.id"), nullable=True
    )
    plantilla_version: Mapped[int | None] = mapped_column(Integer, nullable=True)
    module_name: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_id: Mapped[int] = mapped_column(Integer, nullable=False)
    proyecto_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    usuario_solicitante_id: Mapped[int] = mapped_column(Integer, nullable=False)
    titulo: Mapped[str] = mapped_column(String(200), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    estado: Mapped[str] = mapped_column(String(20), default="PENDIENTE", nullable=False)
    paso_actual: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    fecha_creacion: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    fecha_completado: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completado_por_id: Mapped[int | None] = mapped_column(Integer, nullable=True)


class PasoSolicitud(Base):
    """Modelo para aprobaciones.paso_solicitud."""

    __tablename__ = "paso_solicitud"
    __table_args__ = {"schema": "aprobaciones"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    solicitud_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("aprobaciones.solicitud_aprobacion.id"), nullable=False
    )
    paso_numero: Mapped[int] = mapped_column(Integer, nullable=False)
    aprobador_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    estado_paso: Mapped[str] = mapped_column(String(20), default="PENDIENTE", nullable=False)
    accion_fecha: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    comentario: Mapped[str | None] = mapped_column(Text, nullable=True)


class AuditoriaAprobacion(Base):
    """Modelo para aprobaciones.auditoria_aprobacion."""

    __tablename__ = "auditoria_aprobacion"
    __table_args__ = {"schema": "aprobaciones"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    solicitud_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    solicitud_adhoc_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    plantilla_version: Mapped[int | None] = mapped_column(Integer, nullable=True)
    accion: Mapped[str] = mapped_column(String(30), nullable=False)
    usuario_id: Mapped[int] = mapped_column(Integer, nullable=False)
    paso_numero: Mapped[int | None] = mapped_column(Integer, nullable=True)
    comentario: Mapped[str | None] = mapped_column(Text, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    metadata_json: Mapped[dict | None] = mapped_column("metadata", JSONB, nullable=True)


class SolicitudAdhoc(Base):
    """Modelo para aprobaciones.solicitud_adhoc."""

    __tablename__ = "solicitud_adhoc"
    __table_args__ = {"schema": "aprobaciones"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    usuario_solicitante_id: Mapped[int] = mapped_column(Integer, nullable=False)
    titulo: Mapped[str] = mapped_column(String(200), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    aprobadores: Mapped[dict] = mapped_column(JSONB, nullable=False)
    usuarios_cc: Mapped[dict] = mapped_column(JSONB, nullable=False)
    logica_aprobacion: Mapped[str] = mapped_column(
        String(30), default="FIRST_APPROVES", nullable=False
    )
    estado: Mapped[str] = mapped_column(String(20), default="PENDIENTE", nullable=False)
    fecha_creacion: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    fecha_completado: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    archivos_adjuntos: Mapped[dict | None] = mapped_column(JSONB, nullable=True)


class RespuestaAdhoc(Base):
    """Modelo para aprobaciones.respuesta_adhoc."""

    __tablename__ = "respuesta_adhoc"
    __table_args__ = {"schema": "aprobaciones"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    solicitud_adhoc_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("aprobaciones.solicitud_adhoc.id"), nullable=False
    )
    aprobador_id: Mapped[int] = mapped_column(Integer, nullable=False)
    respuesta: Mapped[str] = mapped_column(String(20), nullable=False)
    comentario: Mapped[str | None] = mapped_column(Text, nullable=True)
    fecha_respuesta: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
