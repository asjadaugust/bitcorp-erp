"""Router de configuración de combustible.
"""

from fastapi import APIRouter, Depends
from fastapi.responses import ORJSONResponse

from app.core.dependencias import SesionDb, UsuarioActual, requerir_roles
from app.esquemas.combustible import CombustibleActualizar
from app.servicios.combustible import ServicioCombustible
from app.utils.respuesta import enviar_exito

router = APIRouter()


@router.get("")
async def obtener_config(_usuario: UsuarioActual, db: SesionDb) -> ORJSONResponse:
    """Obtener la configuración de combustible actual."""
    servicio = ServicioCombustible(db)
    config = await servicio.obtener()
    datos = config.model_dump() if config else None
    return enviar_exito(datos)


@router.get("/precio-manipuleo")
async def obtener_precio_manipuleo(
    _usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener solo la tarifa de manipuleo."""
    servicio = ServicioCombustible(db)
    precio = await servicio.obtener_precio_manipuleo()
    return enviar_exito(precio.model_dump())


@router.put(
    "/",
    dependencies=[Depends(requerir_roles("ADMIN", "ADMIN_SISTEMA"))],
)
async def actualizar_config(
    datos: CombustibleActualizar,
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Actualizar la tarifa de manipuleo."""
    servicio = ServicioCombustible(db)
    config = await servicio.actualizar(datos, usuario.id_usuario)
    return enviar_exito(config.model_dump())
