"""Create presupuestos schema with insumo, apu, apu_insumo, presupuesto, presupuesto_partida.

Revision ID: 018_presupuestos_schema
Revises: 017_provider_documents_and_logs
Create Date: 2026-03-06
"""

import sqlalchemy as sa
from alembic import op

revision = "018_presupuestos_schema"
down_revision = "017_provider_documents_and_logs"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()

    # ── 1. Create schema ─────────────────────────────────────────────────────
    conn.execute(sa.text("CREATE SCHEMA IF NOT EXISTS presupuestos;"))

    # ── 2. insumo — Recurso maestro ──────────────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS presupuestos.insumo (
            id                SERIAL PRIMARY KEY,
            codigo            VARCHAR(20) NOT NULL,
            nombre            VARCHAR(255) NOT NULL,
            unidad_medida     VARCHAR(10) NOT NULL,
            tipo              VARCHAR(20) NOT NULL,
            precio_unitario   NUMERIC(15,4) NOT NULL DEFAULT 0,
            equipo_tipo_id    INTEGER,
            is_active         BOOLEAN NOT NULL DEFAULT TRUE,
            tenant_id         INTEGER NOT NULL DEFAULT 1,
            created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_insumo_codigo ON presupuestos.insumo(codigo);
        CREATE INDEX IF NOT EXISTS idx_insumo_tenant ON presupuestos.insumo(tenant_id);
        CREATE INDEX IF NOT EXISTS idx_insumo_tipo ON presupuestos.insumo(tipo);
    """))

    # ── 3. apu — Analisis de Precios Unitarios ───────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS presupuestos.apu (
            id                SERIAL PRIMARY KEY,
            codigo            VARCHAR(20) NOT NULL,
            nombre            VARCHAR(255) NOT NULL,
            unidad_medida     VARCHAR(10) NOT NULL,
            rendimiento       NUMERIC(12,4) NOT NULL DEFAULT 1,
            jornada           NUMERIC(4,2) NOT NULL DEFAULT 8.00,
            descripcion       TEXT,
            is_active         BOOLEAN NOT NULL DEFAULT TRUE,
            tenant_id         INTEGER NOT NULL DEFAULT 1,
            created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_apu_codigo ON presupuestos.apu(codigo);
        CREATE INDEX IF NOT EXISTS idx_apu_tenant ON presupuestos.apu(tenant_id);
    """))

    # ── 4. apu_insumo — Lineas de APU (recursión via sub_apu_id) ─────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS presupuestos.apu_insumo (
            id                SERIAL PRIMARY KEY,
            apu_id            INTEGER NOT NULL REFERENCES presupuestos.apu(id) ON DELETE CASCADE,
            insumo_id         INTEGER REFERENCES presupuestos.insumo(id),
            sub_apu_id        INTEGER REFERENCES presupuestos.apu(id),
            tipo              VARCHAR(20) NOT NULL,
            cantidad          NUMERIC(12,4) NOT NULL DEFAULT 1,
            precio            NUMERIC(15,4),
            aporte            NUMERIC(12,6),
            es_porcentaje     BOOLEAN NOT NULL DEFAULT FALSE,
            porcentaje        NUMERIC(5,2),
            orden             INTEGER NOT NULL DEFAULT 0,
            is_active         BOOLEAN NOT NULL DEFAULT TRUE,
            tenant_id         INTEGER NOT NULL DEFAULT 1,
            CONSTRAINT ck_apu_insumo_ref CHECK (insumo_id IS NOT NULL OR sub_apu_id IS NOT NULL)
        );

        CREATE INDEX IF NOT EXISTS idx_apu_insumo_apu ON presupuestos.apu_insumo(apu_id);
        CREATE INDEX IF NOT EXISTS idx_apu_insumo_tenant ON presupuestos.apu_insumo(tenant_id);
    """))

    # ── 5. presupuesto — Presupuesto de obra ─────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS presupuestos.presupuesto (
            id                    SERIAL PRIMARY KEY,
            proyecto_id           INTEGER NOT NULL,
            codigo                VARCHAR(50) NOT NULL,
            nombre                VARCHAR(255) NOT NULL,
            descripcion           TEXT,
            fecha                 DATE NOT NULL,
            version               INTEGER NOT NULL DEFAULT 1,
            estado                VARCHAR(20) NOT NULL DEFAULT 'BORRADOR',
            total_presupuestado   NUMERIC(15,2) NOT NULL DEFAULT 0,
            is_active             BOOLEAN NOT NULL DEFAULT TRUE,
            tenant_id             INTEGER NOT NULL DEFAULT 1,
            created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_presupuesto_proyecto ON presupuestos.presupuesto(proyecto_id);
        CREATE INDEX IF NOT EXISTS idx_presupuesto_codigo ON presupuestos.presupuesto(codigo);
        CREATE INDEX IF NOT EXISTS idx_presupuesto_tenant ON presupuestos.presupuesto(tenant_id);
    """))

    # ── 6. presupuesto_partida — Partidas del presupuesto ────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS presupuestos.presupuesto_partida (
            id                SERIAL PRIMARY KEY,
            presupuesto_id    INTEGER NOT NULL REFERENCES presupuestos.presupuesto(id) ON DELETE CASCADE,
            edt_id            INTEGER,
            apu_id            INTEGER REFERENCES presupuestos.apu(id),
            codigo            VARCHAR(20) NOT NULL,
            descripcion       VARCHAR(255) NOT NULL,
            unidad_medida     VARCHAR(10) NOT NULL,
            metrado           NUMERIC(15,4) NOT NULL DEFAULT 0,
            precio_unitario   NUMERIC(15,4) NOT NULL DEFAULT 0,
            parcial           NUMERIC(15,2) NOT NULL DEFAULT 0,
            fase              VARCHAR(100),
            orden             INTEGER NOT NULL DEFAULT 0,
            is_active         BOOLEAN NOT NULL DEFAULT TRUE,
            tenant_id         INTEGER NOT NULL DEFAULT 1
        );

        CREATE INDEX IF NOT EXISTS idx_partida_presupuesto ON presupuestos.presupuesto_partida(presupuesto_id);
        CREATE INDEX IF NOT EXISTS idx_partida_tenant ON presupuestos.presupuesto_partida(tenant_id);
    """))


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS presupuestos.presupuesto_partida CASCADE;")
    op.execute("DROP TABLE IF EXISTS presupuestos.apu_insumo CASCADE;")
    op.execute("DROP TABLE IF EXISTS presupuestos.presupuesto CASCADE;")
    op.execute("DROP TABLE IF EXISTS presupuestos.apu CASCADE;")
    op.execute("DROP TABLE IF EXISTS presupuestos.insumo CASCADE;")
    op.execute("DROP SCHEMA IF EXISTS presupuestos CASCADE;")
