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

from app.main import app


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
