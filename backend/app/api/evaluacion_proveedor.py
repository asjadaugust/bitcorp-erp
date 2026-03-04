"""Router de evaluacion de proveedor."""

from fastapi import APIRouter, Depends, Query
from fastapi.responses import ORJSONResponse

from app.core.dependencias import SesionDb, UsuarioActual, requerir_roles
from app.esquemas.evaluacion_proveedor import (
    EvaluacionProveedorActualizar,
    EvaluacionProveedorCrear,
)
from app.servicios.evaluacion_proveedor import ServicioEvaluacionProveedor
from app.utils.respuesta import enviar_creado, enviar_exito, enviar_paginado, enviar_sin_contenido

router = APIRouter(
    dependencies=[Depends(requerir_roles("ADMIN", "ADMIN_SISTEMA"))],
)


# --- CriterioSeleccionEvaluacion (read-only) ---


@router.get("/criterios")
async def listar_criterios(usuario: UsuarioActual, db: SesionDb) -> ORJSONResponse:
    """Listar todos los criterios de seleccion/evaluacion."""
    servicio = ServicioEvaluacionProveedor(db)
    datos = await servicio.listar_criterios()
    return enviar_exito([d.model_dump() for d in datos])


# --- EvaluacionProveedor ---


@router.get("/evaluaciones")
async def listar_evaluaciones(
    usuario: UsuarioActual,
    db: SesionDb,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    resultado: str | None = Query(None),
) -> ORJSONResponse:
    """Listar evaluaciones de proveedor con paginacion."""
    servicio = ServicioEvaluacionProveedor(db)
    datos, total = await servicio.listar_evaluaciones(
        pagina=page,
        limite=limit,
        resultado_filter=resultado,
    )
    return enviar_paginado([d.model_dump() for d in datos], page, limit, total)


@router.post("/evaluaciones")
async def crear_evaluacion(
    datos: EvaluacionProveedorCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Crear una nueva evaluacion de proveedor."""
    servicio = ServicioEvaluacionProveedor(db)
    creada = await servicio.crear_evaluacion(datos)
    return enviar_creado({"id": creada.id})


@router.get("/evaluaciones/proveedor/{ruc}")
async def listar_por_proveedor(
    ruc: str, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Listar evaluaciones filtradas por RUC del proveedor."""
    servicio = ServicioEvaluacionProveedor(db)
    datos = await servicio.listar_por_proveedor(ruc)
    return enviar_exito([d.model_dump() for d in datos])


@router.get("/evaluaciones/{eval_id}")
async def obtener_evaluacion(
    eval_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener evaluacion de proveedor por ID."""
    servicio = ServicioEvaluacionProveedor(db)
    datos = await servicio.obtener_evaluacion(eval_id)
    return enviar_exito(datos.model_dump())


@router.put("/evaluaciones/{eval_id}")
async def actualizar_evaluacion(
    eval_id: int,
    datos: EvaluacionProveedorActualizar,
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Actualizar una evaluacion de proveedor."""
    servicio = ServicioEvaluacionProveedor(db)
    await servicio.actualizar_evaluacion(eval_id, datos)
    return enviar_exito({"id": eval_id})


@router.delete("/evaluaciones/{eval_id}")
async def eliminar_evaluacion(
    eval_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Eliminar una evaluacion de proveedor."""
    servicio = ServicioEvaluacionProveedor(db)
    await servicio.eliminar_evaluacion(eval_id)
    return enviar_sin_contenido()
