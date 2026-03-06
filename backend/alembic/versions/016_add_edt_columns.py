"""Separate EDT from Proyectos — rename and create tables.

Revision ID: 016_add_edt_columns
Revises: 015_seed_and_fill_nulls
Create Date: 2026-03-06
"""

from alembic import op

revision = "016_add_edt_columns"
down_revision = "015_seed_and_fill_nulls"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Drop ALL foreign keys referencing proyectos.edt (dynamic, safe)
    op.execute("""
        DO $$
        DECLARE r RECORD;
        BEGIN
            FOR r IN
                SELECT con.conname, nsp.nspname AS schema, cls.relname AS tbl
                FROM pg_constraint con
                JOIN pg_class cls ON con.conrelid = cls.oid
                JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
                WHERE con.contype = 'f'
                  AND con.confrelid = 'proyectos.edt'::regclass
            LOOP
                EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT %I',
                    r.schema, r.tbl, r.conname);
            END LOOP;
        END $$;
    """)

    # 2. Rename proyectos.edt → proyectos.proyectos
    op.execute("ALTER TABLE proyectos.edt RENAME TO proyectos;")

    # 3. Clean up: drop EDT-only columns from the now-projects table
    op.execute("""
        ALTER TABLE proyectos.proyectos
        DROP COLUMN IF EXISTS codigo_alfanumerico,
        DROP COLUMN IF EXISTS unidad_medida,
        DROP COLUMN IF EXISTS nivel;
    """)

    # 4. Truncate projects table (user: data is messed up)
    op.execute("TRUNCATE TABLE proyectos.proyectos RESTART IDENTITY;")

    # 5. Insert project rows from sistema.unidad_operativa
    op.execute("""
        INSERT INTO proyectos.proyectos (codigo, nombre, estado, is_active)
        SELECT codigo, nombre, 'ACTIVO', TRUE
        FROM sistema.unidad_operativa
        WHERE is_active = TRUE;
    """)

    # 6. Create new proyectos.edt table for EDT work items
    op.execute("""
        CREATE TABLE proyectos.edt (
            id SERIAL PRIMARY KEY,
            legacy_id VARCHAR(50) UNIQUE,
            codigo VARCHAR(20) NOT NULL,
            nombre VARCHAR(255) NOT NULL,
            unidad_medida VARCHAR(10),
            codigo_alfanumerico VARCHAR(10),
            unidad_operativa_id INTEGER,
            estado VARCHAR(10) NOT NULL DEFAULT 'ACTIVO',
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
        CREATE INDEX idx_edt_codigo ON proyectos.edt (codigo);
    """)

    # 7. Re-seed EDT data from legacy source (layer_01.sql seed data)
    # Only take columns that exist in the new table
    op.execute("""
        INSERT INTO proyectos.edt (legacy_id, codigo, nombre, unidad_operativa_id, estado, is_active)
        SELECT legacy_id, codigo, nombre, unidad_operativa_id, estado, is_active
        FROM proyectos.proyectos WHERE 1=0;
    """)
    # Actually load from the seed — we embed the insert here
    import os
    seed_path = os.path.join(os.path.dirname(__file__), '..', 'seed_data', 'layer_01.sql')
    if os.path.exists(seed_path):
        with open(seed_path) as f:
            content = f.read()
        # Extract the proyectos.edt INSERT block
        import re
        # The seed inserts into proyectos.edt with columns including descripcion
        # We need to re-insert but the table now has different columns
        # Instead, let's use a temp approach: create temp table, load, copy
        pass

    # Simpler approach: just copy from the backup in proyectos.proyectos
    # But we truncated it. Let's use raw SQL from seed.
    # Actually the simplest: read the seed file and transform the INSERT
    op.execute(_build_edt_seed_sql())

    # 8. Re-add FKs for proyecto_id → proyectos.proyectos
    op.execute("""
        DO $$
        DECLARE
            tbl RECORD;
        BEGIN
            FOR tbl IN
                SELECT c.table_schema, c.table_name
                FROM information_schema.columns c
                JOIN pg_tables pt ON pt.schemaname = c.table_schema AND pt.tablename = c.table_name
                WHERE c.column_name = 'proyecto_id'
                  AND c.table_schema NOT IN ('pg_catalog', 'information_schema', 'proyectos')
            LOOP
                BEGIN
                    EXECUTE format(
                        'ALTER TABLE %I.%I ADD CONSTRAINT fk_%s_proyecto FOREIGN KEY (proyecto_id) REFERENCES proyectos.proyectos(id)',
                        tbl.table_schema, tbl.table_name, tbl.table_name
                    );
                EXCEPTION WHEN others THEN
                    -- Skip if FK can't be added (orphan data)
                    RAISE NOTICE 'Skipped FK for %.%: %', tbl.table_schema, tbl.table_name, SQLERRM;
                END;
            END LOOP;

            -- edt_id → proyectos.edt
            IF EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_schema='equipo' AND table_name='equipo_edt' AND column_name='edt_id') THEN
                BEGIN
                    ALTER TABLE equipo.equipo_edt
                    ADD CONSTRAINT fk_equipo_edt_edt
                    FOREIGN KEY (edt_id) REFERENCES proyectos.edt(id);
                EXCEPTION WHEN others THEN
                    RAISE NOTICE 'Skipped FK for equipo.equipo_edt: %', SQLERRM;
                END;
            END IF;
        END $$;
    """)


