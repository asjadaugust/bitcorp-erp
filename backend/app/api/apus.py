"""Router de APU (Analisis de Precios Unitarios)."""

from fastapi import APIRouter, Query
from fastapi.responses import ORJSONResponse

from app.core.dependencias import SesionDb, UsuarioActual
from app.esquemas.apu import ApuActualizar, ApuCrear, ApuInsumoActualizar, ApuInsumoCrear
from app.servicios.apu import ServicioApu
from app.utils.respuesta import (
    enviar_creado,
    enviar_exito,
    enviar_paginado,
    enviar_sin_contenido,
)

router = APIRouter()


# ── APU CRUD ──────────────────────────────────────────────────────────────────

@router.get("/")
async def listar_apus(
    usuario: UsuarioActual,
    db: SesionDb,
    search: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
) -> ORJSONResponse:
    """Listar APUs con paginación."""
    servicio = ServicioApu(db)
    datos, total = await servicio.listar(
        busqueda=search, pagina=page, limite=limit
    )
    return enviar_paginado([d.model_dump() for d in datos], page, limit, total)


@router.get("/dropdown")
async def listar_dropdown(
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Listar APUs para dropdown (sin paginación)."""
    servicio = ServicioApu(db)
    datos = await servicio.listar_dropdown()
    return enviar_exito([d.model_dump() for d in datos])


@router.get("/{apu_id}")
async def obtener_apu(
    apu_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener APU por ID con líneas agrupadas y costos calculados."""
    servicio = ServicioApu(db)
    datos = await servicio.obtener_por_id(apu_id)
    return enviar_exito(datos.model_dump())


@router.post("/")
async def crear_apu(
    datos: ApuCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Crear un nuevo APU."""
    servicio = ServicioApu(db)
    creado = await servicio.crear(datos)
    return enviar_creado({"id": creado.id, "message": "APU creado"})


@router.put("/{apu_id}")
async def actualizar_apu(
    apu_id: int, datos: ApuActualizar, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Actualizar cabecera de APU."""
    servicio = ServicioApu(db)
    actualizado = await servicio.actualizar(apu_id, datos)
    return enviar_exito(actualizado.model_dump())


@router.delete("/{apu_id}")
async def eliminar_apu(
    apu_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Eliminar (soft delete) un APU."""
    servicio = ServicioApu(db)
    await servicio.eliminar(apu_id)
    return enviar_sin_contenido()


# ── APU Insumo Lines ─────────────────────────────────────────────────────────

@router.post("/{apu_id}/insumos")
async def agregar_insumo(
    apu_id: int, datos: ApuInsumoCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Agregar un insumo o sub-APU a un APU."""
    servicio = ServicioApu(db)
    resultado = await servicio.agregar_insumo(apu_id, datos)
    return enviar_exito(resultado.model_dump())


@router.put("/{apu_id}/insumos/{linea_id}")
async def actualizar_insumo(
    apu_id: int,
    linea_id: int,
    datos: ApuInsumoActualizar,
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Actualizar una línea de insumo en un APU."""
    servicio = ServicioApu(db)
    resultado = await servicio.actualizar_insumo(apu_id, linea_id, datos)
    return enviar_exito(resultado.model_dump())


@router.delete("/{apu_id}/insumos/{linea_id}")
async def eliminar_insumo(
    apu_id: int, linea_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Eliminar una línea de insumo de un APU."""
    servicio = ServicioApu(db)
    resultado = await servicio.eliminar_insumo(apu_id, linea_id)
    return enviar_exito(resultado.model_dump())


# ── Special Operations ───────────────────────────────────────────────────────

@router.post("/{apu_id}/duplicar")
async def duplicar_apu(
    apu_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Duplicar un APU con todas sus líneas."""
    servicio = ServicioApu(db)
    duplicado = await servicio.duplicar(apu_id)
    return enviar_creado({"id": duplicado.id, "message": "APU duplicado"})


@router.get("/{apu_id}/calcular")
async def calcular_apu(
    apu_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Calcular el desglose completo del precio unitario."""
    servicio = ServicioApu(db)
    calculo = await servicio.calcular(apu_id)
    return enviar_exito(calculo.model_dump())
