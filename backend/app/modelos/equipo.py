"""Modelos SQLAlchemy para el schema 'equipo'.

Fase 1: TipoEquipo, PrecalentamientoConfig, ConfiguracionCombustible.
Fase 2: Equipo, ContratoAdenda, ValorizacionEquipo, RegistroPago, etc.
"""

from datetime import date, datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.modelos.base import Base


class TipoEquipo(Base):
    """Modelo para equipo.tipo_equipo."""

    __tablename__ = "tipo_equipo"
    __table_args__ = {"schema": "equipo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    codigo: Mapped[str] = mapped_column(String(5), unique=True, nullable=False)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    categoria_prd: Mapped[str] = mapped_column(String(30), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class PrecalentamientoConfig(Base):
    """Modelo para equipo.precalentamiento_config."""

    __tablename__ = "precalentamiento_config"
    __table_args__ = {"schema": "equipo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tipo_equipo_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("equipo.tipo_equipo.id"), unique=True, nullable=False
    )
    horas_precalentamiento: Mapped[float] = mapped_column(
        Numeric(4, 2), default=0, nullable=False
    )
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    tipo_equipo: Mapped[TipoEquipo] = relationship("TipoEquipo", lazy="joined")


class ConfiguracionCombustible(Base):
    """Modelo para equipo.configuracion_combustible."""

    __tablename__ = "configuracion_combustible"
    __table_args__ = {"schema": "equipo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    precio_manipuleo: Mapped[float] = mapped_column(
        Numeric(10, 2), default=0.8, nullable=False
    )
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    updated_by: Mapped[int | None] = mapped_column(Integer, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class Equipo(Base):
    """Modelo para equipo.equipo - Equipos disponibles para alquiler."""

    __tablename__ = "equipo"
    __table_args__ = {"schema": "equipo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    codigo: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    marca: Mapped[str] = mapped_column(String(50), nullable=False)
    modelo: Mapped[str] = mapped_column(String(100), nullable=False)
    anio_fabricacion: Mapped[int] = mapped_column(Integer, nullable=False)
    placa: Mapped[str | None] = mapped_column(String(20), nullable=True)
    numero_serie: Mapped[str | None] = mapped_column(String(100), nullable=True)
    tipo_equipo_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("equipo.tipo_equipo.id"), nullable=False
    )
    tarifa_horaria: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    estado: Mapped[str] = mapped_column(String(20), default="DISPONIBLE", nullable=False)
    tenant_id: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    tipo_equipo: Mapped[TipoEquipo] = relationship("TipoEquipo", lazy="joined")


class ContratoAdenda(Base):
    """Modelo para equipo.contrato_adenda - Contrato de alquiler de equipo."""

    __tablename__ = "contrato_adenda"
    __table_args__ = {"schema": "equipo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    numero_contrato: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    equipo_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("equipo.equipo.id"), nullable=False
    )
    proveedor_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    proyecto_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    fecha_inicio: Mapped[date] = mapped_column(nullable=False)
    fecha_termino: Mapped[date] = mapped_column(nullable=False)
    estado: Mapped[str] = mapped_column(String(20), default="ACTIVO", nullable=False)
    tarifa_horaria: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    horas_incluidas: Mapped[float] = mapped_column(Numeric(8, 2), default=0, nullable=False)
    penalidad_exceso: Mapped[float] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    tenant_id: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    equipo: Mapped[Equipo] = relationship("Equipo", lazy="joined")


class ValorizacionEquipo(Base):
    """Modelo para equipo.valorizacion_equipo - Valorización de equipo alquilado."""

    __tablename__ = "valorizacion_equipo"
    __table_args__ = {"schema": "equipo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    numero_valorizacion: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    contrato_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("equipo.contrato_adenda.id"), nullable=False
    )
    equipo_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("equipo.equipo.id"), nullable=False
    )
    proyecto_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    periodo_inicio: Mapped[date] = mapped_column(nullable=False)
    periodo_fin: Mapped[date] = mapped_column(nullable=False)
    horas_operadas: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    total_valorizado: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    igv_porcentaje: Mapped[float] = mapped_column(Numeric(5, 2), default=18, nullable=False)
    igv_monto: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    total_con_igv: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    estado: Mapped[str] = mapped_column(String(20), default="BORRADOR", nullable=False)
    combustible_costo: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    cargos_adicionales: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    descuentos: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    tenant_id: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    contrato: Mapped[ContratoAdenda] = relationship("ContratoAdenda", lazy="joined")
    equipo: Mapped[Equipo] = relationship("Equipo", lazy="joined")


class ValorizacionDocumentoPago(Base):
    """Modelo para equipo.valorizacion_documento_pago - Documentos de pago de valorización."""

    __tablename__ = "valorizacion_documento_pago"
    __table_args__ = {"schema": "equipo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    valorizacion_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("equipo.valorizacion_equipo.id"), nullable=False
    )
    tipo_documento: Mapped[str] = mapped_column(String(20), nullable=False)
    numero_documento: Mapped[str] = mapped_column(String(50), nullable=False)
    fecha_documento: Mapped[date] = mapped_column(nullable=False)
    estado: Mapped[str] = mapped_column(String(20), default="PENDIENTE", nullable=False)
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    valorizacion: Mapped[ValorizacionEquipo] = relationship("ValorizacionEquipo", lazy="joined")


class RegistroPago(Base):
    """Modelo para equipo.registro_pago - Registro de pagos realizados."""

    __tablename__ = "registro_pago"
    __table_args__ = {"schema": "equipo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    valorizacion_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("equipo.valorizacion_equipo.id"), nullable=False
    )
    numero_pago: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    contrato_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("equipo.contrato_adenda.id"), nullable=False
    )
    proyecto_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    fecha_pago: Mapped[date] = mapped_column(nullable=False)
    monto_pagado: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    moneda: Mapped[str] = mapped_column(String(10), default="PEN", nullable=False)
    tipo_cambio: Mapped[float | None] = mapped_column(Numeric(10, 4), nullable=True)
    metodo_pago: Mapped[str] = mapped_column(String(20), nullable=False)
    banco_origen: Mapped[str | None] = mapped_column(String(50), nullable=True)
    banco_destino: Mapped[str | None] = mapped_column(String(50), nullable=True)
    cuenta_origen: Mapped[str | None] = mapped_column(String(30), nullable=True)
    cuenta_destino: Mapped[str | None] = mapped_column(String(30), nullable=True)
    numero_operacion: Mapped[str | None] = mapped_column(String(50), nullable=True)
    numero_cheque: Mapped[str | None] = mapped_column(String(20), nullable=True)
    comprobante_tipo: Mapped[str | None] = mapped_column(String(20), nullable=True)
    comprobante_numero: Mapped[str | None] = mapped_column(String(50), nullable=True)
    comprobante_fecha: Mapped[date | None] = mapped_column(nullable=True)
    estado: Mapped[str] = mapped_column(String(20), default="PENDIENTE", nullable=False)
    conciliado: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    fecha_conciliacion: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)
    referencia_interna: Mapped[str | None] = mapped_column(String(100), nullable=True)
    registrado_por_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    aprobado_por_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    fecha_registro: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    fecha_aprobacion: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    valorizacion: Mapped[ValorizacionEquipo] = relationship("ValorizacionEquipo", lazy="joined")
    contrato: Mapped[ContratoAdenda] = relationship("ContratoAdenda", lazy="joined")


