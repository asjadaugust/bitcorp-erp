"""Add missing columns to equipo.parte_diario for cross-surface consistency.

Columns: gps_latitude, gps_longitude, gps_accuracy, weather_conditions,
combustible_cargado. Also ensures turno, lugar_llegada, responsable_frente
exist (IF NOT EXISTS for safety).

Revision ID: 022_parte_diario_missing_fields
Revises: 021_seed_missing_data
Create Date: 2026-03-06
"""

import sqlalchemy as sa
from alembic import op

revision = "022_parte_diario_missing_fields"
down_revision = "021_seed_missing_data"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()

    conn.execute(sa.text("""
        ALTER TABLE equipo.parte_diario
            ADD COLUMN IF NOT EXISTS turno VARCHAR(20),
            ADD COLUMN IF NOT EXISTS lugar_llegada TEXT,
            ADD COLUMN IF NOT EXISTS gps_latitude NUMERIC(12,8),
            ADD COLUMN IF NOT EXISTS gps_longitude NUMERIC(12,8),
            ADD COLUMN IF NOT EXISTS gps_accuracy NUMERIC(6,1),
            ADD COLUMN IF NOT EXISTS weather_conditions VARCHAR(50),
            ADD COLUMN IF NOT EXISTS combustible_cargado NUMERIC(10,2),
            ADD COLUMN IF NOT EXISTS responsable_frente VARCHAR(255)
    """))


def downgrade() -> None:
    conn = op.get_bind()

    conn.execute(sa.text("""
        ALTER TABLE equipo.parte_diario
            DROP COLUMN IF EXISTS gps_latitude,
            DROP COLUMN IF EXISTS gps_longitude,
            DROP COLUMN IF EXISTS gps_accuracy,
            DROP COLUMN IF EXISTS weather_conditions,
            DROP COLUMN IF EXISTS combustible_cargado
    """))
