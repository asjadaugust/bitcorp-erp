"""Router de reportes diarios (partes diarios).
"""

from datetime import date

from fastapi import APIRouter, Query
from fastapi.responses import ORJSONResponse, Response

from app.core.dependencias import SesionDb, UsuarioActual
from app.esquemas.parte_diario import (
    FirmarResidente,
    ParteDiarioActualizar,
    ParteDiarioCrear,
    RechazarReporte,
    ResolverObservacionDto,
)
from app.servicios.parte_diario import ServicioParteDiario
from app.utils.respuesta import enviar_creado, enviar_exito, enviar_paginado, enviar_sin_contenido

router = APIRouter()


# ─── Static routes (before /{id}) ──────────────────────────────────────────


@router.get("/reception-status")
async def estado_recepcion(
    usuario: UsuarioActual,
    db: SesionDb,
    fecha_desde: date = Query(...),
    fecha_hasta: date = Query(...),
    proyecto_id: int | None = None,
) -> ORJSONResponse:
    """Estado de recepción de reportes por equipo."""
    servicio = ServicioParteDiario(db)
    resultado = await servicio.estado_recepcion(
        usuario.id_empresa, fecha_desde, fecha_hasta, proyecto_id
    )
    return enviar_exito([r.model_dump() for r in resultado])


@router.get("/inspection-tracking")
async def seguimiento_inspeccion(
    usuario: UsuarioActual,
    db: SesionDb,
    fecha_desde: date | None = None,
    fecha_hasta: date | None = None,
    solo_abiertas: bool = False,
) -> ORJSONResponse:
    """Seguimiento de observaciones mecánicas por equipo."""
    servicio = ServicioParteDiario(db)
    resultado = await servicio.seguimiento_inspeccion(
        usuario.id_empresa, fecha_desde, fecha_hasta, solo_abiertas
    )
    return enviar_exito([r.model_dump() for r in resultado])


@router.get("/operator/{operador_id}")
async def listar_reportes_por_operador(
    operador_id: int,
    usuario: UsuarioActual,
    db: SesionDb,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
) -> ORJSONResponse:
    """Listar reportes filtrados por operador."""
    servicio = ServicioParteDiario(db)
    reportes, total = await servicio.listar(
        usuario.id_empresa,
        trabajador_id=operador_id,
        page=page,
        limit=limit,
    )
    return enviar_paginado(
        [r.model_dump() for r in reportes],
        pagina=page,
        limite=limit,
        total=total,
    )


