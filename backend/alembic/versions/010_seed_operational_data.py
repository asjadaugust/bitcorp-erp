"""Seed operational data for feature phases.

Populates tables that currently have zero rows but are required by the
feature-phase API endpoints (phases 1-9). This ensures list/detail
endpoints return meaningful data during development and QA.

Tables seeded:
  - logistica.solicitud_material (4 rows)
  - logistica.detalle_solicitud_material (10 rows)
  - logistica.requerimiento (4 rows)
  - logistica.detalle_requerimiento (10 rows)
  - logistica.cotizacion_logistica (3 rows)
  - proveedores.seleccion_proveedor (3 rows)
  - sst.seguimiento_inspeccion (5 rows)
  - sst.reporte_acto_condicion (4 rows)
  - rrhh.registro_trabajador (5 rows)
  - rrhh.comportamiento_historico (5 rows)
  - rrhh.edt_tareo (5 rows)

Revision ID: 010_seed_operational_data
Revises: 009_seed_legacy_data
Create Date: 2026-03-04
"""

from alembic import op
import sqlalchemy as sa

revision = "010_seed_operational_data"
down_revision = "009_seed_legacy_data"
branch_labels = None
depends_on = None

# Tables seeded by this migration (children before parents for truncation)
_SEEDED_TABLES = [
    "logistica.detalle_solicitud_material",
    "logistica.detalle_requerimiento",
    "rrhh.comportamiento_historico",
    "rrhh.edt_tareo",
    "logistica.solicitud_material",
    "logistica.requerimiento",
    "logistica.cotizacion_logistica",
    "proveedores.seleccion_proveedor",
    "sst.seguimiento_inspeccion",
    "sst.reporte_acto_condicion",
    "rrhh.registro_trabajador",
]


