"""Import ConstrucSoft legacy data from dBASE files into presupuestos schema.

Usage:
    pip install dbfread
    python scripts/import_construcsoft.py

Source: /Users/klm95441/Documents/projects/construction-soft/CONSTRUC/CIVIL3/
Target: presupuestos schema (insumo, apu, apu_insumo tables)
"""

import os
import sys
from pathlib import Path

# Determine source path
CONSTRUCSOFT_PATH = Path(
    os.environ.get(
        "CONSTRUCSOFT_PATH",
        "/Users/klm95441/Documents/projects/construction-soft/CONSTRUC/CIVIL3",
    )
)

TENANT_ID = 1

# Tipo mappings based on ConstrucSoft resource types
TIPO_MAP = {
    "MO": "MANO_OBRA",
    "MA": "MATERIAL",
    "EQ": "EQUIPO",
    "SC": "SUBCONTRATO",
    "HE": "HERRAMIENTAS",
    # Fallbacks
    "MANO": "MANO_OBRA",
    "MATE": "MATERIAL",
    "EQUI": "EQUIPO",
    "SUBC": "SUBCONTRATO",
}


def read_dbf(filename: str) -> list[dict]:
    """Read a DBF file and return list of dicts."""
    try:
        from dbfread import DBF
    except ImportError:
        print("ERROR: dbfread not installed. Run: pip install dbfread")
        sys.exit(1)

    filepath = CONSTRUCSOFT_PATH / filename
    if not filepath.exists():
        print(f"WARNING: File not found: {filepath}")
        return []

    try:
        table = DBF(str(filepath), encoding="latin-1", ignore_missing_memofile=True)
        return list(table)
    except Exception as e:
        print(f"WARNING: Error reading {filename}: {e}")
        return []


def normalize_tipo(raw_tipo: str) -> str:
    """Normalize ConstrucSoft resource type to our enum."""
    upper = raw_tipo.strip().upper()
    if upper in TIPO_MAP:
        return TIPO_MAP[upper]
    # Try prefix match
    for prefix, mapped in TIPO_MAP.items():
        if upper.startswith(prefix):
            return mapped
    return "MATERIAL"  # Default fallback


