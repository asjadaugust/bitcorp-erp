"""Seed test users for local development and mobile app testing.

Creates the following users (all with password 'admin123'):
  - admin       → Director General (rol_id=1)
  - director    → Director de Proyecto (rol_id=2)
  - jefe_equipo → Jefe de Equipo (rol_id=3)
  - operador1   → Operador (rol_id=4)
  - admin_fin   → Administrador (rol_id=5)

Revision ID: 004_seed_test_users
Revises: 003_seed_demo
Create Date: 2026-03-01
"""

from alembic import op
import sqlalchemy as sa

revision = "004_seed_test_users"
down_revision = "003_seed_demo"
branch_labels = None
depends_on = None

# bcrypt hash for 'admin123' — generated with bcrypt cost 10.
# Verified with: from passlib.context import CryptContext; CryptContext(schemes=["bcrypt"]).verify("admin123", HASH)
PASSWORD_HASH = "$2b$10$4caVqdjHJdnPj8rLMTX/vO7K.v2IkS9Usw1tGSP6cvCCfeZMvRoV6"


def upgrade() -> None:
    conn = op.get_bind()

    # Ensure a default Unidad Operativa exists
    conn.execute(sa.text("""
        INSERT INTO sistema.unidad_operativa (codigo, nombre, is_active)
        VALUES ('PRINCIPAL', 'Unidad Operativa Principal', true)
        ON CONFLICT (codigo) DO NOTHING
    """))

    uo_row = conn.execute(sa.text("SELECT id FROM sistema.unidad_operativa LIMIT 1")).fetchone()
    uo_id = uo_row[0] if uo_row else None

    # Ensure roles exist (codes must match frontend src/app/core/types/roles.ts)
    for codigo, nombre, nivel in [
        ("ADMIN",       "Administrador",     1),
        ("DIRECTOR",    "Director",          2),
        ("JEFE_EQUIPO", "Jefe de Equipo",    3),
        ("OPERADOR",    "Operador",          4),
    ]:
        conn.execute(sa.text("""
            INSERT INTO sistema.rol (nombre, codigo, descripcion, nivel, is_active)
            VALUES (:nombre, :codigo, :desc, :nivel, true)
            ON CONFLICT (codigo) DO NOTHING
        """), {
            "nombre": nombre,
            "codigo": codigo,
            "desc": nombre,
            "nivel": nivel,
        })

    # Upsert test users
    users = [
        ("admin",       "Admin",    "Sistema",   "admin@bitcorp.local",       "ADMIN"),
        ("director",    "Carlos",   "Ramírez",   "cramirez@bitcorp.local",    "DIRECTOR"),
        ("jefe_equipo", "Ana",      "Torres",    "atorres@bitcorp.local",     "JEFE_EQUIPO"),
        ("operador1",   "Juan",     "Pérez",     "jperez@bitcorp.local",      "OPERADOR"),
    ]

    for username, nombres, apellidos, email, rol_codigo in users:
        # Look up role id by codigo
        rol_row = conn.execute(
            sa.text("SELECT id FROM sistema.rol WHERE codigo = :codigo"),
            {"codigo": rol_codigo},
        ).fetchone()

        if not rol_row:
            continue

        rol_id = rol_row[0]

        conn.execute(sa.text("""
            INSERT INTO sistema.usuario
                (nombre_usuario, contrasena, nombres, apellidos,
                 correo_electronico, rol_id, unidad_operativa_id,
                 is_active, tenant_id)
            VALUES
                (:username, :password, :nombres, :apellidos,
                 :email, :rol_id, :uo_id,
                 true, 1)
            ON CONFLICT (nombre_usuario) DO UPDATE SET
                contrasena      = EXCLUDED.contrasena,
                is_active       = true,
                rol_id          = EXCLUDED.rol_id
        """), {
            "username": username,
            "password": PASSWORD_HASH,
            "nombres": nombres,
            "apellidos": apellidos,
            "email": email,
            "rol_id": rol_id,
            "uo_id": uo_id,
        })

        # Also ensure usuario_rol mapping exists
        conn.execute(sa.text("""
            INSERT INTO sistema.usuario_rol (usuario_id, rol_id)
            SELECT u.id, :rol_id
            FROM sistema.usuario u
            WHERE u.nombre_usuario = :username
            ON CONFLICT DO NOTHING
        """), {"username": username, "rol_id": rol_id})


def downgrade() -> None:
    op.execute(sa.text("""
        DELETE FROM sistema.usuario
        WHERE nombre_usuario IN ('admin', 'director', 'jefe_equipo', 'operador1', 'admin_fin')
    """))
