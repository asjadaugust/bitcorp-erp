"""Router de catálogos SUNAT (solo lectura)."""

from fastapi import APIRouter, Depends
from fastapi.responses import ORJSONResponse

from app.core.dependencias import SesionDb, UsuarioActual, requerir_roles
from app.servicios.catalogo import ServicioCatalogo
from app.utils.respuesta import enviar_exito

router = APIRouter(
    dependencies=[
        Depends(
            requerir_roles(
                "ADMIN",
                "ADMIN_SISTEMA",
                "DIRECTOR",
                "JEFE_EQUIPO",
                "OPERADOR",
                "CONTABILIDAD",
                "HR",
                "ALMACEN",
            )
        )
    ],
)


@router.get("/tipos-medio-pago")
async def listar_tipos_medio_pago(
    usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Listar todos los tipos de medio de pago activos."""
    servicio = ServicioCatalogo(db)
    datos = await servicio.listar_tipos_medio_pago()
    return enviar_exito([d.model_dump() for d in datos])


@router.get("/unidades-medida")
async def listar_unidades_medida(
    usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Listar todas las unidades de medida activas."""
    servicio = ServicioCatalogo(db)
    datos = await servicio.listar_unidades_medida()
    return enviar_exito([d.model_dump() for d in datos])


@router.get("/tipos-comprobante")
async def listar_tipos_comprobante(
    usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Listar todos los tipos de comprobante activos."""
    servicio = ServicioCatalogo(db)
    datos = await servicio.listar_tipos_comprobante()
    return enviar_exito([d.model_dump() for d in datos])


@router.get("/tipos-operacion")
async def listar_tipos_operacion(
    usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Listar todos los tipos de operación activos."""
    servicio = ServicioCatalogo(db)
    datos = await servicio.listar_tipos_operacion()
    return enviar_exito([d.model_dump() for d in datos])
