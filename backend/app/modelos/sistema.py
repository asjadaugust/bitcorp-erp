"""Modelos SQLAlchemy para el schema 'sistema'.

Tablas: usuario, rol, usuario_rol, unidad_operativa.
"""

from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.modelos.base import Base

# Tabla de asociación many-to-many: usuario_rol
tabla_usuario_rol = Table(
    "usuario_rol",
    Base.metadata,
    Column("usuario_id", Integer, ForeignKey("sistema.usuario.id"), primary_key=True),
    Column("rol_id", Integer, ForeignKey("sistema.rol.id"), primary_key=True),
    schema="sistema",
)


class Rol(Base):
    """Modelo para sistema.rol."""

    __tablename__ = "rol"
    __table_args__ = {"schema": "sistema"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    codigo: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    nivel: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
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

    usuarios: Mapped[list["Usuario"]] = relationship(
        "Usuario", secondary=tabla_usuario_rol, back_populates="roles"
    )


class UnidadOperativa(Base):
    """Modelo para sistema.unidad_operativa (tenant)."""

    __tablename__ = "unidad_operativa"
    __table_args__ = {"schema": "sistema"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    legacy_id: Mapped[str | None] = mapped_column(
        String(50), unique=True, nullable=True
    )
    codigo: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    ubicacion: Mapped[str | None] = mapped_column(String(255), nullable=True)
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


class Usuario(Base):
    """Modelo para sistema.usuario."""

    __tablename__ = "usuario"
    __table_args__ = {"schema": "sistema"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    legacy_id: Mapped[str | None] = mapped_column(
        String(50), unique=True, nullable=True
    )
    nombre_usuario: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False
    )
    contrasena: Mapped[str] = mapped_column(String(255), nullable=False)
    nombres: Mapped[str | None] = mapped_column(String(100), nullable=True)
    apellidos: Mapped[str | None] = mapped_column(String(100), nullable=True)
    correo_electronico: Mapped[str | None] = mapped_column(String(100), nullable=True)
    dni: Mapped[str | None] = mapped_column(String(20), nullable=True)
    telefono: Mapped[str | None] = mapped_column(String(20), nullable=True)
    rol_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("sistema.rol.id"), nullable=True
    )
    unidad_operativa_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("sistema.unidad_operativa.id"), nullable=True
    )
    tenant_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    ultimo_acceso: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
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

    rol_directo: Mapped[Rol | None] = relationship(
        "Rol", foreign_keys=[rol_id], lazy="joined"
    )
    unidad_operativa: Mapped[UnidadOperativa | None] = relationship(
        "UnidadOperativa", foreign_keys=[unidad_operativa_id], lazy="joined"
    )
    roles: Mapped[list[Rol]] = relationship(
        "Rol", secondary=tabla_usuario_rol, back_populates="usuarios", lazy="joined"
    )

    @property
    def nombre_completo(self) -> str:
        return f"{self.nombres or ''} {self.apellidos or ''}".strip()

    @property
    def rol_principal(self) -> str:
        """Obtener el rol principal: directo (rol_id) o el primero de many-to-many."""
        if self.rol_directo and self.rol_directo.codigo:
            return self.rol_directo.codigo
        if self.roles:
            for r in self.roles:
                if r.codigo:
                    return r.codigo
        return "OPERADOR"


# ─── Permissions ─────────────────────────────────────────────────────────


class Permiso(Base):
    """Modelo para sistema.permiso (from tbl_G00006_Permiso)."""

    __tablename__ = "permiso"
    __table_args__ = {"schema": "sistema"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    legacy_id: Mapped[str | None] = mapped_column(
        String(50), unique=True, nullable=True
    )
    proceso: Mapped[str | None] = mapped_column(String(50), nullable=True)
    modulo: Mapped[str | None] = mapped_column(String(50), nullable=True)
    permiso: Mapped[str | None] = mapped_column(String(50), nullable=True)
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


# Tabla de asociación many-to-many: rol_permiso (from tbl_G00005_RolPermiso)
tabla_rol_permiso = Table(
    "rol_permiso",
    Base.metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("rol_id", Integer, ForeignKey("sistema.rol.id"), nullable=True),
    Column("permiso_id", Integer, ForeignKey("sistema.permiso.id"), nullable=True),
    schema="sistema",
)


class UsuarioRolUnidadOperativa(Base):
    """Modelo para sistema.usuario_rol_unidad_operativa (from tbl_G00003)."""

    __tablename__ = "usuario_rol_unidad_operativa"
    __table_args__ = {"schema": "sistema"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    legacy_id: Mapped[str | None] = mapped_column(
        String(50), unique=True, nullable=True
    )
    usuario_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("sistema.usuario.id"), nullable=True
    )
    rol_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("sistema.rol.id"), nullable=True
    )
    unidad_operativa_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("sistema.unidad_operativa.id"), nullable=True
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


class ComponenteUnidadOperativa(Base):
    """Modelo para sistema.componente_unidad_operativa (from tbl_G00007)."""

    __tablename__ = "componente_unidad_operativa"
    __table_args__ = {"schema": "sistema"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    legacy_id: Mapped[str | None] = mapped_column(
        String(50), unique=True, nullable=True
    )
    codigo: Mapped[str | None] = mapped_column(String(20), nullable=True)
    componente: Mapped[str | None] = mapped_column(String(50), nullable=True)
    unidad_operativa_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("sistema.unidad_operativa.id"), nullable=True
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
