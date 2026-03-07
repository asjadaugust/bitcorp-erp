"""Router de períodos de inoperatividad."""

from fastapi import APIRouter, Query
from fastapi.responses import ORJSONResponse

from app.core.dependencias import SesionDb, UsuarioActual
from app.esquemas.inoperatividad import (
    AplicarPenalidad,
    InoperatividadActualizar,
    InoperatividadCrear,
    ResolverInoperatividad,
)
from app.servicios.inoperatividad import ServicioInoperatividad
from app.utils.respuesta import enviar_creado, enviar_exito, enviar_paginado

router = APIRouter()


@router.get("/equipo/{equipo_id}")
async def listar_por_equipo(
    equipo_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioInoperatividad(db)
    periodos = await servicio.listar_por_equipo(usuario.id_empresa, equipo_id)
    return enviar_exito([p.model_dump() for p in periodos])


@router.get("")
async def listar_periodos(
    usuario: UsuarioActual, db: SesionDb,
    page: int = Query(1, ge=1), limit: int = Query(10, ge=1, le=100),
    estado: str | None = None,
) -> ORJSONResponse:
    servicio = ServicioInoperatividad(db)
    periodos, total = await servicio.listar(
        usuario.id_empresa, estado=estado, page=page, limit=limit,
    )
    return enviar_paginado(
        [p.model_dump() for p in periodos], pagina=page, limite=limit, total=total,
    )


@router.post("")
async def crear_periodo(
    datos: InoperatividadCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioInoperatividad(db)
    p = await servicio.crear(usuario.id_empresa, datos, usuario.id_usuario)
    return enviar_creado({"id": p.id, "message": "Periodo creado"})


@router.get("/{per_id}")
async def obtener_periodo(
    per_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioInoperatividad(db)
    p = await servicio.obtener_por_id(usuario.id_empresa, per_id)
    return enviar_exito(p.model_dump())


@router.put("/{per_id}")
async def actualizar_periodo(
    per_id: int, datos: InoperatividadActualizar, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioInoperatividad(db)
    p = await servicio.actualizar(usuario.id_empresa, per_id, datos)
    return enviar_exito(p.model_dump())


@router.post("/{per_id}/resolver")
async def resolver_periodo(
    per_id: int, datos: ResolverInoperatividad, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioInoperatividad(db)
    p = await servicio.resolver(usuario.id_empresa, per_id, datos, usuario.id_usuario)
    return enviar_exito(p.model_dump())


@router.post("/{per_id}/penalidad")
async def aplicar_penalidad(
    per_id: int, datos: AplicarPenalidad, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioInoperatividad(db)
    p = await servicio.aplicar_penalidad(usuario.id_empresa, per_id, datos)
    return enviar_exito(p.model_dump())
