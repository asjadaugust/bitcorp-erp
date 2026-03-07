"""Router de cotizaciones de proveedor."""

from fastapi import APIRouter, Depends, Query
from fastapi.responses import ORJSONResponse

from app.core.dependencias import SesionDb, UsuarioActual, requerir_roles
from app.esquemas.cotizacion import (
    CotizacionActualizar,
    CotizacionCrear,
    EvaluarCotizacion,
    SeleccionarCotizacion,
)
from app.servicios.cotizacion import ServicioCotizacion
from app.utils.respuesta import enviar_creado, enviar_exito, enviar_paginado

router = APIRouter()


@router.get("/")
async def listar_cotizaciones(
    usuario: UsuarioActual, db: SesionDb,
    page: int = Query(1, ge=1), limit: int = Query(10, ge=1, le=100),
    solicitud_id: int | None = None, estado: str | None = None,
) -> ORJSONResponse:
    servicio = ServicioCotizacion(db)
    cots, total = await servicio.listar(
        usuario.id_empresa, solicitud_id=solicitud_id, estado=estado, page=page, limit=limit,
    )
    return enviar_paginado([c.model_dump() for c in cots], pagina=page, limite=limit, total=total)


@router.post("/", dependencies=[Depends(requerir_roles("ADMIN", "DIRECTOR", "JEFE_EQUIPO"))])
async def crear_cotizacion(
    datos: CotizacionCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioCotizacion(db)
    c = await servicio.crear(usuario.id_empresa, datos, usuario.id_usuario)
    return enviar_creado({"id": c.id, "message": "Cotización creada"})


@router.get("/{cot_id}")
async def obtener_cotizacion(
    cot_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioCotizacion(db)
    c = await servicio.obtener_por_id(usuario.id_empresa, cot_id)
    return enviar_exito(c.model_dump())


@router.put("/{cot_id}")
async def actualizar_cotizacion(
    cot_id: int, datos: CotizacionActualizar, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioCotizacion(db)
    c = await servicio.actualizar(usuario.id_empresa, cot_id, datos)
    return enviar_exito(c.model_dump())


@router.put("/{cot_id}/evaluar", dependencies=[Depends(requerir_roles("ADMIN", "DIRECTOR"))])
async def evaluar_cotizacion(
    cot_id: int, datos: EvaluarCotizacion, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioCotizacion(db)
    c = await servicio.evaluar(usuario.id_empresa, cot_id, datos, usuario.id_usuario)
    return enviar_exito(c.model_dump())


@router.put("/{cot_id}/seleccionar", dependencies=[Depends(requerir_roles("ADMIN", "DIRECTOR"))])
async def seleccionar_cotizacion(
    cot_id: int, datos: SeleccionarCotizacion, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioCotizacion(db)
    c = await servicio.seleccionar(usuario.id_empresa, cot_id, datos, usuario.id_usuario)
    return enviar_exito(c.model_dump())


@router.put("/{cot_id}/rechazar", dependencies=[Depends(requerir_roles("ADMIN", "DIRECTOR"))])
async def rechazar_cotizacion(
    cot_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioCotizacion(db)
    c = await servicio.rechazar(usuario.id_empresa, cot_id)
    return enviar_exito(c.model_dump())
