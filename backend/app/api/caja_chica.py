"""Router de caja chica, solicitudes y movimientos."""

from fastapi import APIRouter, Depends, Query
from fastapi.responses import ORJSONResponse

from app.core.dependencias import SesionDb, UsuarioActual, requerir_roles
from app.esquemas.caja_chica import (
    CajaChicaActualizar,
    CajaChicaCrear,
    MovimientoCajaCrear,
    SolicitudCajaActualizar,
    SolicitudCajaCrear,
)
from app.servicios.caja_chica import ServicioCajaChica
from app.utils.respuesta import enviar_creado, enviar_exito, enviar_sin_contenido

router = APIRouter(
    dependencies=[Depends(requerir_roles("ADMIN", "ADMIN_SISTEMA", "CONTABILIDAD"))],
)


# ─── Caja Chica ──────────────────────────────────────────────────────────


@router.get("/cajas")
async def listar_cajas(usuario: UsuarioActual, db: SesionDb) -> ORJSONResponse:
    """Listar todas las cajas chicas."""
    servicio = ServicioCajaChica(db)
    datos = await servicio.listar_cajas()
    return enviar_exito([d.model_dump() for d in datos])


@router.post("/cajas")
async def crear_caja(
    datos: CajaChicaCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Crear una nueva caja chica."""
    servicio = ServicioCajaChica(db)
    creada = await servicio.crear_caja(datos)
    return enviar_creado({"id": creada.id})


@router.get("/cajas/{caja_id}")
async def obtener_caja(
    caja_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener caja chica por ID con solicitudes y movimientos."""
    servicio = ServicioCajaChica(db)
    datos = await servicio.obtener_caja(caja_id)
    return enviar_exito(datos.model_dump())


@router.put("/cajas/{caja_id}")
async def actualizar_caja(
    caja_id: int,
    datos: CajaChicaActualizar,
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Actualizar una caja chica."""
    servicio = ServicioCajaChica(db)
    await servicio.actualizar_caja(caja_id, datos)
    return enviar_exito({"id": caja_id})


@router.delete("/cajas/{caja_id}")
async def eliminar_caja(
    caja_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Eliminar una caja chica."""
    servicio = ServicioCajaChica(db)
    await servicio.eliminar_caja(caja_id)
    return enviar_sin_contenido()


@router.post("/cajas/{caja_id}/cerrar")
async def cerrar_caja(
    caja_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Cerrar una caja chica recalculando saldos."""
    servicio = ServicioCajaChica(db)
    datos = await servicio.cerrar_caja(caja_id)
    return enviar_exito(datos.model_dump())


# ─── Solicitudes ─────────────────────────────────────────────────────────


@router.get("/solicitudes")
async def listar_solicitudes(
    usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Listar todas las solicitudes de caja."""
    servicio = ServicioCajaChica(db)
    datos = await servicio.listar_solicitudes()
    return enviar_exito([d.model_dump() for d in datos])


@router.post("/solicitudes")
async def crear_solicitud(
    datos: SolicitudCajaCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Crear una solicitud de caja."""
    servicio = ServicioCajaChica(db)
    creada = await servicio.crear_solicitud(datos)
    return enviar_creado({"id": creada.id})


@router.get("/solicitudes/{sol_id}")
async def obtener_solicitud(
    sol_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener solicitud de caja por ID."""
    servicio = ServicioCajaChica(db)
    datos = await servicio.obtener_solicitud(sol_id)
    return enviar_exito(datos.model_dump())


@router.put("/solicitudes/{sol_id}")
async def actualizar_solicitud(
    sol_id: int,
    datos: SolicitudCajaActualizar,
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Actualizar una solicitud de caja."""
    servicio = ServicioCajaChica(db)
    actualizada = await servicio.actualizar_solicitud(sol_id, datos)
    return enviar_exito(actualizada.model_dump())


# ─── Movimientos ─────────────────────────────────────────────────────────


@router.get("/movimientos")
async def listar_movimientos(
    usuario: UsuarioActual,
    db: SesionDb,
    numero_caja: str | None = Query(None),
) -> ORJSONResponse:
    """Listar movimientos de caja."""
    servicio = ServicioCajaChica(db)
    datos = await servicio.listar_movimientos(numero_caja)
    return enviar_exito([d.model_dump() for d in datos])


@router.post("/movimientos")
async def crear_movimiento(
    datos: MovimientoCajaCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Crear un movimiento de caja."""
    servicio = ServicioCajaChica(db)
    creado = await servicio.crear_movimiento(datos)
    return enviar_creado({"id": creado.id})


@router.get("/movimientos/{mov_id}")
async def obtener_movimiento(
    mov_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener movimiento de caja por ID."""
    servicio = ServicioCajaChica(db)
    datos = await servicio.obtener_movimiento(mov_id)
    return enviar_exito(datos.model_dump())
