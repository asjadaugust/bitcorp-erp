"""Fix equipo.contrato_adenda incluye_motor and incluye_operador NULL values.

All 111 legacy contracts have incluye_motor=NULL and incluye_operador=NULL.
ContratoListaDto defines these as bool (not bool|None), causing Pydantic
validation errors -> 500 on every GET /api/contracts/ request.

Revision ID: 013_fix_contrato_bools
Revises: 012_fix_equipo_nulls
Create Date: 2026-03-05
"""

from alembic import op
import sqlalchemy as sa

revision = "013_fix_contrato_bools"
down_revision = "012_fix_equipo_nulls"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text(
        "UPDATE equipo.contrato_adenda SET incluye_motor = FALSE WHERE incluye_motor IS NULL"
    ))
    conn.execute(sa.text(
        "UPDATE equipo.contrato_adenda SET incluye_operador = FALSE WHERE incluye_operador IS NULL"
    ))


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text(
        "UPDATE equipo.contrato_adenda SET incluye_motor = NULL WHERE incluye_motor = FALSE"
    ))
    conn.execute(sa.text(
        "UPDATE equipo.contrato_adenda SET incluye_operador = NULL WHERE incluye_operador = FALSE"
    ))
