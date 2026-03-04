"""Add legacy tables for data migration.

Creates the 'catalogo' schema and runs Base.metadata.create_all() to pick up
all new models added in Phase 1 (legacy tables from SQL Server migration).

New tables:
  catalogo: tipo_medio_pago, unidad_medida, tipo_comprobante, tipo_operacion
  sistema: permiso, rol_permiso, usuario_rol_unidad_operativa, componente_unidad_operativa
  administracion: caja_chica, solicitud_caja, movimiento_caja, cuenta_caja_banco,
                  flujo_caja_banco, admin_centro_costo, detalle_movimiento_contable
  logistica: categoria, solicitud_material, detalle_solicitud_material,
             requerimiento, detalle_requerimiento, cotizacion_logistica
  proveedores: criterio_seleccion_evaluacion, seleccion_proveedor, evaluacion_proveedor
  equipo: equipo_edt, equipo_combustible
  rrhh: registro_trabajador, comportamiento_historico, edt_tareo
  sst: lista_acto_condicion_inseguro, seguimiento_inspeccion_ssoma,
       seguimiento_inspeccion, reporte_acto_condicion

Revision ID: 008_add_legacy_tables
Create Date: 2026-03-04
"""

from alembic import op

revision = "008_add_legacy_tables"
down_revision = "007_seed_checklist_observations"
branch_labels = None
depends_on = None

# New tables added in this migration, grouped by schema for downgrade
_NEW_TABLES = {
    "catalogo": [
        "tipo_medio_pago",
        "unidad_medida",
        "tipo_comprobante",
        "tipo_operacion",
    ],
    "sistema": [
        "permiso",
        "rol_permiso",
        "usuario_rol_unidad_operativa",
        "componente_unidad_operativa",
    ],
    "administracion": [
        "caja_chica",
        "solicitud_caja",
        "movimiento_caja",
        "cuenta_caja_banco",
        "flujo_caja_banco",
        "admin_centro_costo",
        "detalle_movimiento_contable",
    ],
    "logistica": [
        "categoria",
        "solicitud_material",
        "detalle_solicitud_material",
        "requerimiento",
        "detalle_requerimiento",
        "cotizacion_logistica",
    ],
    "proveedores": [
        "criterio_seleccion_evaluacion",
        "seleccion_proveedor",
        "evaluacion_proveedor",
    ],
    "equipo": [
        "equipo_edt",
        "equipo_combustible",
    ],
    "rrhh": [
        "registro_trabajador",
        "comportamiento_historico",
        "edt_tareo",
    ],
    "sst": [
        "lista_acto_condicion_inseguro",
        "seguimiento_inspeccion_ssoma",
        "seguimiento_inspeccion",
        "reporte_acto_condicion",
    ],
}


def upgrade() -> None:
    # ── 1. Create catalogo schema ──────────────────────────────────────────
    op.execute("CREATE SCHEMA IF NOT EXISTS catalogo")

    # ── 2. Import all models so metadata picks them up ─────────────────────
    import app.modelos.administracion  # noqa: F401
    import app.modelos.aprobaciones  # noqa: F401
    import app.modelos.catalogo  # noqa: F401
    import app.modelos.checklist  # noqa: F401
    import app.modelos.equipo  # noqa: F401
    import app.modelos.licitacion  # noqa: F401
    import app.modelos.logistica  # noqa: F401
    import app.modelos.proveedores  # noqa: F401
    import app.modelos.proyectos  # noqa: F401
    import app.modelos.publico  # noqa: F401
    import app.modelos.rrhh  # noqa: F401
    import app.modelos.sig  # noqa: F401
    import app.modelos.sistema  # noqa: F401
    import app.modelos.sst  # noqa: F401
    import app.modelos.tarea_programada  # noqa: F401

    from app.modelos.base import Base

    # ── 3. Create all new tables (checkfirst=True skips existing ones) ─────
    bind = op.get_bind()
    Base.metadata.create_all(bind=bind, checkfirst=True)


def downgrade() -> None:
    # Drop new tables in reverse order (children before parents)
    for schema, tables in _NEW_TABLES.items():
        for table in reversed(tables):
            op.execute(f"DROP TABLE IF EXISTS {schema}.{table} CASCADE")

    # Drop the catalogo schema (only schema introduced in this migration)
    op.execute("DROP SCHEMA IF EXISTS catalogo CASCADE")
