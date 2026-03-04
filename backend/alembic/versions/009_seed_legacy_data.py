"""Seed legacy data from converted SQL Server exports.

Replaces all existing demo/test seed data (from migrations 003-007) with
actual production data migrated from the legacy SQL Server database.

Process:
  1. Truncates all tables that will receive legacy data (CASCADE handles dependents)
  2. Resets identity sequences
  3. Executes generated SQL files (layer_00 through layer_06) in dependency order

Data volume: ~79,000 rows across 43 tables.

Revision ID: 009_seed_legacy_data
Revises: 008_add_legacy_tables
Create Date: 2026-03-04
"""

from pathlib import Path

from alembic import op
import sqlalchemy as sa

revision = "009_seed_legacy_data"
down_revision = "008_add_legacy_tables"
branch_labels = None
depends_on = None

# Directory containing generated SQL files (relative to this migration file)
SEED_DATA_DIR = Path(__file__).resolve().parent.parent / "seed_data"

# All tables that receive legacy data, listed in reverse dependency order
# for safe truncation (children before parents).
# TRUNCATE CASCADE handles FK dependencies automatically, but listing in
# reverse order makes the intent clear and handles edge cases.
_TABLES_TO_TRUNCATE = [
    # Layer 6
    "equipo.equipo_edt",
    # Layer 5
    "equipo.parte_diario",
    "equipo.adelanto_amortizacion",
    "equipo.gasto_en_obra",
    "equipo.analisis_combustible",
    "equipo.equipo_combustible",
    # Layer 4
    "equipo.valorizacion_equipo",
    "administracion.detalle_programacion_pago",
    "administracion.detalle_movimiento_contable",
    "logistica.detalle_movimiento",
    "rrhh.edt_tareo",
    # Layer 3
    "equipo.contrato_adenda",
    "rrhh.comportamiento_historico",
    "rrhh.tareo",
    "administracion.programacion_pago",
    "administracion.admin_centro_costo",
    "administracion.flujo_caja_banco",
    "logistica.movimiento",
    "sst.seguimiento_inspeccion",
    # Layer 2
    "sistema.usuario_rol_unidad_operativa",
    "equipo.equipo",
    "rrhh.registro_trabajador",
    "administracion.cuenta_por_pagar",
    "administracion.movimiento_caja",
    "administracion.solicitud_caja",
    "proveedores.evaluacion_proveedor",
    "logistica.detalle_solicitud_material",
    "logistica.detalle_requerimiento",
    "sst.reporte_acto_condicion",
    "sst.seguimiento_inspeccion_ssoma",
    # Layer 1
    "sistema.usuario",
    "sistema.rol_permiso",
    "sistema.componente_unidad_operativa",
    "proveedores.proveedor",
    "rrhh.trabajador",
    "proyectos.edt",
    "administracion.cuenta_caja_banco",
    "logistica.producto",
    "logistica.solicitud_material",
    "logistica.requerimiento",
    "logistica.cotizacion_logistica",
    "proveedores.seleccion_proveedor",
    # Layer 0
    "catalogo.tipo_medio_pago",
    "catalogo.unidad_medida",
    "catalogo.tipo_comprobante",
    "catalogo.tipo_operacion",
    "sistema.unidad_operativa",
    "sistema.rol",
    "sistema.permiso",
    "logistica.categoria",
    "administracion.centro_costo",
    "administracion.caja_chica",
    "equipo.tipo_equipo",
    "proveedores.criterio_seleccion_evaluacion",
    "sst.lista_acto_condicion_inseguro",
]

# SQL files to execute in dependency order
_LAYER_FILES = [
    "layer_00.sql",
    "layer_01.sql",
    "layer_02.sql",
    "layer_03.sql",
    "layer_04.sql",
    "layer_05.sql",
    "layer_06.sql",
]