@router.patch("/observaciones/{observacion_id}/resolver")
async def resolver_observacion(
    observacion_id: int,
    datos: ResolverObservacionDto,
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Resolver una observación mecánica."""
    servicio = ServicioParteDiario(db)
    resultado = await servicio.resolver_observacion(
        usuario.id_empresa, observacion_id, datos.observacion_resolucion
    )
    return enviar_exito(resultado)


# ─── List (paginated) ─────────────────────────────────────────────────────


@router.get("/")
async def listar_reportes(
    usuario: UsuarioActual,
    db: SesionDb,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    estado: str | None = None,
    equipo_id: int | None = None,
    trabajador_id: int | None = None,
    proyecto_id: int | None = None,
    fecha_inicio: date | None = None,
    fecha_fin: date | None = None,
    search: str | None = None,
    sort_by: str = "fecha",
    sort_order: str = "DESC",
) -> ORJSONResponse:
    """Listar reportes con filtros y paginación."""
    servicio = ServicioParteDiario(db)
    reportes, total = await servicio.listar(
        usuario.id_empresa,
        estado=estado,
        equipo_id=equipo_id,
        trabajador_id=trabajador_id,
        proyecto_id=proyecto_id,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        limit=limit,
    )
    return enviar_paginado(
        [r.model_dump() for r in reportes],
        pagina=page,
        limite=limit,
        total=total,
    )


# ─── Create ───────────────────────────────────────────────────────────────


@router.post("/")
async def crear_reporte(
    datos: ParteDiarioCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Crear un nuevo reporte diario."""
    servicio = ServicioParteDiario(db)
    reporte = await servicio.crear(usuario.id_empresa, datos, usuario.id_usuario)
    return enviar_creado({"id": reporte.id, "message": "Reporte creado exitosamente"})


# ─── Photos ───────────────────────────────────────────────────────────────


@router.get("/{reporte_id}/photos")
async def listar_fotos(
    reporte_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Listar fotos de un reporte."""
    servicio = ServicioParteDiario(db)
    fotos = await servicio.listar_fotos(usuario.id_empresa, reporte_id)
    return enviar_exito([f.model_dump() for f in fotos])


@router.post("/{reporte_id}/photos")
async def subir_fotos(
    reporte_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Subir fotos a un reporte (stub — file upload no implementado)."""
    return enviar_exito(
        {"message": "Upload endpoint disponible (implementación de storage pendiente)"}
    )


@router.delete("/{reporte_id}/photos/{foto_id}")
async def eliminar_foto(
    reporte_id: int, foto_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Eliminar una foto de un reporte."""
    servicio = ServicioParteDiario(db)
    await servicio.eliminar_foto(usuario.id_empresa, reporte_id, foto_id)
    return enviar_sin_contenido()


# ─── CRUD by ID ───────────────────────────────────────────────────────────


@router.get("/{reporte_id}")
async def obtener_reporte(
    reporte_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener un reporte por ID."""
    servicio = ServicioParteDiario(db)
    reporte = await servicio.obtener_por_id(usuario.id_empresa, reporte_id)
    return enviar_exito(reporte.model_dump())


@router.put("/{reporte_id}")
async def actualizar_reporte(
    reporte_id: int,
    datos: ParteDiarioActualizar,
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Actualizar un reporte existente."""
    servicio = ServicioParteDiario(db)
    reporte = await servicio.actualizar(
        usuario.id_empresa, reporte_id, datos, usuario.id_usuario
    )
    return enviar_exito(reporte.model_dump())


@router.delete("/{reporte_id}")
async def eliminar_reporte(
    reporte_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Eliminar un reporte (hard delete)."""
    servicio = ServicioParteDiario(db)
    await servicio.eliminar(usuario.id_empresa, reporte_id)
    return enviar_sin_contenido()


# ─── Approval workflow ────────────────────────────────────────────────────


@router.post("/{reporte_id}/enviar")
async def enviar_reporte(
    reporte_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Enviar reporte para aprobación (BORRADOR → ENVIADO)."""
    servicio = ServicioParteDiario(db)
    reporte = await servicio.enviar(usuario.id_empresa, reporte_id, usuario.id_usuario)
    return enviar_exito(reporte.model_dump())


@router.post("/{reporte_id}/approve")
async def aprobar_reporte(
    reporte_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Aprobar un reporte."""
    servicio = ServicioParteDiario(db)
    reporte = await servicio.aprobar(usuario.id_empresa, reporte_id, usuario.id_usuario)
    return enviar_exito(reporte.model_dump())


@router.post("/{reporte_id}/reject")
async def rechazar_reporte(
    reporte_id: int,
    datos: RechazarReporte,
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Rechazar un reporte con motivo."""
    servicio = ServicioParteDiario(db)
    reporte = await servicio.rechazar(usuario.id_empresa, reporte_id, datos.reason)
    return enviar_exito(reporte.model_dump())


@router.post("/{reporte_id}/firmar-residente")
async def firmar_residente(
    reporte_id: int,
    datos: FirmarResidente,
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Registrar firma del residente."""
    servicio = ServicioParteDiario(db)
    reporte = await servicio.firmar_residente(
        usuario.id_empresa, reporte_id, datos.firma_residente
    )
    return enviar_exito(reporte.model_dump())


# --- PDF generation ---------------------------------------------------------


@router.get("/{reporte_id}/pdf")
async def generar_pdf_reporte(
    reporte_id: int, usuario: UsuarioActual, db: SesionDb
) -> Response:
    """Generar PDF del parte diario."""
    from app.servicios.pdf import servicio_pdf
    from app.utils.transformar_pdf import transformar_parte_diario

    servicio = ServicioParteDiario(db)
    reporte = await servicio.obtener_por_id(usuario.id_empresa, reporte_id)
    datos_pdf = transformar_parte_diario(reporte.model_dump())
    pdf_bytes = await servicio_pdf.generar_pdf_parte_diario(datos_pdf)
    filename = f"parte-diario-{reporte_id}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
