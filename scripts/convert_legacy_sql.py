#!/usr/bin/env python3
"""Convert legacy SQL Server INSERT statements to PostgreSQL-compatible SQL.

Usage:
    python scripts/convert_legacy_sql.py

Reads SQL files from docs/database/utf8_ready/ and generates PostgreSQL
INSERT statements in scripts/generated/ organized by dependency layer.

Output files:
    scripts/generated/layer_00.sql  (catalog/reference tables)
    scripts/generated/layer_01.sql  (users, providers, workers, etc.)
    ...
    scripts/generated/layer_06.sql  (equipo_edt)
"""

from __future__ import annotations

import os
import re
import sys
from collections import defaultdict
from pathlib import Path

# Add scripts/ to path so we can import table_mappings
sys.path.insert(0, str(Path(__file__).resolve().parent))
from table_mappings import MAPPINGS, SKIPPED_TABLES, get_tables_by_layer

# ─── Configuration ────────────────────────────────────────────────────────────

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = PROJECT_ROOT / "docs" / "database" / "utf8_ready"
OUTPUT_DIR = Path(__file__).resolve().parent / "generated"
BATCH_SIZE = 500

# Tables with special conversion logic (not handled by generic parser)
SPECIAL_TABLES = {"tbl_C05028_Tareo"}

# FK resolution map: _fk_ target → (schema, table, lookup_column, value_needs_str_cast)
FK_MAP = {
    "_fk_unidad_operativa": ("sistema", "unidad_operativa", "legacy_id", False),
    "_fk_usuario": ("sistema", "usuario", "legacy_id", False),
    "_fk_rol": ("sistema", "rol", "codigo", True),  # int→str lookup
    "_fk_permiso": ("sistema", "permiso", "legacy_id", True),  # int→str lookup
    "_fk_proveedor": ("proveedores", "proveedor", "legacy_id", False),
    "_fk_equipo": ("equipo", "equipo", "legacy_id", False),
    "_fk_contrato": ("equipo", "contrato_adenda", "legacy_id", False),
    "_fk_valorizacion": ("equipo", "valorizacion_equipo", "legacy_id", False),
    "_fk_trabajador": ("rrhh", "trabajador", "legacy_id", False),
    "_fk_movimiento": ("logistica", "movimiento", "legacy_id", True),  # int→str
    "_fk_producto": ("logistica", "producto", "legacy_id", False),
    "_fk_edt": ("proyectos", "edt", "legacy_id", True),  # int→str
    "_fk_programacion_pago": (
        "administracion",
        "programacion_pago",
        "legacy_id",
        False,
    ),
    "_fk_tareo": ("rrhh", "tareo", "legacy_id", True),  # int→str
    "_fk_trabajador_via_registro": None,  # special case, handled separately
}


# ─── SQL Parsing ──────────────────────────────────────────────────────────────


def find_source_file(table_name: str) -> Path | None:
    """Find the source SQL file for a legacy table name."""
    filename = f"dbo.{table_name}.Table.sql"
    path = SOURCE_DIR / filename
    if path.exists():
        return path
    return None


def extract_inserts(filepath: Path) -> list[tuple[list[str], str]]:
    """Extract INSERT statements from a SQL file.

    Returns a list of (column_names, values_str) tuples.
    """
    content = filepath.read_text(encoding="utf-8")
    results = []

    # Match INSERT lines - they can span, but in these files each is one line
    pattern = re.compile(
        r"INSERT\s+\[dbo\]\.\[[\w]+\]\s*" r"\(([^)]+)\)\s*" r"VALUES\s*\((.+)\)\s*$",
        re.IGNORECASE | re.MULTILINE,
    )

    for m in pattern.finditer(content):
        cols_str = m.group(1)
        vals_str = m.group(2)

        # Parse column names: [Col1], [Col2], ...
        columns = [c.strip().strip("[]") for c in cols_str.split(",")]
        results.append((columns, vals_str))

    return results


