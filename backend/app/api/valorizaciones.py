"""Rutas para valorizaciones de equipo.

Replica valuation.routes.ts del BFF Node.js.
"""

from typing import Any

from fastapi import APIRouter, Query
from fastapi.responses import ORJSONResponse

from app.core.dependencias import SesionDb, UsuarioActual
from app.esquemas.valorizacion import (
    ConformidadDto,
    DocumentoPagoActualizar,
    DocumentoPagoCrear,
    RechazarValorizacion,
    ValorizacionActualizar,
    ValorizacionCrear,
)
from app.servicios.valorizacion import ServicioValorizacion

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
async def listar_valorizaciones(
    db: SesionDb,
    usuario: UsuarioActual,
    estado: str | None = None,
    equipo_id: int | None = None,
    contrato_id: int | None = None,
    proyecto_id: int | None = None,
    periodo: str | None = None,
    search: str | None = None,
    sort_by: str = "created_at",
    sort_order: str = "DESC",
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
) -> dict[str, Any]:
    svc = ServicioValorizacion(db)
    items, total = await svc.listar(
        usuario.id_empresa,
        estado=estado,
        equipo_id=equipo_id,
        contrato_id=contrato_id,
        proyecto_id=proyecto_id,
        periodo=periodo,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        limit=limit,
    )
    return _paginated(items, total, page, limit)


@router.get("/{val_id}", response_class=ORJSONResponse)
async def obtener_valorizacion(
    val_id: int, db: SesionDb, usuario: UsuarioActual
) -> dict[str, Any]:
    svc = ServicioValorizacion(db)
    dto = await svc.obtener_por_id(usuario.id_empresa, val_id)
    return _ok(dto)


@router.post("/", response_class=ORJSONResponse, status_code=201)
async def crear_valorizacion(
    datos: ValorizacionCrear, db: SesionDb, usuario: UsuarioActual
) -> dict[str, Any]:
    svc = ServicioValorizacion(db)
    dto = await svc.crear(usuario.id_empresa, datos, usuario.id_usuario)
    return {"success": True, "data": {"id": dto.id, "message": "Valorización creada"}}


@router.put("/{val_id}", response_class=ORJSONResponse)
async def actualizar_valorizacion(
    val_id: int, datos: ValorizacionActualizar, db: SesionDb, usuario: UsuarioActual
) -> dict[str, Any]:
    svc = ServicioValorizacion(db)
    dto = await svc.actualizar(usuario.id_empresa, val_id, datos)
    return _ok(dto)


@router.delete("/{val_id}", status_code=204)
async def eliminar_valorizacion(
    val_id: int, db: SesionDb, usuario: UsuarioActual
) -> None:
    svc = ServicioValorizacion(db)
    await svc.eliminar(usuario.id_empresa, val_id)


# ─── Workflow transitions ────────────────────────────────────────────────


@router.post("/{val_id}/submit-draft", response_class=ORJSONResponse)
async def enviar_borrador(
    val_id: int, db: SesionDb, usuario: UsuarioActual
) -> dict[str, Any]:
    svc = ServicioValorizacion(db)
    dto = await svc.enviar_borrador(usuario.id_empresa, val_id)
    return _ok(dto)


@router.post("/{val_id}/submit-review", response_class=ORJSONResponse)
async def enviar_a_revision(
    val_id: int, db: SesionDb, usuario: UsuarioActual
) -> dict[str, Any]:
    svc = ServicioValorizacion(db)
    dto = await svc.enviar_a_revision(usuario.id_empresa, val_id)
    return _ok(dto)


@router.post("/{val_id}/validate", response_class=ORJSONResponse)
async def validar_valorizacion(
    val_id: int, db: SesionDb, usuario: UsuarioActual
) -> dict[str, Any]:
    svc = ServicioValorizacion(db)
    dto = await svc.validar(usuario.id_empresa, val_id, usuario.id_usuario)
    return _ok(dto)