# ─── Contract Obligations Models ────────────────────────────────────────────


class ContratoObligacion(Base):
    """Modelo para equipo.contrato_obligacion - Obligaciones del arrendador."""

    __tablename__ = "contrato_obligacion"
    __table_args__ = {"schema": "equipo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    contrato_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("equipo.contrato_adenda.id"), nullable=False
    )
    tipo_obligacion: Mapped[str] = mapped_column(String(50), nullable=False)
    estado: Mapped[str] = mapped_column(String(20), default="PENDIENTE", nullable=False)
    fecha_compromiso: Mapped[date | None] = mapped_column(nullable=True)
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    contrato: Mapped[ContratoAdenda] = relationship("ContratoAdenda", lazy="joined")


class ContratoObligacionArrendatario(Base):
    """Modelo para equipo.contrato_obligacion_arrendatario - Obligaciones del arrendatario."""

    __tablename__ = "contrato_obligacion_arrendatario"
    __table_args__ = {"schema": "equipo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    contrato_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("equipo.contrato_adenda.id"), nullable=False
    )
    tipo_obligacion: Mapped[str] = mapped_column(String(50), nullable=False)
    estado: Mapped[str] = mapped_column(String(20), default="PENDIENTE", nullable=False)
    fecha_compromiso: Mapped[date | None] = mapped_column(nullable=True)
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    contrato: Mapped[ContratoAdenda] = relationship("ContratoAdenda", lazy="joined")