def parse_values(values_str: str) -> list[str]:
    """Parse VALUES content into individual raw value strings.

    Handles nested parentheses in CAST() and quoted strings with commas.
    """
    values: list[str] = []
    current: list[str] = []
    i = 0
    in_string = False
    paren_depth = 0

    while i < len(values_str):
        c = values_str[i]

        if in_string:
            if c == "'" and i + 1 < len(values_str) and values_str[i + 1] == "'":
                current.append("''")
                i += 2
                continue
            elif c == "'":
                in_string = False
                current.append(c)
            else:
                current.append(c)
        else:
            if c == "'":
                in_string = True
                current.append(c)
            elif c == "(":
                paren_depth += 1
                current.append(c)
            elif c == ")":
                if paren_depth > 0:
                    paren_depth -= 1
                current.append(c)
            elif c == "," and paren_depth == 0:
                values.append("".join(current).strip())
                current = []
                i += 1
                continue
            else:
                current.append(c)

        i += 1

    if current:
        values.append("".join(current).strip())

    return values


# ─── Value Conversion ────────────────────────────────────────────────────────


def convert_raw_value(raw: str) -> str:
    """Convert a SQL Server raw value to a clean PostgreSQL value string.

    Handles N'...', CAST(... AS Date/DateTime/Decimal), NULL, etc.
    Returns the value ready for use in a PostgreSQL INSERT.
    """
    raw = raw.strip()

    if raw.upper() == "NULL":
        return "NULL"

    # CAST(N'...' AS Date)
    m = re.match(r"CAST\(N'(.+?)'\s+AS\s+Date\)", raw, re.IGNORECASE)
    if m:
        return f"'{m.group(1)}'"

    # CAST(N'...' AS DateTime) or CAST(N'...' AS SmallDateTime)
    m = re.match(r"CAST\(N'(.+?)'\s+AS\s+(?:Small)?DateTime\)", raw, re.IGNORECASE)
    if m:
        dt = m.group(1).replace("T", " ")
        dt = re.sub(r"\.\d+$", "", dt)  # Strip .000 milliseconds
        return f"'{dt}'"

    # CAST(nnn.nn AS Decimal(p, s))
    m = re.match(
        r"CAST\((-?\d+\.?\d*)\s+AS\s+Decimal\(\d+,\s*\d+\)\)", raw, re.IGNORECASE
    )
    if m:
        return m.group(1)

    # N'string' — strip N prefix
    if raw.startswith("N'") and raw.endswith("'"):
        return raw[1:]  # Keep the quotes, remove N

    # Plain number (int or decimal)
    if re.match(r"^-?\d+\.?\d*$", raw):
        return raw

    # Fallback: return as-is
    return raw


def apply_type_conversion(pg_value: str, col_type: str) -> str:
    """Apply type conversion to a PostgreSQL value based on the mapping type."""
    if pg_value == "NULL":
        return "NULL"

    if col_type == "str_to_bool":
        # Extract string content and convert
        inner = pg_value.strip("'")
        return "TRUE" if inner == "ACTIVO" else "FALSE"

    if col_type == "int_to_str":
        # Integer → quoted string
        if pg_value.startswith("'"):
            return pg_value  # Already a string
        return f"'{pg_value}'"

    if col_type == "str_to_int":
        # Quoted string → integer
        if pg_value.startswith("'") and pg_value.endswith("'"):
            inner = pg_value.strip("'").strip()
            if not inner:
                return "NULL"
            return inner
        return pg_value

    # For str, int, float, money, date, datetime: value is already correct
    return pg_value


def escape_pg_string(value: str) -> str:
    """Ensure a string value is properly escaped for PostgreSQL.

    Input is already in 'quoted' form. We just need to handle special chars.
    """
    if value == "NULL" or not value.startswith("'"):
        return value
    # The SQL Server export already uses '' for escaped quotes,
    # which is valid PostgreSQL. Just return as-is.
    return value


# ─── FK Resolution ───────────────────────────────────────────────────────────


def make_fk_subquery(fk_target: str, pg_value: str, col_type: str) -> str:
    """Generate a PostgreSQL subquery for FK resolution.

    Returns something like:
        (SELECT id FROM schema.table WHERE legacy_id = 'value')
    """
    if pg_value == "NULL":
        return "NULL"

    fk_info = FK_MAP.get(fk_target)
    if fk_info is None:
        # Unknown FK target or special case — skip
        return "NULL"

    schema, table, lookup_col, needs_str_cast = fk_info

    # Prepare lookup value
    if needs_str_cast:
        # The source value is an integer but the lookup column is a string
        lookup_val = apply_type_conversion(pg_value, "int_to_str")
    else:
        lookup_val = pg_value

    # Ensure proper quoting
    if not lookup_val.startswith("'"):
        lookup_val = f"'{lookup_val}'"

    return f"(SELECT id FROM {schema}.{table} WHERE {lookup_col} = {lookup_val})"