def upgrade() -> None:
    conn = op.get_bind()

    # ── 1. Solicitud Material (4 rows) ────────────────────────────────────
    conn.execute(sa.text("""
        INSERT INTO logistica.solicitud_material
            (motivo, fecha_solicitud, solicitado_por)
        VALUES
            ('Reposicion de materiales para obra Cutervo',
             '2026-02-10', 'Juan Perez'),
            ('Solicitud urgente de clavos y alambres',
             '2026-02-15', 'Carlos Garcia'),
            ('Materiales para encofrado sector B',
             '2026-02-20', 'Maria Lopez'),
            ('Solicitud de EPP para personal nuevo',
             '2026-02-25', 'Ana Torres')
    """))

    # ── 2. Detalle Solicitud Material (10 rows) ──────────────────────────
    conn.execute(sa.text("""
        INSERT INTO logistica.detalle_solicitud_material
            (solicitud_legacy_id, producto_legacy_id, producto,
             cantidad, unidad_medida, fecha_requerida,
             marca_sugerida, descripcion, estatus)
        VALUES
            (NULL, NULL, 'ALAMBRE 16"',
             50, 'KG', '2026-02-15',
             NULL, 'Alambre para amarras', 'PENDIENTE'),
            (NULL, NULL, 'CLAVO 3"',
             30, 'KG', '2026-02-15',
             NULL, 'Clavos para encofrado', 'PENDIENTE'),
            (NULL, NULL, 'CLAVO 4"',
             20, 'KG', '2026-02-15',
             'PRODAC', 'Clavos para estructura', 'APROBADO'),
            (NULL, NULL, 'ALAMBRE 8"',
             40, 'KG', '2026-02-20',
             NULL, 'Alambre delgado', 'PENDIENTE'),
            (NULL, NULL, 'CLAVO 1" 1/2',
             15, 'KG', '2026-02-20',
             NULL, 'Clavos para acabados', 'PENDIENTE'),
            (NULL, NULL, 'CLAVO 2"',
             25, 'KG', '2026-02-25',
             NULL, 'Clavos medianos', 'APROBADO'),
            (NULL, NULL, 'CLAVO 8"',
             10, 'KG', '2026-02-25',
             'PRODAC', 'Clavos largos', 'PENDIENTE'),
            (NULL, NULL, 'CLAVO DE 1"',
             35, 'KG', '2026-03-01',
             NULL, 'Clavos cortos', 'PENDIENTE'),
            (NULL, NULL, 'CLAVO DE 1/2',
             20, 'KG', '2026-03-01',
             NULL, 'Clavos muy cortos', 'RECHAZADO'),
            (NULL, NULL, 'CLAVO DE CALAMINA 2"',
             45, 'KG', '2026-03-01',
             NULL, 'Clavos de calamina', 'PENDIENTE')
    """))

    # ── 3. Requerimiento (4 rows) ─────────────────────────────────────────
    conn.execute(sa.text("""
        INSERT INTO logistica.requerimiento
            (numero_requerimiento, motivo, fecha_requerimiento, solicitado_por)
        VALUES
            (1001, 'Requerimiento mensual febrero',
             '2026-02-05', 'Juan Perez'),
            (1002, 'Requerimiento urgente obra Cutervo',
             '2026-02-12', 'Carlos Garcia'),
            (1003, 'Requerimiento EPP trimestral',
             '2026-02-18', 'Maria Lopez'),
            (1004, 'Requerimiento herramientas sector C',
             '2026-02-28', 'Pedro Quispe')
    """))

    # ── 4. Detalle Requerimiento (10 rows) ────────────────────────────────
    conn.execute(sa.text("""
        INSERT INTO logistica.detalle_requerimiento
            (requerimiento_legacy_id, producto_legacy_id, producto,
             cantidad, unidad_medida, fecha_requerida,
             marca_sugerida, descripcion, estatus)
        VALUES
            (NULL, NULL, 'ALAMBRE 16"',
             100, 'KG', '2026-02-10',
             NULL, 'Alambre para amarras estructurales', 'PENDIENTE'),
            (NULL, NULL, 'CLAVO 3"',
             50, 'KG', '2026-02-10',
             'PRODAC', 'Clavos para encofrado principal', 'APROBADO'),
            (NULL, NULL, 'ALAMBRE 8"',
             60, 'KG', '2026-02-10',
             NULL, 'Alambre delgado para refuerzo', 'PENDIENTE'),
            (NULL, NULL, 'CLAVO 4"',
             40, 'KG', '2026-02-15',
             NULL, 'Clavos para estructura de madera', 'PENDIENTE'),
            (NULL, NULL, 'CLAVO 1" 1/2',
             25, 'KG', '2026-02-15',
             NULL, 'Clavos cortos para acabados', 'APROBADO'),
            (NULL, NULL, 'CLAVO 2"',
             35, 'KG', '2026-02-20',
             NULL, 'Clavos medianos multiuso', 'PENDIENTE'),
            (NULL, NULL, 'CLAVO 8"',
             15, 'KG', '2026-02-20',
             'PRODAC', 'Clavos largos para vigas', 'RECHAZADO'),
            (NULL, NULL, 'CLAVO DE 1"',
             45, 'KG', '2026-02-25',
             NULL, 'Clavos cortos para paneles', 'PENDIENTE'),
            (NULL, NULL, 'CLAVO DE CALAMINA 2"',
             55, 'KG', '2026-02-25',
             NULL, 'Clavos de calamina para techos', 'APROBADO'),
            (NULL, NULL, 'CLAVO DE 1/2',
             30, 'KG', '2026-03-01',
             NULL, 'Clavos muy cortos para detalles', 'PENDIENTE')
    """))

    # ── 5. Cotizacion Logistica (3 rows) ──────────────────────────────────
    conn.execute(sa.text("""
        INSERT INTO logistica.cotizacion_logistica
            (numero_cotizacion)
        VALUES
            (5001),
            (5002),
            (5003)
    """))

    # ── 6. Seleccion Proveedor (3 rows) ───────────────────────────────────
    conn.execute(sa.text("""
        INSERT INTO proveedores.seleccion_proveedor
            (legacy_id)
        VALUES
            ('SEL-001'),
            ('SEL-002'),
            ('SEL-003')
    """))

    # ── 7. Seguimiento Inspeccion (5 rows) ────────────────────────────────
    conn.execute(sa.text("""
        INSERT INTO sst.seguimiento_inspeccion
            (fecha, inspector_dni, inspector, descripcion_inspeccion,
             link_evidencia, fecha_proxima_inspeccion, avance_estimado,
             seguimiento_ssoma_legacy_id)
        VALUES
            ('2026-02-01 08:00:00', '12345678', 'Roberto Sanchez',
             'Inspeccion de seguridad zona de excavacion',
             NULL, '2026-03-01', 30, '1'),
            ('2026-02-05 09:30:00', '12345678', 'Roberto Sanchez',
             'Verificacion uso de EPP personal obrero',
             NULL, '2026-03-05', 60, '1'),
            ('2026-02-10 10:00:00', '87654321', 'Luis Fernandez',
             'Inspeccion de andamios sector norte',
             NULL, '2026-03-10', 80, '1'),
            ('2026-02-15 14:00:00', '87654321', 'Luis Fernandez',
             'Revision de extintores planta baja',
             NULL, '2026-03-15', 100, '1'),
            ('2026-02-20 11:00:00', '12345678', 'Roberto Sanchez',
             'Inspeccion general almacen de materiales',
             NULL, '2026-03-20', 50, '1')
    """))

    # ── 8. Reporte Acto Condicion (4 rows) ────────────────────────────────
    conn.execute(sa.text("""
        INSERT INTO sst.reporte_acto_condicion
            (fecha_registro, registrado_por_dni, registrado_por,
             reportado_por_dni, reportado_por_nombre, cargo,
             empresa_reportante, fecha_evento, lugar, empresa,
             sistema_gestion, tipo_reporte, codigo_acto_condicion,
             acto_condicion, descripcion, estado,
             accion_correctiva)
        VALUES
            ('2026-02-03 08:30:00', '12345678', 'Roberto Sanchez',
             '11111111', 'Carlos Ramirez', 'Operador',
             'BITCORP SAC', '2026-02-03 07:45:00', 'Zona excavacion', 'BITCORP SAC',
             'SST', 'ACTO', 'A01',
             'No usa casco de seguridad', 'Trabajador sin casco en zona de riesgo', 'ABIERTO',
             'Capacitacion inmediata sobre uso de EPP'),
            ('2026-02-08 10:00:00', '87654321', 'Luis Fernandez',
             '22222222', 'Pedro Martinez', 'Supervisor',
             'BITCORP SAC', '2026-02-08 09:30:00', 'Almacen', 'BITCORP SAC',
             'SST', 'CONDICION', 'C03',
             'Piso resbaloso sin senalizacion', 'Derrame de aceite sin limpiar ni senalizar', 'CERRADO',
             'Limpieza inmediata y colocacion de senales'),
            ('2026-02-14 15:00:00', '12345678', 'Roberto Sanchez',
             '33333333', 'Ana Gutierrez', 'Ingeniera',
             'BITCORP SAC', '2026-02-14 14:00:00', 'Sector B', 'BITCORP SAC',
             'SST', 'ACTO', 'A05',
             'Uso incorrecto de arnes', 'Trabajador con arnes mal ajustado en altura', 'ABIERTO',
             'Reinduccion en trabajo en altura'),
            ('2026-02-22 09:00:00', '87654321', 'Luis Fernandez',
             '44444444', 'Jorge Huamani', 'Capataz',
             'BITCORP SAC', '2026-02-22 08:15:00', 'Planta', 'BITCORP SAC',
             'SGA', 'CONDICION', 'C07',
             'Residuos mal segregados', 'Contenedor de residuos peligrosos sin tapa', 'ABIERTO',
             'Reemplazo de contenedor y capacitacion')
    """))

    # ── 9. Registro Trabajador (5 rows) ───────────────────────────────────
    # Uses DNI references to rrhh.trabajador (first 5 workers)
    conn.execute(sa.text("""
        INSERT INTO rrhh.registro_trabajador
            (trabajador_dni, proveedor_ruc, fecha_ingreso, fecha_cese,
             estatus, fecha_registro, registrado_por, sub_grupo)
        VALUES
            ('00000001', NULL, '2025-01-15', NULL,
             'ACTIVO', '2025-01-15', 'Admin Sistema', 'OBREROS'),
            ('01220034', NULL, '2025-02-01', NULL,
             'ACTIVO', '2025-02-01', 'Admin Sistema', 'OBREROS'),
            ('01240877', NULL, '2025-03-10', NULL,
             'ACTIVO', '2025-03-10', 'Admin Sistema', 'OPERADORES'),
            ('01263116', '10012014932', '2025-04-01', '2025-12-31',
             'CESADO', '2025-04-01', 'Admin Sistema', 'OBREROS'),
            ('01270942', NULL, '2025-05-15', NULL,
             'ACTIVO', '2025-05-15', 'Admin Sistema', 'OPERADORES')
    """))

    # ── 10. Comportamiento Historico (5 rows) ─────────────────────────────
    # References registro_trabajador via legacy_id pattern
    conn.execute(sa.text("""
        INSERT INTO rrhh.comportamiento_historico
            (cargo, salario, fecha_inicio, fecha_fin,
             numero_contrato, registro_trabajador_legacy_id)
        VALUES
            ('Operador de excavadora', 3500.00,
             '2025-01-15', '2025-06-30', 'CONT-2025-001', NULL),
            ('Peon de obra', 2200.00,
             '2025-02-01', '2025-07-31', 'CONT-2025-002', NULL),
            ('Operador de rodillo', 3200.00,
             '2025-03-10', '2025-08-31', 'CONT-2025-003', NULL),
            ('Oficial de albañileria', 2800.00,
             '2025-04-01', '2025-12-31', 'CONT-2025-004', NULL),
            ('Operador de volquete', 3000.00,
             '2025-05-15', NULL, 'CONT-2025-005', NULL)
    """))

    # ── 11. EDT Tareo (5 rows) ────────────────────────────────────────────
    # References rrhh.tareo and proyectos.edt
    conn.execute(sa.text("""
        INSERT INTO rrhh.edt_tareo
            (edt_id, tareo_id, horas)
        VALUES
            (1, 1, 8.00),
            (2, 1, 4.50),
            (1, 2, 10.00),
            (3, 3, 6.00),
            (2, 4, 7.50)
    """))


def downgrade() -> None:
    conn = op.get_bind()

    # Truncate all seeded tables (children first)
    for table in _SEEDED_TABLES:
        conn.execute(sa.text(f"TRUNCATE TABLE {table} CASCADE"))

    # Reset identity sequences
    for table in _SEEDED_TABLES:
        schema, tbl = table.split(".")
        seq_name = f"{schema}.{tbl}_id_seq"
        conn.execute(sa.text(f"ALTER SEQUENCE IF EXISTS {seq_name} RESTART WITH 1"))
