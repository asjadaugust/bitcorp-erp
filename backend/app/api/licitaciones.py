"""Router de licitaciones."""

from fastapi import APIRouter, Query
from fastapi.responses import ORJSONResponse

from app.core.dependencias import SesionDb, UsuarioActual
from app.esquemas.licitacion import (
    LicitacionActualizar,
    LicitacionCrear,
    TransicionEstado,
)
from app.servicios.licitacion import ServicioLicitacion
from app.utils.respuesta import (
    enviar_creado,
    enviar_exito,
    enviar_paginado,
    enviar_sin_contenido,
)

router = APIRouter()


@router.get("/")
async def listar_licitaciones(
    usuario: UsuarioActual,
    db: SesionDb,
    estado: str | None = Query(None),
    search: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
) -> ORJSONResponse:
    """Listar licitaciones con filtros y paginación."""
    servicio = ServicioLicitacion(db)
    datos, total = await servicio.listar(
        estado=estado, busqueda=search, pagina=page, limite=limit
    )
    return enviar_paginado([d.model_dump() for d in datos], page, limit, total)


@router.get("/{licitacion_id}")
async def obtener_licitacion(
    licitacion_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener licitación por ID."""
    servicio = ServicioLicitacion(db)
    datos = await servicio.obtener_por_id(licitacion_id)
    return enviar_exito(datos.model_dump())


@router.post("/")
async def crear_licitacion(
    datos: LicitacionCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Crear una nueva licitación."""
    servicio = ServicioLicitacion(db)
    creada = await servicio.crear(datos)
    return enviar_creado({"id": creada.id, "message": "Licitación creada"})


@router.put("/{licitacion_id}")
async def actualizar_licitacion(
    licitacion_id: int,
    datos: LicitacionActualizar,
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Actualizar una licitación existente."""
    servicio = ServicioLicitacion(db)
    actualizada = await servicio.actualizar(licitacion_id, datos)
    return enviar_exito(actualizada.model_dump())


@router.delete("/{licitacion_id}")
async def eliminar_licitacion(
    licitacion_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Eliminar una licitación."""
    servicio = ServicioLicitacion(db)
    await servicio.eliminar(licitacion_id)
    return enviar_sin_contenido()


@router.post("/{licitacion_id}/transition")
async def transicionar_licitacion(
    licitacion_id: int,
    datos: TransicionEstado,
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Cambiar estado de una licitación con validación."""
    servicio = ServicioLicitacion(db)
    actualizada = await servicio.cambiar_estado(licitacion_id, datos.nuevo_estado)
    return enviar_exito(actualizada.model_dump())