# ─── Row Processing ──────────────────────────────────────────────────────────


def process_row(
    legacy_columns: list[str],
    raw_values: list[str],
    mapping: dict,
) -> tuple[list[str], list[str]] | None:
    """Process a single INSERT row through the column mapping.

    Returns (target_columns, target_values) or None if row should be skipped.
    """
    col_map = mapping["columns"]
    defaults = mapping.get("defaults", {})

    target_cols: list[str] = []
    target_vals: list[str] = []

    # Track which defaults have been set by explicit columns
    used_defaults: set[str] = set()

    for legacy_col, raw_val in zip(legacy_columns, raw_values):
        if legacy_col not in col_map:
            continue  # Unmapped column, skip

        spec = col_map[legacy_col]
        targets = spec["target"]
        col_type = spec["type"]

        # Convert raw SQL Server value to PostgreSQL
        pg_value = convert_raw_value(raw_val)

        # Handle multi-target columns (e.g., ["legacy_id", "codigo"])
        if isinstance(targets, list):
            for t in targets:
                if t.startswith("_") and not t.startswith("_fk_"):
                    continue  # Skip internal markers

                if t.startswith("_fk_"):
                    target_cols.append(t.replace("_fk_", "") + "_id")
                    target_vals.append(make_fk_subquery(t, pg_value, col_type))
                else:
                    target_cols.append(t)
                    target_vals.append(
                        escape_pg_string(apply_type_conversion(pg_value, col_type))
                    )
                    used_defaults.add(t)
        elif targets.startswith("_fk_"):
            # FK column → generate subquery
            fk_target = targets
            # Derive the actual column name from the FK target
            col_name = fk_target.replace("_fk_", "") + "_id"
            target_cols.append(col_name)
            target_vals.append(make_fk_subquery(fk_target, pg_value, col_type))
        elif targets.startswith("_"):
            # Internal marker (_runtime_pk, _operador_nombre, _item, _derive_periodo)
            # Skip these columns
            continue
        else:
            target_cols.append(targets)
            target_vals.append(
                escape_pg_string(apply_type_conversion(pg_value, col_type))
            )
            used_defaults.add(targets)

    # Apply defaults for columns not set by explicit mapping
    for default_col, default_val in defaults.items():
        if default_col in used_defaults:
            continue

        if default_val == "_from_legacy_id":
            # Copy from legacy_id column (already added above)
            if "legacy_id" in target_cols:
                idx = target_cols.index("legacy_id")
                target_cols.append(default_col)
                target_vals.append(target_vals[idx])
        elif isinstance(default_val, bool):
            target_cols.append(default_col)
            target_vals.append("TRUE" if default_val else "FALSE")
        elif isinstance(default_val, (int, float)):
            target_cols.append(default_col)
            target_vals.append(str(default_val))
        elif isinstance(default_val, str):
            target_cols.append(default_col)
            target_vals.append(f"'{default_val}'")

    if not target_cols:
        return None

    # Apply derived columns (equipo_id from code pattern, periodo from date, etc.)
    derived = mapping.get("derived", {})
    if derived:
        # Build legacy_col → converted pg_value lookup
        legacy_values: dict[str, str] = {}
        for legacy_col, raw_val in zip(legacy_columns, raw_values):
            legacy_values[legacy_col] = convert_raw_value(raw_val)

        for target_col, derive_spec in derived.items():
            method = derive_spec["method"]
            source_col = derive_spec["source_legacy_col"]
            source_val = legacy_values.get(source_col, "NULL")

            if source_val == "NULL":
                target_cols.append(target_col)
                target_vals.append("NULL")
                continue

            if method == "equipo_from_code_suffix":
                # '04.CCU-EM-CH-1005-009' → equipo code '04.CCU-EM-CH-1005'
                inner = source_val.strip("'")
                equipo_code = inner.rsplit("-", 1)[0]
                target_cols.append(target_col)
                target_vals.append(
                    f"(SELECT id FROM equipo.equipo WHERE legacy_id = '{equipo_code}')"
                )
            elif method == "periodo_from_date":
                # '2020-06-01' → '2020-06'
                inner = source_val.strip("'")
                periodo = inner[:7]
                target_cols.append(target_col)
                target_vals.append(f"'{periodo}'")

    return target_cols, target_vals


