"""Agregador principal de routers de API."""

from fastapi import APIRouter

from app.api.actas_devolucion import router as router_actas_devolucion
from app.api.auth import router as router_auth
from app.api.centros_costo import router as router_centros_costo
from app.api.combustible import router as router_combustible
from app.api.contratos import router as router_contratos
from app.api.cotizaciones import router as router_cotizaciones
from app.api.equipos import router as router_equipos
from app.api.inoperatividad import router as router_inoperatividad
from app.api.mantenimiento import router as router_mantenimiento
from app.api.operadores import router as router_operadores
from app.api.ordenes_alquiler import router as router_ordenes_alquiler
from app.api.pagos import router as router_pagos
from app.api.precalentamiento import router as router_precalentamiento
from app.api.proveedores import router as router_proveedores
from app.api.reportes import router as router_reportes
from app.api.solicitudes_equipo import router as router_solicitudes_equipo
from app.api.tipos_equipo import router as router_tipos_equipo
from app.api.usuarios import router as router_usuarios
from app.api.vales_combustible import router as router_vales_combustible
from app.api.valorizaciones import router as router_valorizaciones

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

# Fase 2 — Core Equipment Domain
router_api.include_router(router_equipos, prefix="/equipment", tags=["Equipos"])
router_api.include_router(router_contratos, prefix="/contracts", tags=["Contratos"])
router_api.include_router(router_reportes, prefix="/reports", tags=["Reportes"])
router_api.include_router(
    router_valorizaciones, prefix="/valuations", tags=["Valorizaciones"]
)
router_api.include_router(router_pagos, prefix="/payments", tags=["Pagos"])

# Fase 3 — Operational Modules
router_api.include_router(router_operadores, prefix="/operators", tags=["Operadores"])
router_api.include_router(router_proveedores, prefix="/providers", tags=["Proveedores"])
router_api.include_router(router_cotizaciones, prefix="/cotizaciones", tags=["Cotizaciones"])
router_api.include_router(
    router_solicitudes_equipo, prefix="/solicitudes-equipo", tags=["Solicitudes Equipo"]
)
router_api.include_router(
    router_ordenes_alquiler, prefix="/ordenes-alquiler", tags=["Ordenes Alquiler"]
)
router_api.include_router(
    router_actas_devolucion, prefix="/actas-devolucion", tags=["Actas Devolucion"]
)
router_api.include_router(router_mantenimiento, prefix="/maintenance", tags=["Mantenimiento"])
router_api.include_router(
    router_vales_combustible, prefix="/vales-combustible", tags=["Vales Combustible"]
)
router_api.include_router(
    router_inoperatividad, prefix="/periodos-inoperatividad", tags=["Inoperatividad"]
)
