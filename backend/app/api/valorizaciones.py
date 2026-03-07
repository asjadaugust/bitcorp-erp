"""Rutas para valorizaciones de equipo."""

from typing import Any

from fastapi import APIRouter, Query
from fastapi.responses import ORJSONResponse, Response
from pydantic import BaseModel
from sqlalchemy import text

from app.core.dependencias import SesionDb, UsuarioActual
from app.esquemas.valorizacion import (
    AnalisisCombustibleActualizar,
    ConformidadDto,
    DocumentoPagoActualizar,
    DocumentoPagoCrear,
    RechazarValorizacion,
    ValorizacionActualizar,
    ValorizacionCrear,
)
from app.servicios.valorizacion import ServicioValorizacion

router = APIRouter()


def _paginated(data: list[Any], total: int, page: int, limit: int) -> dict[str, Any]:
    return {
        "success": True,
        "data": [d.model_dump() if hasattr(d, "model_dump") else d for d in data],
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": max(1, -(-total // limit)),
        },
    }


def _ok(data: Any) -> dict[str, Any]:
    d = data.model_dump() if hasattr(data, "model_dump") else data
    return {"success": True, "data": d}


def _ok_list(data: list[Any]) -> dict[str, Any]:
    return {
        "success": True,
        "data": [d.model_dump() if hasattr(d, "model_dump") else d for d in data],
    }


# ─── Static routes (before /{id}) ────────────────────────────────────────


@router.get("/analytics", response_class=ORJSONResponse)
async def analiticas_valorizaciones(
    db: SesionDb, usuario: UsuarioActual
) -> dict[str, Any]:
    """Estadísticas de valorizaciones."""
    try:
        result = await db.execute(
            text(
                """
                SELECT
                    COUNT(*) AS total,
                    COUNT(*) FILTER (WHERE estado = 'PENDIENTE') AS pendientes,
                    COUNT(*) FILTER (WHERE estado = 'EN_REVISION') AS en_revision,
                    COUNT(*) FILTER (WHERE estado = 'APROBADO') AS aprobados,
                    COUNT(*) FILTER (WHERE estado = 'PAGADO') AS pagados,
                    COUNT(*) FILTER (WHERE estado = 'RECHAZADO') AS rechazados,
                    COALESCE(SUM(monto_total), 0) AS monto_total,
                    COALESCE(SUM(monto_total) FILTER (WHERE estado = 'PAGADO'), 0) AS monto_pagado
                FROM equipo.valorizacion
                WHERE tenant_id = :tid
                """
            ),
            {"tid": usuario.id_empresa},
        )
        row = result.mappings().first()
        stats = {
            "total": row["total"] if row else 0,
            "pendientes": row["pendientes"] if row else 0,
            "en_revision": row["en_revision"] if row else 0,
            "aprobados": row["aprobados"] if row else 0,
            "pagados": row["pagados"] if row else 0,
            "rechazados": row["rechazados"] if row else 0,
            "monto_total": float(row["monto_total"]) if row else 0,
            "monto_pagado": float(row["monto_pagado"]) if row else 0,
        }
    except Exception:
        stats = {
            "total": 0,
            "pendientes": 0,
            "en_revision": 0,
            "aprobados": 0,
            "pagados": 0,
            "rechazados": 0,
            "monto_total": 0,
            "monto_pagado": 0,
        }
    return _ok(stats)


@router.get("/registry", response_class=ORJSONResponse)
async def registro_valorizaciones(
    db: SesionDb,
    usuario: UsuarioActual,
    estado: str | None = None,
    periodo_desde: str | None = None,
    periodo_hasta: str | None = None,
    proveedor: str | None = None,
    equipo_id: int | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
) -> dict[str, Any]:
    """Registro consolidado de valorizaciones con filtros."""
    svc = ServicioValorizacion(db)
    items, total = await svc.listar(
        usuario.id_empresa,
        estado=estado,
        equipo_id=equipo_id,
        periodo_desde=periodo_desde,
        periodo_hasta=periodo_hasta,
        proveedor=proveedor,
        sort_by="created_at",
        sort_order="DESC",
        page=page,
        limit=limit,
    )
    return _paginated(items, total, page, limit)


