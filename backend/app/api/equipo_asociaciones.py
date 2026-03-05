"""Router de equipo EDT y combustible (asociaciones)."""

from fastapi import APIRouter, Query
from fastapi.responses import ORJSONResponse

from app.core.dependencias import SesionDb, UsuarioActual
from app.esquemas.equipo_edt import (
    EquipoCombustibleActualizar,
    EquipoCombustibleCrear,
    EquipoEdtActualizar,
    EquipoEdtCrear,
)
from app.servicios.equipo_edt import ServicioEquipoAsociaciones
from app.utils.respuesta import enviar_creado, enviar_exito, enviar_sin_contenido

router = APIRouter()


# ─── EquipoEdt ────────────────────────────────────────────────────────────


@router.get("/edt")
async def listar_edt(
    usuario: UsuarioActual,
    db: SesionDb,
    parte_diario_id: int | None = Query(None),
) -> ORJSONResponse:
    """Listar registros de equipo EDT."""
    servicio = ServicioEquipoAsociaciones(db)
    datos = await servicio.listar_edt(parte_diario_id=parte_diario_id)
    return enviar_exito([d.model_dump() for d in datos])


@router.post("/edt")
async def crear_edt(
    datos: EquipoEdtCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Crear un nuevo registro de equipo EDT."""
    servicio = ServicioEquipoAsociaciones(db)
    creado = await servicio.crear_edt(datos)
    return enviar_creado({"id": creado.id})


@router.get("/edt/validate/{parte_diario_id}")
async def validar_porcentaje_edt(
    parte_diario_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Validar que los porcentajes de EDT suman 100% para un parte diario."""
    servicio = ServicioEquipoAsociaciones(db)
    resultado = await servicio.validar_porcentaje(parte_diario_id)
    return enviar_exito(resultado.model_dump())


@router.get("/edt/{edt_id}")
async def obtener_edt(
    edt_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener registro de equipo EDT por ID."""
    servicio = ServicioEquipoAsociaciones(db)
    datos = await servicio.obtener_edt(edt_id)
    return enviar_exito(datos.model_dump())


@router.put("/edt/{edt_id}")
async def actualizar_edt(
    edt_id: int,
    datos: EquipoEdtActualizar,
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Actualizar un registro de equipo EDT."""
    servicio = ServicioEquipoAsociaciones(db)
    await servicio.actualizar_edt(edt_id, datos)
    return enviar_exito({"id": edt_id})


@router.delete("/edt/{edt_id}")
async def eliminar_edt(
    edt_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Eliminar un registro de equipo EDT."""
    servicio = ServicioEquipoAsociaciones(db)
    await servicio.eliminar_edt(edt_id)
    return enviar_sin_contenido()


# ─── EquipoCombustible ────────────────────────────────────────────────────


@router.get("/combustible")
async def listar_combustible(
    usuario: UsuarioActual,
    db: SesionDb,
    valorizacion_legacy_id: str | None = Query(None),
) -> ORJSONResponse:
    """Listar registros de combustible."""
    servicio = ServicioEquipoAsociaciones(db)
    datos = await servicio.listar_combustible(
        valorizacion_legacy_id=valorizacion_legacy_id
    )
    return enviar_exito([d.model_dump() for d in datos])


@router.post("/combustible")
async def crear_combustible(
    datos: EquipoCombustibleCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Crear un nuevo registro de combustible (auto-calcula importe)."""
    servicio = ServicioEquipoAsociaciones(db)
    creado = await servicio.crear_combustible(datos)
    return enviar_creado({"id": creado.id})


@router.get("/combustible/{comb_id}")
async def obtener_combustible(
    comb_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener registro de combustible por ID."""
    servicio = ServicioEquipoAsociaciones(db)
    datos = await servicio.obtener_combustible(comb_id)
    return enviar_exito(datos.model_dump())


@router.put("/combustible/{comb_id}")
async def actualizar_combustible(
    comb_id: int,
    datos: EquipoCombustibleActualizar,
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Actualizar un registro de combustible (re-calcula importe)."""
    servicio = ServicioEquipoAsociaciones(db)
    await servicio.actualizar_combustible(comb_id, datos)
    return enviar_exito({"id": comb_id})


@router.delete("/combustible/{comb_id}")
async def eliminar_combustible(
    comb_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Eliminar un registro de combustible."""
    servicio = ServicioEquipoAsociaciones(db)
    await servicio.eliminar_combustible(comb_id)
    return enviar_sin_contenido()
