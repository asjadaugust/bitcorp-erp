"""Router de checklists de inspección."""

from datetime import date as _date
from typing import Any

from fastapi import APIRouter, Query
from fastapi.responses import ORJSONResponse
from pydantic import BaseModel
from sqlalchemy import text

from app.core.dependencias import SesionDb, UsuarioActual
from app.esquemas.checklist import InspeccionCrear, PlantillaActualizar, PlantillaCrear
from app.servicios.checklist import ServicioChecklist
from app.utils.respuesta import enviar_creado, enviar_exito, enviar_paginado

router = APIRouter()


# ─── Plantillas ─────────────────────────────────────────────────────────


@router.get("/templates")
async def listar_plantillas(
    usuario: UsuarioActual,
    db: SesionDb,
    tipo_equipo: str | None = Query(None),
    activo: bool | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
) -> ORJSONResponse:
    """Listar plantillas de checklists."""
    servicio = ServicioChecklist(db)
    datos, total = await servicio.listar_plantillas(
        tipo_equipo=tipo_equipo, activo=activo, pagina=page, limite=limit
    )
    return enviar_paginado([d.model_dump() for d in datos], page, limit, total)


@router.get("/templates/{plantilla_id}")
async def obtener_plantilla(
    plantilla_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener plantilla con sus items."""
    servicio = ServicioChecklist(db)
    plantilla = await servicio.obtener_plantilla(plantilla_id)
    items = await servicio.obtener_items_plantilla(plantilla_id)
    data = plantilla.model_dump()
    data["items"] = [i.model_dump() for i in items]
    return enviar_exito(data)


@router.post("/templates")
async def crear_plantilla(
    datos: PlantillaCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Crear una nueva plantilla."""
    servicio = ServicioChecklist(db)
    creada = await servicio.crear_plantilla(datos, usuario.id_usuario)
    return enviar_creado({"id": creada.id, "message": "Plantilla creada"})


@router.put("/templates/{plantilla_id}")
async def actualizar_plantilla(
    plantilla_id: int, datos: PlantillaActualizar, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Actualizar una plantilla."""
    servicio = ServicioChecklist(db)
    actualizada = await servicio.actualizar_plantilla(plantilla_id, datos)
    return enviar_exito(actualizada.model_dump())


# ─── Inspecciones ───────────────────────────────────────────────────────


@router.get("/inspections")
async def listar_inspecciones(
    usuario: UsuarioActual,
    db: SesionDb,
    equipo_id: int | None = Query(None),
    estado: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
) -> ORJSONResponse:
    """Listar inspecciones."""
    servicio = ServicioChecklist(db)
    datos, total = await servicio.listar_inspecciones(
        equipo_id=equipo_id, estado=estado, pagina=page, limite=limit
    )
    return enviar_paginado([d.model_dump() for d in datos], page, limit, total)


@router.get("/inspections/stats")
async def estadisticas_inspecciones(
    usuario: UsuarioActual,
    db: SesionDb,
    equipo_id: int | None = Query(None),
    trabajador_id: int | None = Query(None),
    fecha_desde: str | None = Query(None),
    fecha_hasta: str | None = Query(None),
) -> ORJSONResponse:
    """Estadísticas de inspecciones con filtros opcionales."""
    conditions = ["1=1"]
    params: dict[str, Any] = {}
    if equipo_id:
        conditions.append("equipo_id = :eid")
        params["eid"] = equipo_id
    if trabajador_id:
        conditions.append("trabajador_id = :wid")
        params["wid"] = trabajador_id
    if fecha_desde:
        conditions.append("fecha_inspeccion >= :fdesde")
        params["fdesde"] = fecha_desde
    if fecha_hasta:
        conditions.append("fecha_inspeccion <= :fhasta")
        params["fhasta"] = fecha_hasta
    where = " AND ".join(conditions)
    result = await db.execute(
        text(
            f"""
            SELECT
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE estado = 'COMPLETADA') AS completadas,
                COUNT(*) FILTER (WHERE estado = 'EN_PROGRESO') AS pendientes,
                COUNT(*) FILTER (WHERE resultado_general = 'APROBADO') AS aprobadas,
                COUNT(*) FILTER (WHERE resultado_general = 'RECHAZADO') AS rechazadas
            FROM equipo.checklist_inspeccion
            WHERE {where}
            """
        ),
        params,
    )
    row = result.mappings().first()
    return enviar_exito(
        {
            "total": row["total"] if row else 0,
            "completadas": row["completadas"] if row else 0,
            "pendientes": row["pendientes"] if row else 0,
            "aprobadas": row["aprobadas"] if row else 0,
            "rechazadas": row["rechazadas"] if row else 0,
        }
    )


@router.get("/inspections/overdue")
async def inspecciones_vencidas(usuario: UsuarioActual, db: SesionDb) -> ORJSONResponse:
    """Inspecciones vencidas por frecuencia de plantilla."""
    result = await db.execute(
        text(
            """
            SELECT i.id, i.equipo_id, i.plantilla_id, i.estado,
                   i.fecha_inspeccion, p.nombre AS plantilla_nombre,
                   p.frecuencia
            FROM equipo.checklist_inspeccion i
            JOIN equipo.checklist_plantilla p ON p.id = i.plantilla_id
            WHERE i.estado = 'EN_PROGRESO'
              AND i.fecha_inspeccion < CURRENT_DATE
            ORDER BY i.fecha_inspeccion
            """
        ),
    )
    rows = result.mappings().all()
    return enviar_exito(
        [
            {
                "id": r["id"],
                "equipo_id": r["equipo_id"],
                "plantilla_id": r["plantilla_id"],
                "estado": r["estado"],
                "fecha_inspeccion": (
                    r["fecha_inspeccion"].isoformat() if r["fecha_inspeccion"] else None
                ),
                "plantilla_nombre": r["plantilla_nombre"],
                "frecuencia": r["frecuencia"],
            }
            for r in rows
        ]
    )


@router.get("/inspections/{inspeccion_id}")
async def obtener_inspeccion(
    inspeccion_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener inspección por ID."""
    servicio = ServicioChecklist(db)
    datos = await servicio.obtener_inspeccion(inspeccion_id)
    return enviar_exito(datos.model_dump())


@router.post("/inspections")
async def crear_inspeccion(
    datos: InspeccionCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Crear una nueva inspección."""
    servicio = ServicioChecklist(db)
    creada = await servicio.crear_inspeccion(datos)
    return enviar_creado({"id": creada.id, "message": "Inspección creada"})


@router.post("/inspections/{inspeccion_id}/complete")
async def completar_inspeccion(
    inspeccion_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Completar una inspección."""
    servicio = ServicioChecklist(db)
    datos = await servicio.completar_inspeccion(inspeccion_id)
    return enviar_exito(datos.model_dump())


# ─── Seguimiento de Observaciones ──────────────────────────────────────


@router.get("/observations")
async def listar_observaciones(
    usuario: UsuarioActual,
    db: SesionDb,
    fecha_desde: str | None = Query(None),
    fecha_hasta: str | None = Query(None),
    equipo_id: int | None = Query(None),
    accion_requerida: str | None = Query(None),
    es_critico: bool | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
) -> ORJSONResponse:
    """Listar observaciones (ítems no conformes) de inspecciones."""
    conditions = ["cr.conforme = FALSE"]
    params: dict[str, Any] = {"limit": limit, "offset": (page - 1) * limit}

    if fecha_desde:
        conditions.append("ci.fecha_inspeccion >= :fdesde")
        params["fdesde"] = _date.fromisoformat(fecha_desde)
    if fecha_hasta:
        conditions.append("ci.fecha_inspeccion <= :fhasta")
        params["fhasta"] = _date.fromisoformat(fecha_hasta)
    if equipo_id:
        conditions.append("ci.equipo_id = :eid")
        params["eid"] = equipo_id
    if accion_requerida:
        conditions.append("cr.accion_requerida = :accion")
        params["accion"] = accion_requerida
    if es_critico is not None:
        conditions.append("citem.es_critico = :critico")
        params["critico"] = es_critico

    where = " AND ".join(conditions)

    list_result = await db.execute(
        text(
            f"""
            SELECT
                cr.id,
                cr.inspeccion_id,
                ci.codigo AS inspeccion_codigo,
                ci.equipo_id,
                e.codigo_equipo AS equipo_codigo,
                e.marca AS equipo_marca,
                e.modelo AS equipo_modelo,
                ci.fecha_inspeccion,
                citem.descripcion AS item_descripcion,
                citem.categoria,
                citem.es_critico,
                cr.observaciones,
                COALESCE(cr.accion_requerida, 'NINGUNA') AS accion_requerida,
                cr.foto_url,
                ci.estado AS estado_inspeccion,
                ci.resultado_general
            FROM equipo.checklist_resultado cr
            JOIN equipo.checklist_inspeccion ci ON cr.inspeccion_id = ci.id
            JOIN equipo.equipo e ON ci.equipo_id = e.id
            JOIN equipo.checklist_item citem ON cr.item_id = citem.id
            WHERE {where}
            ORDER BY ci.fecha_inspeccion DESC, citem.es_critico DESC, cr.id DESC
            LIMIT :limit OFFSET :offset
            """
        ),
        params,
    )
    rows = list_result.mappings().all()

    count_result = await db.execute(
        text(
            f"""
            SELECT
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE citem.es_critico = TRUE) AS criticas,
                COUNT(*) FILTER (
                    WHERE cr.accion_requerida IN ('REPARAR','MANTENIMIENTO')
                ) AS a_reparar,
                COUNT(*) FILTER (
                    WHERE cr.accion_requerida IN ('REEMPLAZAR','REEMPLAZO')
                ) AS a_reemplazar
            FROM equipo.checklist_resultado cr
            JOIN equipo.checklist_inspeccion ci ON cr.inspeccion_id = ci.id
            JOIN equipo.equipo e ON ci.equipo_id = e.id
            JOIN equipo.checklist_item citem ON cr.item_id = citem.id
            WHERE {where}
            """
        ),
        {k: v for k, v in params.items() if k not in ("limit", "offset")},
    )
    stats_row = count_result.mappings().first()

    total = int(stats_row["total"]) if stats_row else 0
    items = [
        {
            "id": r["id"],
            "inspeccion_id": r["inspeccion_id"],
            "inspeccion_codigo": r["inspeccion_codigo"],
            "equipo_id": r["equipo_id"],
            "equipo_codigo": r["equipo_codigo"],
            "equipo_marca": r["equipo_marca"],
            "equipo_modelo": r["equipo_modelo"],
            "fecha_inspeccion": (
                r["fecha_inspeccion"].isoformat() if r["fecha_inspeccion"] else None
            ),
            "item_descripcion": r["item_descripcion"],
            "categoria": r["categoria"],
            "es_critico": r["es_critico"],
            "observaciones": r["observaciones"],
            "accion_requerida": r["accion_requerida"],
            "foto_url": r["foto_url"],
            "estado_inspeccion": r["estado_inspeccion"],
            "resultado_general": r["resultado_general"],
        }
        for r in rows
    ]

    from app.utils.respuesta import enviar_exito  # noqa: PLC0415

    return enviar_exito(
        {
            "items": items,
            "stats": {
                "total": total,
                "criticas": int(stats_row["criticas"]) if stats_row else 0,
                "a_reparar": int(stats_row["a_reparar"]) if stats_row else 0,
                "a_reemplazar": int(stats_row["a_reemplazar"]) if stats_row else 0,
            },
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "total_pages": max(1, -(-total // limit)),
            },
        }
    )


# ─── Estadísticas ───────────────────────────────────────────────────────


@router.get("/stats")
async def estadisticas_checklists(
    usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Estadísticas generales de checklists."""
    servicio = ServicioChecklist(db)
    stats = await servicio.obtener_estadisticas()
    return enviar_exito(stats)


# ─── Items CRUD ────────────────────────────────────────────────────────


class ItemCrear(BaseModel):
    plantilla_id: int
    descripcion: str
    orden: int = 0
    obligatorio: bool = True
    tipo_respuesta: str = "SI_NO"


class ItemActualizar(BaseModel):
    descripcion: str | None = None
    orden: int | None = None
    obligatorio: bool | None = None
    tipo_respuesta: str | None = None


@router.post("/items")
async def crear_item(
    datos: ItemCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Crear un item de checklist."""
    result = await db.execute(
        text(
            """
            INSERT INTO equipo.checklist_item
                (plantilla_id, descripcion, orden, obligatorio, tipo_respuesta)
            VALUES (:pid, :desc, :orden, :oblig, :tipo)
            RETURNING id
            """
        ),
        {
            "pid": datos.plantilla_id,
            "desc": datos.descripcion,
            "orden": datos.orden,
            "oblig": datos.obligatorio,
            "tipo": datos.tipo_respuesta,
        },
    )
    await db.commit()
    row = result.mappings().first()
    return enviar_creado({"id": row["id"], "message": "Item creado"})


@router.put("/items/{item_id}")
async def actualizar_item(
    item_id: int, datos: ItemActualizar, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Actualizar un item de checklist."""
    sets: list[str] = []
    params: dict[str, Any] = {"iid": item_id}
    if datos.descripcion is not None:
        sets.append("descripcion = :desc")
        params["desc"] = datos.descripcion
    if datos.orden is not None:
        sets.append("orden = :orden")
        params["orden"] = datos.orden
    if datos.obligatorio is not None:
        sets.append("obligatorio = :oblig")
        params["oblig"] = datos.obligatorio
    if datos.tipo_respuesta is not None:
        sets.append("tipo_respuesta = :tipo")
        params["tipo"] = datos.tipo_respuesta
    if not sets:
        return enviar_exito({"id": item_id, "message": "Sin cambios"})
    query = f"UPDATE equipo.checklist_item SET {', '.join(sets)} WHERE id = :iid RETURNING id, descripcion, orden, obligatorio, tipo_respuesta"  # noqa: E501
    result = await db.execute(text(query), params)
    await db.commit()
    row = result.mappings().first()
    if not row:
        from app.core.excepciones import NoEncontradoError

        raise NoEncontradoError("Item no encontrado")
    return enviar_exito(dict(row))


@router.delete("/items/{item_id}", status_code=204)
async def eliminar_item(
    item_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Eliminar un item de checklist."""
    await db.execute(
        text("DELETE FROM equipo.checklist_item WHERE id = :iid"),
        {"iid": item_id},
    )
    await db.commit()
    return ORJSONResponse(status_code=204, content={"success": True, "data": None})


# ─── Inspection results / with-results ─────────────────────────────────


@router.get("/inspections/{inspeccion_id}/with-results")
async def obtener_inspeccion_con_resultados(
    inspeccion_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener inspección con sus resultados."""
    servicio = ServicioChecklist(db)
    inspeccion = await servicio.obtener_inspeccion(inspeccion_id)
    # Get results
    result = await db.execute(
        text(
            """
            SELECT id, inspeccion_id, item_id, conforme, observaciones, foto_url
            FROM equipo.checklist_resultado
            WHERE inspeccion_id = :iid
            ORDER BY item_id
            """
        ),
        {"iid": inspeccion_id},
    )
    rows = result.mappings().all()
    data = inspeccion.model_dump()
    data["resultados"] = [dict(r) for r in rows]
    return enviar_exito(data)


@router.get("/inspections/{inspeccion_id}/results")
async def listar_resultados_inspeccion(
    inspeccion_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Listar resultados de una inspección."""
    result = await db.execute(
        text(
            """
            SELECT id, inspeccion_id, item_id, conforme, observaciones, foto_url
            FROM equipo.checklist_resultado
            WHERE inspeccion_id = :iid
            ORDER BY item_id
            """
        ),
        {"iid": inspeccion_id},
    )
    rows = result.mappings().all()
    return enviar_exito([dict(r) for r in rows])


class ResultadoCrear(BaseModel):
    inspeccion_id: int
    item_id: int
    conforme: bool | None = None
    observaciones: str | None = None
    foto_url: str | None = None


@router.post("/results")
async def crear_resultado(
    datos: ResultadoCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Crear un resultado de inspección."""
    result = await db.execute(
        text(
            """
            INSERT INTO equipo.checklist_resultado
                (inspeccion_id, item_id, conforme, observaciones, foto_url)
            VALUES (:iid, :item, :conf, :obs, :foto)
            RETURNING id
            """
        ),
        {
            "iid": datos.inspeccion_id,
            "item": datos.item_id,
            "conf": datos.conforme,
            "obs": datos.observaciones,
            "foto": datos.foto_url,
        },
    )
    await db.commit()
    row = result.mappings().first()
    return enviar_creado({"id": row["id"], "message": "Resultado registrado"})
