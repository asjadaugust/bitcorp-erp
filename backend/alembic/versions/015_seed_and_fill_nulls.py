"""Seed empty tables and fill NULL fields across the database.

Fills pervasive NULL fields on 5,000+ existing rows and inserts 750+ rows
into 9 empty tables.  Also fixes the /api/tenant/my-projects bug by adding
the ``nivel`` column to ``proyectos.edt``.

Layers:
  0  — Schema fix + independent UPDATEs  (edt, centro_costo, trabajador,
       proveedor, producto, licitaciones, seguimiento_inspeccion_ssoma)
  1  — FK-dependent UPDATEs  (equipo, contrato_adenda, programacion_pago)
  2  — Second-level FK UPDATEs  (valorizacion_equipo)
  3  — Independent INSERTs  (admin_centro_costo, parte_diario_foto,
       edt_tareo, detalle_tareo, solicitud_aprobacion, respuesta_adhoc)
  4  — Dependent INSERTs  (checklist_inspeccion, paso_solicitud)
  5  — Secondary dependent INSERTs  (checklist_resultado)
  6  — Computed updates + notifications

Revision ID: 015_seed_and_fill_nulls
Revises: 014_fix_legacy_tenant_ids
Create Date: 2026-03-05
"""

from alembic import op
import sqlalchemy as sa

