"""Agregador principal de routers de API."""

from fastapi import APIRouter

from app.api.actas_devolucion import router as router_actas_devolucion
from app.api.caja_banco import router as router_caja_banco
from app.api.caja_chica import router as router_caja_chica
from app.api.catalogo import router as router_catalogo
from app.api.adelantos import (
    router_contratos as router_adelantos_contratos,
    router_valorizaciones as router_adelantos_valorizaciones,
)
from app.api.analitica import router as router_analitica
from app.api.aprobaciones import router as router_aprobaciones
from app.api.auth import router as router_auth
from app.api.centros_costo import router as router_centros_costo
from app.api.checklists import router as router_checklists
from app.api.combustible import router as router_combustible
from app.api.contratos import router as router_contratos
from app.api.cotizaciones import router as router_cotizaciones
from app.api.cuentas_por_pagar import router as router_cuentas_por_pagar
from app.api.dashboard import router as router_dashboard
from app.api.empleados import router as router_empleados
from app.api.evaluacion_proveedor import router as router_evaluacion_proveedor
from app.api.equipo_asociaciones import router as router_equipo_asociaciones
from app.api.equipos import router as router_equipos
from app.api.gastos_obra import router as router_gastos_obra
from app.api.inoperatividad import router as router_inoperatividad
from app.api.licitaciones import router as router_licitaciones
from app.api.logistica import router as router_logistica
from app.api.mantenimiento import router as router_mantenimiento
from app.api.notificaciones import router as router_notificaciones
from app.api.operadores import router as router_operadores
from app.api.permisos import router as router_permisos
from app.api.ordenes_alquiler import router as router_ordenes_alquiler
from app.api.pagos import router as router_pagos
from app.api.precalentamiento import router as router_precalentamiento
from app.api.programacion_pago import router as router_programacion_pago
from app.api.proveedores import router as router_proveedores
from app.api.registro_trabajador import router as router_registro_trabajador

# Fase 5 — Secondary Modules
from app.api.edt import router as router_edt
from app.api.proyectos import router as router_proyectos
from app.api.reportes import router as router_reportes
from app.api.reportes_analiticos import router as router_reportes_analiticos
from app.api.sig import router as router_sig
from app.api.solicitudes_equipo import router as router_solicitudes_equipo
from app.api.solicitudes_material import router as router_solicitudes_material
from app.api.inspecciones_ssoma import router as router_inspecciones_ssoma
from app.api.sst import router as router_sst
from app.api.tareas_programadas import router as router_tareas_programadas
from app.api.tareos import router as router_tareos
from app.api.tenant import router as router_tenant
from app.api.tipos_equipo import router as router_tipos_equipo
from app.api.usuarios import router as router_usuarios
from app.api.vales_combustible import router as router_vales_combustible
from app.api.valorizaciones import router as router_valorizaciones

router_api = APIRouter(prefix="/api")

# Fase 1 — Auth + Simple CRUD
router_api.include_router(router_auth, prefix="/auth", tags=["Auth"])
router_api.include_router(
    router_tipos_equipo, prefix="/tipos-equipo", tags=["Tipos de Equipo"]
)
router_api.include_router(
    router_precalentamiento,
    prefix="/precalentamiento-config",
    tags=["Precalentamiento"],
)
router_api.include_router(
    router_combustible, prefix="/combustible-config", tags=["Combustible"]
)
router_api.include_router(
    router_centros_costo, prefix="/admin/cost-centers", tags=["Centros de Costo"]
)
router_api.include_router(router_usuarios, prefix="/users", tags=["Usuarios"])
router_api.include_router(router_tenant, prefix="/tenant", tags=["Tenant"])

# Fase 2 — Core Equipment Domain
router_api.include_router(router_equipos, prefix="/equipment", tags=["Equipos"])
router_api.include_router(
    router_equipo_asociaciones,
    prefix="/equipment/associations",
    tags=["Equipo Asociaciones"],
)
router_api.include_router(router_contratos, prefix="/contracts", tags=["Contratos"])
router_api.include_router(router_reportes, prefix="/reports", tags=["Reportes"])
router_api.include_router(
    router_valorizaciones, prefix="/valuations", tags=["Valorizaciones"]
)
router_api.include_router(
    router_gastos_obra, prefix="/valuations", tags=["Gastos en Obra"]
)
router_api.include_router(
    router_adelantos_valorizaciones,
    prefix="/valuations",
    tags=["Adelantos Valorizacion"],
)
router_api.include_router(
    router_adelantos_contratos, prefix="/contracts", tags=["Adelantos Contrato"]
)
router_api.include_router(router_pagos, prefix="/payments", tags=["Pagos"])

