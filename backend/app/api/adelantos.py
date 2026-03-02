"""Rutas para adelantos y amortizaciones."""

from typing import Any

from fastapi import APIRouter
from fastapi.responses import ORJSONResponse

from app.core.dependencias import SesionDb, UsuarioActual
from app.esquemas.valorizacion import AdelantoActualizar, AdelantoCrear
from app.servicios.adelanto import ServicioAdelanto

router_contratos = APIRouter()
router_valorizaciones = APIRouter()


# ─── Contract-scoped routes ──────────────────────────────────────────────


@router_contratos.get("/{contrato_id}/adelantos", response_class=ORJSONResponse)
async def listar_adelantos_contrato(
    contrato_id: int, db: SesionDb, usuario: UsuarioActual
) -> dict[str, Any]:
    svc = ServicioAdelanto(db)
    items = await svc.listar_por_contrato(usuario.id_empresa, contrato_id)
    return {
        "success": True,
        "data": [i.model_dump() for i in items],
    }


@router_contratos.post(
    "/{contrato_id}/adelantos", response_class=ORJSONResponse, status_code=201
)
async def crear_adelanto(
    contrato_id: int,
    datos: AdelantoCrear,
    db: SesionDb,
    usuario: UsuarioActual,
) -> dict[str, Any]:
    svc = ServicioAdelanto(db)
    dto = await svc.crear(usuario.id_empresa, contrato_id, datos)
    return {"success": True, "data": {"id": dto.id, "message": "Adelanto creado"}}


@router_contratos.put("/adelantos/{adelanto_id}", response_class=ORJSONResponse)
async def actualizar_adelanto(
    adelanto_id: int,
    datos: AdelantoActualizar,
    db: SesionDb,
    usuario: UsuarioActual,
) -> dict[str, Any]:
    svc = ServicioAdelanto(db)
    dto = await svc.actualizar(usuario.id_empresa, adelanto_id, datos)
    return {"success": True, "data": dto.model_dump()}


@router_contratos.delete("/adelantos/{adelanto_id}", status_code=204)
async def eliminar_adelanto(
    adelanto_id: int, db: SesionDb, usuario: UsuarioActual
) -> None:
    svc = ServicioAdelanto(db)
    await svc.eliminar(usuario.id_empresa, adelanto_id)


# ─── Valuation-scoped routes ─────────────────────────────────────────────


@router_valorizaciones.get("/{val_id}/adelantos", response_class=ORJSONResponse)
async def listar_adelantos_valorizacion(
    val_id: int, db: SesionDb, usuario: UsuarioActual
) -> dict[str, Any]:
    svc = ServicioAdelanto(db)
    items = await svc.listar_por_valorizacion(usuario.id_empresa, val_id)
    return {
        "success": True,
        "data": [i.model_dump() for i in items],
    }
