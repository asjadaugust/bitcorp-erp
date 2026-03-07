"""Router de solicitudes de equipo."""

from fastapi import APIRouter, Depends, Query
from fastapi.responses import ORJSONResponse

from app.core.dependencias import SesionDb, UsuarioActual, requerir_roles
from app.esquemas.solicitud_equipo import SolicitudEquipoActualizar, SolicitudEquipoCrear
from app.servicios.solicitud_equipo import ServicioSolicitudEquipo
from app.utils.respuesta import enviar_creado, enviar_exito, enviar_paginado

router = APIRouter()


@router.get("/")
async def listar_solicitudes(
    usuario: UsuarioActual, db: SesionDb,
    page: int = Query(1, ge=1), limit: int = Query(10, ge=1, le=100),
    estado: str | None = None,
) -> ORJSONResponse:
    servicio = ServicioSolicitudEquipo(db)
    sols, total = await servicio.listar(usuario.id_empresa, estado=estado, page=page, limit=limit)
    return enviar_paginado([s.model_dump() for s in sols], pagina=page, limite=limit, total=total)


@router.post("/")
async def crear_solicitud(
    datos: SolicitudEquipoCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioSolicitudEquipo(db)
    s = await servicio.crear(usuario.id_empresa, datos, usuario.id_usuario)
    return enviar_creado({"id": s.id, "message": "Solicitud creada"})


@router.get("/{sol_id}")
async def obtener_solicitud(
    sol_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioSolicitudEquipo(db)
    s = await servicio.obtener_por_id(usuario.id_empresa, sol_id)
    return enviar_exito(s.model_dump())


@router.put("/{sol_id}")
async def actualizar_solicitud(
    sol_id: int, datos: SolicitudEquipoActualizar, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioSolicitudEquipo(db)
    s = await servicio.actualizar(usuario.id_empresa, sol_id, datos)
    return enviar_exito(s.model_dump())


@router.post("/{sol_id}/enviar")
async def enviar_solicitud(
    sol_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioSolicitudEquipo(db)
    s = await servicio.enviar(usuario.id_empresa, sol_id)
    return enviar_exito(s.model_dump())


@router.post(
    "/{sol_id}/aprobar",
    dependencies=[Depends(requerir_roles("ADMIN", "DIRECTOR"))],
)
async def aprobar_solicitud(
    sol_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioSolicitudEquipo(db)
    s = await servicio.aprobar(usuario.id_empresa, sol_id, usuario.id_usuario)
    return enviar_exito(s.model_dump())


@router.post("/{sol_id}/rechazar")
async def rechazar_solicitud(
    sol_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioSolicitudEquipo(db)
    s = await servicio.rechazar(usuario.id_empresa, sol_id)
    return enviar_exito(s.model_dump())
