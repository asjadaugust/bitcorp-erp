"""Fixtures de pytest para tests del backend BitCorp ERP."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
def cliente_test():
    """Cliente HTTP síncrono para tests simples."""
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://test")


@pytest.fixture
async def cliente_async():
    """Cliente HTTP asíncrono para tests async."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as cliente:
        yield cliente
