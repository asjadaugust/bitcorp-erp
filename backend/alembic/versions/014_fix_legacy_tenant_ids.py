"""Fix legacy tenant_ids for accounts-payable, providers, and operators.

All legacy data seeded from the SQL Server migration has tenant_id = NULL.
The service layers filter exclusively by tenant_id == id_empresa (1 for the
default admin user), so these APIs return 0 rows despite having seed data:

  - administracion.cuenta_por_pagar  6,958 rows → /api/accounts-payable/
  - proveedores.proveedor              529 rows → /api/providers/
  - rrhh.trabajador                    455 rows → /api/operators/

Revision ID: 014_fix_legacy_tenant_ids
Revises: 013_fix_contrato_bools
Create Date: 2026-03-05
"""

from alembic import op
import sqlalchemy as sa

revision = "014_fix_legacy_tenant_ids"
down_revision = "013_fix_contrato_bools"
branch_labels = None
depends_on = None

_TABLES = [
    "administracion.cuenta_por_pagar",
    "proveedores.proveedor",
    "rrhh.trabajador",
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