# ─── CRUD ────────────────────────────────────────────────────────────────


@router.get("", response_class=ORJSONResponse)
async def listar_valorizaciones(
    db: SesionDb,
    usuario: UsuarioActual,
    estado: str | None = None,
    equipo_id: int | None = None,
    contrato_id: int | None = None,
    proyecto_id: int | None = None,
    periodo: str | None = None,
    search: str | None = None,
    sort_by: str = "created_at",
    sort_order: str = "DESC",
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
) -> dict[str, Any]:
    svc = ServicioValorizacion(db)
    items, total = await svc.listar(
        usuario.id_empresa,
        estado=estado,
        equipo_id=equipo_id,
        contrato_id=contrato_id,
        proyecto_id=proyecto_id,
        periodo=periodo,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        limit=limit,
    )
    return _paginated(items, total, page, limit)


@router.get("/{val_id}", response_class=ORJSONResponse)
async def obtener_valorizacion(
    val_id: int, db: SesionDb, usuario: UsuarioActual
) -> dict[str, Any]:
    svc = ServicioValorizacion(db)
    dto = await svc.obtener_por_id(usuario.id_empresa, val_id)
    return _ok(dto)


@router.post("", response_class=ORJSONResponse, status_code=201)
async def crear_valorizacion(
    datos: ValorizacionCrear, db: SesionDb, usuario: UsuarioActual
) -> dict[str, Any]:
    svc = ServicioValorizacion(db)
    dto = await svc.crear(usuario.id_empresa, datos, usuario.id_usuario)
    return {"success": True, "data": {"id": dto.id, "message": "Valorización creada"}}


@router.put("/{val_id}", response_class=ORJSONResponse)
async def actualizar_valorizacion(
    val_id: int, datos: ValorizacionActualizar, db: SesionDb, usuario: UsuarioActual
) -> dict[str, Any]:
    svc = ServicioValorizacion(db)
    dto = await svc.actualizar(usuario.id_empresa, val_id, datos)
    return _ok(dto)


@router.delete("/{val_id}", status_code=204)
async def eliminar_valorizacion(
    val_id: int, db: SesionDb, usuario: UsuarioActual
) -> None:
    svc = ServicioValorizacion(db)
    await svc.eliminar(usuario.id_empresa, val_id)


# ─── Workflow transitions ────────────────────────────────────────────────


@router.post("/{val_id}/submit-draft", response_class=ORJSONResponse)
async def enviar_borrador(
    val_id: int, db: SesionDb, usuario: UsuarioActual
) -> dict[str, Any]:
    svc = ServicioValorizacion(db)
    dto = await svc.enviar_borrador(usuario.id_empresa, val_id)
    return _ok(dto)


@router.post("/{val_id}/submit-review", response_class=ORJSONResponse)
async def enviar_a_revision(
    val_id: int, db: SesionDb, usuario: UsuarioActual
) -> dict[str, Any]:
    svc = ServicioValorizacion(db)
    dto = await svc.enviar_a_revision(usuario.id_empresa, val_id)
    return _ok(dto)


@router.post("/{val_id}/validate", response_class=ORJSONResponse)
async def validar_valorizacion(
    val_id: int, db: SesionDb, usuario: UsuarioActual
) -> dict[str, Any]:
    svc = ServicioValorizacion(db)
    dto = await svc.validar(usuario.id_empresa, val_id, usuario.id_usuario)
    return _ok(dto)


@router.post("/{val_id}/approve", response_class=ORJSONResponse)
async def aprobar_valorizacion(
    val_id: int, db: SesionDb, usuario: UsuarioActual
) -> dict[str, Any]:
    svc = ServicioValorizacion(db)
    dto = await svc.aprobar(usuario.id_empresa, val_id, usuario.id_usuario)
    return _ok(dto)


@router.post("/{val_id}/reject", response_class=ORJSONResponse)
async def rechazar_valorizacion(
    val_id: int, datos: RechazarValorizacion, db: SesionDb, usuario: UsuarioActual
) -> dict[str, Any]:
    svc = ServicioValorizacion(db)
    dto = await svc.rechazar(usuario.id_empresa, val_id, datos.reason)
    return _ok(dto)


