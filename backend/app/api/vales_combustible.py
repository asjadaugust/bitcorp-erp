"""Router de vales de combustible."""

from fastapi import APIRouter, Query
from fastapi.responses import ORJSONResponse

from app.core.dependencias import SesionDb, UsuarioActual
from app.esquemas.vale_combustible import ValeCombustibleActualizar, ValeCombustibleCrear
from app.servicios.vale_combustible import ServicioValeCombustible
from app.utils.respuesta import enviar_creado, enviar_exito, enviar_paginado

router = APIRouter()


@router.get("/equipo/{equipo_id}")
async def listar_por_equipo(
    equipo_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioValeCombustible(db)
    vales = await servicio.listar_por_equipo(usuario.id_empresa, equipo_id)
    return enviar_exito([v.model_dump() for v in vales])


@router.get("/")
async def listar_vales(
    usuario: UsuarioActual, db: SesionDb,
    page: int = Query(1, ge=1), limit: int = Query(10, ge=1, le=100),
    estado: str | None = None, tipo_combustible: str | None = None,
) -> ORJSONResponse:
    servicio = ServicioValeCombustible(db)
    vales, total = await servicio.listar(
        usuario.id_empresa, estado=estado, tipo_combustible=tipo_combustible,
        page=page, limit=limit,
    )
    return enviar_paginado([v.model_dump() for v in vales], pagina=page, limite=limit, total=total)


@router.post("/")
async def crear_vale(
    datos: ValeCombustibleCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioValeCombustible(db)
    v = await servicio.crear(usuario.id_empresa, datos, usuario.id_usuario)
    return enviar_creado({"id": v.id, "message": "Vale creado"})


@router.get("/{vale_id}")
async def obtener_vale(
    vale_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioValeCombustible(db)
    v = await servicio.obtener_por_id(usuario.id_empresa, vale_id)
    return enviar_exito(v.model_dump())


@router.put("/{vale_id}")
async def actualizar_vale(
    vale_id: int, datos: ValeCombustibleActualizar, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioValeCombustible(db)
    v = await servicio.actualizar(usuario.id_empresa, vale_id, datos)
    return enviar_exito(v.model_dump())


@router.post("/{vale_id}/registrar")
async def registrar_vale(
    vale_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioValeCombustible(db)
    v = await servicio.registrar(usuario.id_empresa, vale_id)
    return enviar_exito(v.model_dump())


@router.post("/{vale_id}/anular")
async def anular_vale(
    vale_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioValeCombustible(db)
    v = await servicio.anular(usuario.id_empresa, vale_id)
    return enviar_exito(v.model_dump())
