"""Router de registro de trabajador."""

from fastapi import APIRouter, Query
from fastapi.responses import ORJSONResponse

from app.core.dependencias import SesionDb, UsuarioActual
from app.esquemas.registro_trabajador import (
    ComportamientoHistoricoActualizar,
    ComportamientoHistoricoCrear,
    RegistroTrabajadorActualizar,
    RegistroTrabajadorCrear,
)
from app.servicios.registro_trabajador import ServicioRegistroTrabajador
from app.utils.respuesta import (
    enviar_creado,
    enviar_exito,
    enviar_paginado,
    enviar_sin_contenido,
)

router = APIRouter()


# ── RegistroTrabajador ─────────────────────────────────────────────


@router.get("/registros")
async def listar_registros(
    usuario: UsuarioActual,
    db: SesionDb,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    estatus: str | None = Query(None),
    sub_grupo: str | None = Query(None),
    search: str | None = Query(None),
) -> ORJSONResponse:
    """Listar registros de trabajador con filtros y paginacion."""
    servicio = ServicioRegistroTrabajador(db)
    datos, total = await servicio.listar_registros(
        pagina=page,
        limite=limit,
        estatus=estatus,
        sub_grupo=sub_grupo,
        search=search,
    )
    return enviar_paginado([d.model_dump() for d in datos], page, limit, total)


@router.post("/registros")
async def crear_registro(
    datos: RegistroTrabajadorCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Crear un nuevo registro de trabajador."""
    servicio = ServicioRegistroTrabajador(db)
    creado = await servicio.crear_registro(datos)
    return enviar_creado({"id": creado.id})


@router.get("/registros/{reg_id}")
async def obtener_registro(
    reg_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener registro de trabajador con comportamiento historico."""
    servicio = ServicioRegistroTrabajador(db)
    datos = await servicio.obtener_registro(reg_id)
    return enviar_exito(datos.model_dump())


@router.put("/registros/{reg_id}")
async def actualizar_registro(
    reg_id: int,
    datos: RegistroTrabajadorActualizar,
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Actualizar un registro de trabajador."""
    servicio = ServicioRegistroTrabajador(db)
    await servicio.actualizar_registro(reg_id, datos)
    return enviar_exito({"id": reg_id})


@router.delete("/registros/{reg_id}")
async def eliminar_registro(
    reg_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Eliminar un registro de trabajador (cascade comportamiento historico)."""
    servicio = ServicioRegistroTrabajador(db)
    await servicio.eliminar_registro(reg_id)
    return enviar_sin_contenido()


# ── ComportamientoHistorico (child of RegistroTrabajador) ──────────


@router.post("/registros/{reg_id}/comportamiento")
async def agregar_comportamiento(
    reg_id: int,
    datos: ComportamientoHistoricoCrear,
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Agregar un comportamiento historico a un registro de trabajador."""
    servicio = ServicioRegistroTrabajador(db)
    creado = await servicio.agregar_comportamiento(reg_id, datos)
    return enviar_creado(creado.model_dump())


@router.put("/registros/{reg_id}/comportamiento/{ch_id}")
async def actualizar_comportamiento(
    reg_id: int,
    ch_id: int,
    datos: ComportamientoHistoricoActualizar,
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Actualizar un comportamiento historico."""
    servicio = ServicioRegistroTrabajador(db)
    actualizado = await servicio.actualizar_comportamiento(ch_id, datos)
    return enviar_exito(actualizado.model_dump())


@router.delete("/registros/{reg_id}/comportamiento/{ch_id}")
async def eliminar_comportamiento(
    reg_id: int,
    ch_id: int,
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Eliminar un comportamiento historico."""
    servicio = ServicioRegistroTrabajador(db)
    await servicio.eliminar_comportamiento(ch_id)
    return enviar_sin_contenido()


# ── EdtTareo ──────────────────────────────────────────────────────


@router.get("/edt-tareo")
async def listar_edt_tareo(
    usuario: UsuarioActual,
    db: SesionDb,
    tareo_id: int | None = Query(None),
) -> ORJSONResponse:
    """Listar EdtTareo, opcionalmente filtrado por tareo_id."""
    servicio = ServicioRegistroTrabajador(db)
    datos = await servicio.listar_edt_tareo(tareo_id=tareo_id)
    return enviar_exito([d.model_dump() for d in datos])
