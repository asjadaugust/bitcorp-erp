"""Router de equipos.
"""

from fastapi import APIRouter, Depends, Query
from fastapi.responses import ORJSONResponse

from app.core.dependencias import SesionDb, UsuarioActual, requerir_roles
from app.esquemas.equipo import (
    AsignarEquipo,
    CambioEstado,
    EquipoActualizar,
    EquipoCrear,
    TransferirEquipo,
)
from app.servicios.equipo import ServicioEquipo
from app.utils.respuesta import enviar_creado, enviar_exito, enviar_paginado, enviar_sin_contenido

router = APIRouter()


# ─── Rutas sin path params (deben ir antes de /{id}) ─────────────────────


@router.get("/available")
async def obtener_disponibles(usuario: UsuarioActual, db: SesionDb) -> ORJSONResponse:
    """Obtener todos los equipos disponibles."""
    servicio = ServicioEquipo(db)
    equipos = await servicio.obtener_disponibles(usuario.id_empresa)
    return enviar_exito([e.model_dump() for e in equipos])


@router.get("/types")
async def obtener_tipos(usuario: UsuarioActual, db: SesionDb) -> ORJSONResponse:
    """Obtener categorías distintas de equipos."""
    servicio = ServicioEquipo(db)
    tipos = await servicio.obtener_tipos(usuario.id_empresa)
    return enviar_exito(tipos)


@router.get(
    "/statistics",
    dependencies=[Depends(requerir_roles("ADMIN", "DIRECTOR", "JEFE_EQUIPO"))],
)
async def obtener_estadisticas(usuario: UsuarioActual, db: SesionDb) -> ORJSONResponse:
    """Obtener estadísticas de equipos por estado."""
    servicio = ServicioEquipo(db)
    stats = await servicio.obtener_estadisticas(usuario.id_empresa)
    return enviar_exito(stats.model_dump())


@router.get("/availability/range")
async def obtener_disponibilidad(usuario: UsuarioActual, db: SesionDb) -> ORJSONResponse:
    """Verificar disponibilidad en rango de fechas (stub)."""
    servicio = ServicioEquipo(db)
    disponible = await servicio.disponibilidad_rango(usuario.id_empresa)
    return enviar_exito(disponible)


# ─── List (paginated) ────────────────────────────────────────────────────


@router.get("")
async def listar_equipos(
    usuario: UsuarioActual,
    db: SesionDb,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=500),
    estado: str | None = None,
    categoria: str | None = None,
    categoria_prd: str | None = None,
    marca: str | None = None,
    equipment_type_id: int | None = None,
    provider_id: int | None = None,
    search: str | None = None,
    is_active: bool = True,
    sort_by: str = "codigo_equipo",
    sort_order: str = "ASC",
) -> ORJSONResponse:
    """Listar equipos con filtros y paginación."""
    servicio = ServicioEquipo(db)
    equipos, total = await servicio.listar(
        usuario.id_empresa,
        estado=estado,
        categoria=categoria,
        categoria_prd=categoria_prd,
        marca=marca,
        equipment_type_id=equipment_type_id,
        provider_id=provider_id,
        search=search,
        is_active=is_active,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        limit=limit,
    )
    return enviar_paginado(
        [e.model_dump() for e in equipos],
        pagina=page,
        limite=limit,
        total=total,
    )


# ─── CRUD by ID ──────────────────────────────────────────────────────────


@router.get("/{equipo_id}")
async def obtener_equipo(
    equipo_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener un equipo por ID."""
    servicio = ServicioEquipo(db)
    equipo = await servicio.obtener_por_id(usuario.id_empresa, equipo_id)
    return enviar_exito(equipo.model_dump())


@router.get("/{equipo_id}/assignment-history")
async def historial_asignaciones(
    equipo_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener historial de asignaciones de un equipo."""
    servicio = ServicioEquipo(db)
    historial = await servicio.historial_asignaciones(usuario.id_empresa, equipo_id)
    return enviar_exito(historial)


@router.post(
    "/",
    dependencies=[Depends(requerir_roles("ADMIN", "DIRECTOR", "JEFE_EQUIPO"))],
)
async def crear_equipo(
    datos: EquipoCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Crear un nuevo equipo."""
    servicio = ServicioEquipo(db)
    equipo = await servicio.crear(usuario.id_empresa, datos, usuario.id_usuario)
    return enviar_creado({"id": equipo.id, "message": "Equipo creado exitosamente"})


@router.put("/{equipo_id}")
async def actualizar_equipo(
    equipo_id: int, datos: EquipoActualizar, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Actualizar un equipo existente."""
    servicio = ServicioEquipo(db)
    equipo = await servicio.actualizar(
        usuario.id_empresa, equipo_id, datos, usuario.id_usuario
    )
    return enviar_exito(equipo.model_dump())


@router.delete(
    "/{equipo_id}",
    dependencies=[Depends(requerir_roles("ADMIN", "DIRECTOR"))],
)
async def eliminar_equipo(
    equipo_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Eliminar (soft delete) un equipo."""
    servicio = ServicioEquipo(db)
    await servicio.eliminar(usuario.id_empresa, equipo_id)
    return enviar_sin_contenido()


@router.patch("/{equipo_id}/status")
async def actualizar_estado(
    equipo_id: int, datos: CambioEstado, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Cambiar el estado de un equipo."""
    servicio = ServicioEquipo(db)
    equipo = await servicio.cambiar_estado(usuario.id_empresa, equipo_id, datos.estado)
    return enviar_exito(equipo.model_dump())


@router.post("/{equipo_id}/assign")
async def asignar_equipo(
    equipo_id: int, datos: AsignarEquipo, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Asignar equipo a proyecto (stub)."""
    servicio = ServicioEquipo(db)
    resultado = await servicio.asignar(
        usuario.id_empresa, equipo_id, datos.model_dump()
    )
    return enviar_exito(resultado)


@router.post("/{equipo_id}/transfer")
async def transferir_equipo(
    equipo_id: int, datos: TransferirEquipo, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Transferir equipo entre proyectos (stub)."""
    servicio = ServicioEquipo(db)
    resultado = await servicio.transferir(
        usuario.id_empresa, equipo_id, datos.model_dump()
    )
    return enviar_exito(resultado)
