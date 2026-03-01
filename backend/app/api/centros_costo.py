"""Router de centros de costo.
"""

from fastapi import APIRouter, Depends, Query
from fastapi.responses import ORJSONResponse

from app.core.dependencias import SesionDb, UsuarioActual, requerir_roles
from app.esquemas.centro_costo import CentroCostoActualizar, CentroCostoCrear
from app.servicios.centro_costo import ServicioCentroCosto
from app.utils.respuesta import enviar_creado, enviar_exito, enviar_paginado, enviar_sin_contenido

router = APIRouter(
    dependencies=[Depends(requerir_roles("ADMIN", "ADMIN_SISTEMA", "DIRECTOR"))],
)


@router.get("/")
async def listar_centros_costo(
    usuario: UsuarioActual,
    db: SesionDb,
    search: str | None = Query(None),
    proyecto_id: int | None = Query(None),
    is_active: bool | None = Query(True),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    sort_by: str = Query("codigo"),
    sort_order: str = Query("ASC"),
) -> ORJSONResponse:
    """Listar centros de costo con filtros y paginación."""
    servicio = ServicioCentroCosto(db)
    datos, total = await servicio.listar(
        tenant_id=usuario.id_empresa,
        busqueda=search,
        proyecto_id=proyecto_id,
        is_active=is_active,
        pagina=page,
        limite=limit,
        ordenar_por=sort_by,
        orden=sort_order,
    )
    return enviar_paginado([d.model_dump() for d in datos], page, limit, total)


@router.get("/count")
async def contar_activos(usuario: UsuarioActual, db: SesionDb) -> ORJSONResponse:
    """Contar centros de costo activos."""
    servicio = ServicioCentroCosto(db)
    conteo = await servicio.contar_activos(usuario.id_empresa)
    return enviar_exito({"count": conteo})


@router.get("/by-project/{proyecto_id}")
async def listar_por_proyecto(
    proyecto_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Listar centros de costo activos de un proyecto."""
    servicio = ServicioCentroCosto(db)
    datos = await servicio.listar_por_proyecto(usuario.id_empresa, proyecto_id)
    return enviar_exito([d.model_dump() for d in datos])


@router.get("/by-project/{proyecto_id}/budget")
async def obtener_presupuesto_total(
    proyecto_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener presupuesto total de un proyecto."""
    servicio = ServicioCentroCosto(db)
    total = await servicio.obtener_presupuesto_total(usuario.id_empresa, proyecto_id)
    return enviar_exito({"total_budget": total})


@router.get("/{cc_id}")
async def obtener_centro_costo(
    cc_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener un centro de costo por ID."""
    servicio = ServicioCentroCosto(db)
    datos = await servicio.obtener_por_id(usuario.id_empresa, cc_id)
    return enviar_exito(datos.model_dump())


@router.post("/")
async def crear_centro_costo(
    datos: CentroCostoCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Crear un nuevo centro de costo."""
    servicio = ServicioCentroCosto(db)
    creado = await servicio.crear(usuario.id_empresa, datos)
    return enviar_creado({"id": creado.id, "message": "Centro de costo creado exitosamente"})


@router.put("/{cc_id}")
async def actualizar_centro_costo(
    cc_id: int,
    datos: CentroCostoActualizar,
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Actualizar un centro de costo existente."""
    servicio = ServicioCentroCosto(db)
    actualizado = await servicio.actualizar(usuario.id_empresa, cc_id, datos)
    return enviar_exito(actualizado.model_dump())


@router.delete("/{cc_id}")
async def eliminar_centro_costo(
    cc_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Eliminar (soft delete) un centro de costo."""
    servicio = ServicioCentroCosto(db)
    await servicio.eliminar(usuario.id_empresa, cc_id)
    return enviar_sin_contenido()
