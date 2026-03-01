"""Router de tareas programadas.

Replica /api/scheduling del BFF Node.js.
"""

from fastapi import APIRouter, Query
from fastapi.responses import ORJSONResponse
from pydantic import BaseModel

from app.core.dependencias import SesionDb, UsuarioActual
from app.esquemas.tarea_programada import TareaProgramadaActualizar, TareaProgramadaCrear
from app.servicios.tarea_programada import ServicioTareaProgramada
from app.utils.respuesta import enviar_creado, enviar_exito, enviar_paginado, enviar_sin_contenido

router = APIRouter()


class CompletarPayload(BaseModel):
    notas: str | None = None


@router.get("/tasks")
async def listar_tareas(
    usuario: UsuarioActual,
    db: SesionDb,
    task_type: str | None = Query(None),
    status: str | None = Query(None),
    fecha_inicio: str | None = Query(None),
    fecha_fin: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
) -> ORJSONResponse:
    """Listar tareas programadas."""
    servicio = ServicioTareaProgramada(db)
    datos, total = await servicio.listar(
        task_type=task_type,
        status=status,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        pagina=page,
        limite=limit,
    )
    return enviar_paginado([d.model_dump() for d in datos], page, limit, total)


@router.get("/tasks/{tarea_id}")
async def obtener_tarea(
    tarea_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener tarea por ID."""
    servicio = ServicioTareaProgramada(db)
    datos = await servicio.obtener_por_id(tarea_id)
    return enviar_exito(datos.model_dump())


@router.post("/tasks")
async def crear_tarea(
    datos: TareaProgramadaCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Crear una nueva tarea programada."""
    servicio = ServicioTareaProgramada(db)
    creada = await servicio.crear(datos, usuario.id_usuario)
    return enviar_creado({"id": creada.id, "message": "Tarea programada creada"})


@router.put("/tasks/{tarea_id}")
async def actualizar_tarea(
    tarea_id: int, datos: TareaProgramadaActualizar, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Actualizar una tarea programada."""
    servicio = ServicioTareaProgramada(db)
    actualizada = await servicio.actualizar(tarea_id, datos)
    return enviar_exito(actualizada.model_dump())


@router.delete("/tasks/{tarea_id}")
async def eliminar_tarea(
    tarea_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Eliminar una tarea programada."""
    servicio = ServicioTareaProgramada(db)
    await servicio.eliminar(tarea_id)
    return enviar_sin_contenido()


@router.post("/tasks/{tarea_id}/complete")
async def completar_tarea(
    tarea_id: int,
    payload: CompletarPayload,
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Marcar tarea como completada."""
    servicio = ServicioTareaProgramada(db)
    datos = await servicio.completar(tarea_id, payload.notas)
    return enviar_exito(datos.model_dump())


@router.post("/tasks/{tarea_id}/cancel")
async def cancelar_tarea(
    tarea_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Cancelar una tarea programada."""
    servicio = ServicioTareaProgramada(db)
    datos = await servicio.cancelar(tarea_id)
    return enviar_exito(datos.model_dump())
