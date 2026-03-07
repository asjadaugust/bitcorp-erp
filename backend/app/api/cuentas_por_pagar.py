"""Router de cuentas por pagar."""

from fastapi import APIRouter, Depends, Query
from fastapi.responses import ORJSONResponse

from app.core.dependencias import SesionDb, UsuarioActual, requerir_roles
from app.esquemas.cuenta_por_pagar import CuentaPorPagarActualizar, CuentaPorPagarCrear
from app.servicios.cuenta_por_pagar import ServicioCuentaPorPagar
from app.utils.respuesta import (
    enviar_creado,
    enviar_exito,
    enviar_paginado,
    enviar_sin_contenido,
)

router = APIRouter(
    dependencies=[
        Depends(requerir_roles("ADMIN", "ADMIN_SISTEMA", "DIRECTOR", "CONTABILIDAD"))
    ],
)


@router.get("/")
async def listar_cuentas(
    usuario: UsuarioActual,
    db: SesionDb,
    estado: str | None = Query(None),
    proveedor_id: int | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
) -> ORJSONResponse:
    """Listar cuentas por pagar."""
    servicio = ServicioCuentaPorPagar(db)
    datos, total = await servicio.listar(
        tenant_id=usuario.id_empresa,
        estado=estado,
        proveedor_id=proveedor_id,
        pagina=page,
        limite=limit,
    )
    return enviar_paginado([d.model_dump() for d in datos], page, limit, total)


@router.get("/pending")
async def listar_pendientes(usuario: UsuarioActual, db: SesionDb) -> ORJSONResponse:
    """Listar cuentas pendientes."""
    servicio = ServicioCuentaPorPagar(db)
    datos = await servicio.listar_pendientes(usuario.id_empresa)
    return enviar_exito([d.model_dump() for d in datos])


@router.get("/summary")
async def obtener_resumen(usuario: UsuarioActual, db: SesionDb) -> ORJSONResponse:
    """Obtener resumen de cuentas por pagar."""
    servicio = ServicioCuentaPorPagar(db)
    datos = await servicio.obtener_resumen(usuario.id_empresa)
    return enviar_exito(datos)


@router.get("/{cuenta_id}")
async def obtener_cuenta(
    cuenta_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener cuenta por pagar por ID."""
    servicio = ServicioCuentaPorPagar(db)
    datos = await servicio.obtener_por_id(usuario.id_empresa, cuenta_id)
    return enviar_exito(datos.model_dump())


@router.post("/")
async def crear_cuenta(
    datos: CuentaPorPagarCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Crear cuenta por pagar."""
    servicio = ServicioCuentaPorPagar(db)
    creada = await servicio.crear(usuario.id_empresa, datos)
    return enviar_creado({"id": creada.id, "message": "Cuenta por pagar creada"})


@router.put("/{cuenta_id}")
async def actualizar_cuenta(
    cuenta_id: int,
    datos: CuentaPorPagarActualizar,
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Actualizar cuenta por pagar."""
    servicio = ServicioCuentaPorPagar(db)
    actualizada = await servicio.actualizar(usuario.id_empresa, cuenta_id, datos)
    return enviar_exito(actualizada.model_dump())


@router.delete("/{cuenta_id}")
async def eliminar_cuenta(
    cuenta_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Eliminar (anular) cuenta por pagar."""
    servicio = ServicioCuentaPorPagar(db)
    await servicio.eliminar(usuario.id_empresa, cuenta_id)
    return enviar_sin_contenido()