def _split_sql_statements(sql_content: str) -> list[str]:
    """Split SQL content on statement-ending semicolons, respecting quoted strings.

    Handles:
    - Semicolons inside single-quoted strings (e.g., in data values)
    - Escaped quotes ('') inside strings
    - SQL comments (-- to end of line) which may contain apostrophes
    """
    statements: list[str] = []
    current: list[str] = []
    in_string = False
    i = 0
    length = len(sql_content)

    while i < length:
        c = sql_content[i]

        if in_string:
            current.append(c)
            if c == "'" and i + 1 < length and sql_content[i + 1] == "'":
                # Escaped quote ('') — consume both
                current.append(sql_content[i + 1])
                i += 2
                continue
            elif c == "'":
                in_string = False
        else:
            if c == "-" and i + 1 < length and sql_content[i + 1] == "-":
                # SQL line comment — skip to end of line
                # Include the comment in current statement (preserves formatting)
                while i < length and sql_content[i] != "\n":
                    current.append(sql_content[i])
                    i += 1
                if i < length:
                    current.append(sql_content[i])  # include \n
                    i += 1
                continue
            elif c == "'":
                in_string = True
                current.append(c)
            elif c == ";":
                # Statement boundary
                stmt = "".join(current).strip()
                if stmt:
                    statements.append(stmt)
                current = []
            else:
                current.append(c)

        i += 1

    # Handle any remaining content (no trailing semicolon)
    remainder = "".join(current).strip()
    if remainder:
        statements.append(remainder)

    return statements


def _execute_sql_file(conn: sa.Connection, filename: str) -> None:
    """Read and execute a SQL file, splitting on statement-ending semicolons."""
    filepath = SEED_DATA_DIR / filename
    if not filepath.exists():
        raise FileNotFoundError(f"Seed data file not found: {filepath}")

    sql_content = filepath.read_text(encoding="utf-8")
    statements = _split_sql_statements(sql_content)

    for stmt in statements:
        # Skip comment-only blocks
        lines = [
            l for l in stmt.split("\n") if l.strip() and not l.strip().startswith("--")
        ]
        if not lines:
            continue

        # Only execute if there's actual SQL
        if any(
            keyword in stmt.upper()
            for keyword in ("INSERT", "UPDATE", "DELETE", "SELECT")
        ):
            conn.execute(sa.text(stmt))


