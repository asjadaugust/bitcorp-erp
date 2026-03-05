"""Servicio para analítica de equipos.
"""

from datetime import date
from typing import Any

from sqlalchemy import and_, func, literal_column, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.esquemas.analitica import (
    CombustibleEquipoDto,
    FlotaEquipoResumenDto,
    MetricaMantenimientoDto,
    TendenciaCombustibleDto,
    TendenciaUtilizacionDto,
    UtilizacionEquipoDto,
    UtilizacionFlotaDto,
)
from app.modelos.equipo import Equipo, ParteDiario, ProgramaMantenimiento, ValeCombustible

logger = obtener_logger(__name__)


class ServicioAnalitica:
    """Servicio para métricas analíticas de equipos."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def obtener_utilizacion_flota(
        self, tenant_id: int, fecha_inicio: date, fecha_fin: date
    ) -> UtilizacionFlotaDto:
        """Obtener utilización de toda la flota en el rango de fechas."""
        days = max(1, (fecha_fin - fecha_inicio).days)

        # Total equipos activos
        r_eq = await self.db.execute(
            select(func.count(Equipo.id)).where(
                Equipo.tenant_id == tenant_id, Equipo.is_active.is_(True)
            )
        )
        total_equipos: int = r_eq.scalar_one()

        # Per-equipment ranking via outerjoin (ensures equipment with 0 hours appear)
        horas_sum = func.coalesce(func.sum(ParteDiario.horas_trabajadas), 0)
        ranking_resultado = await self.db.execute(
            select(Equipo.codigo_equipo, horas_sum.label("horas"))
            .outerjoin(
                ParteDiario,
                and_(
                    ParteDiario.equipo_id == Equipo.id,
                    ParteDiario.fecha >= fecha_inicio,
                    ParteDiario.fecha <= fecha_fin,
                    ParteDiario.tenant_id == tenant_id,
                ),
            )
            .where(Equipo.tenant_id == tenant_id, Equipo.is_active.is_(True))
            .group_by(Equipo.id, Equipo.codigo_equipo)
            .order_by(horas_sum.desc())
        )
        ranking_rows = ranking_resultado.all()

        total_horas = sum(float(r[1]) for r in ranking_rows)
        equipos_activos = sum(1 for r in ranking_rows if float(r[1]) > 0)
        horas_disponibles = total_equipos * days * 8
        tasa_promedio = (
            round(total_horas / horas_disponibles * 100, 2) if horas_disponibles > 0 else 0.0
        )

        # Fleet fuel cost total
        r_costo = await self.db.execute(
            select(func.coalesce(func.sum(ValeCombustible.monto_total), 0))
            .select_from(ValeCombustible)
            .join(Equipo, Equipo.id == ValeCombustible.equipo_id)
            .where(
                Equipo.tenant_id == tenant_id,
                ValeCombustible.fecha >= fecha_inicio,
                ValeCombustible.fecha <= fecha_fin,
                ValeCombustible.estado != "ANULADO",
            )
        )
        costo_total = float(r_costo.scalar_one())

        # Build ranked lists
        horas_max = days * 8
        equipos_data = [
            {
                "codigo_equipo": r[0],
                "tasa_utilizacion": (
                    round(float(r[1]) / horas_max * 100, 2) if horas_max > 0 else 0.0
                ),
            }
            for r in ranking_rows
        ]
        mejores_equipos = [
            FlotaEquipoResumenDto(**e) for e in equipos_data[:5]
        ]
        equipos_sub_utilizados = [
            FlotaEquipoResumenDto(**e)
            for e in sorted(
                [e for e in equipos_data if e["tasa_utilizacion"] < 50],
                key=lambda x: x["tasa_utilizacion"],
            )
        ]

        return UtilizacionFlotaDto(
            total_equipos=total_equipos,
            equipos_activos=equipos_activos,
            tasa_utilizacion_promedio=tasa_promedio,
            costo_total=round(costo_total, 2),
            mejores_equipos=mejores_equipos,
            equipos_sub_utilizados=equipos_sub_utilizados,
        )

    async def obtener_utilizacion_equipo(
        self, tenant_id: int, equipo_id: int, fecha_inicio: date, fecha_fin: date
    ) -> UtilizacionEquipoDto:
        """Obtener utilización de un equipo en el rango de fechas."""
        days = max(1, (fecha_fin - fecha_inicio).days + 1)
        horas_totales = days * 8.0

        # Get codigo_equipo
        r_eq = await self.db.execute(
            select(Equipo.codigo_equipo).where(Equipo.id == equipo_id)
        )
        codigo_equipo: str = r_eq.scalar_one_or_none() or ""

        # Hours worked in period
        resultado = await self.db.execute(
            select(func.coalesce(func.sum(ParteDiario.horas_trabajadas), 0)).where(
                ParteDiario.equipo_id == equipo_id,
                ParteDiario.tenant_id == tenant_id,
                ParteDiario.fecha >= fecha_inicio,
                ParteDiario.fecha <= fecha_fin,
            )
        )
        horas_trabajadas = float(resultado.scalar_one())
        horas_inactivas = max(0.0, horas_totales - horas_trabajadas)
        tasa_utilizacion = round(min(100.0, horas_trabajadas / horas_totales * 100), 2)

        # Fuel cost in period
        r_costo = await self.db.execute(
            select(func.coalesce(func.sum(ValeCombustible.monto_total), 0))
            .select_from(ValeCombustible)
            .join(Equipo, Equipo.id == ValeCombustible.equipo_id)
            .where(
                ValeCombustible.equipo_id == equipo_id,
                Equipo.tenant_id == tenant_id,
                ValeCombustible.fecha >= fecha_inicio,
                ValeCombustible.fecha <= fecha_fin,
                ValeCombustible.estado != "ANULADO",
            )
        )
        costo_total = float(r_costo.scalar_one())
        costo_por_hora = (
            round(costo_total / horas_trabajadas, 2) if horas_trabajadas > 0 else 0.0
        )

        return UtilizacionEquipoDto(
            equipo_id=equipo_id,
            codigo_equipo=codigo_equipo,
            horas_totales=round(horas_totales, 2),
            horas_trabajadas=round(horas_trabajadas, 2),
            horas_inactivas=round(horas_inactivas, 2),
            tasa_utilizacion=tasa_utilizacion,
            costo_por_hora=costo_por_hora,
            costo_total=round(costo_total, 2),
            periodo_inicio=str(fecha_inicio),
            periodo_fin=str(fecha_fin),
        )

    async def obtener_tendencia_utilizacion(
        self, tenant_id: int, equipo_id: int, fecha_inicio: date, fecha_fin: date
    ) -> list[TendenciaUtilizacionDto]:
        """Obtener tendencia diaria de utilización."""
        fecha_expr = func.to_char(ParteDiario.fecha, "YYYY-MM-DD")
        resultado = await self.db.execute(
            select(
                fecha_expr.label("fecha"),
                func.coalesce(func.sum(ParteDiario.horas_trabajadas), 0),
            )
            .where(
                ParteDiario.equipo_id == equipo_id,
                ParteDiario.tenant_id == tenant_id,
                ParteDiario.fecha >= fecha_inicio,
                ParteDiario.fecha <= fecha_fin,
            )
            .group_by(literal_column("fecha"))
            .order_by(literal_column("fecha"))
        )

        tendencias: list[TendenciaUtilizacionDto] = []
        for row in resultado.all():
            horas = float(row[1])
            tasa = round(min(100.0, horas / 8 * 100), 2)
            tendencias.append(
                TendenciaUtilizacionDto(
                    fecha=row[0],
                    horas_trabajadas=round(horas, 2),
                    tasa_utilizacion=tasa,
                    costo=0.0,
                )
            )
        return tendencias

    async def obtener_metricas_combustible(
        self, tenant_id: int, equipo_id: int, fecha_inicio: date, fecha_fin: date
    ) -> CombustibleEquipoDto:
        """Obtener métricas de combustible de un equipo."""
        # Combustible totals
        resultado = await self.db.execute(
            select(
                func.coalesce(func.sum(ValeCombustible.cantidad_galones), 0),
                func.coalesce(func.sum(ValeCombustible.monto_total), 0),
            )
            .select_from(ValeCombustible)
            .join(Equipo, Equipo.id == ValeCombustible.equipo_id)
            .where(
                ValeCombustible.equipo_id == equipo_id,
                Equipo.tenant_id == tenant_id,
                ValeCombustible.fecha >= fecha_inicio,
                ValeCombustible.fecha <= fecha_fin,
                ValeCombustible.estado != "ANULADO",
            )
        )
        row = resultado.one()
        total_galones = float(row[0])
        costo_total = float(row[1])

        # Hours worked for gal/hour ratio
        r_horas = await self.db.execute(
            select(func.coalesce(func.sum(ParteDiario.horas_trabajadas), 0)).where(
                ParteDiario.equipo_id == equipo_id,
                ParteDiario.tenant_id == tenant_id,
                ParteDiario.fecha >= fecha_inicio,
                ParteDiario.fecha <= fecha_fin,
            )
        )
        total_horas_raw: Any = r_horas.scalar_one()
        total_horas = float(total_horas_raw)

        galones_hora = round(total_galones / total_horas, 2) if total_horas > 0 else 0.0
        costo_promedio_por_hora = round(costo_total / total_horas, 2) if total_horas > 0 else 0.0

        if galones_hora < 2:
            eficiencia = "buena"
        elif galones_hora < 4:
            eficiencia = "promedio"
        else:
            eficiencia = "deficiente"

        return CombustibleEquipoDto(
            equipo_id=equipo_id,
            total_combustible_consumido=round(total_galones, 2),
            promedio_combustible_por_hora=galones_hora,
            costo_total_combustible=round(costo_total, 2),
            costo_promedio_por_hora=costo_promedio_por_hora,
            eficiencia=eficiencia,
        )

    async def obtener_tendencia_combustible(
        self, tenant_id: int, equipo_id: int, fecha_inicio: date, fecha_fin: date
    ) -> list[TendenciaCombustibleDto]:
        """Obtener tendencia diaria de combustible."""
        fecha_expr = func.to_char(ValeCombustible.fecha, "YYYY-MM-DD")
        resultado = await self.db.execute(
            select(
                fecha_expr.label("fecha"),
                func.coalesce(func.sum(ValeCombustible.cantidad_galones), 0),
                func.coalesce(func.sum(ValeCombustible.monto_total), 0),
            )
            .select_from(ValeCombustible)
            .join(Equipo, Equipo.id == ValeCombustible.equipo_id)
            .where(
                ValeCombustible.equipo_id == equipo_id,
                Equipo.tenant_id == tenant_id,
                ValeCombustible.fecha >= fecha_inicio,
                ValeCombustible.fecha <= fecha_fin,
                ValeCombustible.estado != "ANULADO",
            )
            .group_by(literal_column("fecha"))
            .order_by(literal_column("fecha"))
        )

        return [
            TendenciaCombustibleDto(
                fecha=row[0],
                combustible_consumido=round(float(row[1]), 2),
                costo_combustible=round(float(row[2]), 2),
                combustible_por_hora=0.0,
            )
            for row in resultado.all()
        ]

    async def obtener_metricas_mantenimiento(
        self, tenant_id: int, equipo_id: int
    ) -> MetricaMantenimientoDto:
        """Obtener métricas de mantenimiento de un equipo."""
        resultado = await self.db.execute(
            select(
                func.count(ProgramaMantenimiento.id),
                func.coalesce(func.sum(ProgramaMantenimiento.costo_real), 0),
            ).where(
                ProgramaMantenimiento.equipo_id == equipo_id,
                ProgramaMantenimiento.tenant_id == tenant_id,
            )
        )
        row = resultado.one()
        total = int(row[0])
        costo = float(row[1])

        r_pend = await self.db.execute(
            select(func.count(ProgramaMantenimiento.id)).where(
                ProgramaMantenimiento.equipo_id == equipo_id,
                ProgramaMantenimiento.tenant_id == tenant_id,
                ProgramaMantenimiento.estado == "PROGRAMADO",
            )
        )
        pendientes: int = r_pend.scalar_one()

        return MetricaMantenimientoDto(
            equipo_id=equipo_id,
            total_mantenimientos=total,
            costo_total=round(costo, 2),
            mantenimientos_pendientes=pendientes,
        )
