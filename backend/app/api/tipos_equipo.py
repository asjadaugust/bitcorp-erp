"""Router de tipos de equipo.
"""

from fastapi import APIRouter
from fastapi.responses import ORJSONResponse

from app.core.dependencias import SesionDb, UsuarioActual
from app.servicios.tipo_equipo import ServicioTipoEquipo
from app.utils.respuesta import enviar_exito

router = APIRouter()


@router.get("")
async def listar_tipos(_usuario: UsuarioActual, db: SesionDb) -> ORJSONResponse:
    """Listar todos los tipos de equipo activos."""
    servicio = ServicioTipoEquipo(db)
    tipos = await servicio.listar()
    return enviar_exito([t.model_dump() for t in tipos])


@router.get("/agrupados")
async def listar_agrupados(_usuario: UsuarioActual, db: SesionDb) -> ORJSONResponse:
    """Listar tipos agrupados por categoría PRD."""
    servicio = ServicioTipoEquipo(db)
    grupos = await servicio.listar_agrupados()
    return enviar_exito([g.model_dump() for g in grupos])


@router.get("/categoria/{categoria_prd}")
async def listar_por_categoria(
    categoria_prd: str, _usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Listar tipos para una categoría PRD específica."""
    servicio = ServicioTipoEquipo(db)
    tipos = await servicio.listar_por_categoria(categoria_prd)
    return enviar_exito([t.model_dump() for t in tipos])


@router.get("/{tipo_id}")
async def obtener_tipo(
    tipo_id: int, _usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener un tipo de equipo por ID."""
    servicio = ServicioTipoEquipo(db)
    tipo = await servicio.obtener_por_id(tipo_id)
    return enviar_exito(tipo.model_dump())
