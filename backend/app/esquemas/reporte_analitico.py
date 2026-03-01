"""Esquemas Pydantic para reportes analíticos."""

from pydantic import BaseModel


class UtilizacionEquipoReporteDto(BaseModel):
    equipo_id: int
    codigo_equipo: str
    total_horas: float
    dias_con_reporte: int
    promedio_diario: float
    periodo: str


class HistorialMantenimientoDto(BaseModel):
    id: int
    equipo_id: int
    tipo_mantenimiento: str
    descripcion: str | None = None
    fecha_programada: str | None = None
    fecha_realizada: str | None = None
    costo_estimado: float | None = None
    costo_real: float | None = None
    estado: str


class MovimientoInventarioDto(BaseModel):
    id: int
    tipo: str
    fecha: str
    cantidad: float | None = None
    observaciones: str | None = None


class HojaOperadorDto(BaseModel):
    trabajador_id: int
    nombres: str
    fecha: str
    equipo_id: int
    horas_trabajadas: float
    estado: str
