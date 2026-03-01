"""Router de checklists de inspección.

Replica /api/checklists del BFF Node.js.
"""

from fastapi import APIRouter, Query
from fastapi.responses import ORJSONResponse

from app.core.dependencias import SesionDb, UsuarioActual
from app.esquemas.checklist import InspeccionCrear, PlantillaActualizar, PlantillaCrear
from app.servicios.checklist import ServicioChecklist
from app.utils.respuesta import enviar_creado, enviar_exito, enviar_paginado

router = APIRouter()


# ─── Plantillas ─────────────────────────────────────────────────────────


@router.get("/templates")
async def listar_plantillas(
    usuario: UsuarioActual,
    db: SesionDb,
    tipo_equipo: str | None = Query(None),
    activo: bool | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
) -> ORJSONResponse:
    """Listar plantillas de checklists."""
    servicio = ServicioChecklist(db)
    datos, total = await servicio.listar_plantillas(
        tipo_equipo=tipo_equipo, activo=activo, pagina=page, limite=limit
    )
    return enviar_paginado([d.model_dump() for d in datos], page, limit, total)


@router.get("/templates/{plantilla_id}")
async def obtener_plantilla(
    plantilla_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener plantilla con sus items."""
    servicio = ServicioChecklist(db)
    plantilla = await servicio.obtener_plantilla(plantilla_id)
    items = await servicio.obtener_items_plantilla(plantilla_id)
    data = plantilla.model_dump()
    data["items"] = [i.model_dump() for i in items]
    return enviar_exito(data)


@router.post("/templates")
async def crear_plantilla(
    datos: PlantillaCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Crear una nueva plantilla."""
    servicio = ServicioChecklist(db)
    creada = await servicio.crear_plantilla(datos, usuario.id_usuario)
    return enviar_creado({"id": creada.id, "message": "Plantilla creada"})


@router.put("/templates/{plantilla_id}")
async def actualizar_plantilla(
    plantilla_id: int, datos: PlantillaActualizar, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Actualizar una plantilla."""
    servicio = ServicioChecklist(db)
    actualizada = await servicio.actualizar_plantilla(plantilla_id, datos)
    return enviar_exito(actualizada.model_dump())


# ─── Inspecciones ───────────────────────────────────────────────────────


@router.get("/inspections")
async def listar_inspecciones(
    usuario: UsuarioActual,
    db: SesionDb,
    equipo_id: int | None = Query(None),
    estado: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
) -> ORJSONResponse:
    """Listar inspecciones."""
    servicio = ServicioChecklist(db)
    datos, total = await servicio.listar_inspecciones(
        equipo_id=equipo_id, estado=estado, pagina=page, limite=limit
    )
    return enviar_paginado([d.model_dump() for d in datos], page, limit, total)


@router.get("/inspections/{inspeccion_id}")
async def obtener_inspeccion(
    inspeccion_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener inspección por ID."""
    servicio = ServicioChecklist(db)
    datos = await servicio.obtener_inspeccion(inspeccion_id)
    return enviar_exito(datos.model_dump())


@router.post("/inspections")
async def crear_inspeccion(
    datos: InspeccionCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Crear una nueva inspección."""
    servicio = ServicioChecklist(db)
    creada = await servicio.crear_inspeccion(datos)
    return enviar_creado({"id": creada.id, "message": "Inspección creada"})


@router.post("/inspections/{inspeccion_id}/complete")
async def completar_inspeccion(
    inspeccion_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Completar una inspección."""
    servicio = ServicioChecklist(db)
    datos = await servicio.completar_inspeccion(inspeccion_id)
    return enviar_exito(datos.model_dump())


# ─── Estadísticas ───────────────────────────────────────────────────────


@router.get("/stats")
async def estadisticas_checklists(
    usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Estadísticas generales de checklists."""
    servicio = ServicioChecklist(db)
    stats = await servicio.obtener_estadisticas()
    return enviar_exito(stats)
