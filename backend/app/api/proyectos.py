"""Router de proyectos (EDT).
"""

from fastapi import APIRouter, Query
from fastapi.responses import ORJSONResponse

from app.core.dependencias import SesionDb, UsuarioActual
from app.esquemas.proyecto import ProyectoActualizar, ProyectoCrear
from app.servicios.proyecto import ServicioProyecto
from app.utils.respuesta import enviar_creado, enviar_exito, enviar_paginado, enviar_sin_contenido

router = APIRouter()


@router.get("/")
async def listar_proyectos(
    usuario: UsuarioActual,
    db: SesionDb,
    estado: str | None = Query(None),
    search: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
) -> ORJSONResponse:
    """Listar proyectos con filtros y paginación."""
    servicio = ServicioProyecto(db)
    datos, total = await servicio.listar(
        estado=estado, busqueda=search, pagina=page, limite=limit
    )
    return enviar_paginado([d.model_dump() for d in datos], page, limit, total)


@router.get("/{proyecto_id}")
async def obtener_proyecto(
    proyecto_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener proyecto por ID."""
    servicio = ServicioProyecto(db)
    datos = await servicio.obtener_por_id(proyecto_id)
    return enviar_exito(datos.model_dump())


@router.post("/")
async def crear_proyecto(
    datos: ProyectoCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Crear un nuevo proyecto."""
    servicio = ServicioProyecto(db)
    creado = await servicio.crear(datos, usuario.id_usuario)
    return enviar_creado({"id": creado.id, "message": "Proyecto creado"})


@router.put("/{proyecto_id}")
async def actualizar_proyecto(
    proyecto_id: int, datos: ProyectoActualizar, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Actualizar un proyecto existente."""
    servicio = ServicioProyecto(db)
    actualizado = await servicio.actualizar(proyecto_id, datos, usuario.id_usuario)
    return enviar_exito(actualizado.model_dump())


@router.delete("/{proyecto_id}")
async def eliminar_proyecto(
    proyecto_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Eliminar (soft delete) un proyecto."""
    servicio = ServicioProyecto(db)
    await servicio.eliminar(proyecto_id)
    return enviar_sin_contenido()


@router.get("/{proyecto_id}/stats")
async def estadisticas_proyecto(
    proyecto_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener estadísticas del proyecto."""
    servicio = ServicioProyecto(db)
    stats = await servicio.obtener_estadisticas(proyecto_id)
    return enviar_exito(stats)