def upgrade() -> None:
    conn = op.get_bind()

    # ── 1. Truncate all tables that will receive legacy data ─────────────
    # Using CASCADE to handle FK dependencies from tables NOT in this list
    # (e.g., checklist_*, programa_mantenimiento, etc.)
    for table in _TABLES_TO_TRUNCATE:
        conn.execute(sa.text(f"TRUNCATE TABLE {table} CASCADE"))

    # ── 2. Reset identity sequences ──────────────────────────────────────
    # After TRUNCATE, sequences are NOT reset automatically.
    # Reset all sequences for tables that use auto-increment IDs.
    for table in _TABLES_TO_TRUNCATE:
        # PostgreSQL convention: {table}_id_seq
        schema, tbl = table.split(".")
        seq_name = f"{schema}.{tbl}_id_seq"
        conn.execute(sa.text(f"ALTER SEQUENCE IF EXISTS {seq_name} RESTART WITH 1"))

    # ── 3. Set server-level defaults for NOT NULL columns ────────────────
    # SQLAlchemy models use Python-level `default=` which is bypassed by raw
    # SQL INSERTs. We temporarily set DB-level defaults so INSERT statements
    # that omit these columns don't violate NOT NULL constraints.
    _COLUMN_DEFAULTS = [
        # administracion
        ("administracion.centro_costo", "is_active", "true"),
        ("administracion.cuenta_por_pagar", "monto_pagado", "0"),
        ("administracion.cuenta_por_pagar", "moneda", "'PEN'"),
        ("administracion.cuenta_por_pagar", "estado", "'PENDIENTE'"),
        ("administracion.programacion_pago", "estado", "'PROGRAMADO'"),
        # catalogo
        ("catalogo.tipo_medio_pago", "is_active", "true"),
        ("catalogo.unidad_medida", "is_active", "true"),
        ("catalogo.tipo_comprobante", "is_active", "true"),
        ("catalogo.tipo_operacion", "is_active", "true"),
        # equipo
        ("equipo.tipo_equipo", "activo", "true"),
        ("equipo.equipo", "estado", "'DISPONIBLE'"),
        ("equipo.contrato_adenda", "estado", "'VIGENTE'"),
        ("equipo.valorizacion_equipo", "estado", "'BORRADOR'"),
        ("equipo.gasto_en_obra", "importe", "0"),
        ("equipo.gasto_en_obra", "incluye_igv", "false"),
        ("equipo.gasto_en_obra", "importe_sin_igv", "0"),
        ("equipo.adelanto_amortizacion", "monto", "0"),
        ("equipo.parte_diario", "estado", "'BORRADOR'"),
        # logistica
        ("logistica.producto", "stock_actual", "0"),
        ("logistica.detalle_movimiento", "precio_unitario", "0"),
        ("logistica.producto", "is_active", "true"),
        ("logistica.movimiento", "estado", "'pendiente'"),
        # proveedores
        ("proveedores.proveedor", "is_active", "true"),
        # proyectos
        ("proyectos.edt", "estado", "'PLANIFICACION'"),
        ("proyectos.edt", "is_active", "true"),
        # rrhh
        ("rrhh.trabajador", "is_active", "true"),
        # sistema
        ("sistema.rol", "nivel", "3"),
        ("sistema.rol", "is_active", "true"),
        ("sistema.permiso", "is_active", "true"),
        ("sistema.unidad_operativa", "is_active", "true"),
        ("sistema.usuario", "is_active", "true"),
    ]
    for table, column, default_val in _COLUMN_DEFAULTS:
        conn.execute(
            sa.text(
                f"ALTER TABLE {table} "
                f"ALTER COLUMN {column} SET DEFAULT {default_val}"
            )
        )

    # ── 4. Fix constraints incompatible with legacy data ──────────────────
    # EDT codes are unique per unidad_operativa in legacy, not globally.
    conn.execute(
        sa.text("ALTER TABLE proyectos.edt " "DROP CONSTRAINT IF EXISTS edt_codigo_key")
    )
    # Contract numbers can repeat across addendums in legacy data
    conn.execute(
        sa.text(
            "ALTER TABLE equipo.contrato_adenda "
            "DROP CONSTRAINT IF EXISTS contrato_adenda_numero_contrato_key"
        )
    )
    # Widen tipo_proveedor to accommodate legacy concatenated values
    conn.execute(
        sa.text(
            "ALTER TABLE proveedores.proveedor "
            "ALTER COLUMN tipo_proveedor TYPE VARCHAR(100)"
        )
    )
    # Widen telefono for multi-number entries
    conn.execute(
        sa.text(
            "ALTER TABLE proveedores.proveedor "
            "ALTER COLUMN telefono TYPE VARCHAR(50)"
        )
    )
    # Widen moneda columns for legacy values (SOLES/DOLARES instead of PEN/USD)
    for table in [
        "administracion.cuenta_por_pagar",
        "equipo.contrato_adenda",
    ]:
        conn.execute(
            sa.text(f"ALTER TABLE {table} " "ALTER COLUMN moneda TYPE VARCHAR(10)")
        )
    # Change potencia_neta from NUMERIC to VARCHAR (legacy stores "130@3400" etc.)
    conn.execute(
        sa.text(
            "ALTER TABLE equipo.equipo "
            "ALTER COLUMN potencia_neta TYPE VARCHAR(50) "
            "USING potencia_neta::TEXT"
        )
    )

    # Drop NOT NULL on all non-PK columns for tables receiving legacy data.
    # Legacy data has many NULL values in columns that the new schema marks as NOT NULL.
    # Instead of listing columns individually, we dynamically find and relax all of them.
    for table in _TABLES_TO_TRUNCATE:
        schema, tbl = table.split(".")
        not_null_cols = conn.execute(
            sa.text(
                """
                SELECT c.column_name
                FROM information_schema.columns c
                WHERE c.table_schema = :schema
                  AND c.table_name = :tbl
                  AND c.is_nullable = 'NO'
                  AND c.column_name != 'id'
            """
            ),
            {"schema": schema, "tbl": tbl},
        ).fetchall()
        for (col,) in not_null_cols:
            conn.execute(
                sa.text(f'ALTER TABLE {table} ALTER COLUMN "{col}" DROP NOT NULL')
            )
    # Drop unique constraint on correo_electronico (many legacy users lack email)
    conn.execute(
        sa.text(
            "ALTER TABLE sistema.usuario "
            "DROP CONSTRAINT IF EXISTS usuario_correo_electronico_key"
        )
    )

    # ── 5. Execute generated SQL files in dependency order ───────────────
    for layer_file in _LAYER_FILES:
        _execute_sql_file(conn, layer_file)

    # ── 6. Create admin and operator users for application access ──────
    # Legacy data replaces demo users from migrations 003-007.
    # Re-create essential users so the app remains accessible.
    # Password: Admin@123 (bcrypt cost 12)
    _ADMIN_PASSWORD_HASH = (
        "$2b$12$MnoP.vx.cL2z5Uruzk7wne2gPYk.HSJWju7UMAGYvaEs00cl0VGjK"
    )

    # Ensure ADMIN and OPERADOR roles exist
    for codigo, nombre, nivel in [
        ("ADMIN", "Administrador", 1),
        ("OPERADOR", "Operador", 4),
    ]:
        conn.execute(
            sa.text(
                """
            INSERT INTO sistema.rol (nombre, codigo, descripcion, nivel, is_active)
            VALUES (:nombre, :codigo, :desc, :nivel, true)
            ON CONFLICT (codigo) DO NOTHING
        """
            ),
            {"nombre": nombre, "codigo": codigo, "desc": nombre, "nivel": nivel},
        )

    uo_row = conn.execute(
        sa.text("SELECT id FROM sistema.unidad_operativa LIMIT 1")
    ).fetchone()
    uo_id = uo_row[0] if uo_row else None

    for username, nombres, apellidos, email, rol_codigo in [
        ("admin", "Admin", "Sistema", "admin@bitcorp.local", "ADMIN"),
        ("operador1", "Juan", "Perez", "jperez@bitcorp.local", "OPERADOR"),
    ]:
        rol_row = conn.execute(
            sa.text("SELECT id FROM sistema.rol WHERE codigo = :codigo"),
            {"codigo": rol_codigo},
        ).fetchone()
        if not rol_row:
            continue
        rol_id = rol_row[0]

        conn.execute(
            sa.text(
                """
            INSERT INTO sistema.usuario
                (nombre_usuario, contrasena, nombres, apellidos,
                 correo_electronico, rol_id, unidad_operativa_id,
                 is_active, tenant_id)
            VALUES
                (:username, :password, :nombres, :apellidos,
                 :email, :rol_id, :uo_id, true, 1)
            ON CONFLICT (nombre_usuario) DO UPDATE SET
                contrasena = EXCLUDED.contrasena,
                is_active  = true,
                rol_id     = EXCLUDED.rol_id
        """
            ),
            {
                "username": username,
                "password": _ADMIN_PASSWORD_HASH,
                "nombres": nombres,
                "apellidos": apellidos,
                "email": email,
                "rol_id": rol_id,
                "uo_id": uo_id,
            },
        )

        conn.execute(
            sa.text(
                """
            INSERT INTO sistema.usuario_rol (usuario_id, rol_id)
            SELECT u.id, :rol_id
            FROM sistema.usuario u
            WHERE u.nombre_usuario = :username
            ON CONFLICT DO NOTHING
        """
            ),
            {"username": username, "rol_id": rol_id},
        )

    # ── 7. Normalize categoria_prd values ──────────────────────────────────
    # Legacy data uses accented/spaced values; the app expects underscored enums.
    for old_val, new_val in [
        ("MAQUINARIA PESADA", "MAQUINARIA_PESADA"),
        ("VEHÍCULO PESADO", "VEHICULOS_PESADOS"),
        ("VEHÍCULO LIVIANO", "VEHICULOS_LIVIANOS"),
        ("EQUIPO MENOR", "EQUIPOS_MENORES"),
    ]:
        conn.execute(
            sa.text(
                "UPDATE equipo.tipo_equipo SET categoria_prd = :new "
                "WHERE categoria_prd = :old"
            ),
            {"old": old_val, "new": new_val},
        )

    # ── 8. Re-seed precalentamiento_config ─────────────────────────────────
    # Wiped by TRUNCATE equipo.tipo_equipo CASCADE in step 1.
    conn.execute(sa.text("""
        INSERT INTO equipo.precalentamiento_config
            (tipo_equipo_id, horas_precalentamiento, activo)
        SELECT t.id, pc.horas, true
        FROM equipo.tipo_equipo t
        CROSS JOIN (VALUES
            ('EX',  0.50),
            ('CF',  0.50),
            ('RL',  0.50),
            ('MN',  0.50),
            ('TO',  0.50),
            ('VQ',  0.25)
        ) AS pc(codigo, horas)
        WHERE t.codigo = pc.codigo
        ON CONFLICT (tipo_equipo_id) DO NOTHING
    """))


def downgrade() -> None:
    conn = op.get_bind()

    # Truncate all legacy data (reverse of what we inserted)
    for table in _TABLES_TO_TRUNCATE:
        conn.execute(sa.text(f"TRUNCATE TABLE {table} CASCADE"))

    # Reset sequences
    for table in _TABLES_TO_TRUNCATE:
        schema, tbl = table.split(".")
        seq_name = f"{schema}.{tbl}_id_seq"
        conn.execute(sa.text(f"ALTER SEQUENCE IF EXISTS {seq_name} RESTART WITH 1"))
