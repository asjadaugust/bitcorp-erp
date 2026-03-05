"""Fix equipo.equipo is_active and contrato_adenda tipo NULL seed values.

equipo.equipo: all 79 legacy rows have is_active=NULL; service filters
  WHERE is_active = TRUE -> zero results.
equipo.contrato_adenda: all 111 legacy rows have tipo=NULL; service filters
  WHERE tipo = 'CONTRATO' -> zero results.

Revision ID: 012_fix_equipo_nulls
Revises: 011_fix_equipo_tenant_ids
Create Date: 2026-03-05
"""

from alembic import op
import sqlalchemy as sa

revision = "012_fix_equipo_nulls"
down_revision = "011_fix_equipo_tenant_ids"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    # All legacy equipment records are active
    conn.execute(sa.text(
        "UPDATE equipo.equipo SET is_active = TRUE WHERE is_active IS NULL"
    ))
    # All 111 legacy records are root contracts (addenda were separate in legacy system)
    conn.execute(sa.text(
        "UPDATE equipo.contrato_adenda SET tipo = 'CONTRATO' WHERE tipo IS NULL"
    ))


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text(
        "UPDATE equipo.equipo SET is_active = NULL WHERE is_active = TRUE"
    ))
    conn.execute(sa.text(
        "UPDATE equipo.contrato_adenda SET tipo = NULL WHERE tipo = 'CONTRATO'"
    ))