class ContratoAnexo(Base):
    """Modelo para equipo.contrato_anexo - Anexos al contrato."""

    __tablename__ = "contrato_anexo"
    __table_args__ = {"schema": "equipo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    contrato_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("equipo.contrato_adenda.id"), nullable=False
    )
    numero_anexo: Mapped[str] = mapped_column(String(20), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    contrato: Mapped[ContratoAdenda] = relationship("ContratoAdenda", lazy="joined")


class ContratoDocumentoRequerido(Base):
    """Modelo para equipo.contrato_documento_requerido - Documentos requeridos para el contrato."""

    __tablename__ = "contrato_documento_requerido"
    __table_args__ = {"schema": "equipo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    contrato_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("equipo.contrato_adenda.id"), nullable=False
    )
    tipo_documento: Mapped[str] = mapped_column(String(50), nullable=False)
    estado: Mapped[str] = mapped_column(String(20), default="PENDIENTE", nullable=False)
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    contrato: Mapped[ContratoAdenda] = relationship("ContratoAdenda", lazy="joined")


class ContratoLegalizacionPaso(Base):
    """Modelo para equipo.contrato_legalizacion_paso - Pasos de legalización del contrato."""

    __tablename__ = "contrato_legalizacion_paso"
    __table_args__ = {"schema": "equipo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    contrato_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("equipo.contrato_adenda.id"), nullable=False
    )
    numero_paso: Mapped[int] = mapped_column(Integer, nullable=False)
    tipo_paso: Mapped[str] = mapped_column(String(50), nullable=False)
    estado: Mapped[str] = mapped_column(String(20), default="PENDIENTE", nullable=False)
    fecha_completado: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    contrato: Mapped[ContratoAdenda] = relationship("ContratoAdenda", lazy="joined")


# ─── Daily Report Models ───────────────────────────────────────────────────


class ParteDiario(Base):
    """Modelo para equipo.parte_diario - Reporte diario del operario."""

    __tablename__ = "parte_diario"
    __table_args__ = {"schema": "equipo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    numero_parte: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    codigo: Mapped[str] = mapped_column(String(20), nullable=False)
    equipo_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("equipo.equipo.id"), nullable=False
    )
    trabajador_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    proyecto_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    fecha: Mapped[date] = mapped_column(nullable=False)
    turno: Mapped[str] = mapped_column(String(20), nullable=False)
    horometro_inicial: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    horometro_final: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    horas_trabajadas: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    horas_precalentamiento: Mapped[float] = mapped_column(Numeric(4, 2), default=0, nullable=False)
    produccion_total: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    estado: Mapped[str] = mapped_column(String(20), default="PENDIENTE", nullable=False)
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)
    tenant_id: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    equipo: Mapped[Equipo] = relationship("Equipo", lazy="joined")


class ParteDiarioProduccion(Base):
    """Modelo para equipo.parte_diario_produccion - Producción en el reporte diario."""

    __tablename__ = "parte_diario_produccion"
    __table_args__ = {"schema": "equipo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    parte_diario_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("equipo.parte_diario.id"), nullable=False
    )
    tipo: Mapped[str] = mapped_column(String(20), nullable=False)
    cantidad: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    unidad: Mapped[str] = mapped_column(String(20), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class ParteDiarioActividadProduccion(Base):
    """Modelo para equipo.parte_diario_actividad_produccion - Actividad de producción."""

    __tablename__ = "parte_diario_actividad_produccion"
    __table_args__ = {"schema": "equipo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    parte_diario_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("equipo.parte_diario.id"), nullable=False
    )
    descripcion: Mapped[str] = mapped_column(String(255), nullable=False)
    cantidad: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    unidad: Mapped[str] = mapped_column(String(20), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class ParteDiarioDemoraOperativa(Base):
    """Modelo para equipo.parte_diario_demora_operativa - Demora operativa."""

    __tablename__ = "parte_diario_demora_operativa"
    __table_args__ = {"schema": "equipo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    parte_diario_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("equipo.parte_diario.id"), nullable=False
    )
    codigo: Mapped[str] = mapped_column(String(10), nullable=False)
    horas: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class ParteDiarioDemoraMecanica(Base):
    """Modelo para equipo.parte_diario_demora_mecanica - Demora mecánica."""

    __tablename__ = "parte_diario_demora_mecanica"
    __table_args__ = {"schema": "equipo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    parte_diario_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("equipo.parte_diario.id"), nullable=False
    )
    codigo: Mapped[str] = mapped_column(String(10), nullable=False)
    horas: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class ParteDiarioOtroEvento(Base):
    """Modelo para equipo.parte_diario_otro_evento - Otros eventos en el reporte diario."""

    __tablename__ = "parte_diario_otro_evento"
    __table_args__ = {"schema": "equipo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    parte_diario_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("equipo.parte_diario.id"), nullable=False
    )
    codigo: Mapped[str] = mapped_column(String(10), nullable=False)
    descripcion: Mapped[str] = mapped_column(String(255), nullable=False)
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class ParteDiarioFoto(Base):
    """Modelo para equipo.parte_diario_foto - Fotos del reporte diario."""

    __tablename__ = "parte_diario_foto"
    __table_args__ = {"schema": "equipo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    parte_diario_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("equipo.parte_diario.id"), nullable=False
    )
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
