"""Router de configuración de precalentamiento.
"""

from fastapi import APIRouter, Depends
from fastapi.responses import ORJSONResponse

from app.core.dependencias import SesionDb, UsuarioActual, requerir_roles
from app.esquemas.precalentamiento import PrecalentamientoActualizar
from app.servicios.precalentamiento import ServicioPrecalentamiento
from app.utils.respuesta import enviar_exito

router = APIRouter()


@router.get("")
async def listar_configs(_usuario: UsuarioActual, db: SesionDb) -> ORJSONResponse:
    """Listar todas las configuraciones de precalentamiento."""
    servicio = ServicioPrecalentamiento(db)
    configs = await servicio.listar()
    return enviar_exito([c.model_dump() for c in configs])


@router.get("/tipo-equipo/{tipo_equipo_id}")
async def obtener_por_tipo_equipo(
    tipo_equipo_id: int, _usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener configuración para un tipo de equipo específico."""
    servicio = ServicioPrecalentamiento(db)
    config = await servicio.obtener_por_tipo_equipo(tipo_equipo_id)
    datos = config.model_dump() if config else None
    return enviar_exito(datos)


@router.get("/tipo-equipo/{tipo_equipo_id}/horas")
async def obtener_horas(
    tipo_equipo_id: int, _usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener solo las horas de precalentamiento para un tipo de equipo."""
    servicio = ServicioPrecalentamiento(db)
    horas = await servicio.obtener_horas(tipo_equipo_id)
    return enviar_exito(horas.model_dump())


@router.put(
    "/tipo-equipo/{tipo_equipo_id}",
    dependencies=[Depends(requerir_roles("ADMIN", "ADMIN_SISTEMA"))],
)
async def actualizar_config(
    tipo_equipo_id: int,
    datos: PrecalentamientoActualizar,
    db: SesionDb,
) -> ORJSONResponse:
    """Actualizar horas de precalentamiento para un tipo de equipo."""
    servicio = ServicioPrecalentamiento(db)
    config = await servicio.actualizar(tipo_equipo_id, datos)
    return enviar_exito(config.model_dump())
