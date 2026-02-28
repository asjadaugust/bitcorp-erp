"""Agregador principal de routers de API."""

from fastapi import APIRouter

from app.api.auth import router as router_auth
from app.api.centros_costo import router as router_centros_costo
from app.api.combustible import router as router_combustible
from app.api.precalentamiento import router as router_precalentamiento
from app.api.tipos_equipo import router as router_tipos_equipo
from app.api.usuarios import router as router_usuarios

router_api = APIRouter(prefix="/api")

# Fase 1 — Auth + Simple CRUD
router_api.include_router(router_auth, prefix="/auth", tags=["Auth"])
router_api.include_router(router_tipos_equipo, prefix="/tipos-equipo", tags=["Tipos de Equipo"])
router_api.include_router(
    router_precalentamiento, prefix="/precalentamiento-config", tags=["Precalentamiento"]
)
router_api.include_router(
    router_combustible, prefix="/combustible-config", tags=["Combustible"]
)
router_api.include_router(
    router_centros_costo, prefix="/admin/cost-centers", tags=["Centros de Costo"]
)
router_api.include_router(router_usuarios, prefix="/users", tags=["Usuarios"])
