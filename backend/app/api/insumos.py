"""Router de Insumos (Recursos Maestros)."""

from fastapi import APIRouter, Query
from fastapi.responses import ORJSONResponse

from app.core.dependencias import SesionDb, UsuarioActual
from app.esquemas.insumo import InsumoActualizar, InsumoCrear
from app.servicios.insumo import ServicioInsumo
from app.utils.respuesta import (
    enviar_creado,
    enviar_exito,
    enviar_paginado,
    enviar_sin_contenido,
)

router = APIRouter()


@router.get("")
async def listar_insumos(
    usuario: UsuarioActual,
    db: SesionDb,
    tipo: str | None = Query(None),
    search: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
) -> ORJSONResponse:
    """Listar insumos con filtros y paginación."""
    servicio = ServicioInsumo(db)
    datos, total = await servicio.listar(
        tipo=tipo, busqueda=search, pagina=page, limite=limit
    )
    return enviar_paginado([d.model_dump() for d in datos], page, limit, total)


@router.get("/dropdown")
async def listar_dropdown(
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Listar insumos para dropdown (sin paginación)."""
    servicio = ServicioInsumo(db)
    datos = await servicio.listar_dropdown()
    return enviar_exito([d.model_dump() for d in datos])


@router.get("/{insumo_id}")
async def obtener_insumo(
    insumo_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener insumo por ID."""
    servicio = ServicioInsumo(db)
    datos = await servicio.obtener_por_id(insumo_id)
    return enviar_exito(datos.model_dump())


@router.post("")
async def crear_insumo(
    datos: InsumoCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Crear un nuevo insumo."""
    servicio = ServicioInsumo(db)
    creado = await servicio.crear(datos)
    return enviar_creado({"id": creado.id, "message": "Insumo creado"})


@router.put("/{insumo_id}")
async def actualizar_insumo(
    insumo_id: int, datos: InsumoActualizar, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Actualizar un insumo existente."""
    servicio = ServicioInsumo(db)
    actualizado = await servicio.actualizar(insumo_id, datos)
    return enviar_exito(actualizado.model_dump())


@router.delete("/{insumo_id}")
async def eliminar_insumo(
    insumo_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Eliminar (soft delete) un insumo."""
    servicio = ServicioInsumo(db)
    await servicio.eliminar(insumo_id)
    return enviar_sin_contenido()
