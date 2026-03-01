"""Esquemas Pydantic para analítica de equipos."""

from pydantic import BaseModel


class UtilizacionEquipoDto(BaseModel):
    equipo_id: int
    total_horas: float
    dias_con_reporte: int
    promedio_diario: float
    utilizacion_porcentaje: float


class TendenciaUtilizacionDto(BaseModel):
    mes: str
    total_horas: float
    dias_con_reporte: int
    promedio_diario: float


class UtilizacionFlotaDto(BaseModel):
    total_equipos: int
    equipos_con_actividad: int
    total_horas: float
    promedio_por_equipo: float


class MetricaCombustibleDto(BaseModel):
    equipo_id: int
    total_galones: float
    costo_total: float
    galones_por_hora: float


class TendenciaCombustibleDto(BaseModel):
    mes: str
    total_galones: float
    costo_total: float


class MetricaMantenimientoDto(BaseModel):
    equipo_id: int
    total_mantenimientos: int
    costo_total: float
    mantenimientos_pendientes: int
