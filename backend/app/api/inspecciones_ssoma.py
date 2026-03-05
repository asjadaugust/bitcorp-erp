"""Router de SST / inspecciones SSOMA y reportes acto/condicion."""

from fastapi import APIRouter, Query
from fastapi.responses import ORJSONResponse

from app.core.dependencias import SesionDb, UsuarioActual
from app.esquemas.inspeccion_ssoma import (
    InspeccionSsomaActualizar,
    InspeccionSsomaCrear,
    ReporteActoCondicionActualizar,
    ReporteActoCondicionCrear,
    SeguimientoInspeccionCrear,
)
from app.servicios.inspeccion_ssoma import ServicioInspeccionSsoma
from app.utils.respuesta import (
    enviar_creado,
    enviar_exito,
    enviar_paginado,
    enviar_sin_contenido,
)

router = APIRouter()


# ── Inspecciones SSOMA ──────────────────────────────────────────────────


@router.get("/inspecciones")
async def listar_inspecciones(
    usuario: UsuarioActual,
    db: SesionDb,
    tipo_inspeccion: str | None = Query(None),
    nivel_riesgo: str | None = Query(None),
    estado: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
) -> ORJSONResponse:
    """Listar inspecciones SSOMA con filtros y paginación."""
    servicio = ServicioInspeccionSsoma(db)
    datos, total = await servicio.listar_inspecciones(
        pagina=page,
        limite=limit,
        tipo_inspeccion=tipo_inspeccion,
        nivel_riesgo=nivel_riesgo,
        estado=estado,
    )
    return enviar_paginado([d.model_dump() for d in datos], page, limit, total)


@router.post("/inspecciones")
async def crear_inspeccion(
    datos: InspeccionSsomaCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Crear una nueva inspección SSOMA."""
    servicio = ServicioInspeccionSsoma(db)
    creado = await servicio.crear_inspeccion(datos)
    return enviar_creado({"id": creado.id, "message": "Inspección SSOMA creada"})


@router.get("/inspecciones/{inspeccion_id}")
async def obtener_inspeccion(
    inspeccion_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener inspección SSOMA con seguimientos."""
    servicio = ServicioInspeccionSsoma(db)
    datos = await servicio.obtener_inspeccion(inspeccion_id)
    return enviar_exito(datos.model_dump())


@router.put("/inspecciones/{inspeccion_id}")
async def actualizar_inspeccion(
    inspeccion_id: int,
    datos: InspeccionSsomaActualizar,
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Actualizar una inspección SSOMA."""
    servicio = ServicioInspeccionSsoma(db)
    actualizado = await servicio.actualizar_inspeccion(inspeccion_id, datos)
    return enviar_exito(actualizado.model_dump())


@router.delete("/inspecciones/{inspeccion_id}")
async def eliminar_inspeccion(
    inspeccion_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Eliminar una inspección SSOMA (cascade a seguimientos)."""
    servicio = ServicioInspeccionSsoma(db)
    await servicio.eliminar_inspeccion(inspeccion_id)
    return enviar_sin_contenido()


# ── Seguimientos (child of inspection) ──────────────────────────────────


@router.post("/inspecciones/{inspeccion_id}/seguimientos")
async def agregar_seguimiento(
    inspeccion_id: int,
    datos: SeguimientoInspeccionCrear,
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Agregar un seguimiento a una inspección SSOMA."""
    servicio = ServicioInspeccionSsoma(db)
    creado = await servicio.agregar_seguimiento(inspeccion_id, datos)
    return enviar_creado({"id": creado.id, "message": "Seguimiento agregado"})


@router.delete("/inspecciones/{inspeccion_id}/seguimientos/{seg_id}")
async def eliminar_seguimiento(
    inspeccion_id: int, seg_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Eliminar un seguimiento de una inspección."""
    servicio = ServicioInspeccionSsoma(db)
    await servicio.eliminar_seguimiento(seg_id)
    return enviar_sin_contenido()


# ── Reportes acto/condicion ─────────────────────────────────────────────


@router.get("/reportes-acto-condicion")
async def listar_reportes(
    usuario: UsuarioActual,
    db: SesionDb,
    tipo_reporte: str | None = Query(None),
    estado: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
) -> ORJSONResponse:
    """Listar reportes acto/condicion con filtros y paginación."""
    servicio = ServicioInspeccionSsoma(db)
    datos, total = await servicio.listar_reportes(
        pagina=page, limite=limit, tipo_reporte=tipo_reporte, estado=estado
    )
    return enviar_paginado([d.model_dump() for d in datos], page, limit, total)


@router.post("/reportes-acto-condicion")
async def crear_reporte(
    datos: ReporteActoCondicionCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Crear un nuevo reporte acto/condicion."""
    servicio = ServicioInspeccionSsoma(db)
    creado = await servicio.crear_reporte(datos)
    return enviar_creado({"id": creado.id, "message": "Reporte creado"})


@router.get("/reportes-acto-condicion/{reporte_id}")
async def obtener_reporte(
    reporte_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener reporte acto/condicion por ID."""
    servicio = ServicioInspeccionSsoma(db)
    datos = await servicio.obtener_reporte(reporte_id)
    return enviar_exito(datos.model_dump())


@router.put("/reportes-acto-condicion/{reporte_id}")
async def actualizar_reporte(
    reporte_id: int,
    datos: ReporteActoCondicionActualizar,
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Actualizar un reporte acto/condicion."""
    servicio = ServicioInspeccionSsoma(db)
    actualizado = await servicio.actualizar_reporte(reporte_id, datos)
    return enviar_exito(actualizado.model_dump())


@router.delete("/reportes-acto-condicion/{reporte_id}")
async def eliminar_reporte(
    reporte_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Eliminar un reporte acto/condicion."""
    servicio = ServicioInspeccionSsoma(db)
    await servicio.eliminar_reporte(reporte_id)
    return enviar_sin_contenido()


# ── Catalogo actos/condiciones (read-only) ──────────────────────────────


@router.get("/actos-condicion")
async def listar_actos_condicion(
    usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Listar catalogo de actos/condiciones inseguras."""
    servicio = ServicioInspeccionSsoma(db)
    datos = await servicio.listar_actos_condicion()
    return enviar_exito([d.model_dump() for d in datos])
