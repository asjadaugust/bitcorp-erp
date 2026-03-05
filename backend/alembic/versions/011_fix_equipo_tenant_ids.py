"""Fix equipo schema tenant_ids — back-fill NULL to 1.

All legacy equipment data was seeded without a tenant_id (NULL), but the
equipo services filter exclusively by tenant_id == id_empresa. The admin user
has unidad_operativa_id = 1, so set tenant_id = 1 for all affected rows.

Revision ID: 011_fix_equipo_tenant_ids
Revises: 010_seed_operational_data
Create Date: 2026-03-05
"""

from alembic import op
import sqlalchemy as sa

revision = "011_fix_equipo_tenant_ids"
down_revision = "010_seed_operational_data"
branch_labels = None
depends_on = None

_TABLES = [
    "equipo.equipo",
    "equipo.contrato_adenda",
    "equipo.valorizacion_equipo",
    "equipo.parte_diario",
]


def upgrade() -> None:
    conn = op.get_bind()
    for table in _TABLES:
        conn.execute(
            sa.text(f"UPDATE {table} SET tenant_id = 1 WHERE tenant_id IS NULL")
        )


def downgrade() -> None:
    conn = op.get_bind()
    for table in _TABLES:
        conn.execute(
            sa.text(f"UPDATE {table} SET tenant_id = NULL WHERE tenant_id = 1")
        )