@router.post("/{val_id}/approve", response_class=ORJSONResponse)
async def aprobar_valorizacion(
    val_id: int, db: SesionDb, usuario: UsuarioActual
) -> dict[str, Any]:
    svc = ServicioValorizacion(db)
    dto = await svc.aprobar(usuario.id_empresa, val_id, usuario.id_usuario)
    return _ok(dto)


@router.post("/{val_id}/reject", response_class=ORJSONResponse)
async def rechazar_valorizacion(
    val_id: int, datos: RechazarValorizacion, db: SesionDb, usuario: UsuarioActual
) -> dict[str, Any]:
    svc = ServicioValorizacion(db)
    dto = await svc.rechazar(usuario.id_empresa, val_id, datos.reason)
    return _ok(dto)


@router.post("/{val_id}/reopen", response_class=ORJSONResponse)
async def reabrir_valorizacion(
    val_id: int, db: SesionDb, usuario: UsuarioActual
) -> dict[str, Any]:
    svc = ServicioValorizacion(db)
    dto = await svc.reabrir(usuario.id_empresa, val_id)
    return _ok(dto)


@router.post("/{val_id}/mark-paid", response_class=ORJSONResponse)
async def marcar_pagado(
    val_id: int, db: SesionDb, usuario: UsuarioActual
) -> dict[str, Any]:
    svc = ServicioValorizacion(db)
    dto = await svc.marcar_pagado(usuario.id_empresa, val_id)
    return _ok(dto)


# ─── Conformidad ─────────────────────────────────────────────────────────


@router.post("/{val_id}/conformidad", response_class=ORJSONResponse)
async def registrar_conformidad(
    val_id: int,
    datos: ConformidadDto,
    db: SesionDb,
    usuario: UsuarioActual,
) -> dict[str, Any]:
    svc = ServicioValorizacion(db)
    dto = await svc.registrar_conformidad(
        usuario.id_empresa, val_id,
        fecha=datos.fecha,
        observaciones=datos.observaciones,
    )
    return _ok(dto)


# ─── Recalculate ─────────────────────────────────────────────────────────


@router.post("/{val_id}/recalculate", response_class=ORJSONResponse)
async def recalcular_valorizacion(
    val_id: int, db: SesionDb, usuario: UsuarioActual
) -> dict[str, Any]:
    svc = ServicioValorizacion(db)
    dto = await svc.recalcular(usuario.id_empresa, val_id)
    return _ok(dto)


# ─── Documentos de pago ──────────────────────────────────────────────────


@router.get(
    "/{val_id}/payment-documents", response_class=ORJSONResponse
)
async def listar_documentos_pago(
    val_id: int, db: SesionDb, usuario: UsuarioActual
) -> dict[str, Any]:
    svc = ServicioValorizacion(db)
    docs = await svc.listar_documentos(usuario.id_empresa, val_id)
    return _ok_list(docs)


@router.post(
    "/{val_id}/payment-documents",
    response_class=ORJSONResponse,
    status_code=201,
)
async def crear_documento_pago(
    val_id: int,
    datos: DocumentoPagoCrear,
    db: SesionDb,
    usuario: UsuarioActual,
) -> dict[str, Any]:
    svc = ServicioValorizacion(db)
    doc = await svc.crear_documento(usuario.id_empresa, val_id, datos)
    return {"success": True, "data": {"id": doc.id, "message": "Documento creado"}}


@router.put(
    "/payment-documents/{doc_id}", response_class=ORJSONResponse
)
async def actualizar_documento_pago(
    doc_id: int,
    datos: DocumentoPagoActualizar,
    db: SesionDb,
    usuario: UsuarioActual,
) -> dict[str, Any]:
    svc = ServicioValorizacion(db)
    doc = await svc.actualizar_documento(usuario.id_empresa, doc_id, datos)
    return _ok(doc)


@router.get(
    "/{val_id}/payment-documents/check", response_class=ORJSONResponse
)
async def verificar_documentos_completos(
    val_id: int, db: SesionDb, usuario: UsuarioActual
) -> dict[str, Any]:
    svc = ServicioValorizacion(db)
    result = await svc.verificar_documentos_completos(
        usuario.id_empresa, val_id
    )
    return _ok(result)