# ─── Table Processing ────────────────────────────────────────────────────────


def process_table(table_name: str, mapping: dict) -> str | None:
    """Process a legacy table and generate PostgreSQL INSERT SQL.

    Returns the SQL string or None if no data found.
    """
    source_file = find_source_file(table_name)
    if source_file is None:
        print(f"  WARN: Source file not found for {table_name}")
        return None

    inserts = extract_inserts(source_file)
    if not inserts:
        print(f"  SKIP: No INSERT data in {table_name}")
        return None

    schema = mapping["target_schema"]
    table = mapping["target_table"]
    full_table = f"{schema}.{table}"

    print(f"  Processing {table_name} → {full_table} ({len(inserts)} rows)")

    # Process all rows
    all_rows: list[tuple[list[str], list[str]]] = []
    for legacy_cols, vals_str in inserts:
        raw_values = parse_values(vals_str)
        if len(raw_values) != len(legacy_cols):
            print(
                f"    WARN: Column/value count mismatch in {table_name}: "
                f"{len(legacy_cols)} cols vs {len(raw_values)} vals"
            )
            continue

        result = process_row(legacy_cols, raw_values, mapping)
        if result:
            all_rows.append(result)

    if not all_rows:
        return None

    # Generate SQL
    lines: list[str] = []
    lines.append(f"-- ─── {full_table} ({len(all_rows)} rows) ───")
    lines.append(f"-- Source: {table_name}")

    if mapping.get("notes"):
        lines.append(f"-- Notes: {mapping['notes']}")

    # Use the column list from the first row (all rows should have same columns)
    col_names = all_rows[0][0]

    # Batch inserts
    for batch_start in range(0, len(all_rows), BATCH_SIZE):
        batch = all_rows[batch_start : batch_start + BATCH_SIZE]

        cols_sql = ", ".join(col_names)
        lines.append(f"INSERT INTO {full_table} ({cols_sql})")
        lines.append("VALUES")

        value_lines: list[str] = []
        for _cols, vals in batch:
            vals_sql = ", ".join(vals)
            value_lines.append(f"  ({vals_sql})")

        lines.append(",\n".join(value_lines) + ";")
        lines.append("")

    return "\n".join(lines)


# ─── Special Case: Tareo ─────────────────────────────────────────────────────


def process_tareo() -> str | None:
    """Process tbl_C05028_Tareo with grouping logic.

    Legacy has per-day records; target needs period (month) summaries.
    Groups by (RegistroTrabajador, YYYY-MM) and creates one Tareo record per group.
    """
    source_file = find_source_file("tbl_C05028_Tareo")
    if source_file is None:
        return None

    inserts = extract_inserts(source_file)
    if not inserts:
        print("  SKIP: No INSERT data in tbl_C05028_Tareo")
        return None

    print(
        f"  Processing tbl_C05028_Tareo → rrhh.tareo (SPECIAL: grouping {len(inserts)} daily records)"
    )

    # Parse all daily records
    daily_records: list[dict] = []
    for legacy_cols, vals_str in inserts:
        raw_values = parse_values(vals_str)
        if len(raw_values) != len(legacy_cols):
            continue

        record: dict = {}
        for col, val in zip(legacy_cols, raw_values):
            record[col] = convert_raw_value(val)
        daily_records.append(record)

    if not daily_records:
        return None

    # Group by (RegistroTrabajador, YYYY-MM)
    groups: dict[tuple[str, str], list[dict]] = defaultdict(list)
    for rec in daily_records:
        reg_id = rec.get("C05027_Id_RegistroTrabajador", "NULL")
        fecha = rec.get("C05028_Fecha", "NULL")

        if reg_id == "NULL" or fecha == "NULL":
            continue

        # Extract YYYY-MM from date string
        date_str = fecha.strip("'")
        periodo = date_str[:7]  # "2021-01"

        groups[(reg_id, periodo)].append(rec)

    # Generate Tareo period records
    lines: list[str] = []
    lines.append(f"-- ─── rrhh.tareo ({len(groups)} period records) ───")
    lines.append("-- Source: tbl_C05028_Tareo (grouped from daily records)")
    lines.append(
        "-- Note: Each record is a (worker, month) summary derived from daily entries."
    )

    # Build INSERT with subquery FK resolution
    # trabajador_id is resolved via registro_trabajador → trabajador
    cols = "legacy_id, trabajador_id, periodo, total_dias_trabajados, estado"
    lines.append(f"INSERT INTO rrhh.tareo ({cols})")
    lines.append("VALUES")

    value_lines: list[str] = []
    for (reg_id, periodo), records in sorted(groups.items()):
        # Use first record's tareo ID as legacy_id
        first_id = records[0].get("C05028_Id_Tareo", "NULL")
        if first_id != "NULL" and not first_id.startswith("'"):
            first_id = f"'{first_id}'"

        total_dias = len(records)

        # Resolve trabajador_id via registro_trabajador
        reg_id_str = reg_id if reg_id.startswith("'") else f"'{reg_id}'"
        trabajador_subq = (
            f"(SELECT t.id FROM rrhh.trabajador t "
            f"JOIN rrhh.registro_trabajador rt ON rt.trabajador_dni = t.legacy_id "
            f"WHERE rt.legacy_id = {reg_id_str} LIMIT 1)"
        )

        value_lines.append(
            f"  ({first_id}, {trabajador_subq}, '{periodo}', {total_dias}, 'PROCESADO')"
        )

    if not value_lines:
        return None

    # Batch if needed
    for batch_start in range(0, len(value_lines), BATCH_SIZE):
        batch = value_lines[batch_start : batch_start + BATCH_SIZE]
        if batch_start > 0:
            lines.append(f"INSERT INTO rrhh.tareo ({cols})")
            lines.append("VALUES")
        lines.append(",\n".join(batch) + ";")
        lines.append("")

    return "\n".join(lines)


