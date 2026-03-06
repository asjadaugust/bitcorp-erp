"""Add estado column to proveedores.proveedor.

Revision ID: 019_provider_estado
Revises: 018_presupuestos_schema
Create Date: 2026-03-06
"""

import sqlalchemy as sa
from alembic import op

revision = "019_provider_estado"
down_revision = "018_presupuestos_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()

    # Add estado column (nullable, default ACTIVO)
    conn.execute(sa.text("""
        ALTER TABLE proveedores.proveedor
        ADD COLUMN IF NOT EXISTS estado VARCHAR(50) DEFAULT 'ACTIVO'
    """))

    # Populate from is_active: True → ACTIVO, False → EMPRESA_CERRADA
    conn.execute(sa.text("""
        UPDATE proveedores.proveedor
        SET estado = CASE WHEN is_active = TRUE THEN 'ACTIVO' ELSE 'EMPRESA_CERRADA' END
        WHERE estado IS NULL OR estado = 'ACTIVO'
    """))


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("""
        ALTER TABLE proveedores.proveedor DROP COLUMN IF EXISTS estado
    """))