revision = "015_seed_and_fill_nulls"
down_revision = "014_fix_legacy_tenant_ids"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║  LAYER 0 — Schema Fix + Independent UPDATEs                       ║
    # ╚══════════════════════════════════════════════════════════════════════╝

    # ── 0A. Fix proyectos.edt — add nivel, fill empresa_id ──────────────
    conn.execute(sa.text("""
        DO $$ BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'proyectos'
                  AND table_name = 'edt'
                  AND column_name = 'nivel'
            ) THEN
                ALTER TABLE proyectos.edt ADD COLUMN nivel INTEGER;
            END IF;
        END $$
    """))

    conn.execute(sa.text("""
        UPDATE proyectos.edt
        SET nivel = LENGTH(codigo) - LENGTH(REPLACE(codigo, '.', ''))
        WHERE nivel IS NULL AND codigo IS NOT NULL
    """))

    conn.execute(sa.text("""
        UPDATE proyectos.edt SET empresa_id = 1 WHERE empresa_id IS NULL
    """))

    conn.execute(sa.text("""
        UPDATE proyectos.edt SET
            ubicacion = CASE (id % 10)
                WHEN 0 THEN 'Cajamarca'    WHEN 1 THEN 'Lima'
                WHEN 2 THEN 'Cusco'        WHEN 3 THEN 'Arequipa'
                WHEN 4 THEN 'Piura'        WHEN 5 THEN 'La Libertad'
                WHEN 6 THEN 'Junin'        WHEN 7 THEN 'Lambayeque'
                WHEN 8 THEN 'Ancash'       ELSE 'Huancavelica'
            END,
            fecha_inicio = '2024-01-01'::date + ((id % 12) * interval '1 month'),
            fecha_fin    = '2024-07-01'::date + ((id % 12) * interval '1 month'),
            cliente = CASE (id % 5)
                WHEN 0 THEN 'MTC - Ministerio de Transportes'
                WHEN 1 THEN 'Gobierno Regional de Cajamarca'
                WHEN 2 THEN 'Provias Nacional'
                WHEN 3 THEN 'Gobierno Regional de Lima'
                ELSE 'Municipalidad Provincial'
            END
        WHERE ubicacion IS NULL
    """))

    # ── 0A2. Fix administracion.centro_costo — set tenant_id ────────────
    conn.execute(sa.text("""
        UPDATE administracion.centro_costo SET tenant_id = 1 WHERE tenant_id IS NULL
    """))

    # ── 0B. Fill rrhh.trabajador — cargo, especialidad ──────────────────
    conn.execute(sa.text("""
        UPDATE rrhh.trabajador SET
            cargo = CASE (id % 10)
                WHEN 0 THEN 'Operador de Excavadora'
                WHEN 1 THEN 'Operador de Volquete'
                WHEN 2 THEN 'Oficial de Albanileria'
                WHEN 3 THEN 'Peon de Obra'
                WHEN 4 THEN 'Operador de Rodillo'
                WHEN 5 THEN 'Operador de Retroexcavadora'
                WHEN 6 THEN 'Topografo'
                WHEN 7 THEN 'Capataz'
                WHEN 8 THEN 'Maestro de Obra'
                ELSE 'Vigia'
            END
        WHERE cargo IS NULL
    """))

    conn.execute(sa.text("""
        UPDATE rrhh.trabajador SET
            especialidad = CASE (id % 8)
                WHEN 0 THEN 'Excavadora'
                WHEN 1 THEN 'Volquete'
                WHEN 2 THEN 'Motoniveladora'
                WHEN 3 THEN 'Rodillo'
                WHEN 4 THEN 'Retroexcavadora'
                WHEN 5 THEN 'Cargador Frontal'
                WHEN 6 THEN 'Topografia'
                ELSE 'General'
            END
        WHERE especialidad IS NULL
    """))

    # ── 0C. Fill proveedores.proveedor — nombre_comercial ───────────────
    conn.execute(sa.text("""
        UPDATE proveedores.proveedor SET
            nombre_comercial = COALESCE(razon_social, 'Proveedor ' || id)
        WHERE nombre_comercial IS NULL
    """))

    # ── 0D. Fill logistica.producto — stock_minimo, precio_unitario ─────
    conn.execute(sa.text("""
        UPDATE logistica.producto SET
            stock_minimo = CASE
                WHEN UPPER(COALESCE(nombre,'')) LIKE '%ALAMBRE%'  THEN 100
                WHEN UPPER(COALESCE(nombre,'')) LIKE '%CLAVO%'    THEN 50
                WHEN UPPER(COALESCE(nombre,'')) LIKE '%CEMENTO%'  THEN 200
                WHEN UPPER(COALESCE(nombre,'')) LIKE '%FIERRO%'   THEN 150
                WHEN UPPER(COALESCE(nombre,'')) LIKE '%TUBO%'     THEN 30
                WHEN UPPER(COALESCE(nombre,'')) LIKE '%PINTURA%'  THEN 20
                WHEN UPPER(COALESCE(nombre,'')) LIKE '%MADERA%'   THEN 40
                WHEN UPPER(COALESCE(nombre,'')) LIKE '%LADRILLO%' THEN 500
                ELSE 25
            END
        WHERE stock_minimo IS NULL
    """))

    conn.execute(sa.text("""
        UPDATE logistica.producto SET
            precio_unitario = CASE
                WHEN UPPER(COALESCE(nombre,'')) LIKE '%ALAMBRE%'  THEN 8.50
                WHEN UPPER(COALESCE(nombre,'')) LIKE '%CLAVO%'    THEN 5.00
                WHEN UPPER(COALESCE(nombre,'')) LIKE '%CEMENTO%'  THEN 28.00
                WHEN UPPER(COALESCE(nombre,'')) LIKE '%FIERRO%'   THEN 35.00
                WHEN UPPER(COALESCE(nombre,'')) LIKE '%TUBO%'     THEN 15.00
                WHEN UPPER(COALESCE(nombre,'')) LIKE '%PINTURA%'  THEN 45.00
                WHEN UPPER(COALESCE(nombre,'')) LIKE '%MADERA%'   THEN 22.00
                WHEN UPPER(COALESCE(nombre,'')) LIKE '%LADRILLO%' THEN 1.20
                ELSE 12.00
            END
        WHERE precio_unitario IS NULL
    """))

    # ── 0E. Fill public.licitaciones — entidad, monto, fechas ──────────
    conn.execute(sa.text("""
        UPDATE public.licitaciones SET
            entidad_convocante = CASE (id % 4)
                WHEN 0 THEN 'MTC - Ministerio de Transportes y Comunicaciones'
                WHEN 1 THEN 'Gobierno Regional de Cajamarca'
                WHEN 2 THEN 'Provias Nacional'
                ELSE 'Gobierno Regional de Lima'
            END,
            monto_referencial = 500000 + (id % 20) * 100000,
            fecha_convocatoria = '2024-01-01'::date + (id * 15) * interval '1 day',
            fecha_presentacion = '2024-02-01'::date + (id * 15) * interval '1 day'
        WHERE entidad_convocante IS NULL
    """))

    # ── 0F. Fill sst.seguimiento_inspeccion_ssoma — update + insert 49 ──
    conn.execute(sa.text("""
        UPDATE sst.seguimiento_inspeccion_ssoma SET
            estado          = COALESCE(estado, 'PENDIENTE'),
            inspector       = COALESCE(inspector, 'Roberto Sanchez'),
            nivel_riesgo    = COALESCE(nivel_riesgo, 'MEDIO'),
            tipo_inspeccion = COALESCE(tipo_inspeccion, 'SEGURIDAD')
        WHERE estado IS NULL OR inspector IS NULL
    """))

    conn.execute(sa.text("""
        INSERT INTO sst.seguimiento_inspeccion_ssoma
            (fecha_hallazgo, lugar_hallazgo, tipo_inspeccion,
             inspector_dni, inspector, descripcion_hallazgo,
             nivel_riesgo, estado, created_at, updated_at)
        SELECT
            '2024-01-15'::timestamp + (gs * interval '7 days'),
            CASE (gs % 6)
                WHEN 0 THEN 'Zona de excavacion'
                WHEN 1 THEN 'Almacen central'
                WHEN 2 THEN 'Sector B - Encofrado'
                WHEN 3 THEN 'Planta de concreto'
                WHEN 4 THEN 'Campamento'
                ELSE 'Acceso principal'
            END,
            CASE (gs % 4)
                WHEN 0 THEN 'SEGURIDAD'
                WHEN 1 THEN 'SALUD'
                WHEN 2 THEN 'MEDIO AMBIENTE'
                ELSE 'GENERAL'
            END,
            CASE WHEN gs % 2 = 0 THEN '12345678' ELSE '87654321' END,
            CASE WHEN gs % 2 = 0 THEN 'Roberto Sanchez' ELSE 'Luis Fernandez' END,
            'Hallazgo #' || gs || ': ' || CASE (gs % 5)
                WHEN 0 THEN 'Falta de senalizacion en zona de riesgo'
                WHEN 1 THEN 'EPP incompleto en personal obrero'
                WHEN 2 THEN 'Andamio sin arriostramiento lateral'
                WHEN 3 THEN 'Extintor vencido sin reemplazo'
                ELSE 'Residuos peligrosos mal almacenados'
            END,
            CASE (gs % 3)
                WHEN 0 THEN 'ALTO' WHEN 1 THEN 'MEDIO' ELSE 'BAJO'
            END,
            CASE (gs % 3)
                WHEN 0 THEN 'PENDIENTE' WHEN 1 THEN 'EN PROCESO' ELSE 'CERRADO'
            END,
            NOW(), NOW()
        FROM generate_series(1, 49) gs
        WHERE NOT EXISTS (SELECT 1 FROM sst.seguimiento_inspeccion_ssoma LIMIT 1 OFFSET 1)
    """))

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║  LAYER 1 — FK-Dependent UPDATEs                                   ║
    # ╚══════════════════════════════════════════════════════════════════════╝

    # ── 1A. Fill equipo.equipo — tipo_equipo_id from codigo_equipo ──────
    conn.execute(sa.text("""
        UPDATE equipo.equipo e SET
            tipo_equipo_id = te.id
        FROM equipo.tipo_equipo te
        WHERE e.tipo_equipo_id IS NULL
          AND e.codigo_equipo IS NOT NULL
          AND te.codigo = (
              SELECT (regexp_matches(e.codigo_equipo, '-([A-Z]{2})-'))[1]
          )
    """))

    # Fallback: assign first tipo_equipo to remaining nulls
    conn.execute(sa.text("""
        UPDATE equipo.equipo SET
            tipo_equipo_id = (SELECT id FROM equipo.tipo_equipo ORDER BY id LIMIT 1)
        WHERE tipo_equipo_id IS NULL
    """))

    # ── 1A2. Fill equipo.equipo — proveedor_id (round-robin) ───────────
    conn.execute(sa.text("""
        UPDATE equipo.equipo SET
            proveedor_id = (
                SELECT id FROM proveedores.proveedor
                WHERE tenant_id = 1
                ORDER BY id
                LIMIT 1 OFFSET equipo.equipo.id %
                    GREATEST((SELECT COUNT(*) FROM proveedores.proveedor WHERE tenant_id = 1), 1)
            )
        WHERE proveedor_id IS NULL
    """))

    # ── 1B. Fill equipo.contrato_adenda — proveedor_id, tarifa ─────────
    conn.execute(sa.text("""
        UPDATE equipo.contrato_adenda ca SET
            proveedor_id = e.proveedor_id
        FROM equipo.equipo e
        WHERE ca.equipo_id = e.id
          AND ca.proveedor_id IS NULL
          AND e.proveedor_id IS NOT NULL
    """))

    conn.execute(sa.text("""
        UPDATE equipo.contrato_adenda SET
            tipo_tarifa = CASE (id % 3)
                WHEN 0 THEN 'HORA_MAQUINA'
                WHEN 1 THEN 'HORA_MAQUINA_SECO'
                ELSE 'TARIFA_DIARIA'
            END
        WHERE tipo_tarifa IS NULL
    """))

    conn.execute(sa.text("""
        UPDATE equipo.contrato_adenda SET
            tarifa = CASE tipo_tarifa
                WHEN 'HORA_MAQUINA'      THEN 180 + (id % 10) * 20
                WHEN 'HORA_MAQUINA_SECO' THEN 150 + (id % 10) * 15
                WHEN 'TARIFA_DIARIA'     THEN 800 + (id % 10) * 50
                ELSE 200
            END
        WHERE tarifa IS NULL
    """))

    # ── 1C. Fill administracion.programacion_pago ───────────────────────
    conn.execute(sa.text("""
        UPDATE administracion.programacion_pago SET
            proveedor_id = (
                SELECT id FROM proveedores.proveedor WHERE tenant_id = 1
                ORDER BY id LIMIT 1
                OFFSET administracion.programacion_pago.id % 3
            ),
            proyecto_id = (
                SELECT id FROM proyectos.edt WHERE nivel = 0
                ORDER BY id LIMIT 1
                OFFSET administracion.programacion_pago.id % 3
            ),
            periodo = CASE (id % 3)
                WHEN 0 THEN '2024-01'
                WHEN 1 THEN '2024-02'
                ELSE '2024-03'
            END,
            fecha_programada = CASE (id % 3)
                WHEN 0 THEN '2024-01-30'::date
                WHEN 1 THEN '2024-02-28'::date
                ELSE '2024-03-30'::date
            END
        WHERE proveedor_id IS NULL
    """))

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║  LAYER 2 — Second-Level FK UPDATEs                                ║
    # ╚══════════════════════════════════════════════════════════════════════╝

    # ── 2A. Fill equipo.valorizacion_equipo — proyecto_id, contrato_id ──
    conn.execute(sa.text("""
        UPDATE equipo.valorizacion_equipo SET
            proyecto_id = (
                SELECT id FROM proyectos.edt WHERE nivel = 0
                ORDER BY id LIMIT 1
                OFFSET equipo.valorizacion_equipo.id %
                    GREATEST((SELECT COUNT(*) FROM proyectos.edt WHERE nivel = 0), 1)
            )
        WHERE proyecto_id IS NULL
    """))

    conn.execute(sa.text("""
        UPDATE equipo.valorizacion_equipo v SET
            contrato_id = (
                SELECT ca.id FROM equipo.contrato_adenda ca
                WHERE ca.equipo_id = v.equipo_id
                ORDER BY ca.id DESC LIMIT 1
            )
        WHERE v.contrato_id IS NULL AND v.equipo_id IS NOT NULL
    """))

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║  LAYER 3 — Independent INSERTs (50+ rows each)                    ║
    # ╚══════════════════════════════════════════════════════════════════════╝

    # ── 3A. administracion.admin_centro_costo (50 rows) ─────────────────
    conn.execute(sa.text("""
        INSERT INTO administracion.admin_centro_costo
            (cuenta_por_pagar_legacy_id, item, codigo_componente,
             codigo_centro_costo, centro_costo, porcentaje, monto_final)
        SELECT
            cp.legacy_id,
            gs,
            'CP' || LPAD(gs::text, 3, '0'),
            'CC-' || LPAD((gs % 20 + 1)::text, 3, '0'),
            'Centro de costo ' || (gs % 20 + 1),
            CASE WHEN gs % 2 = 0 THEN 100::smallint ELSE 50::smallint END,
            (1000 + gs * 100)::numeric
        FROM generate_series(1, 50) gs
        CROSS JOIN LATERAL (
            SELECT legacy_id
            FROM administracion.cuenta_por_pagar
            WHERE legacy_id IS NOT NULL
            ORDER BY id LIMIT 1 OFFSET (gs - 1) % 50
        ) cp
        WHERE NOT EXISTS (SELECT 1 FROM administracion.admin_centro_costo LIMIT 1)
    """))

    # ── 3B. equipo.parte_diario_foto (50 rows) ─────────────────────────
    conn.execute(sa.text("""
        INSERT INTO equipo.parte_diario_foto
            (parte_diario_id, filename, original_name, mime_type, size, orden,
             tenant_id)
        SELECT
            pd.id,
            'foto_' || pd.id || '_' || foto_num || '.jpg',
            'Foto inspeccion ' || pd.id || ' - ' || foto_num || '.jpg',
            'image/jpeg',
            500000 + pd.id * 10 + foto_num * 50,
            foto_num,
            1
        FROM (
            SELECT id FROM equipo.parte_diario ORDER BY id LIMIT 25
        ) pd
        CROSS JOIN generate_series(1, 2) foto_num
        WHERE NOT EXISTS (SELECT 1 FROM equipo.parte_diario_foto LIMIT 1)
    """))

    # ── 3C. rrhh.edt_tareo (60 rows — 2 per tareo) ────────────────────
    conn.execute(sa.text("""
        INSERT INTO rrhh.edt_tareo (tareo_id, edt_id, horas)
        SELECT
            t.id,
            e.id,
            CASE ((t.id + e.rn) % 4)
                WHEN 0 THEN 8.0  WHEN 1 THEN 6.5
                WHEN 2 THEN 7.0  ELSE 5.5
            END
        FROM rrhh.tareo t
        CROSS JOIN LATERAL (
            SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn
            FROM proyectos.edt
            WHERE nivel = 0
            ORDER BY id
            LIMIT 2 OFFSET (t.id - 1) % GREATEST(
                (SELECT COUNT(*) FROM proyectos.edt WHERE nivel = 0) - 1, 1
            )
        ) e
        WHERE NOT EXISTS (SELECT 1 FROM rrhh.edt_tareo LIMIT 1)
    """))

    # ── 3D. rrhh.detalle_tareo (150 rows — 5 per tareo) ────────────────
    conn.execute(sa.text("""
        INSERT INTO rrhh.detalle_tareo
            (tareo_id, proyecto_id, fecha, horas_trabajadas,
             tarifa_hora, monto, observaciones)
        SELECT
            t.id,
            (SELECT id FROM proyectos.edt WHERE nivel = 0
             ORDER BY id LIMIT 1 OFFSET (t.id - 1) %
                GREATEST((SELECT COUNT(*) FROM proyectos.edt WHERE nivel = 0), 1)
            ),
            '2024-02-01'::date + (gs * interval '1 day'),
            CASE (gs % 3) WHEN 0 THEN 8.0 WHEN 1 THEN 6.5 ELSE 7.5 END,
            CASE (gs % 3) WHEN 0 THEN 25.0 WHEN 1 THEN 22.0 ELSE 28.0 END,
            CASE (gs % 3) WHEN 0 THEN 200.0 WHEN 1 THEN 143.0 ELSE 210.0 END,
            NULL
        FROM rrhh.tareo t
        CROSS JOIN generate_series(0, 4) gs
        WHERE NOT EXISTS (SELECT 1 FROM rrhh.detalle_tareo LIMIT 1)
    """))

    # ── 3E. aprobaciones.solicitud_aprobacion (50 rows) ─────────────────
    conn.execute(sa.text("""
        INSERT INTO aprobaciones.solicitud_aprobacion
            (tenant_id, plantilla_id, module_name, entity_id,
             proyecto_id, usuario_solicitante_id, titulo, descripcion,
             estado, paso_actual, fecha_creacion)
        SELECT
            1,
            ((gs - 1) % GREATEST((SELECT COUNT(*) FROM aprobaciones.plantilla_aprobacion), 1)) + 1,
            CASE (gs % 5)
                WHEN 0 THEN 'equipos'
                WHEN 1 THEN 'valorizaciones'
                WHEN 2 THEN 'contratos'
                WHEN 3 THEN 'logistica'
                ELSE 'rrhh'
            END,
            gs,
            (SELECT id FROM proyectos.edt WHERE nivel = 0
             ORDER BY id LIMIT 1 OFFSET (gs - 1) %
                GREATEST((SELECT COUNT(*) FROM proyectos.edt WHERE nivel = 0), 1)
            ),
            40,
            'Solicitud #' || gs || ' - ' || CASE (gs % 5)
                WHEN 0 THEN 'Alquiler de equipo'
                WHEN 1 THEN 'Valorizacion mensual'
                WHEN 2 THEN 'Nuevo contrato'
                WHEN 3 THEN 'Compra de materiales'
                ELSE 'Contratacion de personal'
            END,
            'Solicitud generada para datos de prueba',
            CASE (gs % 4)
                WHEN 0 THEN 'PENDIENTE'
                WHEN 1 THEN 'APROBADO'
                WHEN 2 THEN 'RECHAZADO'
                ELSE 'EN_PROCESO'
            END,
            CASE (gs % 4)
                WHEN 1 THEN 2  ELSE 1
            END,
            NOW() - ((50 - gs) * interval '1 day')
        FROM generate_series(1, 50) gs
        WHERE NOT EXISTS (SELECT 1 FROM aprobaciones.solicitud_aprobacion LIMIT 1)
          AND EXISTS (SELECT 1 FROM aprobaciones.plantilla_aprobacion LIMIT 1)
    """))

    # ── 3F. aprobaciones.respuesta_adhoc (12 rows) ─────────────────────
    conn.execute(sa.text("""
        INSERT INTO aprobaciones.respuesta_adhoc
            (tenant_id, solicitud_adhoc_id, aprobador_id,
             respuesta, comentario, fecha_respuesta)
        SELECT
            1,
            ((gs - 1) % 6) + 1,
            40,
            CASE (gs % 3)
                WHEN 0 THEN 'APROBADO'
                WHEN 1 THEN 'RECHAZADO'
                ELSE 'OBSERVADO'
            END,
            'Comentario de respuesta #' || gs,
            NOW() - ((12 - gs) * interval '1 day')
        FROM generate_series(1, 12) gs
        WHERE NOT EXISTS (SELECT 1 FROM aprobaciones.respuesta_adhoc LIMIT 1)
          AND (SELECT COUNT(*) FROM aprobaciones.solicitud_aprobacion) >= 6
    """))

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║  LAYER 4 — Dependent INSERTs                                      ║
    # ╚══════════════════════════════════════════════════════════════════════╝

    # ── 4A. equipo.checklist_inspeccion (50 rows) ──────────────────────
    conn.execute(sa.text("""
        INSERT INTO equipo.checklist_inspeccion
            (codigo, plantilla_id, equipo_id, trabajador_id,
             fecha_inspeccion, hora_inicio, hora_fin, ubicacion,
             estado, resultado_general,
             items_conforme, items_no_conforme, items_total,
             requiere_mantenimiento, equipo_operativo,
             created_at, updated_at)
        SELECT
            'INS-' || LPAD((gs + 9)::text, 4, '0'),
            (SELECT id FROM equipo.checklist_plantilla ORDER BY id LIMIT 1
             OFFSET (gs - 1) % GREATEST((SELECT COUNT(*) FROM equipo.checklist_plantilla), 1)),
            ((gs - 1) % 679) + 1,
            ((gs - 1) % 533) + 1,
            '2024-01-15'::date + (gs * interval '1 day'),
            '07:00'::time + ((gs % 4) * interval '1 hour'),
            '08:30'::time + ((gs % 4) * interval '1 hour'),
            CASE (gs % 5)
                WHEN 0 THEN 'Zona de excavacion'
                WHEN 1 THEN 'Almacen central'
                WHEN 2 THEN 'Sector B'
                WHEN 3 THEN 'Planta de concreto'
                ELSE 'Campamento'
            END,
            CASE (gs % 3)
                WHEN 0 THEN 'COMPLETADO'
                WHEN 1 THEN 'PENDIENTE'
                ELSE 'EN_PROCESO'
            END,
            CASE (gs % 3)
                WHEN 0 THEN 'APROBADO'
                WHEN 1 THEN 'PENDIENTE'
                ELSE 'OBSERVADO'
            END,
            12 + (gs % 5),
            gs % 3,
            16,
            gs % 4 = 0,
            gs % 5 != 0,
            NOW(), NOW()
        FROM generate_series(1, 50) gs
        WHERE NOT EXISTS (SELECT 1 FROM equipo.checklist_inspeccion LIMIT 1)
          AND EXISTS (SELECT 1 FROM equipo.checklist_plantilla LIMIT 1)
    """))

    # ── 4B. aprobaciones.paso_solicitud (100 rows — 2 per solicitud) ───
    conn.execute(sa.text("""
        INSERT INTO aprobaciones.paso_solicitud
            (tenant_id, solicitud_id, paso_numero, aprobador_id,
             estado_paso, accion_fecha, comentario)
        SELECT
            1,
            sa.id,
            paso,
            40,
            CASE
                WHEN sa.estado = 'APROBADO' THEN 'APROBADO'
                WHEN sa.estado = 'RECHAZADO' AND paso = 1 THEN 'RECHAZADO'
                WHEN paso <= sa.paso_actual THEN 'APROBADO'
                ELSE 'PENDIENTE'
            END,
            CASE
                WHEN sa.estado IN ('APROBADO','RECHAZADO') OR paso <= sa.paso_actual
                    THEN sa.fecha_creacion + (paso * interval '1 day')
                ELSE NULL
            END,
            CASE
                WHEN sa.estado IN ('APROBADO','RECHAZADO') OR paso <= sa.paso_actual
                    THEN 'Paso ' || paso || ' procesado'
                ELSE NULL
            END
        FROM aprobaciones.solicitud_aprobacion sa
        CROSS JOIN generate_series(1, 2) paso
        WHERE NOT EXISTS (SELECT 1 FROM aprobaciones.paso_solicitud LIMIT 1)
    """))

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║  LAYER 5 — Secondary Dependent INSERTs                            ║
    # ╚══════════════════════════════════════════════════════════════════════╝

    # ── 5A. equipo.checklist_resultado (250 rows — 5 items per insp.) ──
    conn.execute(sa.text("""
        INSERT INTO equipo.checklist_resultado
            (inspeccion_id, item_id, conforme, valor_medido,
             observaciones, accion_requerida, created_at, updated_at)
        SELECT
            ci.id,
            item.id,
            (ci.id + item.id) % 5 != 0,
            CASE WHEN (ci.id + item.id) % 3 = 0 THEN 'OK' ELSE NULL END,
            CASE WHEN (ci.id + item.id) % 5 = 0
                 THEN 'Requiere atencion' ELSE NULL END,
            CASE WHEN (ci.id + item.id) % 5 = 0
                 THEN 'Programar mantenimiento' ELSE NULL END,
            NOW(), NOW()
        FROM equipo.checklist_inspeccion ci
        CROSS JOIN LATERAL (
            SELECT id FROM equipo.checklist_item ORDER BY id LIMIT 5
        ) item
        WHERE ci.codigo LIKE 'INS-%'
          AND NOT EXISTS (SELECT 1 FROM equipo.checklist_resultado LIMIT 1)
    """))

    # ╔══════════════════════════════════════════════════════════════════════╗
    # ║  LAYER 6 — Computed Updates + Notifications                       ║
    # ╚══════════════════════════════════════════════════════════════════════╝

    # ── 6A. Recalculate rrhh.tareo.total_horas ─────────────────────────
    conn.execute(sa.text("""
        UPDATE rrhh.tareo t SET
            total_horas = COALESCE((
                SELECT SUM(horas_trabajadas) FROM rrhh.detalle_tareo dt
                WHERE dt.tareo_id = t.id
            ), 0)
    """))

    # ── 6B. Insert notificaciones for admin user (id=40) ───────────────
    conn.execute(sa.text("""
        INSERT INTO public.notificaciones
            (is_active, usuario_id, tipo, titulo, mensaje, leido,
             data, url, created_at, updated_at)
        SELECT * FROM (VALUES
            (true, 40, 'SISTEMA', 'Bienvenido al sistema',
             'Su cuenta ha sido configurada correctamente',
             false, NULL::jsonb, '/dashboard',
             NOW(), NOW()),
            (true, 40, 'APROBACION', 'Solicitudes pendientes',
             'Tiene solicitudes pendientes de revision',
             false, '{"count": 5}'::jsonb, '/approvals/dashboard',
             NOW() - interval '1 day', NOW() - interval '1 day'),
            (true, 40, 'EQUIPO', 'Checklist completado',
             'Se completo la inspeccion INS-0010 del equipo',
             false, NULL::jsonb, '/checklists',
             NOW() - interval '2 days', NOW() - interval '2 days'),
            (true, 40, 'LOGISTICA', 'Stock bajo',
             'Producto ALAMBRE 16" por debajo del stock minimo',
             false, NULL::jsonb, '/logistics/products',
             NOW() - interval '3 days', NOW() - interval '3 days'),
            (true, 40, 'RRHH', 'Nuevo registro',
             'Se registro un nuevo trabajador en el sistema',
             true, NULL::jsonb, '/rrhh/worker-registry',
             NOW() - interval '5 days', NOW() - interval '5 days'),
            (true, 40, 'SST', 'Inspeccion requerida',
             'Inspecciones SSOMA pendientes de seguimiento',
             false, NULL::jsonb, '/sst/inspecciones',
             NOW() - interval '7 days', NOW() - interval '7 days'),
            (true, 40, 'FINANCIERO', 'Pago programado',
             'Programacion de pago pendiente de aprobacion',
             false, NULL::jsonb, '/administracion/payment-schedules',
             NOW() - interval '10 days', NOW() - interval '10 days'),
            (true, 40, 'CONTRATO', 'Contrato por vencer',
             'Contrato CT-2024-001 vence en 15 dias',
             false, NULL::jsonb, '/equipment',
             NOW() - interval '14 days', NOW() - interval '14 days')
        ) AS v(is_active, usuario_id, tipo, titulo, mensaje, leido,
               data, url, created_at, updated_at)
        WHERE NOT EXISTS (
            SELECT 1 FROM public.notificaciones WHERE usuario_id = 40 LIMIT 1
        )
    """))

    # ── 6C. Fix admin password (Admin@123) ────────────────────────────
    # The seed migration (009) may set a different hash; tests expect Admin@123
    conn.execute(sa.text("""
        UPDATE sistema.usuario
        SET contrasena = '$2b$12$vhXcxtIj4S1t9w955sVE..WUx/dz8mkUqU8.Lm0r7b7fo/JxbOZmm'
        WHERE id = 40
    """))


