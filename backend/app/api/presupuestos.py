"""Router de Presupuestos y Partidas."""

from fastapi import APIRouter, Query
from fastapi.responses import ORJSONResponse

from app.core.dependencias import SesionDb, UsuarioActual
from app.esquemas.presupuesto import (
    PartidaActualizar,
    PartidaCrear,
    PresupuestoActualizar,
    PresupuestoCrear,
)
from app.servicios.presupuesto_svc import ServicioPresupuesto
from app.utils.respuesta import (
    enviar_creado,
    enviar_exito,
    enviar_paginado,
    enviar_sin_contenido,
)

router = APIRouter()


# ── Presupuesto CRUD ─────────────────────────────────────────────────────────

@router.get("/")
async def listar_presupuestos(
    usuario: UsuarioActual,
    db: SesionDb,
    proyecto_id: int | None = Query(None),
    search: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
) -> ORJSONResponse:
    """Listar presupuestos con filtros y paginación."""
    servicio = ServicioPresupuesto(db)
    datos, total = await servicio.listar(
        proyecto_id=proyecto_id, busqueda=search, pagina=page, limite=limit
    )
    return enviar_paginado([d.model_dump() for d in datos], page, limit, total)


@router.get("/{presupuesto_id}")
async def obtener_presupuesto(
    presupuesto_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener presupuesto con todas sus partidas."""
    servicio = ServicioPresupuesto(db)
    datos = await servicio.obtener_por_id(presupuesto_id)
    return enviar_exito(datos.model_dump())


@router.post("/")
async def crear_presupuesto(
    datos: PresupuestoCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Crear un nuevo presupuesto."""
    servicio = ServicioPresupuesto(db)
    creado = await servicio.crear(datos)
    return enviar_creado({"id": creado.id, "message": "Presupuesto creado"})


@router.put("/{presupuesto_id}")
async def actualizar_presupuesto(
    presupuesto_id: int,
    datos: PresupuestoActualizar,
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Actualizar cabecera de presupuesto."""
    servicio = ServicioPresupuesto(db)
    actualizado = await servicio.actualizar(presupuesto_id, datos)
    return enviar_exito(actualizado.model_dump())


@router.delete("/{presupuesto_id}")
async def eliminar_presupuesto(
    presupuesto_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Eliminar (soft delete) un presupuesto."""
    servicio = ServicioPresupuesto(db)
    await servicio.eliminar(presupuesto_id)
    return enviar_sin_contenido()


# ── Partida management ───────────────────────────────────────────────────────

@router.post("/{presupuesto_id}/partidas")
async def agregar_partida(
    presupuesto_id: int,
    datos: PartidaCrear,
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Agregar una partida al presupuesto."""
    servicio = ServicioPresupuesto(db)
    resultado = await servicio.agregar_partida(presupuesto_id, datos)
    return enviar_exito(resultado.model_dump())


@router.put("/{presupuesto_id}/partidas/{partida_id}")
async def actualizar_partida(
    presupuesto_id: int,
    partida_id: int,
    datos: PartidaActualizar,
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Actualizar una partida del presupuesto."""
    servicio = ServicioPresupuesto(db)
    resultado = await servicio.actualizar_partida(presupuesto_id, partida_id, datos)
    return enviar_exito(resultado.model_dump())


@router.delete("/{presupuesto_id}/partidas/{partida_id}")
async def eliminar_partida(
    presupuesto_id: int,
    partida_id: int,
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Eliminar una partida del presupuesto."""
    servicio = ServicioPresupuesto(db)
    resultado = await servicio.eliminar_partida(presupuesto_id, partida_id)
    return enviar_exito(resultado.model_dump())


# ── Special operations ───────────────────────────────────────────────────────

@router.post("/{presupuesto_id}/recalcular")
async def recalcular_presupuesto(
    presupuesto_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Recalcular todas las partidas desde precios APU actuales."""
    servicio = ServicioPresupuesto(db)
    resultado = await servicio.recalcular(presupuesto_id)
    return enviar_exito(resultado.model_dump())


@router.get("/{presupuesto_id}/resumen")
async def resumen_presupuesto(
    presupuesto_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Resumen por fase con subtotales."""
    servicio = ServicioPresupuesto(db)
    resultado = await servicio.resumen(presupuesto_id)
    return enviar_exito(resultado.model_dump())