@router.post("/{val_id}/reopen", response_class=ORJSONResponse)
async def reabrir_valorizacion(
    val_id: int, db: SesionDb, usuario: UsuarioActual
) -> dict[str, Any]:
    svc = ServicioValorizacion(db)
    dto = await svc.reabrir(usuario.id_empresa, val_id)
    return _ok(dto)


@router.post("/{val_id}/mark-paid", response_class=ORJSONResponse)
async def marcar_pagado(
    val_id: int, db: SesionDb, usuario: UsuarioActual
) -> dict[str, Any]:
    svc = ServicioValorizacion(db)
    dto = await svc.marcar_pagado(usuario.id_empresa, val_id)
    return _ok(dto)


# ─── Conformidad ─────────────────────────────────────────────────────────


@router.post("/{val_id}/conformidad", response_class=ORJSONResponse)
async def registrar_conformidad(
    val_id: int,
    datos: ConformidadDto,
    db: SesionDb,
    usuario: UsuarioActual,
) -> dict[str, Any]:
    svc = ServicioValorizacion(db)
    dto = await svc.registrar_conformidad(
        usuario.id_empresa,
        val_id,
        fecha=datos.fecha,
        observaciones=datos.observaciones,
    )
    return _ok(dto)


# ─── Recalculate ─────────────────────────────────────────────────────────


@router.post("/{val_id}/recalculate", response_class=ORJSONResponse)
async def recalcular_valorizacion(
    val_id: int, db: SesionDb, usuario: UsuarioActual
) -> dict[str, Any]:
    svc = ServicioValorizacion(db)
    dto = await svc.recalcular(usuario.id_empresa, val_id)
    return _ok(dto)


# ─── Valorizar (calculation engine) ──────────────────────────────────────


@router.post("/{val_id}/valorizar", response_class=ORJSONResponse)
async def valorizar(
    val_id: int, db: SesionDb, usuario: UsuarioActual
) -> dict[str, Any]:
    """Execute the full valuation calculation engine."""
    svc = ServicioValorizacion(db)
    dto = await svc.valorizar(usuario.id_empresa, val_id)
    return _ok(dto)


# ─── Detail data endpoints ───────────────────────────────────────────────


@router.get("/{val_id}/resumen", response_class=ORJSONResponse)
async def resumen_detallado(
    val_id: int, db: SesionDb, usuario: UsuarioActual
) -> dict[str, Any]:
    """Tab 1: Financial summary with provider/equipment/contract info."""
    svc = ServicioValorizacion(db)
    dto = await svc.obtener_resumen(usuario.id_empresa, val_id)
    return _ok(dto)


@router.get("/{val_id}/resumen-acumulado", response_class=ORJSONResponse)
async def resumen_acumulado(
    val_id: int, db: SesionDb, usuario: UsuarioActual
) -> dict[str, Any]:
    """Tab 2: All valuations for same contract with running totals."""
    svc = ServicioValorizacion(db)
    items = await svc.obtener_resumen_acumulado(usuario.id_empresa, val_id)
    return _ok_list(items)


@router.get("/{val_id}/partes-detalle", response_class=ORJSONResponse)
async def partes_detalle(
    val_id: int, db: SesionDb, usuario: UsuarioActual
) -> dict[str, Any]:
    """Tab 3: Daily reports with computed columns."""
    svc = ServicioValorizacion(db)
    items = await svc.obtener_partes_detalle(usuario.id_empresa, val_id)
    return _ok_list(items)


@router.get("/{val_id}/combustible-detalle", response_class=ORJSONResponse)
async def combustible_detalle(
    val_id: int, db: SesionDb, usuario: UsuarioActual
) -> dict[str, Any]:
    """Tab 4: Fuel vouchers with summary."""
    svc = ServicioValorizacion(db)
    dto = await svc.obtener_combustible_detalle(usuario.id_empresa, val_id)
    return _ok(dto)


