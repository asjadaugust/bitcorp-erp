"""Initial schema: create all tables from current SQLAlchemy models.

This migration bootstraps a fresh database. It creates all schemas and then
calls Base.metadata.create_all() which derives the exact CREATE TABLE DDL from
the SQLAlchemy model definitions — the single authoritative source of truth.

Running on an existing database is safe: create_all(checkfirst=True) silently
skips tables that already exist.

Revision ID: 000_initial_schema
Create Date: 2026-03-01
"""

from alembic import op

revision = "000_initial_schema"
down_revision = None
branch_labels = None
depends_on = None

_SCHEMAS = [
    "sistema",
    "proyectos",
    "proveedores",
    "administracion",
    "rrhh",
    "logistica",
    "equipo",
    "sst",
    "sig",
    "aprobaciones",
    "catalogo",
    "presupuestos",
]


def upgrade() -> None:
    # ── 1. Extensions ─────────────────────────────────────────────────────────
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    # ── 2. Schemas ────────────────────────────────────────────────────────────
    for schema in _SCHEMAS:
        op.execute(f"CREATE SCHEMA IF NOT EXISTS {schema}")

    # ── 3. Tables (derived from SQLAlchemy models) ────────────────────────────
    # Import every model module so their classes register with Base.metadata.
    import app.modelos.administracion  # noqa: F401
    import app.modelos.aprobaciones  # noqa: F401
    import app.modelos.catalogo  # noqa: F401
    import app.modelos.checklist  # noqa: F401
    import app.modelos.equipo  # noqa: F401
    import app.modelos.licitacion  # noqa: F401
    import app.modelos.logistica  # noqa: F401
    import app.modelos.presupuestos  # noqa: F401
    import app.modelos.proveedores  # noqa: F401
    import app.modelos.proyectos  # noqa: F401
    import app.modelos.publico  # noqa: F401
    import app.modelos.rrhh  # noqa: F401
    import app.modelos.sig  # noqa: F401
    import app.modelos.sistema  # noqa: F401
    import app.modelos.sst  # noqa: F401
    import app.modelos.tarea_programada  # noqa: F401

    from app.modelos.base import Base

    # checkfirst=True: silently skips tables that already exist.
    bind = op.get_bind()
    Base.metadata.create_all(bind=bind, checkfirst=True)


def downgrade() -> None:
    import app.modelos.administracion  # noqa: F401
    import app.modelos.aprobaciones  # noqa: F401
    import app.modelos.catalogo  # noqa: F401
    import app.modelos.checklist  # noqa: F401
    import app.modelos.equipo  # noqa: F401
    import app.modelos.licitacion  # noqa: F401
    import app.modelos.logistica  # noqa: F401
    import app.modelos.presupuestos  # noqa: F401
    import app.modelos.proveedores  # noqa: F401
    import app.modelos.proyectos  # noqa: F401
    import app.modelos.publico  # noqa: F401
    import app.modelos.rrhh  # noqa: F401
    import app.modelos.sig  # noqa: F401
    import app.modelos.sistema  # noqa: F401
    import app.modelos.sst  # noqa: F401
    import app.modelos.tarea_programada  # noqa: F401

    from app.modelos.base import Base

    bind = op.get_bind()
    Base.metadata.drop_all(bind=bind, checkfirst=True)

    for schema in reversed(_SCHEMAS):
        op.execute(f"DROP SCHEMA IF EXISTS {schema} CASCADE")
