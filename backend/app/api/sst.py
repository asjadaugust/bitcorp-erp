"""Router de SST / incidentes de seguridad.

Replica /api/sst del BFF Node.js.
"""

from fastapi import APIRouter, Query
from fastapi.responses import ORJSONResponse

from app.core.dependencias import SesionDb, UsuarioActual
from app.esquemas.incidente_sst import IncidenteActualizar, IncidenteCrear
from app.servicios.incidente_sst import ServicioIncidenteSST
from app.utils.respuesta import enviar_creado, enviar_exito, enviar_paginado, enviar_sin_contenido

router = APIRouter()


@router.get("/incidents")
async def listar_incidentes(
    usuario: UsuarioActual,
    db: SesionDb,
    severidad: str | None = Query(None),
    estado: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
) -> ORJSONResponse:
    """Listar incidentes con filtros y paginación."""
    servicio = ServicioIncidenteSST(db)
    datos, total = await servicio.listar(
        severidad=severidad, estado=estado, pagina=page, limite=limit
    )
    return enviar_paginado([d.model_dump() for d in datos], page, limit, total)


@router.get("/incidents/{incidente_id}")
async def obtener_incidente(
    incidente_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener incidente por ID."""
    servicio = ServicioIncidenteSST(db)
    datos = await servicio.obtener_por_id(incidente_id)
    return enviar_exito(datos.model_dump())


@router.post("/incidents")
async def crear_incidente(
    datos: IncidenteCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Crear un nuevo incidente."""
    servicio = ServicioIncidenteSST(db)
    creado = await servicio.crear(datos, usuario.id_usuario)
    return enviar_creado({"id": creado.id, "message": "Incidente creado"})


@router.put("/incidents/{incidente_id}")
async def actualizar_incidente(
    incidente_id: int, datos: IncidenteActualizar, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Actualizar un incidente existente."""
    servicio = ServicioIncidenteSST(db)
    actualizado = await servicio.actualizar(incidente_id, datos)
    return enviar_exito(actualizado.model_dump())


@router.delete("/incidents/{incidente_id}")
async def eliminar_incidente(
    incidente_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Eliminar un incidente."""
    servicio = ServicioIncidenteSST(db)
    await servicio.eliminar(incidente_id)
    return enviar_sin_contenido()
