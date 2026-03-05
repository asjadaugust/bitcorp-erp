"""Router de aprobaciones."""

from fastapi import APIRouter, Query
from fastapi.responses import ORJSONResponse

from app.core.dependencias import SesionDb, UsuarioActual
from app.esquemas.aprobacion import (
    AccionAprobacion,
    AdhocCrear,
    AdhocResponder,
    PlantillaCrear,
    SolicitudCrear,
)
from app.servicios.aprobacion_adhoc import ServicioAprobacionAdhoc
from app.servicios.aprobacion_plantilla import ServicioPlantillaAprobacion
from app.servicios.aprobacion_solicitud import ServicioSolicitudAprobacion
from app.utils.respuesta import enviar_creado, enviar_exito, enviar_paginado

router = APIRouter()


# --- Templates ---


@router.get("/templates")
async def listar_plantillas(
    usuario: UsuarioActual,
    db: SesionDb,
    module_name: str | None = Query(None),
    estado: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
) -> ORJSONResponse:
    """Listar plantillas de aprobación."""
    srv = ServicioPlantillaAprobacion(db)
    datos, total = await srv.listar(
        usuario.id_empresa,
        module_name=module_name,
        estado=estado,
        pagina=page,
        limite=limit,
    )
    return enviar_paginado([d.model_dump() for d in datos], page, limit, total)


