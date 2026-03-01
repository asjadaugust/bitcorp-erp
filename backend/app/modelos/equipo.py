"""Modelos SQLAlchemy para el schema 'equipo'.

Fase 1: TipoEquipo, PrecalentamientoConfig, ConfiguracionCombustible.
Fase 2: Equipo, ContratoAdenda, ValorizacionEquipo, RegistroPago, etc.
"""

from datetime import date, datetime, time

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text, Time, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.modelos.base import Base
from app.modelos.proveedores import Proveedor
from app.modelos.proyectos import Edt
from app.modelos.rrhh import Trabajador


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


# ─── Equipment ────────────────────────────────────────────────────────────────


class Equipo(Base):
    """Modelo para equipo.equipo - Equipos disponibles para alquiler."""

    __tablename__ = "equipo"
    __table_args__ = {"schema": "equipo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    legacy_id: Mapped[str | None] = mapped_column(String(50), unique=True, nullable=True)
    codigo_equipo: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    tipo_equipo_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("equipo.tipo_equipo.id"), nullable=True
    )
    proveedor_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("proveedores.proveedor.id"), nullable=True
    )
    tipo_proveedor: Mapped[str | None] = mapped_column(String(50), nullable=True)
    categoria: Mapped[str | None] = mapped_column(String(50), nullable=True)
    placa: Mapped[str | None] = mapped_column(String(20), nullable=True)
    marca: Mapped[str | None] = mapped_column(String(100), nullable=True)
    modelo: Mapped[str | None] = mapped_column(String(100), nullable=True)
    numero_serie_equipo: Mapped[str | None] = mapped_column(String(100), nullable=True)
    numero_chasis: Mapped[str | None] = mapped_column(String(100), nullable=True)
    numero_serie_motor: Mapped[str | None] = mapped_column(String(100), nullable=True)
    anio_fabricacion: Mapped[int | None] = mapped_column(Integer, nullable=True)
    potencia_neta: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    tipo_motor: Mapped[str | None] = mapped_column(String(50), nullable=True)
    medidor_uso: Mapped[str | None] = mapped_column(String(20), nullable=True)
    estado: Mapped[str] = mapped_column(String(50), default="DISPONIBLE", nullable=False)
    fecha_venc_poliza: Mapped[date | None] = mapped_column(nullable=True)
    fecha_venc_soat: Mapped[date | None] = mapped_column(nullable=True)
    fecha_venc_citv: Mapped[date | None] = mapped_column(nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    tenant_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    tipo_equipo_rel: Mapped[TipoEquipo | None] = relationship("TipoEquipo", lazy="joined")
    proveedor: Mapped[Proveedor | None] = relationship("Proveedor", lazy="joined")


# ─── Contract ─────────────────────────────────────────────────────────────────


class ContratoAdenda(Base):
    """Modelo para equipo.contrato_adenda - Contrato de alquiler de equipo."""

    __tablename__ = "contrato_adenda"
    __table_args__ = {"schema": "equipo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    legacy_id: Mapped[str | None] = mapped_column(String(50), unique=True, nullable=True)
    equipo_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("equipo.equipo.id"), nullable=False
    )
    proveedor_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("proveedores.proveedor.id"), nullable=True
    )
    numero_contrato: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    tipo: Mapped[str] = mapped_column(String(50), default="CONTRATO")
    contrato_padre_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("equipo.contrato_adenda.id"), nullable=True
    )
    fecha_contrato: Mapped[date] = mapped_column(nullable=False)
    fecha_inicio: Mapped[date] = mapped_column(nullable=False)
    fecha_fin: Mapped[date] = mapped_column(nullable=False)
    moneda: Mapped[str] = mapped_column(String(3), default="PEN")
    modalidad: Mapped[str | None] = mapped_column(String(50), nullable=True)
    tipo_tarifa: Mapped[str | None] = mapped_column(String(50), nullable=True)
    tarifa: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    incluye_motor: Mapped[bool] = mapped_column(Boolean, default=False)
    incluye_operador: Mapped[bool] = mapped_column(Boolean, default=False)
    costo_adicional_motor: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    horas_incluidas: Mapped[int | None] = mapped_column(Integer, nullable=True)
    minimo_por: Mapped[str | None] = mapped_column(String(20), nullable=True)
    cantidad_minima: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    penalidad_exceso: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    documento_acredita: Mapped[str | None] = mapped_column(String(200), nullable=True)
    fecha_acreditada: Mapped[date | None] = mapped_column(nullable=True)
    jurisdiccion: Mapped[str | None] = mapped_column(String(200), nullable=True)
    plazo_texto: Mapped[str | None] = mapped_column(String(200), nullable=True)
    motivo_resolucion: Mapped[str | None] = mapped_column(Text, nullable=True)
    fecha_resolucion: Mapped[date | None] = mapped_column(nullable=True)
    monto_liquidacion: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    causal_resolucion: Mapped[str | None] = mapped_column(String(30), nullable=True)
    resuelto_por: Mapped[int | None] = mapped_column(Integer, nullable=True)
    fecha_liquidacion: Mapped[date | None] = mapped_column(nullable=True)
    liquidado_por: Mapped[int | None] = mapped_column(Integer, nullable=True)
    observaciones_liquidacion: Mapped[str | None] = mapped_column(Text, nullable=True)
    condiciones_especiales: Mapped[str | None] = mapped_column(Text, nullable=True)
    documento_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    estado: Mapped[str] = mapped_column(String(50), default="ACTIVO", nullable=False)
    creado_por: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
    tenant_id: Mapped[int | None] = mapped_column(Integer, nullable=True)

    equipo: Mapped[Equipo] = relationship("Equipo", lazy="joined")
    proveedor: Mapped[Proveedor | None] = relationship("Proveedor", lazy="joined")
    contrato_padre: Mapped["ContratoAdenda | None"] = relationship(
        "ContratoAdenda",
        remote_side="ContratoAdenda.id",
        back_populates="adendas",
        lazy="select",
    )
    adendas: Mapped[list["ContratoAdenda"]] = relationship(
        "ContratoAdenda",
        back_populates="contrato_padre",
        lazy="select",
    )


