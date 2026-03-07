"""Router de actas de devolución."""

from fastapi import APIRouter, Query
from fastapi.responses import ORJSONResponse

from app.core.dependencias import SesionDb, UsuarioActual
from app.esquemas.acta_devolucion import ActaDevolucionActualizar, ActaDevolucionCrear
from app.servicios.acta_devolucion import ServicioActaDevolucion
from app.utils.respuesta import enviar_creado, enviar_exito, enviar_paginado

router = APIRouter()


@router.get("/")
async def listar_actas(
    usuario: UsuarioActual, db: SesionDb,
    page: int = Query(1, ge=1), limit: int = Query(10, ge=1, le=100),
    estado: str | None = None,
) -> ORJSONResponse:
    servicio = ServicioActaDevolucion(db)
    actas, total = await servicio.listar(usuario.id_empresa, estado=estado, page=page, limit=limit)
    return enviar_paginado([a.model_dump() for a in actas], pagina=page, limite=limit, total=total)


@router.post("/")
async def crear_acta(
    datos: ActaDevolucionCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioActaDevolucion(db)
    a = await servicio.crear(usuario.id_empresa, datos, usuario.id_usuario)
    return enviar_creado({"id": a.id, "message": "Acta creada"})


@router.get("/{acta_id}")
async def obtener_acta(
    acta_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioActaDevolucion(db)
    a = await servicio.obtener_por_id(usuario.id_empresa, acta_id)
    return enviar_exito(a.model_dump())


@router.put("/{acta_id}")
async def actualizar_acta(
    acta_id: int, datos: ActaDevolucionActualizar, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioActaDevolucion(db)
    a = await servicio.actualizar(usuario.id_empresa, acta_id, datos)
    return enviar_exito(a.model_dump())


@router.post("/{acta_id}/firmar")
async def firmar_acta(
    acta_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioActaDevolucion(db)
    a = await servicio.firmar(usuario.id_empresa, acta_id, usuario.id_usuario)
    return enviar_exito(a.model_dump())


@router.post("/{acta_id}/anular")
async def anular_acta(
    acta_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioActaDevolucion(db)
    a = await servicio.anular(usuario.id_empresa, acta_id)
    return enviar_exito(a.model_dump())
