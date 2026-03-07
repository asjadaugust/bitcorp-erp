"""Router de órdenes de alquiler."""

from fastapi import APIRouter, Query
from fastapi.responses import ORJSONResponse

from app.core.dependencias import SesionDb, UsuarioActual
from app.esquemas.orden_alquiler import (
    CancelarOrden,
    ConfirmarOrden,
    EnviarOrden,
    OrdenAlquilerActualizar,
    OrdenAlquilerCrear,
)
from app.servicios.orden_alquiler import ServicioOrdenAlquiler
from app.utils.respuesta import enviar_creado, enviar_exito, enviar_paginado

router = APIRouter()


@router.get("")
async def listar_ordenes(
    usuario: UsuarioActual, db: SesionDb,
    page: int = Query(1, ge=1), limit: int = Query(10, ge=1, le=100),
    estado: str | None = None,
) -> ORJSONResponse:
    servicio = ServicioOrdenAlquiler(db)
    ordenes, total = await servicio.listar(
        usuario.id_empresa, estado=estado, page=page, limit=limit,
    )
    return enviar_paginado(
        [o.model_dump() for o in ordenes], pagina=page, limite=limit, total=total,
    )


@router.post("")
async def crear_orden(
    datos: OrdenAlquilerCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioOrdenAlquiler(db)
    o = await servicio.crear(usuario.id_empresa, datos, usuario.id_usuario)
    return enviar_creado({"id": o.id, "message": "Orden creada"})


@router.get("/{orden_id}")
async def obtener_orden(
    orden_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioOrdenAlquiler(db)
    o = await servicio.obtener_por_id(usuario.id_empresa, orden_id)
    return enviar_exito(o.model_dump())


@router.put("/{orden_id}")
async def actualizar_orden(
    orden_id: int, datos: OrdenAlquilerActualizar, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioOrdenAlquiler(db)
    o = await servicio.actualizar(usuario.id_empresa, orden_id, datos)
    return enviar_exito(o.model_dump())


@router.post("/{orden_id}/enviar")
async def enviar_orden(
    orden_id: int, datos: EnviarOrden, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioOrdenAlquiler(db)
    o = await servicio.enviar(usuario.id_empresa, orden_id, datos)
    return enviar_exito(o.model_dump())


@router.post("/{orden_id}/confirmar")
async def confirmar_orden(
    orden_id: int, datos: ConfirmarOrden, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioOrdenAlquiler(db)
    o = await servicio.confirmar(usuario.id_empresa, orden_id, datos)
    return enviar_exito(o.model_dump())


@router.post("/{orden_id}/cancelar")
async def cancelar_orden(
    orden_id: int, datos: CancelarOrden, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioOrdenAlquiler(db)
    o = await servicio.cancelar(usuario.id_empresa, orden_id, datos)
    return enviar_exito(o.model_dump())