def generate_migration_sql() -> str:
    """Generate SQL INSERT statements from ConstrucSoft data."""
    lines = []
    lines.append("-- Auto-generated from ConstrucSoft dBASE import")
    lines.append("-- Source: " + str(CONSTRUCSOFT_PATH))
    lines.append("")

    # ── 1. Import ALOBRA.DBF → insumo + apu ──────────────────────────────
    alobra = read_dbf("ALOBRA.DBF")
    insumo_codigos = set()
    apu_codigos = set()

    if alobra:
        lines.append("-- Insumos from ALOBRA.DBF")
        for row in alobra:
            codigo = str(row.get("CODIGO", "") or "").strip()
            nombre = str(row.get("NOMBRE", "") or row.get("DESCRIP", "") or "").strip()
            unidad = str(row.get("UNIDAD", "") or "").strip()[:10]
            tipo_raw = str(row.get("TIPO", "") or row.get("RECURSO", "") or "").strip()
            precio = float(row.get("PRECIO", 0) or 0)
            es_partida = str(row.get("PARTIDA", "") or row.get("TIPO_REG", "") or "").strip()

            if not codigo or not nombre:
                continue

            tipo = normalize_tipo(tipo_raw)

            # Determine if this is an APU (work item) or an insumo (resource)
            if es_partida in ("P", "PARTIDA", "1") or tipo_raw.upper() in ("PA", "PART"):
                # It's an APU
                if codigo not in apu_codigos:
                    apu_codigos.add(codigo)
                    nombre_escaped = nombre.replace("'", "''")
                    lines.append(
                        f"INSERT INTO presupuestos.apu (codigo, nombre, unidad_medida, rendimiento, jornada, tenant_id) "
                        f"VALUES ('{codigo}', '{nombre_escaped}', '{unidad or 'und'}', 1, 8.00, {TENANT_ID}) "
                        f"ON CONFLICT DO NOTHING;"
                    )
            else:
                # It's an insumo
                if codigo not in insumo_codigos:
                    insumo_codigos.add(codigo)
                    nombre_escaped = nombre.replace("'", "''")
                    lines.append(
                        f"INSERT INTO presupuestos.insumo (codigo, nombre, unidad_medida, tipo, precio_unitario, tenant_id) "
                        f"VALUES ('{codigo}', '{nombre_escaped}', '{unidad or 'und'}', '{tipo}', {precio:.4f}, {TENANT_ID}) "
                        f"ON CONFLICT DO NOTHING;"
                    )

    # ── 2. Import COSTOHH.DBF → update insumo prices ─────────────────────
    costohh = read_dbf("COSTOHH.DBF")
    if costohh:
        lines.append("")
        lines.append("-- Labor rates from COSTOHH.DBF")
        for row in costohh:
            codigo = str(row.get("CODIGO", "") or "").strip()
            precio = float(row.get("COSTOHH", 0) or row.get("COSTO", 0) or 0)
            if codigo and precio > 0:
                lines.append(
                    f"UPDATE presupuestos.insumo SET precio_unitario = {precio:.4f} "
                    f"WHERE codigo = '{codigo}' AND tenant_id = {TENANT_ID};"
                )

    # ── 3. Import RENDPU.DBF → update apu rendimiento ────────────────────
    rendpu = read_dbf("RENDPU.DBF")
    if rendpu:
        lines.append("")
        lines.append("-- Productivity rates from RENDPU.DBF")
        for row in rendpu:
            codigo = str(row.get("CODIGO", "") or row.get("PARTIDA", "") or "").strip()
            rendimiento = float(row.get("RENDIMIE", 0) or row.get("RENDIMIENTO", 0) or 0)
            if codigo and rendimiento > 0:
                lines.append(
                    f"UPDATE presupuestos.apu SET rendimiento = {rendimiento:.4f} "
                    f"WHERE codigo = '{codigo}' AND tenant_id = {TENANT_ID};"
                )

    # ── 4. Import PPP*.DBF → apu_insumo lines ────────────────────────────
    ppp_files = sorted(CONSTRUCSOFT_PATH.glob("PPP*.DBF"))
    if ppp_files:
        lines.append("")
        lines.append("-- APU line items from PPP*.DBF files")
        for ppp_file in ppp_files:
            ppp_data = read_dbf(ppp_file.name)
            for row in ppp_data:
                apu_codigo = str(row.get("PARTIDA", "") or row.get("CODIGO", "") or "").strip()
                insumo_codigo = str(row.get("RECURSO", "") or row.get("INSUMO", "") or "").strip()
                cantidad = float(row.get("CANTIDAD", 0) or row.get("CUADRILLA", 0) or 0)
                aporte = float(row.get("APORTE", 0) or 0)
                tipo_raw = str(row.get("TIPO", "") or "").strip()

                if not apu_codigo or not insumo_codigo:
                    continue

                tipo = normalize_tipo(tipo_raw)

                lines.append(
                    f"INSERT INTO presupuestos.apu_insumo (apu_id, insumo_id, tipo, cantidad, aporte, tenant_id) "
                    f"SELECT a.id, i.id, '{tipo}', {cantidad:.4f}, {aporte:.6f}, {TENANT_ID} "
                    f"FROM presupuestos.apu a, presupuestos.insumo i "
                    f"WHERE a.codigo = '{apu_codigo}' AND i.codigo = '{insumo_codigo}' "
                    f"AND a.tenant_id = {TENANT_ID} AND i.tenant_id = {TENANT_ID} "
                    f"ON CONFLICT DO NOTHING;"
                )

    return "\n".join(lines)


def generate_migration_file():
    """Generate an Alembic migration file with the import SQL."""
    sql = generate_migration_sql()

    migration_content = f'''"""Seed ConstrucSoft legacy data into presupuestos schema.

Revision ID: 019_seed_construcsoft_data
Revises: 018_presupuestos_schema
Create Date: 2026-03-06
"""

import sqlalchemy as sa
from alembic import op

revision = "019_seed_construcsoft_data"
down_revision = "018_presupuestos_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("""
{sql}
    """))


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("""
        DELETE FROM presupuestos.apu_insumo WHERE tenant_id = {TENANT_ID};
        DELETE FROM presupuestos.apu WHERE tenant_id = {TENANT_ID};
        DELETE FROM presupuestos.insumo WHERE tenant_id = {TENANT_ID};
    """))
'''

    output_path = Path("backend/alembic/versions/019_seed_construcsoft_data.py")
    output_path.write_text(migration_content)
    print(f"Migration file generated: {output_path}")


def main():
    if not CONSTRUCSOFT_PATH.exists():
        print(f"ConstrucSoft path not found: {CONSTRUCSOFT_PATH}")
        print("Set CONSTRUCSOFT_PATH environment variable to the correct path.")
        print("Generating empty migration file...")
        generate_migration_file()
        return

    print(f"Reading ConstrucSoft data from: {CONSTRUCSOFT_PATH}")

    # List available DBF files
    dbf_files = sorted(CONSTRUCSOFT_PATH.glob("*.DBF"))
    print(f"Found {len(dbf_files)} DBF files")
    for f in dbf_files[:10]:
        print(f"  - {f.name}")
    if len(dbf_files) > 10:
        print(f"  ... and {len(dbf_files) - 10} more")

    generate_migration_file()
    print("Done! Run 'alembic upgrade head' to apply the seed data.")


if __name__ == "__main__":
    main()
