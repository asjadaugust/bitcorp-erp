"""Router de dashboard.
"""

from datetime import date, timedelta

from fastapi import APIRouter
from fastapi.responses import ORJSONResponse
from sqlalchemy import text

from app.core.dependencias import SesionDb, UsuarioActual
from app.servicios.dashboard import ServicioDashboard
from app.utils.respuesta import enviar_exito

router = APIRouter()


@router.get("/stats")
async def obtener_estadisticas(usuario: UsuarioActual, db: SesionDb) -> ORJSONResponse:
    """Obtener estadísticas principales del dashboard."""
    servicio = ServicioDashboard(db)
    datos = await servicio.obtener_estadisticas(usuario.id_empresa)
    return enviar_exito(datos.model_dump())


@router.get("/document-alerts")
async def obtener_alertas_documentos(
    usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener alertas de documentos por vencer."""
    servicio = ServicioDashboard(db)
    datos = await servicio.obtener_alertas_documentos(usuario.id_empresa)
    return enviar_exito([d.model_dump() for d in datos])


@router.get("/modules")
async def obtener_modulos(usuario: UsuarioActual, db: SesionDb) -> ORJSONResponse:
    """Obtener módulos accesibles para el usuario."""
    servicio = ServicioDashboard(db)
    modulos = servicio.obtener_modulos_usuario(usuario.rol)
    return enviar_exito([m.model_dump() for m in modulos])


@router.get("/operator/summary")
async def operator_summary(usuario: UsuarioActual, db: SesionDb) -> ORJSONResponse:
    """Resumen de operador para la app móvil.

    Retorna:
    - equipmentCode / equipmentDescription  → equipo asignado actualmente
    - equipmentId                            → id del equipo
    - dailyReportStatus                      → estado del parte diario de hoy
    - pendingChecklistCount                  → checklists pendientes de hoy
    - pendingApprovalCount                   → partes pendientes de aprobación
    """
    hoy = date.today()
    id_usuario = usuario.id_usuario
    id_empresa = usuario.id_empresa or 1  # fallback for dev

    # ── 1. Equipo asignado al operador ──────────────────────────────────────
    # Link usuario → trabajador via DNI, then find most recent parte_diario
    fila_equipo = (
        await db.execute(
            text("""
                SELECT e.id AS equipo_id, e.codigo_equipo, e.marca, e.modelo
                FROM sistema.usuario u
                JOIN rrhh.trabajador t ON t.dni = u.dni
                JOIN equipo.parte_diario pd ON pd.trabajador_id = t.id
                JOIN equipo.equipo e ON e.id = pd.equipo_id
                WHERE u.id = :uid
                  AND e.is_active = true
                  AND e.tenant_id = :tid
                ORDER BY pd.fecha DESC
                LIMIT 1
            """),
            {"uid": id_usuario, "tid": id_empresa},
        )
    ).mappings().fetchone()

    def _build_desc(row: dict, marca_key: str = "marca", modelo_key: str = "modelo") -> str:
        marca = (row[marca_key] or "").strip()
        modelo = (row[modelo_key] or "").strip()
        desc = f"{marca} {modelo}".strip()
        return desc if desc else "Sin asignar"

    if fila_equipo:
        equipo_id = str(fila_equipo["equipo_id"])
        codigo_equipo = fila_equipo["codigo_equipo"]
        descripcion_equipo = _build_desc(fila_equipo)
    else:
        # Fallback: any active equipment in the tenant
        fila_any = (
            await db.execute(
                text("""
                    SELECT id, codigo_equipo, marca, modelo
                    FROM equipo.equipo
                    WHERE tenant_id = :tid AND is_active = true
                    ORDER BY created_at DESC LIMIT 1
                """),
                {"tid": id_empresa},
            )
        ).mappings().fetchone()
        if fila_any:
            equipo_id = str(fila_any["id"])
            codigo_equipo = fila_any["codigo_equipo"]
            descripcion_equipo = _build_desc(fila_any)
        else:
            equipo_id = ""
            codigo_equipo = "N/A"
            descripcion_equipo = "Sin equipo asignado"

    # ── 2. Parte diario de hoy ──────────────────────────────────────────────
    fila_parte = (
        await db.execute(
            text("""
                SELECT pd.estado
                FROM equipo.parte_diario pd
                WHERE pd.fecha = :hoy
                  AND pd.tenant_id = :tid
                ORDER BY pd.created_at DESC LIMIT 1
            """),
            {"hoy": hoy, "tid": id_empresa},
        )
    ).mappings().fetchone()

    daily_report_status = fila_parte["estado"] if fila_parte else "NOT_SUBMITTED"

    # ── 3. Checklists pendientes ────────────────────────────────────────────
    fila_cl = (
        await db.execute(
            text("""
                SELECT COUNT(*) AS cnt
                FROM equipo.checklist_inspeccion ci
                JOIN equipo.equipo e ON e.id = ci.equipo_id
                WHERE ci.estado = 'EN_PROGRESO'
                  AND e.tenant_id = :tid
            """),
            {"tid": id_empresa},
        )
    ).mappings().fetchone()
    pending_checklist_count: int = fila_cl["cnt"] if fila_cl else 0

    # ── 4. Aprobaciones pendientes ──────────────────────────────────────────
    fila_ap = (
        await db.execute(
            text("""
                SELECT COUNT(*) AS cnt
                FROM equipo.parte_diario
                WHERE estado = 'PENDIENTE_APROBACION'
                  AND tenant_id = :tid
            """),
            {"tid": id_empresa},
        )
    ).mappings().fetchone()
    pending_approval_count: int = fila_ap["cnt"] if fila_ap else 0

    # ── 5. Stats: partes diarios del operador ──────────────────────────────
    hoy_inicio = hoy
    semana_inicio = hoy - timedelta(days=hoy.weekday())  # Monday of current week
    mes_inicio = hoy.replace(day=1)

    fila_stats = (
        await db.execute(
            text("""
                SELECT
                    COUNT(*) FILTER (WHERE pd.fecha = :hoy) AS partes_hoy,
                    COUNT(*) FILTER (WHERE pd.fecha >= :semana) AS partes_semana,
                    COUNT(*) FILTER (WHERE pd.fecha >= :mes) AS partes_mes,
                    COALESCE(SUM(pd.horas_trabajadas) FILTER (WHERE pd.fecha >= :mes), 0) AS horas_mes
                FROM equipo.parte_diario pd
                JOIN rrhh.trabajador t ON t.id = pd.trabajador_id
                JOIN sistema.usuario u ON u.dni = t.dni
                WHERE u.id = :uid
                  AND pd.tenant_id = :tid
            """),
            {"uid": id_usuario, "tid": id_empresa, "hoy": hoy_inicio,
             "semana": semana_inicio, "mes": mes_inicio},
        )
    ).mappings().fetchone()

    stats = {
        "partes_hoy": int(fila_stats["partes_hoy"]) if fila_stats else 0,
        "partes_semana": int(fila_stats["partes_semana"]) if fila_stats else 0,
        "partes_mes": int(fila_stats["partes_mes"]) if fila_stats else 0,
        "horas_mes": float(fila_stats["horas_mes"]) if fila_stats else 0.0,
    }

    # ── 6. Recent partes (last 5) ───────────────────────────────────────────
    filas_recent = (
        await db.execute(
            text("""
                SELECT pd.id, pd.fecha, pd.estado, pd.codigo, pd.horas_trabajadas
                FROM equipo.parte_diario pd
                JOIN rrhh.trabajador t ON t.id = pd.trabajador_id
                JOIN sistema.usuario u ON u.dni = t.dni
                WHERE u.id = :uid
                  AND pd.tenant_id = :tid
                ORDER BY pd.fecha DESC, pd.created_at DESC
                LIMIT 5
            """),
            {"uid": id_usuario, "tid": id_empresa},
        )
    ).mappings().fetchall()

    recent_partes = [
        {
            "id": row["id"],
            "fecha": str(row["fecha"]),
            "estado": row["estado"],
            "codigo": row["codigo"],
            "horas_trabajadas": float(row["horas_trabajadas"]) if row["horas_trabajadas"] is not None else None,
        }
        for row in filas_recent
    ]

    return enviar_exito({
        "equipmentCode": codigo_equipo,
        "equipmentDescription": descripcion_equipo,
        "equipmentId": equipo_id,
        "dailyReportStatus": daily_report_status,
        "pendingChecklistCount": pending_checklist_count,
        "pendingApprovalCount": pending_approval_count,
        "stats": stats,
        "recent_partes": recent_partes,
    })