# Fase 3 — Operational Modules
router_api.include_router(router_operadores, prefix="/operators", tags=["Operadores"])
router_api.include_router(router_proveedores, prefix="/providers", tags=["Proveedores"])
router_api.include_router(
    router_cotizaciones, prefix="/cotizaciones", tags=["Cotizaciones"]
)
router_api.include_router(
    router_solicitudes_equipo, prefix="/solicitudes-equipo", tags=["Solicitudes Equipo"]
)
router_api.include_router(
    router_ordenes_alquiler, prefix="/ordenes-alquiler", tags=["Ordenes Alquiler"]
)
router_api.include_router(
    router_actas_devolucion, prefix="/actas-devolucion", tags=["Actas Devolucion"]
)
router_api.include_router(
    router_mantenimiento, prefix="/maintenance", tags=["Mantenimiento"]
)
router_api.include_router(
    router_vales_combustible, prefix="/vales-combustible", tags=["Vales Combustible"]
)
router_api.include_router(
    router_inoperatividad, prefix="/periodos-inoperatividad", tags=["Inoperatividad"]
)

# Fase 4 — Support Modules
router_api.include_router(
    router_notificaciones, prefix="/notifications", tags=["Notificaciones"]
)
router_api.include_router(router_dashboard, prefix="/dashboard", tags=["Dashboard"])
router_api.include_router(router_analitica, prefix="/analytics", tags=["Analitica"])
router_api.include_router(
    router_cuentas_por_pagar, prefix="/accounts-payable", tags=["Cuentas por Pagar"]
)
router_api.include_router(
    router_programacion_pago, prefix="/payment-schedules", tags=["Programacion Pago"]
)
router_api.include_router(
    router_aprobaciones, prefix="/approvals", tags=["Aprobaciones"]
)
router_api.include_router(
    router_reportes_analiticos, prefix="/reporting", tags=["Reportes Analiticos"]
)

# Fase 5 — Secondary Modules
router_api.include_router(router_proyectos, prefix="/projects", tags=["Proyectos"])
router_api.include_router(router_edt, prefix="/edt", tags=["EDT"])
router_api.include_router(router_empleados, prefix="/hr/employees", tags=["Empleados"])
router_api.include_router(
    router_registro_trabajador,
    prefix="/hr/worker-registry",
    tags=["Registro Trabajador"],
)
router_api.include_router(
    router_tareos, prefix="/scheduling/timesheets", tags=["Tareos"]
)
router_api.include_router(router_logistica, prefix="/logistics", tags=["Logistica"])
router_api.include_router(
    router_solicitudes_material,
    prefix="/logistics/requests",
    tags=["Solicitudes Material"],
)
router_api.include_router(router_sst, prefix="/sst", tags=["SST"])
router_api.include_router(
    router_inspecciones_ssoma,
    prefix="/sst",
    tags=["SST Inspecciones"],
)
router_api.include_router(router_sig, prefix="/sig", tags=["SIG"])
router_api.include_router(router_licitaciones, prefix="/tenders", tags=["Licitaciones"])
router_api.include_router(router_checklists, prefix="/checklists", tags=["Checklists"])
router_api.include_router(
    router_tareas_programadas, prefix="/scheduling", tags=["Tareas Programadas"]
)

# Legacy Features — Catalog (SUNAT reference tables)
router_api.include_router(router_catalogo, prefix="/catalog", tags=["Catalogo"])
router_api.include_router(router_permisos, prefix="/permissions", tags=["Permisos"])

# Legacy Features — Caja Chica (Petty Cash)
router_api.include_router(router_caja_chica, prefix="/petty-cash", tags=["Caja Chica"])

# Legacy Features — Caja y Banco (Bank Cash Flow)
router_api.include_router(router_caja_banco, prefix="/bank-cash", tags=["Caja y Banco"])

# Legacy Features — Evaluacion Proveedor
router_api.include_router(
    router_evaluacion_proveedor,
    prefix="/providers/evaluations",
    tags=["Evaluacion Proveedor"],
)
