"""Seed more checklist inspections with non-conforming observations.

Revision ID: 007_seed_checklist_observations
Revises: 006_seed_more_data
Create Date: 2026-03-02
"""

import sqlalchemy as sa
from alembic import op

revision = "007_seed_checklist_observations"
down_revision = "006_seed_more_data"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()

    # ── 5 additional inspections with non-conforming results ─────────────────
    # Each uses legacy_id references consistent with 005_seed_core_data.py.
    # Equipment: EQ001 (EXC-001 excavadora), EQ002 (EXC-002), EQ006 (volquete)
    # Workers: OPR001, OPR002, OPR005
    # Templates: PLT-001 (pre-op heavy), PLT-002 (weekly heavy), PLT-003 (vehicles)

    # INS-0005: EQ001, PLT-001 — falla crítica motor + hidráulico + extintor
    conn.execute(sa.text("""
        INSERT INTO equipo.checklist_inspeccion
            (codigo, plantilla_id, equipo_id, trabajador_id,
             fecha_inspeccion, hora_inicio, hora_fin,
             horometro_inicial, estado, resultado_general,
             items_conforme, items_no_conforme, items_total,
             equipo_operativo, completado_en)
        SELECT 'INS-0005', p.id, e.id, w.id,
               CURRENT_DATE - 5, '07:00', '07:25',
               1500.0, 'COMPLETADO', 'OBSERVADO',
               3, 3, 6, true, NOW() - interval '5 days'
        FROM equipo.checklist_plantilla p
        CROSS JOIN equipo.equipo e
        CROSS JOIN rrhh.trabajador w
        WHERE p.codigo = 'PLT-001'
          AND e.legacy_id = 'EQ001'
          AND w.legacy_id = 'OPR001'
        ON CONFLICT (codigo) DO NOTHING
    """))

    conn.execute(sa.text("""
        INSERT INTO equipo.checklist_resultado
            (inspeccion_id, item_id, conforme, observaciones, accion_requerida)
        SELECT i.id, ci.id,
               ci.orden NOT IN (1, 3, 6),
               CASE ci.orden
                   WHEN 1 THEN 'Pérdida de aceite en tapa de válvulas, mancha visible en bloque'
                   WHEN 3 THEN 'Nivel de aceite hidráulico por debajo del mínimo (-2 cm)'
                   WHEN 6 THEN 'Extintor con precinto roto, requiere inspección técnica'
                   ELSE NULL
               END,
               CASE ci.orden
                   WHEN 1 THEN 'REPARAR'
                   WHEN 3 THEN 'REPARAR'
                   WHEN 6 THEN 'REEMPLAZAR'
                   ELSE 'NINGUNA'
               END
        FROM equipo.checklist_inspeccion i
        JOIN equipo.checklist_plantilla p ON p.id = i.plantilla_id
        JOIN equipo.checklist_item ci ON ci.plantilla_id = p.id
        WHERE i.codigo = 'INS-0005'
        ON CONFLICT DO NOTHING
    """))

    # INS-0006: EQ002, PLT-001 — falla crítica en orugas (parada inmediata)
    conn.execute(sa.text("""
        INSERT INTO equipo.checklist_inspeccion
            (codigo, plantilla_id, equipo_id, trabajador_id,
             fecha_inspeccion, hora_inicio, hora_fin,
             horometro_inicial, estado, resultado_general,
             items_conforme, items_no_conforme, items_total,
             equipo_operativo, completado_en)
        SELECT 'INS-0006', p.id, e.id, w.id,
               CURRENT_DATE - 3, '06:45', '07:10',
               2300.5, 'COMPLETADO', 'RECHAZADO',
               4, 2, 6, false, NOW() - interval '3 days'
        FROM equipo.checklist_plantilla p
        CROSS JOIN equipo.equipo e
        CROSS JOIN rrhh.trabajador w
        WHERE p.codigo = 'PLT-001'
          AND e.legacy_id = 'EQ002'
          AND w.legacy_id = 'OPR002'
        ON CONFLICT (codigo) DO NOTHING
    """))

    conn.execute(sa.text("""
        INSERT INTO equipo.checklist_resultado
            (inspeccion_id, item_id, conforme, observaciones, accion_requerida)
        SELECT i.id, ci.id,
               ci.orden NOT IN (4, 5),
               CASE ci.orden
                   WHEN 4 THEN 'Manguera hidráulica derecha con fisura longitudinal, riesgo de rotura'
                   WHEN 5 THEN 'Oruga izquierda: eslabón fisurado 3 mm, parada inmediata requerida'
                   ELSE NULL
               END,
               CASE ci.orden
                   WHEN 4 THEN 'REEMPLAZAR'
                   WHEN 5 THEN 'REEMPLAZAR'
                   ELSE 'NINGUNA'
               END
        FROM equipo.checklist_inspeccion i
        JOIN equipo.checklist_plantilla p ON p.id = i.plantilla_id
        JOIN equipo.checklist_item ci ON ci.plantilla_id = p.id
        WHERE i.codigo = 'INS-0006'
        ON CONFLICT DO NOTHING
    """))

    # INS-0007: EQ006 (volquete), PLT-003 — falla en frenos + llantas
    conn.execute(sa.text("""
        INSERT INTO equipo.checklist_inspeccion
            (codigo, plantilla_id, equipo_id, trabajador_id,
             fecha_inspeccion, hora_inicio, hora_fin,
             horometro_inicial, estado, resultado_general,
             items_conforme, items_no_conforme, items_total,
             equipo_operativo, completado_en)
        SELECT 'INS-0007', p.id, e.id, w.id,
               CURRENT_DATE - 2, '07:15', '07:30',
               45000.0, 'COMPLETADO', 'OBSERVADO',
               3, 2, 5, true, NOW() - interval '2 days'
        FROM equipo.checklist_plantilla p
        CROSS JOIN equipo.equipo e
        CROSS JOIN rrhh.trabajador w
        WHERE p.codigo = 'PLT-003'
          AND e.legacy_id = 'EQ006'
          AND w.legacy_id = 'OPR005'
        ON CONFLICT (codigo) DO NOTHING
    """))

    conn.execute(sa.text("""
        INSERT INTO equipo.checklist_resultado
            (inspeccion_id, item_id, conforme, observaciones, accion_requerida)
        SELECT i.id, ci.id,
               ci.orden NOT IN (2, 3),
               CASE ci.orden
                   WHEN 2 THEN 'Llanta trasera izquierda: presión 65 PSI (mín 85), desgaste irregular'
                   WHEN 3 THEN 'Freno de servicio con respuesta lenta, recorrido excesivo del pedal'
                   ELSE NULL
               END,
               CASE ci.orden
                   WHEN 2 THEN 'OBSERVAR'
                   WHEN 3 THEN 'REPARAR'
                   ELSE 'NINGUNA'
               END
        FROM equipo.checklist_inspeccion i
        JOIN equipo.checklist_plantilla p ON p.id = i.plantilla_id
        JOIN equipo.checklist_item ci ON ci.plantilla_id = p.id
        WHERE i.codigo = 'INS-0007'
        ON CONFLICT DO NOTHING
    """))

    # INS-0008: EQ001, PLT-002 — inspección semanal, desgaste cuchara
    conn.execute(sa.text("""
        INSERT INTO equipo.checklist_inspeccion
            (codigo, plantilla_id, equipo_id, trabajador_id,
             fecha_inspeccion, hora_inicio, hora_fin,
             horometro_inicial, estado, resultado_general,
             items_conforme, items_no_conforme, items_total,
             equipo_operativo, completado_en)
        SELECT 'INS-0008', p.id, e.id, w.id,
               CURRENT_DATE - 1, '08:00', '08:40',
               1520.0, 'COMPLETADO', 'OBSERVADO',
               4, 1, 5, true, NOW() - interval '1 day'
        FROM equipo.checklist_plantilla p
        CROSS JOIN equipo.equipo e
        CROSS JOIN rrhh.trabajador w
        WHERE p.codigo = 'PLT-002'
          AND e.legacy_id = 'EQ001'
          AND w.legacy_id = 'OPR001'
        ON CONFLICT (codigo) DO NOTHING
    """))

    conn.execute(sa.text("""
        INSERT INTO equipo.checklist_resultado
            (inspeccion_id, item_id, conforme, observaciones, accion_requerida)
        SELECT i.id, ci.id,
               ci.orden != 4,
               CASE ci.orden
                   WHEN 4 THEN 'Dientes de cuchara con desgaste del 60%, pérdida de productividad ~15%'
                   ELSE NULL
               END,
               CASE ci.orden
                   WHEN 4 THEN 'OBSERVAR'
                   ELSE 'NINGUNA'
               END
        FROM equipo.checklist_inspeccion i
        JOIN equipo.checklist_plantilla p ON p.id = i.plantilla_id
        JOIN equipo.checklist_item ci ON ci.plantilla_id = p.id
        WHERE i.codigo = 'INS-0008'
        ON CONFLICT DO NOTHING
    """))

    # INS-0009: EQ002, PLT-001 — sistema de refrigeración con fuga
    conn.execute(sa.text("""
        INSERT INTO equipo.checklist_inspeccion
            (codigo, plantilla_id, equipo_id, trabajador_id,
             fecha_inspeccion, hora_inicio, hora_fin,
             horometro_inicial, estado, resultado_general,
             items_conforme, items_no_conforme, items_total,
             equipo_operativo, completado_en)
        SELECT 'INS-0009', p.id, e.id, w.id,
               CURRENT_DATE, '06:50', '07:05',
               2320.0, 'COMPLETADO', 'OBSERVADO',
               5, 1, 6, true, NOW()
        FROM equipo.checklist_plantilla p
        CROSS JOIN equipo.equipo e
        CROSS JOIN rrhh.trabajador w
        WHERE p.codigo = 'PLT-001'
          AND e.legacy_id = 'EQ002'
          AND w.legacy_id = 'OPR002'
        ON CONFLICT (codigo) DO NOTHING
    """))

    conn.execute(sa.text("""
        INSERT INTO equipo.checklist_resultado
            (inspeccion_id, item_id, conforme, observaciones, accion_requerida)
        SELECT i.id, ci.id,
               ci.orden != 2,
               CASE ci.orden
                   WHEN 2 THEN 'Fuga leve en manguera del radiador, humedad visible en conexión inferior'
                   ELSE NULL
               END,
               CASE ci.orden
                   WHEN 2 THEN 'REPARAR'
                   ELSE 'NINGUNA'
               END
        FROM equipo.checklist_inspeccion i
        JOIN equipo.checklist_plantilla p ON p.id = i.plantilla_id
        JOIN equipo.checklist_item ci ON ci.plantilla_id = p.id
        WHERE i.codigo = 'INS-0009'
        ON CONFLICT DO NOTHING
    """))


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("""
        DELETE FROM equipo.checklist_resultado
        WHERE inspeccion_id IN (
            SELECT id FROM equipo.checklist_inspeccion
            WHERE codigo IN ('INS-0005','INS-0006','INS-0007','INS-0008','INS-0009')
        )
    """))
    conn.execute(sa.text("""
        DELETE FROM equipo.checklist_inspeccion
        WHERE codigo IN ('INS-0005','INS-0006','INS-0007','INS-0008','INS-0009')
    """))
