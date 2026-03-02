"""Align contract enums with legacy app (modalidad, tipo_tarifa, estado).

Revision ID: 001_align_enums
Create Date: 2026-03-01
"""

from alembic import op

revision = "001_align_enums"
down_revision = "000_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── Modalidad ──────────────────────────────────────────────────────
    op.execute("""
        UPDATE equipo.contrato_adenda SET modalidad = 'MAQUINA_SECA_OPERADA'
        WHERE modalidad IN ('alquiler_con_operador', 'ALQUILER CON OPERADOR');
    """)
    op.execute("""
        UPDATE equipo.contrato_adenda SET modalidad = 'MAQUINA_SECA_NO_OPERADA'
        WHERE modalidad IN ('alquiler_seco', 'ALQUILER SOLO EQUIPO');
    """)
    op.execute("""
        UPDATE equipo.contrato_adenda SET modalidad = 'MAQUINA_SERVIDA_OPERADA'
        WHERE modalidad IN (
            'alquiler_todo_costo', 'servicio',
            'ALQUILER CON OPERADOR Y COMBUSTIBLE'
        );
    """)
    op.execute("""
        UPDATE equipo.contrato_adenda SET modalidad = 'MAQUINA_SERVIDA_NO_OPERADA'
        WHERE modalidad = 'MAQUINA SERVIDA NO OPERADA';
    """)

    # ── Tipo Tarifa ────────────────────────────────────────────────────
    op.execute("""
        UPDATE equipo.contrato_adenda SET tipo_tarifa = 'HORA'
        WHERE tipo_tarifa = 'POR_HORA';
    """)
    op.execute("""
        UPDATE equipo.contrato_adenda SET tipo_tarifa = 'DIA'
        WHERE tipo_tarifa = 'POR_DIA';
    """)
    op.execute("""
        UPDATE equipo.contrato_adenda SET tipo_tarifa = 'MES'
        WHERE tipo_tarifa IN ('FIJO', 'TARIFA_FIJA_MENSUAL');
    """)

    # ── Estado ─────────────────────────────────────────────────────────
    op.execute("""
        UPDATE equipo.contrato_adenda SET estado = 'VIGENTE'
        WHERE estado = 'ACTIVO';
    """)
    op.execute("""
        UPDATE equipo.contrato_adenda SET estado = 'EN_PROCESO'
        WHERE estado = 'BORRADOR';
    """)


def downgrade() -> None:
    # ── Estado (reverse) ───────────────────────────────────────────────
    op.execute("""
        UPDATE equipo.contrato_adenda SET estado = 'ACTIVO'
        WHERE estado = 'VIGENTE';
    """)
    op.execute("""
        UPDATE equipo.contrato_adenda SET estado = 'BORRADOR'
        WHERE estado = 'EN_PROCESO';
    """)

    # ── Tipo Tarifa (reverse) ──────────────────────────────────────────
    op.execute("""
        UPDATE equipo.contrato_adenda SET tipo_tarifa = 'POR_HORA'
        WHERE tipo_tarifa = 'HORA';
    """)
    op.execute("""
        UPDATE equipo.contrato_adenda SET tipo_tarifa = 'POR_DIA'
        WHERE tipo_tarifa = 'DIA';
    """)
    op.execute("""
        UPDATE equipo.contrato_adenda SET tipo_tarifa = 'MES'
        WHERE tipo_tarifa = 'MES';
    """)

    # ── Modalidad (reverse — best effort to original lowercase) ────────
    op.execute("""
        UPDATE equipo.contrato_adenda SET modalidad = 'alquiler_con_operador'
        WHERE modalidad = 'MAQUINA_SECA_OPERADA';
    """)
    op.execute("""
        UPDATE equipo.contrato_adenda SET modalidad = 'alquiler_seco'
        WHERE modalidad = 'MAQUINA_SECA_NO_OPERADA';
    """)
    op.execute("""
        UPDATE equipo.contrato_adenda SET modalidad = 'alquiler_todo_costo'
        WHERE modalidad = 'MAQUINA_SERVIDA_OPERADA';
    """)
    op.execute("""
        UPDATE equipo.contrato_adenda SET modalidad = 'servicio'
        WHERE modalidad = 'MAQUINA_SERVIDA_NO_OPERADA';
    """)
