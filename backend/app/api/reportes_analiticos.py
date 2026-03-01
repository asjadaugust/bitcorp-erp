"""Router de reportes analíticos.

Replica /api/reporting del BFF Node.js.
"""

from datetime import date

from fastapi import APIRouter, Depends, Query
from fastapi.responses import ORJSONResponse

from app.core.dependencias import SesionDb, UsuarioActual, requerir_roles
from app.servicios.reporte_analitico import ServicioReporteAnalitico
from app.utils.respuesta import enviar_exito, enviar_paginado

router = APIRouter(
    dependencies=[Depends(requerir_roles("ADMIN", "ADMIN_SISTEMA", "DIRECTOR", "JEFE_EQUIPO"))],
)


@router.get("/equipment-utilization")
async def reporte_utilizacion_equipo(
    usuario: UsuarioActual,
    db: SesionDb,
    fecha_inicio: date | None = Query(None),
    fecha_fin: date | None = Query(None),
    equipo_id: int | None = Query(None),
    group_by: str = Query("daily"),
) -> ORJSONResponse:
    """Reporte de utilización de equipos por periodo."""
    srv = ServicioReporteAnalitico(db)
    datos = await srv.obtener_utilizacion_equipo(
        usuario.id_empresa,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        equipo_id=equipo_id,
        grupo=group_by,
    )
    return enviar_exito([d.model_dump() for d in datos])


@router.get("/maintenance")
async def reporte_mantenimiento(
    usuario: UsuarioActual,
    db: SesionDb,
    fecha_inicio: date | None = Query(None),
    fecha_fin: date | None = Query(None),
    equipo_id: int | None = Query(None),
    tipo: str | None = Query(None),
    estado: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
) -> ORJSONResponse:
    """Reporte de historial de mantenimiento."""
    srv = ServicioReporteAnalitico(db)
    datos, total = await srv.obtener_historial_mantenimiento(
        usuario.id_empresa,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        equipo_id=equipo_id,
        tipo=tipo,
        estado=estado,
        pagina=page,
        limite=limit,
    )
    return enviar_paginado([d.model_dump() for d in datos], page, limit, total)


@router.get("/inventory")
async def reporte_inventario(
    usuario: UsuarioActual,
    db: SesionDb,
    fecha_inicio: date | None = Query(None),
    fecha_fin: date | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
) -> ORJSONResponse:
    """Reporte de movimientos de inventario."""
    srv = ServicioReporteAnalitico(db)
    datos, total = await srv.obtener_movimientos_inventario(
        usuario.id_empresa,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        pagina=page,
        limite=limit,
    )
    return enviar_paginado([d.model_dump() for d in datos], page, limit, total)


@router.get("/operator-timesheet")
async def reporte_hoja_operador(
    usuario: UsuarioActual,
    db: SesionDb,
    fecha_inicio: date | None = Query(None),
    fecha_fin: date | None = Query(None),
    trabajador_id: int | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
) -> ORJSONResponse:
    """Reporte de hoja de tiempo de operadores."""
    srv = ServicioReporteAnalitico(db)
    datos, total = await srv.obtener_hoja_operador(
        usuario.id_empresa,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        trabajador_id=trabajador_id,
        pagina=page,
        limite=limit,
    )
    return enviar_paginado([d.model_dump() for d in datos], page, limit, total)
