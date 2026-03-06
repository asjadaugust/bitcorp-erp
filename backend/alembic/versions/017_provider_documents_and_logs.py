"""Add provider documents and audit logs tables with seed data.

Revision ID: 017_provider_documents_and_logs
Revises: 016_add_edt_columns
Create Date: 2026-03-06
"""

import sqlalchemy as sa
from alembic import op

revision = "017_provider_documents_and_logs"
down_revision = "016_add_edt_columns"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()

    # ── 1. Create tables ────────────────────────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS proveedores.documento_proveedor (
            id                SERIAL PRIMARY KEY,
            proveedor_id      INTEGER NOT NULL REFERENCES proveedores.proveedor(id),
            tipo_documento    VARCHAR(100) NOT NULL,
            numero_documento  VARCHAR(100),
            fecha_emision     DATE,
            fecha_vencimiento DATE,
            archivo_url       TEXT,
            observaciones     TEXT,
            tenant_id         INTEGER NOT NULL DEFAULT 1,
            created_by        INTEGER,
            created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_doc_proveedor_prov
            ON proveedores.documento_proveedor(proveedor_id);
        CREATE INDEX IF NOT EXISTS idx_doc_proveedor_tenant
            ON proveedores.documento_proveedor(tenant_id);
    """))

    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS proveedores.log_proveedor (
            id             SERIAL PRIMARY KEY,
            proveedor_id   INTEGER NOT NULL REFERENCES proveedores.proveedor(id),
            accion         VARCHAR(50) NOT NULL,
            campo          VARCHAR(100),
            valor_anterior TEXT,
            valor_nuevo    TEXT,
            observaciones  TEXT,
            usuario_id     INTEGER,
            tenant_id      INTEGER NOT NULL DEFAULT 1,
            created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_log_proveedor_prov
            ON proveedores.log_proveedor(proveedor_id);
        CREATE INDEX IF NOT EXISTS idx_log_proveedor_tenant
            ON proveedores.log_proveedor(tenant_id);
    """))

    # ── 2. Pick first 6 real providers (tenant 1) for seed data ────────────
    # We use a fixed set derived from the actual DB to avoid ordering issues.
    # These IDs (1–6) are from the legacy import and always present.

    conn.execute(sa.text("""
        -- ── 2A. Enrich provider base data (fill nulls on first 6) ──────────
        UPDATE proveedores.proveedor SET
            estado_contribuyente   = 'ACTIVO',
            condicion_contribuyente = 'HABIDO'
        WHERE id IN (1, 2, 3, 4, 5, 6) AND tenant_id = 1
          AND estado_contribuyente IS NULL;
    """))

    # ── 2B. Seed contacts ────────────────────────────────────────────────────
    conn.execute(sa.text("""
        INSERT INTO proveedores.provider_contacts
            (provider_id, contact_name, position, primary_phone, secondary_phone,
             email, contact_type, is_primary, status, tenant_id, created_by)
        SELECT * FROM (VALUES
            (1, 'Roberto Cubas Vásquez',  'Representante Legal',  '051-234567', NULL,
             'rcubas@empresa.pe',       'comercial', TRUE,  'active', 1, 1),
            (1, 'María Torres López',     'Asistente Comercial',  '051-234568', '987654321',
             'mtorres@empresa.pe',      'comercial', FALSE, 'active', 1, 1),
            (3, 'Carmen Garrica Pérez',   'Gerente General',      '983028606',  NULL,
             'cgarrica@servicio.pe',    'comercial', TRUE,  'active', 1, 1),
            (4, 'Luis Soncco Mamani',     'Administración',       '051-364001', '976543210',
             'lsoncco@proveedor.pe',    'administrativo', TRUE, 'active', 1, 1),
            (5, 'Elena Zavaleta Rios',    'Notaria Titular',      '051-363699', NULL,
             'notariacentenozavala@gmail.com', 'legal', TRUE, 'active', 1, 1),
            (5, 'Jorge Centeno Salas',    'Asistente Legal',      '051-363700', NULL,
             'jcenteno@notaria.pe',     'legal', FALSE, 'active', 1, 1)
        ) AS v(provider_id, contact_name, position, primary_phone, secondary_phone,
               email, contact_type, is_primary, status, tenant_id, created_by)
        WHERE NOT EXISTS (
            SELECT 1 FROM proveedores.provider_contacts pc
            WHERE pc.provider_id = v.provider_id AND pc.contact_name = v.contact_name
        );
    """))

    # ── 2C. Seed financial info ───────────────────────────────────────────────
    conn.execute(sa.text("""
        INSERT INTO proveedores.provider_financial_info
            (provider_id, bank_name, account_number, cci, account_holder_name,
             account_type, currency, is_primary, status, tenant_id, created_by)
        SELECT * FROM (VALUES
            (1, 'Banco de Crédito del Perú', '194-12345678-0-01', '00219400012345678001',
             'ATILANO CUBAS PEDRAZA',    'Corriente', 'PEN', TRUE,  'active', 1, 1),
            (1, 'Interbank',                '200-3012345678',     '00320000301234567800',
             'ATILANO CUBAS PEDRAZA',    'Ahorros',   'USD', FALSE, 'active', 1, 1),
            (3, 'BBVA Continental',         '0011-0175-01-00012345', '01100175010001234500',
             'VALENTIN GARRICA QUISPE',  'Corriente', 'PEN', TRUE,  'active', 1, 1),
            (4, 'Scotiabank',               '000-1234567',        '00900000001234567000',
             'YUNI ANGELICA SONCCO LLANQUE', 'Ahorros', 'PEN', TRUE, 'active', 1, 1),
            (5, 'Banco de la Nación',       '04-123456789-0',     NULL,
             'CENTENO ZAVALETA EVA MARINA', 'CCI',    'PEN', TRUE,  'active', 1, 1),
            (6, 'Banco de Crédito del Perú', '194-98765432-0-01', '00219400098765432001',
             'PATIÑO URRUCHE SILVIA BETTY', 'Corriente', 'PEN', TRUE, 'active', 1, 1)
        ) AS v(provider_id, bank_name, account_number, cci, account_holder_name,
               account_type, currency, is_primary, status, tenant_id, created_by)
        WHERE NOT EXISTS (
            SELECT 1 FROM proveedores.provider_financial_info fi
            WHERE fi.provider_id = v.provider_id AND fi.bank_name = v.bank_name
        );
    """))

    # ── 2D. Seed documents ────────────────────────────────────────────────────
    conn.execute(sa.text("""
        INSERT INTO proveedores.documento_proveedor
            (proveedor_id, tipo_documento, numero_documento, fecha_emision,
             fecha_vencimiento, observaciones, tenant_id, created_by)
        VALUES
            (1, 'RUC',               '00027265246',    '2005-03-15', NULL,
             'Registro Único de Contribuyente', 1, 1),
            (1, 'Ficha RUC SUNAT',   'FICHA-001-2024', '2024-01-10', '2025-01-10',
             'Ficha actualizada', 1, 1),
            (1, 'Seguro SCTR',       'SCTR-2024-0891', '2024-01-01', '2024-12-31',
             'SCTR Pensión y Salud', 1, 1),
            (3, 'RUC',               '10012064484',    '2008-06-20', NULL,
             'Registro Único de Contribuyente', 1, 1),
            (3, 'Certificado ISO',   'ISO-9001-2023',  '2023-05-15', '2026-05-15',
             'Certificación de calidad vigente', 1, 1),
            (4, 'RUC',               '10012090523',    '2010-09-01', NULL,
             'Registro Único de Contribuyente', 1, 1),
            (4, 'Garantía Bancaria', 'GB-BCP-2024-045','2024-03-01', '2024-09-01',
             'Garantía por contrato de suministros', 1, 1),
            (5, 'RUC',               '10012128521',    '2001-11-12', NULL,
             'Registro Único de Contribuyente', 1, 1),
            (5, 'Habilitación Notarial', 'HN-0245-2024','2024-02-01', '2025-01-31',
             'Habilitación Colegio de Notarios', 1, 1),
            (5, 'Póliza Responsabilidad Civil', 'POL-RC-2024-1122', '2024-01-01', '2024-12-31',
             'Rimac Seguros — cobertura S/ 500,000', 1, 1),
            (6, 'RUC',               '10012277356',    '2012-04-10', NULL,
             'Registro Único de Contribuyente', 1, 1);
    """))

    # ── 2E. Seed audit logs ────────────────────────────────────────────────────
    conn.execute(sa.text("""
        INSERT INTO proveedores.log_proveedor
            (proveedor_id, accion, campo, valor_anterior, valor_nuevo,
             observaciones, usuario_id, tenant_id, created_at)
        VALUES
            (1, 'CREAR',    NULL, NULL, NULL, 'Proveedor creado — importación legacy', 1, 1,
             NOW() - INTERVAL '90 days'),
            (1, 'ACTUALIZAR', 'estado_contribuyente', NULL, 'ACTIVO',
             'Actualización SUNAT', 1, 1, NOW() - INTERVAL '30 days'),
            (1, 'AGREGAR_CONTACTO', NULL, NULL, NULL,
             'Contacto: Roberto Cubas Vásquez', 1, 1, NOW() - INTERVAL '25 days'),
            (1, 'AGREGAR_INFO_FINANCIERA', NULL, NULL, NULL,
             'Banco: Banco de Crédito del Perú', 1, 1, NOW() - INTERVAL '20 days'),
            (1, 'AGREGAR_DOCUMENTO', NULL, NULL, NULL,
             'Documento: SCTR', 1, 1, NOW() - INTERVAL '15 days'),
            (3, 'CREAR',    NULL, NULL, NULL, 'Proveedor creado — importación legacy', 1, 1,
             NOW() - INTERVAL '85 days'),
            (3, 'AGREGAR_CONTACTO', NULL, NULL, NULL,
             'Contacto: Carmen Garrica Pérez', 1, 1, NOW() - INTERVAL '22 days'),
            (3, 'AGREGAR_INFO_FINANCIERA', NULL, NULL, NULL,
             'Banco: BBVA Continental', 1, 1, NOW() - INTERVAL '18 days'),
            (4, 'CREAR',    NULL, NULL, NULL, 'Proveedor creado — importación legacy', 1, 1,
             NOW() - INTERVAL '80 days'),
            (5, 'CREAR',    NULL, NULL, NULL, 'Proveedor creado — importación legacy', 1, 1,
             NOW() - INTERVAL '75 days'),
            (5, 'AGREGAR_DOCUMENTO', NULL, NULL, NULL,
             'Documento: Habilitación Notarial', 1, 1, NOW() - INTERVAL '10 days'),
            (6, 'CREAR',    NULL, NULL, NULL, 'Proveedor creado — importación legacy', 1, 1,
             NOW() - INTERVAL '70 days');
    """))


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS proveedores.log_proveedor;")
    op.execute("DROP TABLE IF EXISTS proveedores.documento_proveedor;")
