"""Rutas para gastos en obra de valorizaciones."""

from typing import Any

from fastapi import APIRouter
from fastapi.responses import ORJSONResponse

from app.core.dependencias import SesionDb, UsuarioActual
from app.esquemas.valorizacion import GastoEnObraActualizar, GastoEnObraCrear
from app.servicios.gasto_en_obra import ServicioGastoEnObra

router = APIRouter()


@router.get("/{val_id}/gastos-obra", response_class=ORJSONResponse)
async def listar_gastos_obra(
    val_id: int, db: SesionDb, usuario: UsuarioActual
) -> dict[str, Any]:
    svc = ServicioGastoEnObra(db)
    items = await svc.listar(usuario.id_empresa, val_id)
    return {
        "success": True,
        "data": [i.model_dump() for i in items],
    }


@router.post(
    "/{val_id}/gastos-obra", response_class=ORJSONResponse, status_code=201
)
async def crear_gasto_obra(
    val_id: int,
    datos: GastoEnObraCrear,
    db: SesionDb,
    usuario: UsuarioActual,
) -> dict[str, Any]:
    svc = ServicioGastoEnObra(db)
    dto = await svc.crear(usuario.id_empresa, val_id, datos)
    return {"success": True, "data": {"id": dto.id, "message": "Gasto en obra creado"}}


@router.put("/gastos-obra/{gasto_id}", response_class=ORJSONResponse)
async def actualizar_gasto_obra(
    gasto_id: int,
    datos: GastoEnObraActualizar,
    db: SesionDb,
    usuario: UsuarioActual,
) -> dict[str, Any]:
    svc = ServicioGastoEnObra(db)
    dto = await svc.actualizar(usuario.id_empresa, gasto_id, datos)
    return {"success": True, "data": dto.model_dump()}


@router.delete("/gastos-obra/{gasto_id}", status_code=204)
async def eliminar_gasto_obra(
    gasto_id: int, db: SesionDb, usuario: UsuarioActual
) -> None:
    svc = ServicioGastoEnObra(db)
    await svc.eliminar(usuario.id_empresa, gasto_id)
