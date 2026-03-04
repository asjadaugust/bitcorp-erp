"""Router de caja y banco (bank cash flow)."""

from fastapi import APIRouter, Depends, Query
from fastapi.responses import ORJSONResponse

from app.core.dependencias import SesionDb, UsuarioActual, requerir_roles
from app.esquemas.caja_banco import (
    CuentaCajaBancoActualizar,
    CuentaCajaBancoCrear,
    DetalleMovimientoContableCrear,
    FlujoCajaBancoActualizar,
    FlujoCajaBancoCrear,
)
from app.servicios.caja_banco import ServicioCajaBanco
from app.utils.respuesta import enviar_creado, enviar_exito, enviar_paginado, enviar_sin_contenido

router = APIRouter(
    dependencies=[Depends(requerir_roles("ADMIN", "ADMIN_SISTEMA", "CONTABILIDAD"))],
)


# --- CuentaCajaBanco ---


@router.get("/cuentas")
async def listar_cuentas(usuario: UsuarioActual, db: SesionDb) -> ORJSONResponse:
    """Listar todas las cuentas de caja y banco."""
    servicio = ServicioCajaBanco(db)
    datos = await servicio.listar_cuentas()
    return enviar_exito([d.model_dump() for d in datos])


@router.post("/cuentas")
async def crear_cuenta(
    datos: CuentaCajaBancoCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Crear una nueva cuenta de caja y banco."""
    servicio = ServicioCajaBanco(db)
    creada = await servicio.crear_cuenta(datos)
    return enviar_creado({"id": creada.id})


@router.get("/cuentas/{cuenta_id}")
async def obtener_cuenta(
    cuenta_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener cuenta de caja y banco por ID."""
    servicio = ServicioCajaBanco(db)
    datos = await servicio.obtener_cuenta(cuenta_id)
    return enviar_exito(datos.model_dump())


@router.put("/cuentas/{cuenta_id}")
async def actualizar_cuenta(
    cuenta_id: int,
    datos: CuentaCajaBancoActualizar,
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Actualizar una cuenta de caja y banco."""
    servicio = ServicioCajaBanco(db)
    await servicio.actualizar_cuenta(cuenta_id, datos)
    return enviar_exito({"id": cuenta_id})


@router.delete("/cuentas/{cuenta_id}")
async def eliminar_cuenta(
    cuenta_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Eliminar una cuenta de caja y banco."""
    servicio = ServicioCajaBanco(db)
    await servicio.eliminar_cuenta(cuenta_id)
    return enviar_sin_contenido()


# --- FlujoCajaBanco ---


@router.get("/flujos")
async def listar_flujos(
    usuario: UsuarioActual,
    db: SesionDb,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    tipo_movimiento: str | None = Query(None),
    moneda: str | None = Query(None),
    fecha_desde: str | None = Query(None),
    fecha_hasta: str | None = Query(None),
) -> ORJSONResponse:
    """Listar flujos de caja y banco con paginacion."""
    servicio = ServicioCajaBanco(db)
    datos, total = await servicio.listar_flujos(
        pagina=page,
        limite=limit,
        tipo_movimiento=tipo_movimiento,
        moneda=moneda,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
    )
    return enviar_paginado([d.model_dump() for d in datos], page, limit, total)


@router.post("/flujos")
async def crear_flujo(
    datos: FlujoCajaBancoCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Crear un nuevo flujo de caja y banco."""
    servicio = ServicioCajaBanco(db)
    creado = await servicio.crear_flujo(datos)
    return enviar_creado({"id": creado.id})


@router.get("/flujos/{flujo_id}")
async def obtener_flujo(
    flujo_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener flujo de caja y banco por ID con detalles."""
    servicio = ServicioCajaBanco(db)
    datos = await servicio.obtener_flujo(flujo_id)
    return enviar_exito(datos.model_dump())


@router.put("/flujos/{flujo_id}")
async def actualizar_flujo(
    flujo_id: int,
    datos: FlujoCajaBancoActualizar,
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Actualizar un flujo de caja y banco."""
    servicio = ServicioCajaBanco(db)
    await servicio.actualizar_flujo(flujo_id, datos)
    return enviar_exito({"id": flujo_id})


# --- DetalleMovimientoContable ---


@router.get("/flujos/{flujo_id}/detalles")
async def listar_detalles_flujo(
    flujo_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Listar detalles de movimiento contable para un flujo."""
    servicio = ServicioCajaBanco(db)
    datos = await servicio.listar_detalles_flujo(flujo_id)
    return enviar_exito([d.model_dump() for d in datos])


@router.post("/flujos/{flujo_id}/detalles")
async def crear_detalle_flujo(
    flujo_id: int,
    datos: DetalleMovimientoContableCrear,
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Crear un detalle de movimiento contable para un flujo."""
    servicio = ServicioCajaBanco(db)
    creado = await servicio.crear_detalle_flujo(flujo_id, datos)
    return enviar_creado({"id": creado.id})


@router.delete("/flujos/{flujo_id}/detalles/{detalle_id}")
async def eliminar_detalle_flujo(
    flujo_id: int, detalle_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Eliminar un detalle de movimiento contable."""
    servicio = ServicioCajaBanco(db)
    await servicio.eliminar_detalle(detalle_id)
    return enviar_sin_contenido()


# --- AdminCentroCosto ---


@router.get("/admin-centros-costo")
async def listar_admin_centros_costo(
    usuario: UsuarioActual,
    db: SesionDb,
    cuenta_por_pagar_legacy_id: str | None = Query(None),
) -> ORJSONResponse:
    """Listar centros de costo administrativos (read-only)."""
    servicio = ServicioCajaBanco(db)
    datos = await servicio.listar_admin_centros_costo(cuenta_por_pagar_legacy_id)
    return enviar_exito([d.model_dump() for d in datos])
