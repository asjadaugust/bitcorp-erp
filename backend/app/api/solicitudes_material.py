"""Router de solicitudes de material, requerimientos y cotizaciones logisticas."""

from fastapi import APIRouter, Depends, Query
from fastapi.responses import ORJSONResponse

from app.core.dependencias import SesionDb, UsuarioActual, requerir_roles
from app.esquemas.solicitud_material import (
    RequerimientoActualizar,
    RequerimientoCrear,
    SolicitudMaterialActualizar,
    SolicitudMaterialCrear,
)
from app.servicios.solicitud_material import ServicioSolicitudMaterial
from app.utils.respuesta import enviar_creado, enviar_exito, enviar_paginado, enviar_sin_contenido

router = APIRouter(
    dependencies=[Depends(requerir_roles("ADMIN", "ADMIN_SISTEMA", "ALMACEN"))],
)


# --- Categoria ---


@router.get("/categorias")
async def listar_categorias(usuario: UsuarioActual, db: SesionDb) -> ORJSONResponse:
    """Listar todas las categorias."""
    servicio = ServicioSolicitudMaterial(db)
    datos = await servicio.listar_categorias()
    return enviar_exito([d.model_dump() for d in datos])


# --- SolicitudMaterial ---


@router.get("/solicitudes-material")
async def listar_solicitudes(
    usuario: UsuarioActual,
    db: SesionDb,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
) -> ORJSONResponse:
    """Listar solicitudes de material con paginacion."""
    servicio = ServicioSolicitudMaterial(db)
    datos, total = await servicio.listar_solicitudes(pagina=page, limite=limit)
    return enviar_paginado([d.model_dump() for d in datos], page, limit, total)


@router.post("/solicitudes-material")
async def crear_solicitud(
    datos: SolicitudMaterialCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Crear una solicitud de material con lineas de detalle."""
    servicio = ServicioSolicitudMaterial(db)
    creada = await servicio.crear_solicitud(datos)
    return enviar_creado({"id": creada.id})


@router.get("/solicitudes-material/{sol_id}")
async def obtener_solicitud(
    sol_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener solicitud de material por ID con detalles."""
    servicio = ServicioSolicitudMaterial(db)
    datos = await servicio.obtener_solicitud(sol_id)
    return enviar_exito(datos.model_dump())


@router.put("/solicitudes-material/{sol_id}")
async def actualizar_solicitud(
    sol_id: int,
    datos: SolicitudMaterialActualizar,
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Actualizar una solicitud de material."""
    servicio = ServicioSolicitudMaterial(db)
    await servicio.actualizar_solicitud(sol_id, datos)
    return enviar_exito({"id": sol_id})


@router.delete("/solicitudes-material/{sol_id}")
async def eliminar_solicitud(
    sol_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Eliminar una solicitud de material y sus lineas de detalle."""
    servicio = ServicioSolicitudMaterial(db)
    await servicio.eliminar_solicitud(sol_id)
    return enviar_sin_contenido()


# --- Requerimiento ---


@router.get("/requerimientos")
async def listar_requerimientos(
    usuario: UsuarioActual,
    db: SesionDb,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
) -> ORJSONResponse:
    """Listar requerimientos con paginacion."""
    servicio = ServicioSolicitudMaterial(db)
    datos, total = await servicio.listar_requerimientos(pagina=page, limite=limit)
    return enviar_paginado([d.model_dump() for d in datos], page, limit, total)


@router.post("/requerimientos")
async def crear_requerimiento(
    datos: RequerimientoCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Crear un requerimiento con auto-increment y lineas de detalle."""
    servicio = ServicioSolicitudMaterial(db)
    creado = await servicio.crear_requerimiento(datos)
    return enviar_creado({"id": creado.id})


@router.get("/requerimientos/{req_id}")
async def obtener_requerimiento(
    req_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener requerimiento por ID con detalles."""
    servicio = ServicioSolicitudMaterial(db)
    datos = await servicio.obtener_requerimiento(req_id)
    return enviar_exito(datos.model_dump())


@router.put("/requerimientos/{req_id}")
async def actualizar_requerimiento(
    req_id: int,
    datos: RequerimientoActualizar,
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Actualizar un requerimiento."""
    servicio = ServicioSolicitudMaterial(db)
    await servicio.actualizar_requerimiento(req_id, datos)
    return enviar_exito({"id": req_id})


@router.delete("/requerimientos/{req_id}")
async def eliminar_requerimiento(
    req_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Eliminar un requerimiento y sus lineas de detalle."""
    servicio = ServicioSolicitudMaterial(db)
    await servicio.eliminar_requerimiento(req_id)
    return enviar_sin_contenido()


# --- CotizacionLogistica ---


@router.get("/cotizaciones-logistica")
async def listar_cotizaciones(
    usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Listar todas las cotizaciones logisticas."""
    servicio = ServicioSolicitudMaterial(db)
    datos = await servicio.listar_cotizaciones()
    return enviar_exito([d.model_dump() for d in datos])
