"""Servicio para analítica de equipos.

Replica EquipmentAnalyticsService del BFF Node.js — aggregation queries.
"""

from datetime import date, timedelta
from typing import Any

from sqlalchemy import func, literal_column, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.esquemas.analitica import (
    MetricaCombustibleDto,
    MetricaMantenimientoDto,
    TendenciaCombustibleDto,
    TendenciaUtilizacionDto,
    UtilizacionEquipoDto,
    UtilizacionFlotaDto,
)
from app.modelos.equipo import Equipo, ParteDiario, ProgramaMantenimiento, ValeCombustible

logger = obtener_logger(__name__)


def _fecha_inicio_periodo(periodo: str = "30d") -> date:
    """Calcular fecha de inicio según periodo (7d, 30d, 90d, 365d)."""
    dias = {"7d": 7, "30d": 30, "90d": 90, "365d": 365}
    return date.today() - timedelta(days=dias.get(periodo, 30))


class ServicioAnalitica:
    """Servicio para métricas analíticas de equipos."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def obtener_utilizacion_equipo(
        self, tenant_id: int, equipo_id: int, periodo: str = "30d"
    ) -> UtilizacionEquipoDto:
        """Obtener utilización de un equipo en un periodo."""
        fecha_inicio = _fecha_inicio_periodo(periodo)
        dias_periodo = {"7d": 7, "30d": 30, "90d": 90, "365d": 365}.get(periodo, 30)

        resultado = await self.db.execute(
            select(
                func.coalesce(func.sum(ParteDiario.horas_trabajadas), 0),
                func.count(ParteDiario.id),
            ).where(
                ParteDiario.equipo_id == equipo_id,
                ParteDiario.tenant_id == tenant_id,
                ParteDiario.fecha >= fecha_inicio,
            )
        )
        row = resultado.one()
        total_horas = float(row[0])
        dias_con_reporte = int(row[1])
        promedio_diario = total_horas / dias_con_reporte if dias_con_reporte > 0 else 0.0
        # Utilizacion = dias con reporte / dias del periodo * 100
        utilizacion = round(dias_con_reporte / dias_periodo * 100, 2) if dias_periodo > 0 else 0.0

        return UtilizacionEquipoDto(
            equipo_id=equipo_id,
            total_horas=round(total_horas, 2),
            dias_con_reporte=dias_con_reporte,
            promedio_diario=round(promedio_diario, 2),
            utilizacion_porcentaje=utilizacion,
        )

    async def obtener_tendencia_utilizacion(
        self, tenant_id: int, equipo_id: int, meses: int = 6
    ) -> list[TendenciaUtilizacionDto]:
        """Obtener tendencia mensual de utilización."""
        fecha_inicio = date.today() - timedelta(days=meses * 30)

        mes_expr = func.to_char(ParteDiario.fecha, "YYYY-MM")
        resultado = await self.db.execute(
            select(
                mes_expr.label("mes"),
                func.coalesce(func.sum(ParteDiario.horas_trabajadas), 0),
                func.count(ParteDiario.id),
            )
            .where(
                ParteDiario.equipo_id == equipo_id,
                ParteDiario.tenant_id == tenant_id,
                ParteDiario.fecha >= fecha_inicio,
            )
            .group_by(literal_column("mes"))
            .order_by(literal_column("mes"))
        )

        tendencias: list[TendenciaUtilizacionDto] = []
        for row in resultado.all():
            total_h = float(row[1])
            dias = int(row[2])
            tendencias.append(
                TendenciaUtilizacionDto(
                    mes=row[0],
                    total_horas=round(total_h, 2),
                    dias_con_reporte=dias,
                    promedio_diario=round(total_h / dias, 2) if dias > 0 else 0.0,
                )
            )
        return tendencias

    async def obtener_utilizacion_flota(
        self, tenant_id: int
    ) -> UtilizacionFlotaDto:
        """Obtener utilización de toda la flota (últimos 30 días)."""
        fecha_inicio = date.today() - timedelta(days=30)

        # Total equipos activos
        r_eq = await self.db.execute(
            select(func.count(Equipo.id)).where(
                Equipo.tenant_id == tenant_id, Equipo.is_active.is_(True)
            )
        )
        total_equipos: int = r_eq.scalar_one()

        # Equipos con actividad y horas totales
        r_act = await self.db.execute(
            select(
                func.count(func.distinct(ParteDiario.equipo_id)),
                func.coalesce(func.sum(ParteDiario.horas_trabajadas), 0),
            ).where(
                ParteDiario.tenant_id == tenant_id,
                ParteDiario.fecha >= fecha_inicio,
            )
        )
        row = r_act.one()
        equipos_activos = int(row[0])
        total_horas = float(row[1])
        promedio = round(total_horas / total_equipos, 2) if total_equipos > 0 else 0.0

        return UtilizacionFlotaDto(
            total_equipos=total_equipos,
            equipos_con_actividad=equipos_activos,
            total_horas=round(total_horas, 2),
            promedio_por_equipo=promedio,
        )

    async def obtener_metricas_combustible(
        self, tenant_id: int, equipo_id: int, periodo: str = "30d"
    ) -> MetricaCombustibleDto:
        """Obtener métricas de combustible de un equipo."""
        fecha_inicio = _fecha_inicio_periodo(periodo)

        # Combustible totals (join through equipo for tenant filtering)
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
                ValeCombustible.estado != "ANULADO",
            )
        )
        row = resultado.one()
        total_galones = float(row[0])
        costo_total = float(row[1])

        # Horas trabajadas para ratio gal/hora
        r_horas = await self.db.execute(
            select(func.coalesce(func.sum(ParteDiario.horas_trabajadas), 0)).where(
                ParteDiario.equipo_id == equipo_id,
                ParteDiario.tenant_id == tenant_id,
                ParteDiario.fecha >= fecha_inicio,
            )
        )
        total_horas_raw: Any = r_horas.scalar_one()
        total_horas = float(total_horas_raw)
        galones_hora = round(total_galones / total_horas, 2) if total_horas > 0 else 0.0

        return MetricaCombustibleDto(
            equipo_id=equipo_id,
            total_galones=round(total_galones, 2),
            costo_total=round(costo_total, 2),
            galones_por_hora=galones_hora,
        )

    async def obtener_tendencia_combustible(
        self, tenant_id: int, equipo_id: int, meses: int = 6
    ) -> list[TendenciaCombustibleDto]:
        """Obtener tendencia mensual de combustible."""
        fecha_inicio = date.today() - timedelta(days=meses * 30)

        mes_comb = func.to_char(ValeCombustible.fecha, "YYYY-MM")
        resultado = await self.db.execute(
            select(
                mes_comb.label("mes"),
                func.coalesce(func.sum(ValeCombustible.cantidad_galones), 0),
                func.coalesce(func.sum(ValeCombustible.monto_total), 0),
            )
            .select_from(ValeCombustible)
            .join(Equipo, Equipo.id == ValeCombustible.equipo_id)
            .where(
                ValeCombustible.equipo_id == equipo_id,
                Equipo.tenant_id == tenant_id,
                ValeCombustible.fecha >= fecha_inicio,
                ValeCombustible.estado != "ANULADO",
            )
            .group_by(literal_column("mes"))
            .order_by(literal_column("mes"))
        )

        return [
            TendenciaCombustibleDto(
                mes=row[0],
                total_galones=round(float(row[1]), 2),
                costo_total=round(float(row[2]), 2),
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

        # Pendientes
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