@router.get("/{val_id}/analisis-combustible", response_class=ORJSONResponse)
async def analisis_combustible(
    val_id: int, db: SesionDb, usuario: UsuarioActual
) -> dict[str, Any]:
    """Tab 7: Fuel excess analysis."""
    svc = ServicioValorizacion(db)
    items = await svc.obtener_analisis_combustible(usuario.id_empresa, val_id)
    return _ok_list(items)


@router.put("/analisis-combustible/{analisis_id}", response_class=ORJSONResponse)
async def actualizar_analisis(
    analisis_id: int,
    datos: AnalisisCombustibleActualizar,
    db: SesionDb,
    usuario: UsuarioActual,
) -> dict[str, Any]:
    """Update ratio_control/precio_unitario, recalculate excess."""
    svc = ServicioValorizacion(db)
    dto = await svc.actualizar_analisis(
        usuario.id_empresa,
        analisis_id,
        ratio_control=datos.ratio_control,
        precio_unitario=datos.precio_unitario,
    )
    return _ok(dto)


# ─── Documentos de pago ──────────────────────────────────────────────────


@router.get("/{val_id}/payment-documents", response_class=ORJSONResponse)
async def listar_documentos_pago(
    val_id: int, db: SesionDb, usuario: UsuarioActual
) -> dict[str, Any]:
    svc = ServicioValorizacion(db)
    docs = await svc.listar_documentos(usuario.id_empresa, val_id)
    return _ok_list(docs)


@router.post(
    "/{val_id}/payment-documents",
    response_class=ORJSONResponse,
    status_code=201,
)
async def crear_documento_pago(
    val_id: int,
    datos: DocumentoPagoCrear,
    db: SesionDb,
    usuario: UsuarioActual,
) -> dict[str, Any]:
    svc = ServicioValorizacion(db)
    doc = await svc.crear_documento(usuario.id_empresa, val_id, datos)
    return {"success": True, "data": {"id": doc.id, "message": "Documento creado"}}


@router.put("/payment-documents/{doc_id}", response_class=ORJSONResponse)
async def actualizar_documento_pago(
    doc_id: int,
    datos: DocumentoPagoActualizar,
    db: SesionDb,
    usuario: UsuarioActual,
) -> dict[str, Any]:
    svc = ServicioValorizacion(db)
    doc = await svc.actualizar_documento(usuario.id_empresa, doc_id, datos)
    return _ok(doc)


@router.get("/{val_id}/payment-documents/check", response_class=ORJSONResponse)
async def verificar_documentos_completos(
    val_id: int, db: SesionDb, usuario: UsuarioActual
) -> dict[str, Any]:
    svc = ServicioValorizacion(db)
    result = await svc.verificar_documentos_completos(usuario.id_empresa, val_id)
    return _ok(result)


# --- PDF generation ---------------------------------------------------------


@router.get("/{val_id}/pdf")
async def generar_pdf_valorizacion(
    val_id: int, db: SesionDb, usuario: UsuarioActual
) -> Response:
    """Generar PDF de valorizacion (7-page report)."""
    from datetime import datetime

    from app.servicios.pdf import servicio_pdf

    svc = ServicioValorizacion(db)
    tenant = usuario.id_empresa

    resumen = await svc.obtener_resumen(tenant, val_id)
    acumulado = await svc.obtener_resumen_acumulado(tenant, val_id)
    partes = await svc.obtener_partes_detalle(tenant, val_id)
    combustible = await svc.obtener_combustible_detalle(tenant, val_id)
    analisis = await svc.obtener_analisis_combustible(tenant, val_id)
    gastos = await svc.obtener_gastos_obra(tenant, val_id)
    adelantos = await svc.obtener_adelantos(tenant, val_id)

    datos = {
        "resumen": resumen.model_dump(),
        "acumulado": [a.model_dump() for a in acumulado],
        "partes": [p.model_dump() for p in partes],
        "combustible": {
            **combustible.model_dump(),
            "vales": [i.model_dump() for i in combustible.items],
        },
        "analisis": [a.model_dump() for a in analisis],
        "gastos": [g.model_dump() for g in gastos],
        "adelantos": [a.model_dump() for a in adelantos],
        "fecha_generacion": datetime.now(),
    }
    pdf_bytes = await servicio_pdf.generar_pdf_valorizacion(datos)

    filename = f"valorizacion-{val_id}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ─── Summary ────────────────────────────────────────────────────────────


