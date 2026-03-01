"""Esquemas Pydantic para dashboard."""

from pydantic import BaseModel


class DashboardEstadisticasDto(BaseModel):
    total_equipos: int
    contratos_activos: int
    valorizaciones_pendientes: int
    pagos_pendientes: float
    reportes_hoy: int


class AlertaDocumentoDto(BaseModel):
    equipo_id: int
    codigo: str
    tipo_documento: str
    fecha_vencimiento: str
    dias_restantes: int


class ModuloUsuarioDto(BaseModel):
    nombre: str
    ruta: str
    icono: str
    descripcion: str
