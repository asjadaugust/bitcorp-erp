"""Router de mantenimiento de equipos."""

from fastapi import APIRouter, Depends, Query
from fastapi.responses import ORJSONResponse

from app.core.dependencias import SesionDb, UsuarioActual, requerir_roles
from app.esquemas.mantenimiento import MantenimientoActualizar, MantenimientoCrear
from app.servicios.mantenimiento import ServicioMantenimiento
from app.utils.respuesta import enviar_creado, enviar_exito, enviar_paginado

router = APIRouter()


# ─── Fixed routes before /{id} ───────────────────────────────────────────


@router.get("/overdue")
async def obtener_vencidos(usuario: UsuarioActual, db: SesionDb) -> ORJSONResponse:
    servicio = ServicioMantenimiento(db)
    vencidos = await servicio.obtener_vencidos(usuario.id_empresa)
    return enviar_exito([m.model_dump() for m in vencidos])


@router.get("/equipo/{equipo_id}")
async def listar_por_equipo(
    equipo_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioMantenimiento(db)
    mants = await servicio.listar_por_equipo(usuario.id_empresa, equipo_id)
    return enviar_exito([m.model_dump() for m in mants])


# ─── List / CRUD ─────────────────────────────────────────────────────────


@router.get("/")
async def listar_mantenimientos(
    usuario: UsuarioActual, db: SesionDb,
    page: int = Query(1, ge=1), limit: int = Query(10, ge=1, le=100),
    estado: str | None = None, tipo: str | None = None,
) -> ORJSONResponse:
    servicio = ServicioMantenimiento(db)
    mants, total = await servicio.listar(
        usuario.id_empresa, estado=estado, tipo=tipo, page=page, limit=limit,
    )
    return enviar_paginado([m.model_dump() for m in mants], pagina=page, limite=limit, total=total)


@router.post("/", dependencies=[Depends(requerir_roles("ADMIN", "DIRECTOR", "JEFE_EQUIPO"))])
async def crear_mantenimiento(
    datos: MantenimientoCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioMantenimiento(db)
    m = await servicio.crear(usuario.id_empresa, datos)
    return enviar_creado({"id": m.id, "message": "Mantenimiento programado"})


@router.get("/{mant_id}")
async def obtener_mantenimiento(
    mant_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioMantenimiento(db)
    m = await servicio.obtener_por_id(usuario.id_empresa, mant_id)
    return enviar_exito(m.model_dump())


@router.put("/{mant_id}")
async def actualizar_mantenimiento(
    mant_id: int, datos: MantenimientoActualizar, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioMantenimiento(db)
    m = await servicio.actualizar(usuario.id_empresa, mant_id, datos)
    return enviar_exito(m.model_dump())


@router.post("/{mant_id}/start")
async def iniciar_mantenimiento(
    mant_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioMantenimiento(db)
    m = await servicio.iniciar(usuario.id_empresa, mant_id)
    return enviar_exito(m.model_dump())


@router.post("/{mant_id}/complete")
async def completar_mantenimiento(
    mant_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioMantenimiento(db)
    m = await servicio.completar(usuario.id_empresa, mant_id)
    return enviar_exito(m.model_dump())


@router.post("/{mant_id}/cancel")
async def cancelar_mantenimiento(
    mant_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioMantenimiento(db)
    m = await servicio.cancelar(usuario.id_empresa, mant_id)
    return enviar_exito(m.model_dump())
