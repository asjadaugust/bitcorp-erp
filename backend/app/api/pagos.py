"""Rutas para registros de pago.
"""

from datetime import date
from typing import Any

from fastapi import APIRouter, Query
from fastapi.responses import ORJSONResponse

from app.core.dependencias import SesionDb, UsuarioActual
from app.esquemas.valorizacion import (
    PagoActualizar,
    PagoCrear,
    ReconciliarPagoDto,
)
from app.servicios.pago import ServicioPago

router = APIRouter()


def _paginated(
    data: list[Any], total: int, page: int, limit: int
) -> dict[str, Any]:
    return {
        "success": True,
        "data": [d.model_dump() if hasattr(d, "model_dump") else d for d in data],
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": max(1, -(-total // limit)),
        },
    }


def _ok(data: Any) -> dict[str, Any]:
    d = data.model_dump() if hasattr(data, "model_dump") else data
    return {"success": True, "data": d}


def _ok_list(data: list[Any]) -> dict[str, Any]:
    return {
        "success": True,
        "data": [d.model_dump() if hasattr(d, "model_dump") else d for d in data],
    }


# ─── CRUD ────────────────────────────────────────────────────────────────


@router.get("/", response_class=ORJSONResponse)
async def listar_pagos(
    db: SesionDb,
    usuario: UsuarioActual,
    valorizacion_id: int | None = None,
    estado: str | None = None,
    conciliado: bool | None = None,
    metodo_pago: str | None = None,
    fecha_desde: date | None = None,
    fecha_hasta: date | None = None,
    moneda: str | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
) -> dict[str, Any]:
    svc = ServicioPago(db)
    items, total = await svc.listar(
        valorizacion_id=valorizacion_id,
        estado=estado,
        conciliado=conciliado,
        metodo_pago=metodo_pago,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
        moneda=moneda,
        page=page,
        limit=limit,
    )
    return _paginated(items, total, page, limit)


@router.get("/{pago_id}", response_class=ORJSONResponse)
async def obtener_pago(
    pago_id: int, db: SesionDb, usuario: UsuarioActual
) -> dict[str, Any]:
    svc = ServicioPago(db)
    dto = await svc.obtener_por_id(pago_id)
    return _ok(dto)


@router.post("/", response_class=ORJSONResponse, status_code=201)
async def crear_pago(
    datos: PagoCrear, db: SesionDb, usuario: UsuarioActual
) -> dict[str, Any]:
    svc = ServicioPago(db)
    dto = await svc.crear(datos, usuario.id_usuario)
    return {"success": True, "data": {"id": dto.id, "message": "Pago creado"}}


@router.put("/{pago_id}", response_class=ORJSONResponse)
async def actualizar_pago(
    pago_id: int, datos: PagoActualizar, db: SesionDb, usuario: UsuarioActual
) -> dict[str, Any]:
    svc = ServicioPago(db)
    dto = await svc.actualizar(pago_id, datos)
    return _ok(dto)


@router.delete("/{pago_id}", response_class=ORJSONResponse)
async def cancelar_pago(
    pago_id: int, db: SesionDb, usuario: UsuarioActual
) -> dict[str, Any]:
    svc = ServicioPago(db)
    dto = await svc.cancelar(pago_id)
    return _ok(dto)


@router.post("/{pago_id}/reconcile", response_class=ORJSONResponse)
async def reconciliar_pago(
    pago_id: int,
    datos: ReconciliarPagoDto,
    db: SesionDb,
    usuario: UsuarioActual,
) -> dict[str, Any]:
    svc = ServicioPago(db)
    dto = await svc.reconciliar(pago_id, observaciones=datos.observaciones)
    return _ok(dto)


# ─── By valuation (mounted on /valuations router too) ────────────────────


@router.get(
    "/by-valuation/{valorizacion_id}",
    response_class=ORJSONResponse,
)
async def listar_por_valorizacion(
    valorizacion_id: int, db: SesionDb, usuario: UsuarioActual
) -> dict[str, Any]:
    svc = ServicioPago(db)
    items = await svc.listar_por_valorizacion(valorizacion_id)
    return _ok_list(items)


@router.get(
    "/by-valuation/{valorizacion_id}/summary",
    response_class=ORJSONResponse,
)
async def resumen_pagos(
    valorizacion_id: int, db: SesionDb, usuario: UsuarioActual
) -> dict[str, Any]:
    svc = ServicioPago(db)
    dto = await svc.resumen(valorizacion_id)
    return _ok(dto)