# ─── Main ────────────────────────────────────────────────────────────────────


def main() -> None:
    """Main entry point: process all tables and generate output files."""
    print("Legacy SQL Server → PostgreSQL Conversion Script")
    print(f"Source: {SOURCE_DIR}")
    print(f"Output: {OUTPUT_DIR}")
    print()

    # Create output directory
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Get tables organized by dependency layer
    layers = get_tables_by_layer()

    # Process each layer
    stats = {"processed": 0, "skipped": 0, "errors": 0, "total_rows": 0}

    for layer_num in sorted(layers.keys()):
        table_names = layers[layer_num]

        print(f"\n{'═' * 70}")
        print(f"Layer {layer_num} ({len(table_names)} tables)")
        print(f"{'═' * 70}")

        layer_sql_parts: list[str] = []

        # File header
        layer_sql_parts.append(
            f"-- ═══════════════════════════════════════════════════════"
        )
        layer_sql_parts.append(f"-- Layer {layer_num} — Legacy data import")
        layer_sql_parts.append(f"-- Generated by convert_legacy_sql.py")
        layer_sql_parts.append(
            f"-- ═══════════════════════════════════════════════════════"
        )
        layer_sql_parts.append("")

        for table_name in sorted(table_names):
            if table_name in SKIPPED_TABLES:
                print(f"  SKIP: {table_name} ({SKIPPED_TABLES[table_name]})")
                stats["skipped"] += 1
                continue

            mapping = MAPPINGS[table_name]

            # Handle special cases
            if table_name in SPECIAL_TABLES:
                if table_name == "tbl_C05028_Tareo":
                    sql = process_tareo()
                else:
                    sql = None

                if sql:
                    layer_sql_parts.append(sql)
                    stats["processed"] += 1
                else:
                    stats["skipped"] += 1
                continue

            # Standard processing
            sql = process_table(table_name, mapping)
            if sql:
                layer_sql_parts.append(sql)
                stats["processed"] += 1
            else:
                stats["skipped"] += 1

        # Write layer file
        if len(layer_sql_parts) > 4:  # More than just header
            output_file = OUTPUT_DIR / f"layer_{layer_num:02d}.sql"
            output_file.write_text("\n".join(layer_sql_parts), encoding="utf-8")
            print(f"\n  → Written to {output_file.name}")
        else:
            print(f"\n  → No data for layer {layer_num}")

    # Summary
    print(f"\n{'═' * 70}")
    print("Summary")
    print(f"{'═' * 70}")
    print(f"  Processed: {stats['processed']}")
    print(f"  Skipped:   {stats['skipped']}")
    print(f"  Errors:    {stats['errors']}")
    print(f"  Output:    {OUTPUT_DIR}")
    print()


if __name__ == "__main__":
    main()
