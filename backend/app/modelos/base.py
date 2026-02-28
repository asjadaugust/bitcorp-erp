"""Base declarativa y mixins comunes para modelos SQLAlchemy."""

from datetime import datetime

from sqlalchemy import DateTime, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Clase base para todos los modelos SQLAlchemy."""

    pass


class MixinAuditoria:
    """Mixin para campos de auditoría (created_at, updated_at)."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class MixinTenant:
    """Mixin para soporte multi-tenant."""

    tenant_id: Mapped[int] = mapped_column(nullable=False, index=True)
