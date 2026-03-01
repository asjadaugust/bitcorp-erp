"""Router de programación de pagos.

Replica /api/payment-schedules del BFF Node.js.
"""

from fastapi import APIRouter, Depends, Query
from fastapi.responses import ORJSONResponse

from app.core.dependencias import SesionDb, UsuarioActual, requerir_roles
from app.esquemas.programacion_pago import (
    DetallePagoCrear,
    ProgramacionPagoActualizar,
    ProgramacionPagoCrear,
)
from app.servicios.programacion_pago import ServicioProgramacionPago
from app.utils.respuesta import enviar_creado, enviar_exito, enviar_paginado, enviar_sin_contenido

router = APIRouter(
    dependencies=[Depends(requerir_roles("ADMIN", "ADMIN_SISTEMA", "DIRECTOR", "CONTABILIDAD"))],
)


@router.get("/")
async def listar_programaciones(
    usuario: UsuarioActual,
    db: SesionDb,
    proveedor_id: int | None = Query(None),
    estado: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
) -> ORJSONResponse:
    """Listar programaciones de pago."""
    servicio = ServicioProgramacionPago(db)
    datos, total = await servicio.listar(
        proveedor_id=proveedor_id, estado=estado, pagina=page, limite=limit
    )
    return enviar_paginado([d.model_dump() for d in datos], page, limit, total)


@router.get("/{prog_id}")
async def obtener_programacion(
    prog_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener programación por ID."""
    servicio = ServicioProgramacionPago(db)
    datos = await servicio.obtener_por_id(prog_id)
    return enviar_exito(datos.model_dump())


@router.post("/")
async def crear_programacion(
    datos: ProgramacionPagoCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Crear programación de pago."""
    servicio = ServicioProgramacionPago(db)
    creada = await servicio.crear(datos)
    return enviar_creado({"id": creada.id, "message": "Programación creada"})


@router.put("/{prog_id}")
async def actualizar_programacion(
    prog_id: int,
    datos: ProgramacionPagoActualizar,
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Actualizar programación de pago."""
    servicio = ServicioProgramacionPago(db)
    actualizada = await servicio.actualizar(prog_id, datos)
    return enviar_exito(actualizada.model_dump())


@router.delete("/{prog_id}")
async def eliminar_programacion(
    prog_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Eliminar programación de pago."""
    servicio = ServicioProgramacionPago(db)
    await servicio.eliminar(prog_id)
    return enviar_sin_contenido()


@router.post("/{prog_id}/approve")
async def aprobar_programacion(
    prog_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Aprobar programación: PROGRAMADO → APROBADO."""
    servicio = ServicioProgramacionPago(db)
    datos = await servicio.aprobar(prog_id)
    return enviar_exito(datos.model_dump())


@router.post("/{prog_id}/process")
async def procesar_programacion(
    prog_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Procesar programación: APROBADO → PROCESADO."""
    servicio = ServicioProgramacionPago(db)
    datos = await servicio.procesar(prog_id)
    return enviar_exito(datos.model_dump())


@router.post("/{prog_id}/cancel")
async def cancelar_programacion(
    prog_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Cancelar programación."""
    servicio = ServicioProgramacionPago(db)
    datos = await servicio.cancelar(prog_id)
    return enviar_exito(datos.model_dump())


@router.post("/{prog_id}/details")
async def agregar_detalle(
    prog_id: int,
    datos: DetallePagoCrear,
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Agregar línea de detalle a programación."""
    servicio = ServicioProgramacionPago(db)
    actualizada = await servicio.agregar_detalle(prog_id, datos)
    return enviar_exito(actualizada.model_dump())


@router.delete("/{prog_id}/details/{detalle_id}")
async def eliminar_detalle(
    prog_id: int,
    detalle_id: int,
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Eliminar línea de detalle de programación."""
    servicio = ServicioProgramacionPago(db)
    actualizada = await servicio.eliminar_detalle(prog_id, detalle_id)
    return enviar_exito(actualizada.model_dump())
