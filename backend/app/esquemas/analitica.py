"""Esquemas Pydantic para analítica de equipos."""

from pydantic import BaseModel


class FlotaEquipoResumenDto(BaseModel):
    codigo_equipo: str
    tasa_utilizacion: float


class UtilizacionFlotaDto(BaseModel):
    total_equipos: int
    equipos_activos: int
    tasa_utilizacion_promedio: float
    costo_total: float
    mejores_equipos: list[FlotaEquipoResumenDto]
    equipos_sub_utilizados: list[FlotaEquipoResumenDto]


class UtilizacionEquipoDto(BaseModel):
    equipo_id: int
    codigo_equipo: str
    horas_totales: float
    horas_trabajadas: float
    horas_inactivas: float
    tasa_utilizacion: float
    costo_por_hora: float
    costo_total: float
    periodo_inicio: str
    periodo_fin: str


class TendenciaUtilizacionDto(BaseModel):
    fecha: str  # YYYY-MM-DD (daily)
    tasa_utilizacion: float
    horas_trabajadas: float
    costo: float


class CombustibleEquipoDto(BaseModel):
    equipo_id: int
    total_combustible_consumido: float
    promedio_combustible_por_hora: float
    costo_total_combustible: float
    costo_promedio_por_hora: float
    eficiencia: str  # 'buena' | 'promedio' | 'deficiente'


class TendenciaCombustibleDto(BaseModel):
    fecha: str  # YYYY-MM-DD (daily)
    combustible_consumido: float
    costo_combustible: float
    combustible_por_hora: float


class MetricaMantenimientoDto(BaseModel):
    equipo_id: int
    total_mantenimientos: int
    costo_total: float
    mantenimientos_pendientes: int
