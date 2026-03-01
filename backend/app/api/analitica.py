"""Router de analítica de equipos.
"""

from fastapi import APIRouter, Depends, Query
from fastapi.responses import ORJSONResponse

from app.core.dependencias import SesionDb, UsuarioActual, requerir_roles
from app.servicios.analitica import ServicioAnalitica
from app.utils.respuesta import enviar_exito

router = APIRouter(
    dependencies=[Depends(requerir_roles("ADMIN", "ADMIN_SISTEMA", "DIRECTOR", "JEFE_EQUIPO"))],
)


@router.get("/equipment/{equipo_id}/utilization")
async def obtener_utilizacion_equipo(
    equipo_id: int,
    usuario: UsuarioActual,
    db: SesionDb,
    period: str = Query("30d"),
) -> ORJSONResponse:
    """Obtener utilización de un equipo."""
    servicio = ServicioAnalitica(db)
    datos = await servicio.obtener_utilizacion_equipo(usuario.id_empresa, equipo_id, period)
    return enviar_exito(datos.model_dump())


@router.get("/equipment/{equipo_id}/utilization-trend")
async def obtener_tendencia_utilizacion(
    equipo_id: int,
    usuario: UsuarioActual,
    db: SesionDb,
    months: int = Query(6, ge=1, le=24),
) -> ORJSONResponse:
    """Obtener tendencia mensual de utilización."""
    servicio = ServicioAnalitica(db)
    datos = await servicio.obtener_tendencia_utilizacion(usuario.id_empresa, equipo_id, months)
    return enviar_exito([d.model_dump() for d in datos])


@router.get("/fleet/utilization")
async def obtener_utilizacion_flota(
    usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener utilización de toda la flota."""
    servicio = ServicioAnalitica(db)
    datos = await servicio.obtener_utilizacion_flota(usuario.id_empresa)
    return enviar_exito(datos.model_dump())


@router.get("/equipment/{equipo_id}/fuel")
async def obtener_metricas_combustible(
    equipo_id: int,
    usuario: UsuarioActual,
    db: SesionDb,
    period: str = Query("30d"),
) -> ORJSONResponse:
    """Obtener métricas de combustible de un equipo."""
    servicio = ServicioAnalitica(db)
    datos = await servicio.obtener_metricas_combustible(usuario.id_empresa, equipo_id, period)
    return enviar_exito(datos.model_dump())


@router.get("/equipment/{equipo_id}/fuel-trend")
async def obtener_tendencia_combustible(
    equipo_id: int,
    usuario: UsuarioActual,
    db: SesionDb,
    months: int = Query(6, ge=1, le=24),
) -> ORJSONResponse:
    """Obtener tendencia mensual de combustible."""
    servicio = ServicioAnalitica(db)
    datos = await servicio.obtener_tendencia_combustible(usuario.id_empresa, equipo_id, months)
    return enviar_exito([d.model_dump() for d in datos])


@router.get("/equipment/{equipo_id}/maintenance")
async def obtener_metricas_mantenimiento(
    equipo_id: int,
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Obtener métricas de mantenimiento de un equipo."""
    servicio = ServicioAnalitica(db)
    datos = await servicio.obtener_metricas_mantenimiento(usuario.id_empresa, equipo_id)
    return enviar_exito(datos.model_dump())
