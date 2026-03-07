"""Esquemas Pydantic para partes diarios (daily reports).
"""

from datetime import date, datetime, time

from pydantic import BaseModel, Field

# ─── Output DTOs ────────────────────────────────────────────────────────────


class ParteDiarioListaDto(BaseModel):
    id: int
    equipo_id: int
    trabajador_id: int | None = None
    proyecto_id: int | None = None
    fecha: date
    horas_trabajadas: float | None = None
    horometro_inicial: float | None = None
    horometro_final: float | None = None
    estado: str
    codigo: str | None = None
    turno: str | None = None
    numero_parte: int | None = None
    horas_precalentamiento: float | None = None
    tenant_id: int | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    # Enriched from relationships
    equipo_codigo: str | None = None
    equipo_marca: str | None = None
    equipo_modelo: str | None = None
    trabajador_nombre: str | None = None
    proyecto_nombre: str | None = None


class ParteDiarioDetalleDto(ParteDiarioListaDto):
    legacy_id: str | None = None
    valorizacion_id: int | None = None
    hora_inicio: time | None = None
    hora_fin: time | None = None
    odometro_inicial: float | None = None
    odometro_final: float | None = None
    km_recorridos: float | None = None
    combustible_inicial: float | None = None
    combustible_consumido: float | None = None
    observaciones: str | None = None
    creado_por: int | None = None
    aprobado_por: int | None = None
    aprobado_en: datetime | None = None
    empresa: str | None = None
    placa: str | None = None
    responsable_frente: str | None = None
    petroleo_gln: float | None = None
    gasolina_gln: float | None = None
    hora_abastecimiento: time | None = None
    num_vale_combustible: str | None = None
    horometro_kilometraje: str | None = None
    lugar_salida: str | None = None
    lugar_llegada: str | None = None
    observaciones_correcciones: str | None = None
    firma_operador: str | None = None
    firma_supervisor: str | None = None
    firma_jefe_equipos: str | None = None
    firma_residente: str | None = None
    firma_planeamiento_control: str | None = None
    solicitud_aprobacion_id: int | None = None
    gps_latitude: float | None = None
    gps_longitude: float | None = None
    gps_accuracy: float | None = None
    weather_conditions: str | None = None
    combustible_cargado: float | None = None
    # Children
    actividades: list["ActividadProduccionDto"] = []
    produccion: list["ProduccionDto"] = []
    demoras_operativas: list["DemoraOperativaDto"] = []
    demoras_mecanicas: list["DemoraMecanicaDto"] = []
    otros_eventos: list["OtroEventoDto"] = []
    fotos: list["FotoDto"] = []


class ActividadProduccionDto(BaseModel):
    id: int
    parte_diario_id: int
    codigo: str
    descripcion: str | None = None


class ProduccionDto(BaseModel):
    id: int
    parte_diario_id: int
    numero: int
    ubicacion_labores_prog_ini: str | None = None
    ubicacion_labores_prog_fin: str | None = None
    hora_ini: time | None = None
    hora_fin: time | None = None
    material_trabajado_descripcion: str | None = None
    metrado: str | None = None
    edt: str | None = None


class DemoraOperativaDto(BaseModel):
    id: int
    parte_diario_id: int
    codigo: str


class DemoraMecanicaDto(BaseModel):
    id: int
    parte_diario_id: int
    codigo: str
    descripcion: str | None = None
    resuelta: bool = False
    fecha_resolucion: date | None = None
    observacion_resolucion: str | None = None


class OtroEventoDto(BaseModel):
    id: int
    parte_diario_id: int
    codigo: str
    descripcion: str | None = None


class FotoDto(BaseModel):
    id: int
    parte_diario_id: int
    filename: str
    original_name: str | None = None
    mime_type: str | None = None
    size: int | None = None
    orden: int | None = None


class EstadoRecepcionDto(BaseModel):
    equipo_id: int
    codigo_equipo: str | None = None
    marca: str | None = None
    modelo: str | None = None
    total_dias: int
    reportes_recibidos: int
    reportes_pendientes: int
    porcentaje_recepcion: float
    fechas_faltantes: list[str] = []


class ObservacionInspeccionDto(BaseModel):
    id: int
    parte_diario_id: int
    fecha: date
    codigo: str
    descripcion: str | None = None
    resuelta: bool
    fecha_resolucion: date | None = None
    observacion_resolucion: str | None = None


