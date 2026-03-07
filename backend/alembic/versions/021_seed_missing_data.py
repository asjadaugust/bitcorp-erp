"""Seed empty tables: proyectos, licitaciones, tareos, incidentes.

These tables were not covered by the legacy data migration (009) and have 0 rows.
This migration adds realistic demo data so the corresponding API endpoints return data.

Revision ID: 021_seed_missing_data
Revises: 020_seed_sig_documents
Create Date: 2026-03-06
"""

from alembic import op
import sqlalchemy as sa

revision = "021_seed_missing_data"
down_revision = "020_seed_sig_documents"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()

    # ── 1. proyectos.proyectos (3 rows — one per unidad_operativa) ─────────
    conn.execute(sa.text("""
        INSERT INTO proyectos.proyectos
            (legacy_id, codigo, nombre, descripcion, ubicacion,
             fecha_inicio, fecha_fin, presupuesto, estado,
             unidad_operativa_id, cliente, is_active, creado_por)
        VALUES
            ('PRY-SEED-001', 'PRY-001',
             'Conservación Vial por Niveles de Servicio Cutervo',
             'Conservación vial por niveles de servicio en la ruta Cutervo-Chiple-Lambayeque',
             'Cajamarca',
             '2025-01-01', '2026-12-31', 5000000.00, 'EN_EJECUCION',
             2, 'Provias Nacional', true, 1),
            ('PRY-SEED-002', 'PRY-002',
             'Conservación Vial Alvac-Aramsa',
             'Conservación vial por niveles de servicio tramo Alvac-Aramsa',
             'Arequipa',
             '2025-03-01', '2027-02-28', 8000000.00, 'EN_EJECUCION',
             3, 'Gobierno Regional Arequipa', true, 1),
            ('PRY-SEED-003', 'PRY-003',
             'Gestión Administrativa Central',
             'Proyecto de gestión administrativa y soporte de oficina central',
             'Lima',
             '2025-01-01', '2025-12-31', 1500000.00, 'EN_EJECUCION',
             1, 'Bitcorp S.A.C.', true, 1)
        ON CONFLICT (legacy_id) DO NOTHING
    """))

    # ── 2. public.licitaciones (5 rows — from old 002_seed.sql) ────────────
    conn.execute(sa.text("""
        INSERT INTO public.licitaciones
            (legacy_id, codigo, nombre, entidad_convocante,
             monto_referencial, fecha_convocatoria, fecha_presentacion,
             estado, observaciones)
        VALUES
            ('LIC-SEED-001', 'LIC-2024-001',
             'Mejoramiento de Carretera Tramo Huaraz-Recuay',
             'Gobierno Regional de Ancash',
             45000000.00, '2024-01-10', '2024-02-15',
             'ADJUDICADO', 'Buena Pro otorgada a favor'),
            ('LIC-SEED-002', 'LIC-2024-002',
             'Construcción de Puente Vehicular sobre el Río Santa',
             'MTC',
             28000000.00, '2024-02-01', '2024-03-10',
             'EVALUACION', 'Propuesta técnica presentada'),
            ('LIC-SEED-003', 'LIC-2024-003',
             'Mantenimiento Rutinario Red Vial Nacional Sector Lima Norte',
             'Provias Nacional',
             12000000.00, '2024-03-01', '2024-04-05',
             'PUBLICADO', 'En proceso de elaboración de propuesta'),
            ('LIC-SEED-004', 'LIC-2024-004',
             'Rehabilitación de Vía Urbana Av. Los Próceres',
             'Municipalidad de Lima',
             8500000.00, '2024-03-15', '2024-04-20',
             'PUBLICADO', 'Pendiente decisión de participación'),
            ('LIC-SEED-005', 'LIC-2024-005',
             'Construcción de Pavimento en Vía de Evitamiento Arequipa',
             'GR Arequipa',
             35000000.00, '2023-11-01', '2023-12-15',
             'DESIERTO', 'Proceso declarado desierto por falta de postores')
        ON CONFLICT (legacy_id) DO NOTHING
    """))

    # ── 3. sst.incidente (5 rows — with proyecto_id via subquery) ──────────
    conn.execute(sa.text("""
        INSERT INTO sst.incidente
            (legacy_id, fecha_incidente, tipo_incidente, severidad,
             ubicacion, descripcion, acciones_tomadas,
             proyecto_id, reportado_por, estado)
        VALUES
            ('INC-SEED-001', '2024-01-25 10:30:00', 'CASI_ACCIDENTE', 'LEVE',
             'Frente de trabajo - Km 45',
             'Operador casi pierde estabilidad al bajar de excavadora',
             'Capacitación sobre uso de puntos de apoyo al subir/bajar de equipo',
             (SELECT id FROM proyectos.proyectos WHERE legacy_id = 'PRY-SEED-001'), 1, 'CERRADO'),
            ('INC-SEED-002', '2024-02-10 14:15:00', 'INCIDENTE_AMBIENTAL', 'MODERADO',
             'Zona de abastecimiento',
             'Derrame menor de combustible durante abastecimiento (5 galones)',
             'Contención inmediata con kit antiderrames. Limpieza de área. Capacitación al personal.',
             (SELECT id FROM proyectos.proyectos WHERE legacy_id = 'PRY-SEED-001'), 2, 'CERRADO'),
            ('INC-SEED-003', '2024-02-18 09:00:00', 'ACCIDENTE_LEVE', 'LEVE',
             'Taller de mantenimiento',
             'Técnico sufrió corte menor en mano durante cambio de filtro',
             'Primeros auxilios. Uso obligatorio de guantes de protección.',
             (SELECT id FROM proyectos.proyectos WHERE legacy_id = 'PRY-SEED-001'), 3, 'CERRADO'),
            ('INC-SEED-004', '2024-03-05 16:45:00', 'CASI_ACCIDENTE', 'MODERADO',
             'Acceso principal obra',
             'Vehículo liviano casi colisiona con volquete por falta de señalización',
             'Instalación de señales de tránsito adicionales. Vigía permanente.',
             (SELECT id FROM proyectos.proyectos WHERE legacy_id = 'PRY-SEED-002'), 4, 'ABIERTO'),
            ('INC-SEED-005', '2024-03-20 11:00:00', 'OBSERVACION', 'LEVE',
             'Área de carga',
             'Personal sin casco en zona de operaciones',
             'Amonestación verbal. Reforzamiento de normas de seguridad.',
             (SELECT id FROM proyectos.proyectos WHERE legacy_id = 'PRY-SEED-002'), 5, 'EN_INVESTIGACION')
        ON CONFLICT (legacy_id) DO NOTHING
    """))

    # ── 4. rrhh.tareo (30 rows — 10 workers × 3 periods) ──────────────────
    # Pick first 10 workers, create tareos for 2026-01, 2026-02, 2026-03
    conn.execute(sa.text("""
        INSERT INTO rrhh.tareo
            (legacy_id, trabajador_id, periodo, total_dias_trabajados,
             total_horas, monto_calculado, estado, creado_por,
             aprobado_por, aprobado_en)
        SELECT
            'TAREO-SEED-' || w.id || '-' || p.periodo,
            w.id,
            p.periodo,
            p.dias,
            p.horas,
            p.horas * 35.00,
            p.estado,
            1,
            CASE WHEN p.estado = 'APROBADO' THEN 1 ELSE NULL END,
            CASE WHEN p.estado = 'APROBADO' THEN (p.periodo || '-25')::timestamp ELSE NULL END
        FROM (SELECT id FROM rrhh.trabajador ORDER BY id LIMIT 10) w
        CROSS JOIN (VALUES
            ('2026-01', 22, 176.00, 'APROBADO'),
            ('2026-02', 20, 160.00, 'APROBADO'),
            ('2026-03', 18, 144.00, 'ENVIADO')
        ) AS p(periodo, dias, horas, estado)
        WHERE NOT EXISTS (
            SELECT 1 FROM rrhh.tareo t
            WHERE t.trabajador_id = w.id AND t.periodo = p.periodo
        )
    """))

    # Override some tareos to have different states for variety
    conn.execute(sa.text("""
        UPDATE rrhh.tareo SET estado = 'BORRADOR', aprobado_por = NULL, aprobado_en = NULL
        WHERE legacy_id IN (
            'TAREO-SEED-9-2026-03',
            'TAREO-SEED-10-2026-03',
            'TAREO-SEED-8-2026-02'
        )
    """))
    conn.execute(sa.text("""
        UPDATE rrhh.tareo SET estado = 'ENVIADO', aprobado_por = NULL, aprobado_en = NULL
        WHERE legacy_id IN (
            'TAREO-SEED-7-2026-02',
            'TAREO-SEED-6-2026-02'
        )
    """))

    # ── 5. rrhh.detalle_tareo (5 detail rows per tareo) ────────────────────
    # For each tareo, create 5 daily entries spread across the period
    conn.execute(sa.text("""
        INSERT INTO rrhh.detalle_tareo
            (tareo_id, proyecto_id, fecha, horas_trabajadas, tarifa_hora, monto, observaciones)
        SELECT
            t.id,
            proj.id,
            (t.periodo || '-' || LPAD(d.dia::text, 2, '0'))::date,
            d.horas,
            d.tarifa,
            d.horas * d.tarifa,
            d.obs
        FROM rrhh.tareo t
        CROSS JOIN (VALUES
            (3,  8.00, 35.00, 'Trabajo normal'),
            (8,  9.00, 35.00, 'Trabajo normal'),
            (13, 8.00, 40.00, 'Trabajo en campo'),
            (18, 10.00, 35.00, 'Horas extra incluidas'),
            (23, 8.00, 45.00, 'Trabajo especializado')
        ) AS d(dia, horas, tarifa, obs)
        CROSS JOIN LATERAL (
            SELECT id FROM proyectos.proyectos
            WHERE legacy_id = CASE
                WHEN t.trabajador_id % 3 = 0 THEN 'PRY-SEED-003'
                WHEN t.trabajador_id % 3 = 1 THEN 'PRY-SEED-001'
                ELSE 'PRY-SEED-002'
            END
        ) proj
        WHERE t.legacy_id LIKE 'TAREO-SEED-%'
        AND NOT EXISTS (
            SELECT 1 FROM rrhh.detalle_tareo dt
            WHERE dt.tareo_id = t.id
            AND dt.fecha = (t.periodo || '-' || LPAD(d.dia::text, 2, '0'))::date
        )
    """))


def downgrade() -> None:
    conn = op.get_bind()

    # Reverse order of insertion
    conn.execute(sa.text("""
        DELETE FROM rrhh.detalle_tareo
        WHERE tareo_id IN (SELECT id FROM rrhh.tareo WHERE legacy_id LIKE 'TAREO-SEED-%')
    """))
    conn.execute(sa.text("DELETE FROM rrhh.tareo WHERE legacy_id LIKE 'TAREO-SEED-%'"))
    conn.execute(sa.text("DELETE FROM sst.incidente WHERE legacy_id LIKE 'INC-SEED-%'"))
    conn.execute(sa.text("DELETE FROM public.licitaciones WHERE legacy_id LIKE 'LIC-SEED-%'"))
    conn.execute(sa.text("DELETE FROM proyectos.proyectos WHERE legacy_id LIKE 'PRY-SEED-%'"))
