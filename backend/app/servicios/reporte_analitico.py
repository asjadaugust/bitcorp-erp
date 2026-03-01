"""Servicio para reportes analíticos.

Replica ReportingService del BFF Node.js — complex SQL aggregation queries.
"""

from datetime import date
from typing import Any

from sqlalchemy import func, literal_column, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.esquemas.reporte_analitico import (
    HistorialMantenimientoDto,
    HojaOperadorDto,
    MovimientoInventarioDto,
    UtilizacionEquipoReporteDto,
)
from app.modelos.equipo import Equipo, ParteDiario, ProgramaMantenimiento
from app.modelos.rrhh import Trabajador

logger = obtener_logger(__name__)


class ServicioReporteAnalitico:
    """Servicio para reportes analíticos."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def obtener_utilizacion_equipo(
        self,
        tenant_id: int,
        *,
        fecha_inicio: date | None = None,
        fecha_fin: date | None = None,
        equipo_id: int | None = None,
        grupo: str = "daily",
    ) -> list[UtilizacionEquipoReporteDto]:
        """Reporte de utilización de equipos por periodo."""
        if grupo == "monthly":
            periodo_expr = func.to_char(ParteDiario.fecha, "YYYY-MM")
        else:
            periodo_expr = func.to_char(ParteDiario.fecha, "YYYY-MM-DD")

        consulta = (
            select(
                ParteDiario.equipo_id,
                Equipo.codigo_equipo,
                func.coalesce(func.sum(ParteDiario.horas_trabajadas), 0).label("total_horas"),
                func.count(ParteDiario.id).label("dias"),
                periodo_expr.label("periodo"),
            )
            .join(Equipo, Equipo.id == ParteDiario.equipo_id)
            .where(ParteDiario.tenant_id == tenant_id)
        )

        if fecha_inicio:
            consulta = consulta.where(ParteDiario.fecha >= fecha_inicio)
        if fecha_fin:
            consulta = consulta.where(ParteDiario.fecha <= fecha_fin)
        if equipo_id:
            consulta = consulta.where(ParteDiario.equipo_id == equipo_id)

        consulta = consulta.group_by(
            ParteDiario.equipo_id, Equipo.codigo_equipo, literal_column("periodo")
        ).order_by(literal_column("periodo"), ParteDiario.equipo_id)

        resultado = await self.db.execute(consulta)
        reportes: list[UtilizacionEquipoReporteDto] = []
        for row in resultado.all():
            total_h = float(row[2])
            dias = int(row[3])
            reportes.append(
                UtilizacionEquipoReporteDto(
                    equipo_id=row[0],
                    codigo_equipo=row[1],
                    total_horas=round(total_h, 2),
                    dias_con_reporte=dias,
                    promedio_diario=round(total_h / dias, 2) if dias > 0 else 0.0,
                    periodo=row[4],
                )
            )
        logger.info("reporte_utilizacion", tenant_id=tenant_id, items=len(reportes))
        return reportes

    async def obtener_historial_mantenimiento(
        self,
        tenant_id: int,
        *,
        fecha_inicio: date | None = None,
        fecha_fin: date | None = None,
        equipo_id: int | None = None,
        tipo: str | None = None,
        estado: str | None = None,
        pagina: int = 1,
        limite: int = 50,
    ) -> tuple[list[HistorialMantenimientoDto], int]:
        """Reporte de historial de mantenimiento."""
        consulta = select(ProgramaMantenimiento).where(
            ProgramaMantenimiento.tenant_id == tenant_id
        )

        if fecha_inicio:
            consulta = consulta.where(ProgramaMantenimiento.fecha_programada >= fecha_inicio)
        if fecha_fin:
            consulta = consulta.where(ProgramaMantenimiento.fecha_programada <= fecha_fin)
        if equipo_id:
            consulta = consulta.where(ProgramaMantenimiento.equipo_id == equipo_id)
        if tipo:
            consulta = consulta.where(ProgramaMantenimiento.tipo_mantenimiento == tipo)
        if estado:
            consulta = consulta.where(ProgramaMantenimiento.estado == estado)

        conteo = await self.db.execute(select(func.count()).select_from(consulta.subquery()))
        total: int = conteo.scalar_one()

        consulta = consulta.order_by(ProgramaMantenimiento.fecha_programada.desc())
        consulta = consulta.offset((pagina - 1) * limite).limit(limite)

        resultado = await self.db.execute(consulta)
        items = [
            HistorialMantenimientoDto(
                id=e.id,
                equipo_id=e.equipo_id,
                tipo_mantenimiento=e.tipo_mantenimiento,
                descripcion=e.descripcion,
                fecha_programada=e.fecha_programada.isoformat() if e.fecha_programada else None,
                fecha_realizada=e.fecha_realizada.isoformat() if e.fecha_realizada else None,
                costo_estimado=float(e.costo_estimado) if e.costo_estimado is not None else None,
                costo_real=float(e.costo_real) if e.costo_real is not None else None,
                estado=e.estado,
            )
            for e in resultado.scalars().all()
        ]
        return items, total

    async def obtener_movimientos_inventario(
        self,
        tenant_id: int,
        *,
        fecha_inicio: date | None = None,
        fecha_fin: date | None = None,
        pagina: int = 1,
        limite: int = 50,
    ) -> tuple[list[MovimientoInventarioDto], int]:
        """Reporte de movimientos de inventario (stub — queries logistica schema if available)."""
        # logistica schema might not be fully modeled yet — return empty with stub
        try:
            from sqlalchemy import text

            sql = text("""
                SELECT m.id, m.tipo, m.fecha, m.observaciones
                FROM logistica.movimiento m
                WHERE 1=1
                ORDER BY m.fecha DESC
                LIMIT :limite OFFSET :offset
            """)
            result = await self.db.execute(
                sql, {"limite": limite, "offset": (pagina - 1) * limite}
            )
            items: list[MovimientoInventarioDto] = []
            for row in result.all():
                items.append(
                    MovimientoInventarioDto(
                        id=row[0],
                        tipo=row[1],
                        fecha=row[2].isoformat() if row[2] else "",
                        observaciones=row[3],
                    )
                )

            count_sql = text("SELECT count(*) FROM logistica.movimiento")
            r_count = await self.db.execute(count_sql)
            total_raw: Any = r_count.scalar_one()
            return items, int(total_raw)
        except Exception:
            logger.warning("logistica_no_disponible")
            return [], 0

    async def obtener_hoja_operador(
        self,
        tenant_id: int,
        *,
        fecha_inicio: date | None = None,
        fecha_fin: date | None = None,
        trabajador_id: int | None = None,
        pagina: int = 1,
        limite: int = 50,
    ) -> tuple[list[HojaOperadorDto], int]:
        """Reporte de hoja de tiempo de operadores."""
        consulta = (
            select(
                ParteDiario.trabajador_id,
                Trabajador.nombres,
                ParteDiario.fecha,
                ParteDiario.equipo_id,
                ParteDiario.horas_trabajadas,
                ParteDiario.estado,
            )
            .join(Trabajador, Trabajador.id == ParteDiario.trabajador_id, isouter=True)
            .where(
                ParteDiario.tenant_id == tenant_id,
                ParteDiario.trabajador_id.isnot(None),
            )
        )

        if fecha_inicio:
            consulta = consulta.where(ParteDiario.fecha >= fecha_inicio)
        if fecha_fin:
            consulta = consulta.where(ParteDiario.fecha <= fecha_fin)
        if trabajador_id:
            consulta = consulta.where(ParteDiario.trabajador_id == trabajador_id)

        conteo = await self.db.execute(select(func.count()).select_from(consulta.subquery()))
        total: int = conteo.scalar_one()

        consulta = consulta.order_by(ParteDiario.fecha.desc(), ParteDiario.trabajador_id)
        consulta = consulta.offset((pagina - 1) * limite).limit(limite)

        resultado = await self.db.execute(consulta)
        items = [
            HojaOperadorDto(
                trabajador_id=row[0] or 0,
                nombres=row[1] or "N/A",
                fecha=row[2].isoformat() if row[2] else "",
                equipo_id=row[3] or 0,
                horas_trabajadas=float(row[4]) if row[4] else 0.0,
                estado=row[5] or "BORRADOR",
            )
            for row in resultado.all()
        ]
        return items, total