# ─── Valuation ────────────────────────────────────────────────────────────────


class ValorizacionEquipo(Base):
    """Modelo para equipo.valorizacion_equipo - Valorización de equipo alquilado."""

    __tablename__ = "valorizacion_equipo"
    __table_args__ = {"schema": "equipo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    legacy_id: Mapped[str | None] = mapped_column(String(50), unique=True, nullable=True)
    equipo_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("equipo.equipo.id"), nullable=False
    )
    contrato_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("equipo.contrato_adenda.id"), nullable=True
    )
    proyecto_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    periodo: Mapped[str] = mapped_column(String(7), nullable=False)
    fecha_inicio: Mapped[date] = mapped_column(nullable=False)
    fecha_fin: Mapped[date] = mapped_column(nullable=False)
    dias_trabajados: Mapped[int | None] = mapped_column(Integer, nullable=True)
    horas_trabajadas: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    combustible_consumido: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    costo_base: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    costo_combustible: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    cargos_adicionales: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    importe_manipuleo: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    importe_gasto_obra: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    importe_adelanto: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    importe_exceso_combustible: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    total_valorizado: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    numero_valorizacion: Mapped[str | None] = mapped_column(String(20), nullable=True)
    tipo_cambio: Mapped[float | None] = mapped_column(Numeric(10, 4), nullable=True)
    descuento_porcentaje: Mapped[float] = mapped_column(Numeric(5, 2), default=0)
    descuento_monto: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    igv_porcentaje: Mapped[float] = mapped_column(Numeric(5, 2), default=18.0)
    igv_monto: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    total_con_igv: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    estado: Mapped[str] = mapped_column(String(50), default="BORRADOR", nullable=False)
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)
    creado_por: Mapped[int | None] = mapped_column(Integer, nullable=True)
    aprobado_por: Mapped[int | None] = mapped_column(Integer, nullable=True)
    aprobado_en: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    validado_por: Mapped[int | None] = mapped_column(Integer, nullable=True)
    validado_en: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    conformidad_proveedor: Mapped[bool] = mapped_column(Boolean, default=False)
    conformidad_fecha: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    conformidad_observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)
    solicitud_aprobacion_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
    tenant_id: Mapped[int | None] = mapped_column(Integer, nullable=True)

    contrato_rel: Mapped[ContratoAdenda | None] = relationship("ContratoAdenda", lazy="joined")
    equipo_rel: Mapped[Equipo] = relationship("Equipo", lazy="joined")