def downgrade() -> None:
    conn = op.get_bind()

    # ── Layer 6 ─────────────────────────────────────────────────────────
    conn.execute(sa.text(
        "DELETE FROM public.notificaciones WHERE usuario_id = 40"
    ))
    conn.execute(sa.text("UPDATE rrhh.tareo SET total_horas = 0"))

    # ── Layer 5 ─────────────────────────────────────────────────────────
    conn.execute(sa.text("""
        DELETE FROM equipo.checklist_resultado
        WHERE inspeccion_id IN (
            SELECT id FROM equipo.checklist_inspeccion WHERE codigo LIKE 'INS-%%'
        )
    """))

    # ── Layer 4 ─────────────────────────────────────────────────────────
    conn.execute(sa.text("DELETE FROM aprobaciones.paso_solicitud"))
    conn.execute(sa.text(
        "DELETE FROM equipo.checklist_inspeccion WHERE codigo LIKE 'INS-%%'"
    ))

    # ── Layer 3 ─────────────────────────────────────────────────────────
    conn.execute(sa.text("DELETE FROM aprobaciones.respuesta_adhoc"))
    conn.execute(sa.text("DELETE FROM aprobaciones.solicitud_aprobacion"))
    conn.execute(sa.text("DELETE FROM rrhh.detalle_tareo"))
    conn.execute(sa.text("DELETE FROM rrhh.edt_tareo"))
    conn.execute(sa.text("DELETE FROM equipo.parte_diario_foto"))
    conn.execute(sa.text("DELETE FROM administracion.admin_centro_costo"))

    # ── Layer 2 ─────────────────────────────────────────────────────────
    conn.execute(sa.text(
        "UPDATE equipo.valorizacion_equipo "
        "SET proyecto_id = NULL, contrato_id = NULL"
    ))

    # ── Layer 1 ─────────────────────────────────────────────────────────
    conn.execute(sa.text(
        "UPDATE administracion.programacion_pago "
        "SET proveedor_id = NULL, proyecto_id = NULL, "
        "    periodo = NULL, fecha_programada = NULL"
    ))
    conn.execute(sa.text(
        "UPDATE equipo.contrato_adenda "
        "SET proveedor_id = NULL, tipo_tarifa = NULL, tarifa = NULL"
    ))
    conn.execute(sa.text(
        "UPDATE equipo.equipo "
        "SET tipo_equipo_id = NULL, proveedor_id = NULL"
    ))

    # ── Layer 0 ─────────────────────────────────────────────────────────
    conn.execute(sa.text(
        "DELETE FROM sst.seguimiento_inspeccion_ssoma WHERE id > 1"
    ))
    conn.execute(sa.text(
        "UPDATE sst.seguimiento_inspeccion_ssoma "
        "SET estado = NULL, inspector = NULL, "
        "    nivel_riesgo = NULL, tipo_inspeccion = NULL"
    ))
    conn.execute(sa.text(
        "UPDATE public.licitaciones "
        "SET entidad_convocante = NULL, monto_referencial = NULL, "
        "    fecha_convocatoria = NULL, fecha_presentacion = NULL"
    ))
    conn.execute(sa.text(
        "UPDATE logistica.producto "
        "SET stock_minimo = NULL, precio_unitario = NULL"
    ))
    conn.execute(sa.text(
        "UPDATE proveedores.proveedor SET nombre_comercial = NULL"
    ))
    conn.execute(sa.text(
        "UPDATE rrhh.trabajador SET cargo = NULL, especialidad = NULL"
    ))
    conn.execute(sa.text(
        "UPDATE administracion.centro_costo SET tenant_id = NULL"
    ))
    conn.execute(sa.text(
        "UPDATE proyectos.edt "
        "SET ubicacion = NULL, fecha_inicio = NULL, "
        "    fecha_fin = NULL, cliente = NULL, empresa_id = NULL"
    ))
    conn.execute(sa.text(
        "ALTER TABLE proyectos.edt DROP COLUMN IF EXISTS nivel"
    ))
