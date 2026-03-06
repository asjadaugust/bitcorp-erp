"""Fixtures de pytest para tests del backend BitCorp ERP."""

import os

os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+asyncpg://bitcorp:dev_password_change_me@localhost:3440/bitcorp_dev",
)
os.environ.setdefault("REDIS_URL", "redis://localhost:3460")
os.environ.setdefault("DB_HOST", "localhost")
os.environ.setdefault("DB_PORT", "3440")

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text

from app.config.database import motor
from app.main import app


@pytest.fixture(scope="session", autouse=True)
async def _reset_sequences():
    """Reset all serial sequences to match max IDs after seed data.

    Uses pg_depend to find the actual owning table for each sequence,
    avoiding name-derivation bugs when sequence names don't match table names
    (e.g. edt_id_seq owned by proyectos.proyectos due to historical renaming).
    """
    async with motor.begin() as conn:
        await conn.execute(text("""
            DO $$
            DECLARE r RECORD;
            BEGIN
                FOR r IN
                    SELECT
                        s.schemaname,
                        s.sequencename,
                        c_tbl.relname AS tablename
                    FROM pg_sequences s
                    JOIN pg_class c_seq
                        ON c_seq.relname = s.sequencename
                        AND c_seq.relnamespace = (
                            SELECT oid FROM pg_namespace WHERE nspname = s.schemaname
                        )
                    JOIN pg_depend d
                        ON d.objid = c_seq.oid AND d.deptype = 'a'
                    JOIN pg_class c_tbl
                        ON c_tbl.oid = d.refobjid
                    WHERE s.schemaname IN (
                        'sistema', 'equipo', 'proyectos',
                        'rrhh', 'logistica', 'public', 'proveedores'
                    )
                LOOP
                    EXECUTE format(
                        'SELECT setval(%L, COALESCE((SELECT MAX(id) FROM %I.%I), 1))',
                        r.schemaname || '.' || r.sequencename,
                        r.schemaname,
                        r.tablename
                    );
                END LOOP;
            END $$;
        """))


@pytest.fixture
async def cliente_async():
    """Cliente HTTP asíncrono para tests."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as cliente:
        yield cliente


async def obtener_token_admin() -> str:
    """Helper: obtener token de admin para tests autenticados."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        resp = await c.post(
            "/api/auth/login",
            json={"username": "admin", "password": "Admin@123"},
        )
        token: str = resp.json()["data"]["access_token"]
        return token