@router.get("/{val_id}/summary", response_class=ORJSONResponse)
async def resumen_valorizacion(
    val_id: int, db: SesionDb, usuario: UsuarioActual
) -> dict[str, Any]:
    """Resumen de valorizacion (derivado del detalle)."""
    svc = ServicioValorizacion(db)
    dto = await svc.obtener_por_id(usuario.id_empresa, val_id)
    d = dto.model_dump() if hasattr(dto, "model_dump") else dto
    summary = {
        "id": d.get("id"),
        "numero_valorizacion": d.get("numero_valorizacion"),
        "estado": d.get("estado"),
        "fecha_inicio": d.get("fecha_inicio"),
        "fecha_fin": d.get("fecha_fin"),
        "monto_total": d.get("monto_total"),
        "equipo_id": d.get("equipo_id"),
        "contrato_id": d.get("contrato_id"),
    }
    return _ok(summary)


# ─── Discount events ────────────────────────────────────────────────────


class EventoDescuentoCrear(BaseModel):
    tipo_evento: str
    subtipo: str | None = None
    fecha: str
    horas: float | None = None
    descripcion: str | None = None


@router.get("/{val_id}/discount-events", response_class=ORJSONResponse)
async def listar_eventos_descuento(
    val_id: int, db: SesionDb, usuario: UsuarioActual
) -> dict[str, Any]:
    """Listar eventos de descuento de una valorización."""
    try:
        result = await db.execute(
            text(
                """
                SELECT id, valorizacion_id, tipo_evento, subtipo, fecha,
                       horas, descripcion, monto_descuento, created_at
                FROM equipo.evento_descuento
                WHERE valorizacion_id = :vid AND tenant_id = :tid
                ORDER BY fecha
                """
            ),
            {"vid": val_id, "tid": usuario.id_empresa},
        )
        rows = result.mappings().all()
        events = [
            {
                "id": r["id"],
                "valorizacion_id": r["valorizacion_id"],
                "tipo_evento": r["tipo_evento"],
                "subtipo": r["subtipo"],
                "fecha": r["fecha"].isoformat() if r["fecha"] else None,
                "horas": float(r["horas"]) if r["horas"] else None,
                "descripcion": r["descripcion"],
                "monto_descuento": (
                    float(r["monto_descuento"]) if r["monto_descuento"] else 0
                ),
                "created_at": r["created_at"].isoformat() if r["created_at"] else None,
            }
            for r in rows
        ]
    except Exception:
        await db.rollback()
        events = []
    return _ok_list(events)


@router.post(
    "/{val_id}/discount-events", response_class=ORJSONResponse, status_code=201
)
async def crear_evento_descuento(
    val_id: int,
    datos: EventoDescuentoCrear,
    db: SesionDb,
    usuario: UsuarioActual,
) -> dict[str, Any]:
    """Crear un evento de descuento."""
    result = await db.execute(
        text(
            """
            INSERT INTO equipo.evento_descuento
                (valorizacion_id, tipo_evento, subtipo, fecha, horas, descripcion, tenant_id)
            VALUES (:vid, :tipo, :sub, :fecha, :horas, :desc, :tid)
            RETURNING id
            """
        ),
        {
            "vid": val_id,
            "tipo": datos.tipo_evento,
            "sub": datos.subtipo,
            "fecha": datos.fecha,
            "horas": datos.horas,
            "desc": datos.descripcion,
            "tid": usuario.id_empresa,
        },
    )
    await db.commit()
    row = result.mappings().first()
    return {"success": True, "data": {"id": row["id"], "message": "Evento creado"}}


@router.delete("/discount-events/{event_id}", status_code=204)
async def eliminar_evento_descuento(
    event_id: int, db: SesionDb, usuario: UsuarioActual
) -> None:
    """Eliminar un evento de descuento."""
    await db.execute(
        text(
            "DELETE FROM equipo.evento_descuento WHERE id = :eid AND tenant_id = :tid"
        ),
        {"eid": event_id, "tid": usuario.id_empresa},
    )
    await db.commit()


