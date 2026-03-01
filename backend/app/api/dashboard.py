"""Router de dashboard.

Replica /api/dashboard del BFF Node.js.
"""

from fastapi import APIRouter
from fastapi.responses import ORJSONResponse

from app.core.dependencias import SesionDb, UsuarioActual
from app.servicios.dashboard import ServicioDashboard
from app.utils.respuesta import enviar_exito

router = APIRouter()


@router.get("/stats")
async def obtener_estadisticas(usuario: UsuarioActual, db: SesionDb) -> ORJSONResponse:
    """Obtener estadísticas principales del dashboard."""
    servicio = ServicioDashboard(db)
    datos = await servicio.obtener_estadisticas(usuario.id_empresa)
    return enviar_exito(datos.model_dump())


@router.get("/document-alerts")
async def obtener_alertas_documentos(
    usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener alertas de documentos por vencer."""
    servicio = ServicioDashboard(db)
    datos = await servicio.obtener_alertas_documentos(usuario.id_empresa)
    return enviar_exito([d.model_dump() for d in datos])


@router.get("/modules")
async def obtener_modulos(usuario: UsuarioActual, db: SesionDb) -> ORJSONResponse:
    """Obtener módulos accesibles para el usuario."""
    servicio = ServicioDashboard(db)
    modulos = servicio.obtener_modulos_usuario(usuario.rol)
    return enviar_exito([m.model_dump() for m in modulos])