class ValorizacionDocumentoPago(Base):
    """Modelo para equipo.valorizacion_documento_pago - Documentos de pago de valorización."""

    __tablename__ = "valorizacion_documento_pago"
    __table_args__ = {"schema": "equipo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    valorizacion_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("equipo.valorizacion_equipo.id"), nullable=False
    )
    tipo_documento: Mapped[str] = mapped_column(String(50), nullable=False)
    numero: Mapped[str | None] = mapped_column(String(100), nullable=True)
    fecha_documento: Mapped[date | None] = mapped_column(nullable=True)
    archivo_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    estado: Mapped[str] = mapped_column(String(20), default="PENDIENTE", nullable=False)
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
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
    contrato_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("equipo.contrato_adenda.id"), nullable=True
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
    fecha_registro: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
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
    tipo_anexo: Mapped[str] = mapped_column(String(1), nullable=False)
    orden: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    concepto: Mapped[str] = mapped_column(String(500), nullable=False)
    incluido: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
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
    provider_document_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    estado: Mapped[str] = mapped_column(String(20), default="PENDIENTE", nullable=False)
    fecha_vencimiento: Mapped[date | None] = mapped_column(nullable=True)
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
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
    tipo_paso: Mapped[str] = mapped_column(String(40), nullable=False)
    completado: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    fecha_completado: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completado_por: Mapped[int | None] = mapped_column(Integer, nullable=True)
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)
    tenant_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    contrato: Mapped[ContratoAdenda] = relationship("ContratoAdenda", lazy="joined")


# ─── Daily Report Models ───────────────────────────────────────────────────


