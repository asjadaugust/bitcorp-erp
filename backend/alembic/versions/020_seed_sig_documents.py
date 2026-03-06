"""Seed SIG documents for /sig page.

Revision ID: 020_seed_sig_documents
Revises: 019_provider_estado
Create Date: 2026-03-06
"""

import sqlalchemy as sa
from alembic import op

revision = "020_seed_sig_documents"
down_revision = "019_provider_estado"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(
        sa.text("""
        INSERT INTO sig.documento
            (legacy_id, codigo, titulo, tipo_documento, iso_standard,
             version, fecha_emision, estado, creado_por)
        VALUES
            ('DOC-001','SIG-PRO-001','Procedimiento de Control de Equipos',
             'PROCEDIMIENTO','ISO 9001','3.0','2024-01-01','VIGENTE',
             (SELECT id FROM sistema.usuario WHERE nombre_usuario='admin' LIMIT 1)),
            ('DOC-002','SIG-INS-001','Instructivo de Inspección Pre-operacional',
             'INSTRUCTIVO','ISO 9001','2.1','2024-01-01','VIGENTE',
             (SELECT id FROM sistema.usuario WHERE nombre_usuario='admin' LIMIT 1)),
            ('DOC-003','SIG-REG-001','Registro de Mantenimiento Preventivo',
             'REGISTRO','ISO 14001','1.0','2024-01-15','VIGENTE',
             (SELECT id FROM sistema.usuario WHERE nombre_usuario='admin' LIMIT 1))
        ON CONFLICT (codigo) DO NOTHING
    """)
    )


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(
        sa.text(
            "DELETE FROM sig.documento WHERE legacy_id IN ('DOC-001','DOC-002','DOC-003')"
        )
    )