# ─── Deducciones manuales ───────────────────────────────────────────────


class DeduccionCrear(BaseModel):
    concepto: str
    monto: float
    observaciones: str | None = None


class DeduccionActualizar(BaseModel):
    concepto: str | None = None
    monto: float | None = None
    observaciones: str | None = None


@router.get("/{val_id}/deducciones", response_class=ORJSONResponse)
async def listar_deducciones(
    val_id: int, db: SesionDb, usuario: UsuarioActual
) -> dict[str, Any]:
    """Listar deducciones de una valorización."""
    try:
        result = await db.execute(
            text(
                """
                SELECT id, valorizacion_id, concepto, monto, observaciones, created_at
                FROM equipo.deduccion_valorizacion
                WHERE valorizacion_id = :vid AND tenant_id = :tid
                ORDER BY created_at
                """
            ),
            {"vid": val_id, "tid": usuario.id_empresa},
        )
        rows = result.mappings().all()
        deducciones = [
            {
                "id": r["id"],
                "valorizacion_id": r["valorizacion_id"],
                "concepto": r["concepto"],
                "monto": float(r["monto"]) if r["monto"] else 0,
                "observaciones": r["observaciones"],
                "created_at": r["created_at"].isoformat() if r["created_at"] else None,
            }
            for r in rows
        ]
    except Exception:
        await db.rollback()
        deducciones = []
    return _ok_list(deducciones)


@router.post("/{val_id}/deducciones", response_class=ORJSONResponse, status_code=201)
async def crear_deduccion(
    val_id: int,
    datos: DeduccionCrear,
    db: SesionDb,
    usuario: UsuarioActual,
) -> dict[str, Any]:
    """Crear una deducción manual."""
    result = await db.execute(
        text(
            """
            INSERT INTO equipo.deduccion_valorizacion
                (valorizacion_id, concepto, monto, observaciones, tenant_id)
            VALUES (:vid, :concepto, :monto, :obs, :tid)
            RETURNING id
            """
        ),
        {
            "vid": val_id,
            "concepto": datos.concepto,
            "monto": datos.monto,
            "obs": datos.observaciones,
            "tid": usuario.id_empresa,
        },
    )
    await db.commit()
    row = result.mappings().first()
    return {"success": True, "data": {"id": row["id"], "message": "Deducción creada"}}


@router.put("/deducciones/{deduccion_id}", response_class=ORJSONResponse)
async def actualizar_deduccion(
    deduccion_id: int,
    datos: DeduccionActualizar,
    db: SesionDb,
    usuario: UsuarioActual,
) -> dict[str, Any]:
    """Actualizar una deducción manual."""
    sets: list[str] = []
    params: dict[str, Any] = {"did": deduccion_id, "tid": usuario.id_empresa}
    if datos.concepto is not None:
        sets.append("concepto = :concepto")
        params["concepto"] = datos.concepto
    if datos.monto is not None:
        sets.append("monto = :monto")
        params["monto"] = datos.monto
    if datos.observaciones is not None:
        sets.append("observaciones = :obs")
        params["obs"] = datos.observaciones
    if not sets:
        return _ok({"id": deduccion_id, "message": "Sin cambios"})
    query = f"UPDATE equipo.deduccion_valorizacion SET {', '.join(sets)} WHERE id = :did AND tenant_id = :tid RETURNING id, concepto, monto, observaciones"  # noqa: E501
    result = await db.execute(text(query), params)
    await db.commit()
    row = result.mappings().first()
    if not row:
        from app.core.excepciones import NoEncontradoError

        raise NoEncontradoError("Deducción no encontrada")
    return _ok(dict(row))


@router.delete("/deducciones/{deduccion_id}", status_code=204)
async def eliminar_deduccion(
    deduccion_id: int, db: SesionDb, usuario: UsuarioActual
) -> None:
    """Eliminar una deducción manual."""
    await db.execute(
        text(
            "DELETE FROM equipo.deduccion_valorizacion WHERE id = :did AND tenant_id = :tid"
        ),
        {"did": deduccion_id, "tid": usuario.id_empresa},
    )
    await db.commit()