@router.post("/templates")
async def crear_plantilla(
    datos: PlantillaCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Crear plantilla de aprobación con pasos."""
    srv = ServicioPlantillaAprobacion(db)
    creada = await srv.crear(usuario.id_empresa, usuario.id_usuario, datos)
    return enviar_creado({"id": creada.id, "message": "Plantilla creada"})


@router.get("/templates/{plantilla_id}")
async def obtener_plantilla(
    plantilla_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener plantilla por ID."""
    srv = ServicioPlantillaAprobacion(db)
    datos = await srv.obtener_por_id(usuario.id_empresa, plantilla_id)
    return enviar_exito(datos.model_dump())


@router.post("/templates/{plantilla_id}/activate")
async def activar_plantilla(
    plantilla_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Activar plantilla."""
    srv = ServicioPlantillaAprobacion(db)
    datos = await srv.activar(usuario.id_empresa, plantilla_id)
    return enviar_exito(datos.model_dump())


@router.post("/templates/{plantilla_id}/archive")
async def archivar_plantilla(
    plantilla_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Archivar plantilla."""
    srv = ServicioPlantillaAprobacion(db)
    datos = await srv.archivar(usuario.id_empresa, plantilla_id)
    return enviar_exito(datos.model_dump())


# --- Dashboard ---


@router.get("/dashboard/recibidos")
async def listar_recibidos(usuario: UsuarioActual, db: SesionDb) -> ORJSONResponse:
    """Solicitudes pendientes donde soy aprobador."""
    srv = ServicioSolicitudAprobacion(db)
    datos = await srv.listar_recibidos(usuario.id_empresa, usuario.id_usuario)
    return enviar_exito([d.model_dump() for d in datos])


@router.get("/dashboard/enviados")
async def listar_enviados(usuario: UsuarioActual, db: SesionDb) -> ORJSONResponse:
    """Solicitudes que yo envié."""
    srv = ServicioSolicitudAprobacion(db)
    datos = await srv.listar_enviados(usuario.id_empresa, usuario.id_usuario)
    return enviar_exito([d.model_dump() for d in datos])


@router.get("/dashboard/stats")
async def obtener_stats(usuario: UsuarioActual, db: SesionDb) -> ORJSONResponse:
    """Estadísticas del dashboard de aprobaciones."""
    srv = ServicioSolicitudAprobacion(db)
    datos = await srv.obtener_dashboard(usuario.id_empresa, usuario.id_usuario)
    return enviar_exito(datos.model_dump())


# --- Requests ---


@router.get("/requests")
async def listar_solicitudes(
    usuario: UsuarioActual,
    db: SesionDb,
    module_name: str | None = Query(None),
    estado: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
) -> ORJSONResponse:
    """Listar solicitudes de aprobación."""
    srv = ServicioSolicitudAprobacion(db)
    datos, total = await srv.listar(
        usuario.id_empresa,
        module_name=module_name,
        estado=estado,
        pagina=page,
        limite=limit,
    )
    return enviar_paginado([d.model_dump() for d in datos], page, limit, total)


@router.post("/requests")
async def crear_solicitud(
    datos: SolicitudCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Crear solicitud de aprobación desde plantilla."""
    srv = ServicioSolicitudAprobacion(db)
    creada = await srv.crear(usuario.id_empresa, usuario.id_usuario, datos)
    return enviar_creado({"id": creada.id, "message": "Solicitud creada"})


@router.get("/requests/{solicitud_id}")
async def obtener_solicitud(
    solicitud_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener solicitud por ID."""
    srv = ServicioSolicitudAprobacion(db)
    datos = await srv.obtener_por_id(usuario.id_empresa, solicitud_id)
    return enviar_exito(datos.model_dump())


@router.post("/requests/{solicitud_id}/approve")
async def aprobar_solicitud(
    solicitud_id: int,
    usuario: UsuarioActual,
    db: SesionDb,
    body: AccionAprobacion | None = None,
) -> ORJSONResponse:
    """Aprobar paso actual de la solicitud."""
    srv = ServicioSolicitudAprobacion(db)
    comentario = body.comentario if body else None
    datos = await srv.aprobar_paso(
        usuario.id_empresa, solicitud_id, usuario.id_usuario, comentario
    )
    return enviar_exito(datos.model_dump())


@router.post("/requests/{solicitud_id}/reject")
async def rechazar_solicitud(
    solicitud_id: int,
    usuario: UsuarioActual,
    db: SesionDb,
    body: AccionAprobacion | None = None,
) -> ORJSONResponse:
    """Rechazar la solicitud en el paso actual."""
    srv = ServicioSolicitudAprobacion(db)
    comentario = body.comentario if body else None
    datos = await srv.rechazar_paso(
        usuario.id_empresa, solicitud_id, usuario.id_usuario, comentario
    )
    return enviar_exito(datos.model_dump())


@router.post("/requests/{solicitud_id}/cancel")
async def cancelar_solicitud(
    solicitud_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Cancelar solicitud."""
    srv = ServicioSolicitudAprobacion(db)
    datos = await srv.cancelar(usuario.id_empresa, solicitud_id, usuario.id_usuario)
    return enviar_exito(datos.model_dump())


@router.get("/requests/{solicitud_id}/audit")
async def obtener_auditoria(
    solicitud_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener trail de auditoría."""
    srv = ServicioSolicitudAprobacion(db)
    datos = await srv.obtener_auditoria(usuario.id_empresa, solicitud_id)
    return enviar_exito([d.model_dump() for d in datos])


# --- Ad-hoc ---


@router.get("/adhoc")
async def listar_adhoc(
    usuario: UsuarioActual,
    db: SesionDb,
    estado: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
) -> ORJSONResponse:
    """Listar solicitudes ad-hoc."""
    srv = ServicioAprobacionAdhoc(db)
    datos, total = await srv.listar(
        usuario.id_empresa, estado=estado, pagina=page, limite=limit
    )
    return enviar_paginado([d.model_dump() for d in datos], page, limit, total)


@router.post("/adhoc")
async def crear_adhoc(
    datos: AdhocCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Crear solicitud ad-hoc."""
    srv = ServicioAprobacionAdhoc(db)
    creada = await srv.crear(usuario.id_empresa, usuario.id_usuario, datos)
    return enviar_creado({"id": creada.id, "message": "Solicitud ad-hoc creada"})


@router.get("/adhoc/{adhoc_id}")
async def obtener_adhoc(
    adhoc_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener solicitud ad-hoc por ID."""
    srv = ServicioAprobacionAdhoc(db)
    datos = await srv.obtener_por_id(usuario.id_empresa, adhoc_id)
    return enviar_exito(datos.model_dump())


@router.post("/adhoc/{adhoc_id}/respond")
async def responder_adhoc(
    adhoc_id: int,
    datos: AdhocResponder,
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Responder a solicitud ad-hoc."""
    srv = ServicioAprobacionAdhoc(db)
    resultado = await srv.responder(
        usuario.id_empresa, adhoc_id, usuario.id_usuario, datos
    )
    return enviar_exito(resultado.model_dump())
