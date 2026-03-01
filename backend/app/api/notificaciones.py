"""Router de notificaciones.
"""

from fastapi import APIRouter, Query
from fastapi.responses import ORJSONResponse

from app.core.dependencias import SesionDb, UsuarioActual
from app.esquemas.notificacion import NotificacionCrear
from app.servicios.notificacion import ServicioNotificacion
from app.utils.respuesta import enviar_creado, enviar_exito, enviar_paginado, enviar_sin_contenido

router = APIRouter()


@router.get("/")
async def listar_notificaciones(
    usuario: UsuarioActual,
    db: SesionDb,
    leido: bool | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
) -> ORJSONResponse:
    """Listar notificaciones del usuario actual."""
    servicio = ServicioNotificacion(db)
    datos, total = await servicio.listar(
        usuario_id=usuario.id_usuario,
        leido=leido,
        pagina=page,
        limite=limit,
    )
    return enviar_paginado([d.model_dump() for d in datos], page, limit, total)


@router.get("/unread-count")
async def contar_no_leidas(usuario: UsuarioActual, db: SesionDb) -> ORJSONResponse:
    """Contar notificaciones no leídas."""
    servicio = ServicioNotificacion(db)
    count = await servicio.contar_no_leidas(usuario.id_usuario)
    return enviar_exito({"count": count})


@router.post("/")
async def crear_notificacion(
    datos: NotificacionCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Crear una nueva notificación."""
    servicio = ServicioNotificacion(db)
    creada = await servicio.crear(datos)
    return enviar_creado({"id": creada.id, "message": "Notificación creada"})


@router.get("/{notificacion_id}")
async def obtener_notificacion(
    notificacion_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener notificación por ID."""
    servicio = ServicioNotificacion(db)
    datos = await servicio.obtener_por_id(usuario.id_usuario, notificacion_id)
    return enviar_exito(datos.model_dump())


@router.patch("/{notificacion_id}/read")
async def marcar_leido(
    notificacion_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Marcar una notificación como leída."""
    servicio = ServicioNotificacion(db)
    datos = await servicio.marcar_leido(usuario.id_usuario, notificacion_id)
    return enviar_exito(datos.model_dump())


@router.patch("/read-all")
async def marcar_todas_leidas(usuario: UsuarioActual, db: SesionDb) -> ORJSONResponse:
    """Marcar todas las notificaciones como leídas."""
    servicio = ServicioNotificacion(db)
    count = await servicio.marcar_todas_leidas(usuario.id_usuario)
    return enviar_exito({"count": count, "message": "Todas marcadas como leídas"})


@router.delete("/{notificacion_id}")
async def eliminar_notificacion(
    notificacion_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Eliminar una notificación."""
    servicio = ServicioNotificacion(db)
    await servicio.eliminar(usuario.id_usuario, notificacion_id)
    return enviar_sin_contenido()
