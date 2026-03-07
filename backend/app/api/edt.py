"""Router de EDT (Estructura de Desglose de Trabajo)."""

from fastapi import APIRouter, Query
from fastapi.responses import ORJSONResponse

from app.core.dependencias import SesionDb, UsuarioActual
from app.esquemas.edt import EdtActualizar, EdtCrear
from app.servicios.edt import ServicioEdt
from app.utils.respuesta import (
    enviar_creado,
    enviar_exito,
    enviar_paginado,
    enviar_sin_contenido,
)

router = APIRouter()


@router.get("")
async def listar_edt(
    usuario: UsuarioActual,
    db: SesionDb,
    estado: str | None = Query(None),
    search: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
) -> ORJSONResponse:
    """Listar EDT items con filtros y paginación."""
    servicio = ServicioEdt(db)
    datos, total = await servicio.listar(
        estado=estado, busqueda=search, pagina=page, limite=limit
    )
    return enviar_paginado([d.model_dump() for d in datos], page, limit, total)


@router.get("/dropdown")
async def listar_dropdown(
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Listar EDT items para dropdown (sin paginación)."""
    servicio = ServicioEdt(db)
    datos = await servicio.listar_dropdown()
    return enviar_exito([d.model_dump() for d in datos])


@router.get("/{edt_id}")
async def obtener_edt(
    edt_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener EDT por ID."""
    servicio = ServicioEdt(db)
    datos = await servicio.obtener_por_id(edt_id)
    return enviar_exito(datos.model_dump())


@router.post("")
async def crear_edt(
    datos: EdtCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Crear un nuevo EDT item."""
    servicio = ServicioEdt(db)
    creado = await servicio.crear(datos)
    return enviar_creado({"id": creado.id, "message": "EDT creado"})


@router.put("/{edt_id}")
async def actualizar_edt(
    edt_id: int, datos: EdtActualizar, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Actualizar un EDT item existente."""
    servicio = ServicioEdt(db)
    actualizado = await servicio.actualizar(edt_id, datos)
    return enviar_exito(actualizado.model_dump())


@router.delete("/{edt_id}")
async def eliminar_edt(
    edt_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Eliminar (soft delete) un EDT item."""
    servicio = ServicioEdt(db)
    await servicio.eliminar(edt_id)
    return enviar_sin_contenido()
