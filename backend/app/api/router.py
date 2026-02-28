"""Agregador principal de routers de API."""

from fastapi import APIRouter

router_api = APIRouter(prefix="/api")

# Los routers de cada módulo se agregarán aquí conforme se migren.
# Ejemplo:
# from app.api.auth import router as router_auth
# router_api.include_router(router_auth, prefix="/auth", tags=["Auth"])