class ParteDiario(Base):
    """Modelo para equipo.parte_diario - Reporte diario del operario."""

    __tablename__ = "parte_diario"
    __table_args__ = {"schema": "equipo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    legacy_id: Mapped[str | None] = mapped_column(String(50), unique=True, nullable=True)
    equipo_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("equipo.equipo.id"), nullable=False
    )
    trabajador_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("rrhh.trabajador.id"), nullable=True
    )
    proyecto_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("proyectos.edt.id"), nullable=True
    )
    valorizacion_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("equipo.valorizacion_equipo.id"), nullable=True
    )
    fecha: Mapped[date] = mapped_column(nullable=False)
    hora_inicio: Mapped[time | None] = mapped_column(Time, nullable=True)
    hora_fin: Mapped[time | None] = mapped_column(Time, nullable=True)
    horas_trabajadas: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    horometro_inicial: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    horometro_final: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    odometro_inicial: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    odometro_final: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    km_recorridos: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    combustible_inicial: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    combustible_consumido: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    horas_precalentamiento: Mapped[float] = mapped_column(Numeric(5, 2), default=0)
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)
    estado: Mapped[str] = mapped_column(String(50), default="BORRADOR", nullable=False)
    creado_por: Mapped[int | None] = mapped_column(Integer, nullable=True)
    aprobado_por: Mapped[int | None] = mapped_column(Integer, nullable=True)
    aprobado_en: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    codigo: Mapped[str | None] = mapped_column(String(50), nullable=True)
    empresa: Mapped[str | None] = mapped_column(String(100), nullable=True)
    placa: Mapped[str | None] = mapped_column(String(20), nullable=True)
    responsable_frente: Mapped[str | None] = mapped_column(String(100), nullable=True)
    turno: Mapped[str | None] = mapped_column(String(20), nullable=True)
    numero_parte: Mapped[int | None] = mapped_column(Integer, nullable=True)
    petroleo_gln: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    gasolina_gln: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    hora_abastecimiento: Mapped[time | None] = mapped_column(Time, nullable=True)
    num_vale_combustible: Mapped[str | None] = mapped_column(String(50), nullable=True)
    horometro_kilometraje: Mapped[str | None] = mapped_column(String(100), nullable=True)
    lugar_salida: Mapped[str | None] = mapped_column(String(200), nullable=True)
    lugar_llegada: Mapped[str | None] = mapped_column(String(200), nullable=True)
    observaciones_correcciones: Mapped[str | None] = mapped_column(Text, nullable=True)
    firma_operador: Mapped[str | None] = mapped_column(Text, nullable=True)
    firma_supervisor: Mapped[str | None] = mapped_column(Text, nullable=True)
    firma_jefe_equipos: Mapped[str | None] = mapped_column(Text, nullable=True)
    firma_residente: Mapped[str | None] = mapped_column(Text, nullable=True)
    firma_planeamiento_control: Mapped[str | None] = mapped_column(Text, nullable=True)
    solicitud_aprobacion_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
    tenant_id: Mapped[int | None] = mapped_column(Integer, nullable=True)

    equipo: Mapped[Equipo] = relationship("Equipo", lazy="joined")
    trabajador: Mapped[Trabajador | None] = relationship("Trabajador", lazy="joined")
    proyecto: Mapped[Edt | None] = relationship("Edt", lazy="joined")
    valorizacion: Mapped[ValorizacionEquipo | None] = relationship(
        "ValorizacionEquipo", lazy="select"
    )


class ParteDiarioProduccion(Base):
    """Modelo para equipo.parte_diario_produccion - Produccion en el reporte diario."""

    __tablename__ = "parte_diario_produccion"
    __table_args__ = {"schema": "equipo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    parte_diario_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("equipo.parte_diario.id"), nullable=False
    )
    numero: Mapped[int] = mapped_column(Integer, nullable=False)
    ubicacion_labores_prog_ini: Mapped[str | None] = mapped_column(String(100), nullable=True)
    ubicacion_labores_prog_fin: Mapped[str | None] = mapped_column(String(100), nullable=True)
    hora_ini: Mapped[time | None] = mapped_column(Time, nullable=True)
    hora_fin: Mapped[time | None] = mapped_column(Time, nullable=True)
    material_trabajado_descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    metrado: Mapped[str | None] = mapped_column(String(50), nullable=True)
    edt: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class ParteDiarioActividadProduccion(Base):
    """Modelo para equipo.parte_diario_actividad_produccion - Actividad de produccion."""

    __tablename__ = "parte_diario_actividad_produccion"
    __table_args__ = {"schema": "equipo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    parte_diario_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("equipo.parte_diario.id"), nullable=False
    )
    codigo: Mapped[str] = mapped_column(String(10), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
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
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class ParteDiarioDemoraMecanica(Base):
    """Modelo para equipo.parte_diario_demora_mecanica - Demora mecanica."""

    __tablename__ = "parte_diario_demora_mecanica"
    __table_args__ = {"schema": "equipo"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    parte_diario_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("equipo.parte_diario.id"), nullable=False
    )
    codigo: Mapped[str] = mapped_column(String(10), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    resuelta: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    fecha_resolucion: Mapped[date | None] = mapped_column(nullable=True)
    observacion_resolucion: Mapped[str | None] = mapped_column(Text, nullable=True)
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
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
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
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    original_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    mime_type: Mapped[str] = mapped_column(String(100), default="image/jpeg", nullable=False)
    size: Mapped[int | None] = mapped_column(Integer, nullable=True)
    orden: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    tenant_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