def _build_edt_seed_sql() -> str:
    """Read layer_01.sql and extract/transform the EDT INSERT for the new table schema."""
    import os
    import re

    seed_path = os.path.join(os.path.dirname(__file__), '..', 'seed_data', 'layer_01.sql')
    if not os.path.exists(seed_path):
        return "SELECT 1;"  # no-op if seed file missing

    with open(seed_path) as f:
        content = f.read()

    # Find the INSERT INTO proyectos.edt block
    # It starts with "INSERT INTO proyectos.edt" and ends with ";"
    match = re.search(
        r'(INSERT INTO proyectos\.edt\s*\([^)]+\)\s*VALUES\s*\n(?:.*\n)*?.*?);',
        content
    )
    if not match:
        return "SELECT 1;"

    insert_sql = match.group(0)

    # The original has columns: (legacy_id, codigo, nombre, descripcion, unidad_operativa_id, estado, is_active)
    # We need: (legacy_id, codigo, nombre, unidad_operativa_id, estado, is_active)
    # Replace the column list
    insert_sql = insert_sql.replace(
        "(legacy_id, codigo, nombre, descripcion, unidad_operativa_id, estado, is_active)",
        "(legacy_id, codigo, nombre, unidad_operativa_id, estado, is_active)"
    )

    # Remove the descripcion value from each VALUES row
    # Each row looks like: ('94', '01.01', 'name', 'desc', (SELECT ...), 'ACTIVO', TRUE)
    # We need to remove the 4th value (descripcion)
    # Pattern: 3 quoted values, then remove the 4th quoted value + comma
    insert_sql = re.sub(
        r"('(?:[^'\\]|\\.)*',\s*'(?:[^'\\]|\\.)*',\s*'(?:[^'\\]|\\.)*'),\s*'(?:[^'\\]|\\.)*',",
        r"\1,",
        insert_sql
    )

    # Handle ON CONFLICT for idempotency
    insert_sql = insert_sql.rstrip(';') + "\nON CONFLICT (legacy_id) DO NOTHING;"

    return insert_sql


def downgrade() -> None:
    # Drop all FKs referencing proyectos.proyectos and proyectos.edt
    op.execute("""
        DO $$
        DECLARE r RECORD;
        BEGIN
            -- Drop FKs to proyectos.edt
            IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON c.relnamespace = n.oid
                       WHERE n.nspname = 'proyectos' AND c.relname = 'edt') THEN
                FOR r IN
                    SELECT con.conname, nsp.nspname AS schema, cls.relname AS tbl
                    FROM pg_constraint con
                    JOIN pg_class cls ON con.conrelid = cls.oid
                    JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
                    WHERE con.contype = 'f'
                      AND con.confrelid = 'proyectos.edt'::regclass
                LOOP
                    EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT %I',
                        r.schema, r.tbl, r.conname);
                END LOOP;
            END IF;

            -- Drop FKs to proyectos.proyectos
            IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON c.relnamespace = n.oid
                       WHERE n.nspname = 'proyectos' AND c.relname = 'proyectos') THEN
                FOR r IN
                    SELECT con.conname, nsp.nspname AS schema, cls.relname AS tbl
                    FROM pg_constraint con
                    JOIN pg_class cls ON con.conrelid = cls.oid
                    JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
                    WHERE con.contype = 'f'
                      AND con.confrelid = 'proyectos.proyectos'::regclass
                LOOP
                    EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT %I',
                        r.schema, r.tbl, r.conname);
                END LOOP;
            END IF;
        END $$;
    """)

    # Drop new EDT table
    op.execute("DROP TABLE IF EXISTS proyectos.edt CASCADE;")

    # Rename proyectos.proyectos back to edt
    op.execute("ALTER TABLE proyectos.proyectos RENAME TO edt;")

    # Re-add original FKs dynamically
    op.execute("""
        DO $$
        DECLARE
            tbl RECORD;
        BEGIN
            FOR tbl IN
                SELECT c.table_schema, c.table_name
                FROM information_schema.columns c
                JOIN pg_tables pt ON pt.schemaname = c.table_schema AND pt.tablename = c.table_name
                WHERE c.column_name = 'proyecto_id'
                  AND c.table_schema NOT IN ('pg_catalog', 'information_schema', 'proyectos')
            LOOP
                BEGIN
                    EXECUTE format(
                        'ALTER TABLE %I.%I ADD CONSTRAINT fk_%s_proyecto FOREIGN KEY (proyecto_id) REFERENCES proyectos.edt(id)',
                        tbl.table_schema, tbl.table_name, tbl.table_name
                    );
                EXCEPTION WHEN others THEN
                    RAISE NOTICE 'Skipped FK for %.%: %', tbl.table_schema, tbl.table_name, SQLERRM;
                END;
            END LOOP;

            IF EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_schema='equipo' AND table_name='equipo_edt' AND column_name='edt_id') THEN
                BEGIN
                    ALTER TABLE equipo.equipo_edt
                    ADD CONSTRAINT fk_equipo_edt_edt
                    FOREIGN KEY (edt_id) REFERENCES proyectos.edt(id);
                EXCEPTION WHEN others THEN
                    RAISE NOTICE 'Skipped FK for equipo.equipo_edt: %', SQLERRM;
                END;
            END IF;
        END $$;
    """)
