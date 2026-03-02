"""Add valorizacion detail tables: gasto_en_obra, adelanto_amortizacion, analisis_combustible.

Also ALTER vale_combustible (add valorizacion_id FK) and contrato_adenda (add precio_manipuleo).

Revision ID: 002_val_detail
Create Date: 2026-03-01
"""

from alembic import op

revision = "002_val_detail"
down_revision = "001_align_enums"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── New table: equipo.gasto_en_obra ──────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS equipo.gasto_en_obra (
            id SERIAL PRIMARY KEY,
            valorizacion_id INT NOT NULL
                REFERENCES equipo.valorizacion_equipo(id) ON DELETE CASCADE,
            fecha DATE NOT NULL,
            proveedor VARCHAR(200),
            concepto VARCHAR(300),
            tipo_documento VARCHAR(20),
            numero_documento VARCHAR(50),
            importe NUMERIC(12,2) NOT NULL DEFAULT 0,
            incluye_igv BOOLEAN NOT NULL DEFAULT FALSE,
            importe_sin_igv NUMERIC(12,2) NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            tenant_id INT NOT NULL
        );
    """)

    # ── New table: equipo.adelanto_amortizacion ──────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS equipo.adelanto_amortizacion (
            id SERIAL PRIMARY KEY,
            contrato_id INT NOT NULL
                REFERENCES equipo.contrato_adenda(id) ON DELETE CASCADE,
            equipo_id INT NOT NULL
                REFERENCES equipo.equipo(id) ON DELETE CASCADE,
            valorizacion_id INT
                REFERENCES equipo.valorizacion_equipo(id) ON DELETE SET NULL,
            tipo_operacion VARCHAR(20) NOT NULL,
            fecha DATE NOT NULL,
            numero_documento VARCHAR(50),
            concepto VARCHAR(300),
            numero_cuota VARCHAR(20),
            monto NUMERIC(12,2) NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            tenant_id INT NOT NULL
        );
    """)

    # ── New table: equipo.analisis_combustible ───────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS equipo.analisis_combustible (
            id SERIAL PRIMARY KEY,
            valorizacion_id INT NOT NULL
                REFERENCES equipo.valorizacion_equipo(id) ON DELETE CASCADE,
            consumo_combustible NUMERIC(10,2) DEFAULT 0,
            tipo_horometro_odometro VARCHAR(20),
            lectura_inicio NUMERIC(10,4) DEFAULT 0,
            lectura_final NUMERIC(10,4) DEFAULT 0,
            total_uso NUMERIC(10,4) DEFAULT 0,
            rendimiento NUMERIC(10,4) DEFAULT 0,
            ratio_control NUMERIC(10,4) DEFAULT 0,
            diferencia NUMERIC(10,4) DEFAULT 0,
            exceso_combustible NUMERIC(10,4) DEFAULT 0,
            precio_unitario NUMERIC(10,4) DEFAULT 0,
            importe_exceso NUMERIC(12,4) DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    """)

    # ── ALTER: equipo.vale_combustible — add valorizacion_id FK ──────────
    op.execute("""
        ALTER TABLE equipo.vale_combustible
        ADD COLUMN IF NOT EXISTS valorizacion_id INT
            REFERENCES equipo.valorizacion_equipo(id) ON DELETE SET NULL;
    """)

    # ── ALTER: equipo.contrato_adenda — add precio_manipuleo ─────────────
    op.execute("""
        ALTER TABLE equipo.contrato_adenda
        ADD COLUMN IF NOT EXISTS precio_manipuleo NUMERIC(10,2) DEFAULT 0;
    """)


def downgrade() -> None:
    op.execute("ALTER TABLE equipo.contrato_adenda DROP COLUMN IF EXISTS precio_manipuleo;")
    op.execute("ALTER TABLE equipo.vale_combustible DROP COLUMN IF EXISTS valorizacion_id;")
    op.execute("DROP TABLE IF EXISTS equipo.analisis_combustible;")
    op.execute("DROP TABLE IF EXISTS equipo.adelanto_amortizacion;")
    op.execute("DROP TABLE IF EXISTS equipo.gasto_en_obra;")
