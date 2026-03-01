"""Router de tareos (timesheets).

Replica /api/timesheets del BFF Node.js.
"""

from fastapi import APIRouter, Query
from fastapi.responses import ORJSONResponse

from app.core.dependencias import SesionDb, UsuarioActual
from app.esquemas.tareo import TareoActualizar, TareoCrear
from app.servicios.tareo import ServicioTareo
from app.utils.respuesta import enviar_creado, enviar_exito, enviar_paginado

router = APIRouter()


@router.get("/")
async def listar_tareos(
    usuario: UsuarioActual,
    db: SesionDb,
    periodo: str | None = Query(None),
    estado: str | None = Query(None),
    trabajador_id: int | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
) -> ORJSONResponse:
    """Listar tareos con filtros y paginación."""
    servicio = ServicioTareo(db)
    datos, total = await servicio.listar(
        periodo=periodo,
        estado=estado,
        trabajador_id=trabajador_id,
        pagina=page,
        limite=limit,
    )
    return enviar_paginado([d.model_dump() for d in datos], page, limit, total)


@router.get("/{tareo_id}")
async def obtener_tareo(
    tareo_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener tareo por ID."""
    servicio = ServicioTareo(db)
    datos = await servicio.obtener_por_id(tareo_id)
    return enviar_exito(datos.model_dump())


@router.post("/")
async def crear_tareo(
    datos: TareoCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Crear un nuevo tareo."""
    servicio = ServicioTareo(db)
    creado = await servicio.crear(datos, usuario.id_usuario)
    return enviar_creado({"id": creado.id, "message": "Tareo creado"})


@router.put("/{tareo_id}")
async def actualizar_tareo(
    tareo_id: int, datos: TareoActualizar, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Actualizar un tareo (solo en BORRADOR)."""
    servicio = ServicioTareo(db)
    actualizado = await servicio.actualizar(tareo_id, datos)
    return enviar_exito(actualizado.model_dump())


@router.post("/{tareo_id}/submit")
async def enviar_tareo(
    tareo_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Enviar tareo para aprobación (BORRADOR -> ENVIADO)."""
    servicio = ServicioTareo(db)
    datos = await servicio.enviar(tareo_id, usuario.id_usuario)
    return enviar_exito(datos.model_dump())


@router.post("/{tareo_id}/approve")
async def aprobar_tareo(
    tareo_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Aprobar tareo (ENVIADO -> APROBADO)."""
    servicio = ServicioTareo(db)
    datos = await servicio.aprobar(tareo_id, usuario.id_usuario)
    return enviar_exito(datos.model_dump())


@router.post("/{tareo_id}/reject")
async def rechazar_tareo(
    tareo_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Rechazar tareo (ENVIADO -> RECHAZADO)."""
    servicio = ServicioTareo(db)
    datos = await servicio.rechazar(tareo_id, usuario.id_usuario)
    return enviar_exito(datos.model_dump())


@router.post("/{tareo_id}/reopen")
async def reabrir_tareo(
    tareo_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Reabrir tareo rechazado (RECHAZADO -> BORRADOR)."""
    servicio = ServicioTareo(db)
    datos = await servicio.reabrir(tareo_id, usuario.id_usuario)
    return enviar_exito(datos.model_dump())


@router.get("/{tareo_id}/details")
async def obtener_detalles_tareo(
    tareo_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener líneas de detalle de un tareo."""
    servicio = ServicioTareo(db)
    detalles = await servicio.obtener_detalles(tareo_id)
    return enviar_exito([d.model_dump() for d in detalles])