class SeguimientoInspeccionDto(BaseModel):
    equipo_id: int
    codigo_equipo: str | None = None
    marca: str | None = None
    modelo: str | None = None
    total_observaciones: int
    observaciones_abiertas: int
    observaciones_resueltas: int
    observaciones: list[ObservacionInspeccionDto] = []


# ─── Input DTOs ─────────────────────────────────────────────────────────────


class ActividadItem(BaseModel):
    codigo: str
    descripcion: str | None = None


class ProduccionItem(BaseModel):
    numero: int
    ubicacion_labores_prog_ini: str | None = None
    ubicacion_labores_prog_fin: str | None = None
    hora_ini: time | None = None
    hora_fin: time | None = None
    material_trabajado_descripcion: str | None = None
    metrado: str | None = None
    edt: str | None = None


class DemoraOperativaItem(BaseModel):
    codigo: str


class DemoraMecanicaItem(BaseModel):
    codigo: str
    descripcion: str | None = None


class OtroEventoItem(BaseModel):
    codigo: str
    descripcion: str | None = None


class ParteDiarioCrear(BaseModel):
    equipo_id: int
    fecha: date
    trabajador_id: int | None = None
    proyecto_id: int | None = None
    hora_inicio: time | None = None
    hora_fin: time | None = None
    horas_trabajadas: float | None = None
    horometro_inicial: float | None = None
    horometro_final: float | None = None
    odometro_inicial: float | None = None
    odometro_final: float | None = None
    km_recorridos: float | None = None
    combustible_inicial: float | None = None
    combustible_consumido: float | None = None
    observaciones: str | None = None
    codigo: str | None = None
    empresa: str | None = None
    placa: str | None = None
    responsable_frente: str | None = None
    turno: str | None = None
    numero_parte: int | None = None
    petroleo_gln: float | None = None
    gasolina_gln: float | None = None
    hora_abastecimiento: time | None = None
    num_vale_combustible: str | None = None
    horometro_kilometraje: str | None = None
    lugar_salida: str | None = None
    lugar_llegada: str | None = None
    firma_operador: str | None = None
    firma_supervisor: str | None = None
    horas_precalentamiento: float | None = None
    observaciones_correcciones: str | None = None
    gps_latitude: float | None = None
    gps_longitude: float | None = None
    gps_accuracy: float | None = None
    weather_conditions: str | None = None
    combustible_cargado: float | None = None
    # Children
    actividades: list[ActividadItem] = []
    produccion: list[ProduccionItem] = []
    demoras_operativas: list[DemoraOperativaItem] = []
    demoras_mecanicas: list[DemoraMecanicaItem] = []
    otros_eventos: list[OtroEventoItem] = []


class ParteDiarioActualizar(BaseModel):
    trabajador_id: int | None = None
    proyecto_id: int | None = None
    fecha: date | None = None
    hora_inicio: time | None = None
    hora_fin: time | None = None
    horas_trabajadas: float | None = None
    horometro_inicial: float | None = None
    horometro_final: float | None = None
    odometro_inicial: float | None = None
    odometro_final: float | None = None
    km_recorridos: float | None = None
    combustible_inicial: float | None = None
    combustible_consumido: float | None = None
    observaciones: str | None = None
    codigo: str | None = None
    empresa: str | None = None
    placa: str | None = None
    responsable_frente: str | None = None
    turno: str | None = None
    numero_parte: int | None = None
    petroleo_gln: float | None = None
    gasolina_gln: float | None = None
    hora_abastecimiento: time | None = None
    num_vale_combustible: str | None = None
    horometro_kilometraje: str | None = None
    lugar_salida: str | None = None
    lugar_llegada: str | None = None
    firma_operador: str | None = None
    firma_supervisor: str | None = None
    horas_precalentamiento: float | None = None
    observaciones_correcciones: str | None = None
    gps_latitude: float | None = None
    gps_longitude: float | None = None
    gps_accuracy: float | None = None
    weather_conditions: str | None = None
    combustible_cargado: float | None = None
    # Children (replace all on update)
    actividades: list[ActividadItem] | None = None
    produccion: list[ProduccionItem] | None = None
    demoras_operativas: list[DemoraOperativaItem] | None = None
    demoras_mecanicas: list[DemoraMecanicaItem] | None = None
    otros_eventos: list[OtroEventoItem] | None = None


class RechazarReporte(BaseModel):
    reason: str = Field(..., min_length=1)


class FirmarResidente(BaseModel):
    firma_residente: str = Field(..., min_length=1)


class ResolverObservacionDto(BaseModel):
    observacion_resolucion: str | None = None
