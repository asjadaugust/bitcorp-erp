/**
 * DTOs de Analítica de Equipos (WS-25)
 * Transformación de interfaces camelCase → snake_case español para respuestas API
 */

// ─── Interfaces DTO ────────────────────────────────────────────────────────────

export interface UtilizacionEquipoDto {
  equipo_id: number;
  codigo_equipo: string;
  horas_totales: number;
  horas_trabajadas: number;
  horas_inactivas: number;
  tasa_utilizacion: number;
  costo_por_hora: number;
  costo_total: number;
  periodo_inicio: string;
  periodo_fin: string;
}

export interface TendenciaUtilizacionDto {
  fecha: string;
  tasa_utilizacion: number;
  horas_trabajadas: number;
  costo: number;
}

export interface FlotaEquipoResumenDto {
  codigo_equipo: string;
  tasa_utilizacion: number;
}

export interface FlotaUtilizacionDto {
  total_equipos: number;
  equipos_activos: number;
  tasa_utilizacion_promedio: number;
  costo_total: number;
  mejores_equipos: FlotaEquipoResumenDto[];
  equipos_sub_utilizados: FlotaEquipoResumenDto[];
}

export interface CombustibleEquipoDto {
  equipo_id: number;
  total_combustible_consumido: number;
  promedio_combustible_por_hora: number;
  costo_total_combustible: number;
  costo_promedio_por_hora: number;
  eficiencia: 'buena' | 'promedio' | 'deficiente';
}

export interface TendenciaCombustibleDto {
  fecha: string;
  combustible_consumido: number;
  costo_combustible: number;
  combustible_por_hora: number;
}

// ─── Funciones transformadoras ─────────────────────────────────────────────────

export function toUtilizacionDto(entity: {
  equipment_id: number;
  equipment_code: string;
  total_hours: number;
  working_hours: number;
  idle_hours: number;
  utilization_rate: number;
  cost_per_hour: number;
  total_cost: number;
  period_start: Date;
  period_end: Date;
}): UtilizacionEquipoDto {
  return {
    equipo_id: entity.equipment_id,
    codigo_equipo: entity.equipment_code,
    horas_totales: entity.total_hours,
    horas_trabajadas: entity.working_hours,
    horas_inactivas: entity.idle_hours,
    tasa_utilizacion: entity.utilization_rate,
    costo_por_hora: entity.cost_per_hour,
    costo_total: entity.total_cost,
    periodo_inicio:
      entity.period_start instanceof Date
        ? entity.period_start.toISOString()
        : String(entity.period_start),
    periodo_fin:
      entity.period_end instanceof Date
        ? entity.period_end.toISOString()
        : String(entity.period_end),
  };
}

export function toTendenciaUtilizacionDto(entity: {
  date: string;
  utilization_rate: number;
  working_hours: number;
  cost: number;
}): TendenciaUtilizacionDto {
  return {
    fecha: entity.date,
    tasa_utilizacion: entity.utilization_rate,
    horas_trabajadas: entity.working_hours,
    costo: entity.cost,
  };
}

export function toFlotaUtilizacionDto(entity: {
  total_equipment: number;
  active_equipment: number;
  avg_utilization_rate: number;
  total_cost: number;
  top_performers: Array<{ equipment_code: string; utilization_rate: number }>;
  underutilized: Array<{ equipment_code: string; utilization_rate: number }>;
}): FlotaUtilizacionDto {
  return {
    total_equipos: entity.total_equipment,
    equipos_activos: entity.active_equipment,
    tasa_utilizacion_promedio: entity.avg_utilization_rate,
    costo_total: entity.total_cost,
    mejores_equipos: entity.top_performers.map((e) => ({
      codigo_equipo: e.equipment_code,
      tasa_utilizacion: e.utilization_rate,
    })),
    equipos_sub_utilizados: entity.underutilized.map((e) => ({
      codigo_equipo: e.equipment_code,
      tasa_utilizacion: e.utilization_rate,
    })),
  };
}

export function toCombustibleDto(entity: {
  equipment_id: number;
  total_fuel_consumed: number;
  avg_fuel_per_hour: number;
  total_fuel_cost: number;
  avg_cost_per_hour: number;
  efficiency: 'good' | 'average' | 'poor';
}): CombustibleEquipoDto {
  const eficienciaMap: Record<'good' | 'average' | 'poor', 'buena' | 'promedio' | 'deficiente'> = {
    good: 'buena',
    average: 'promedio',
    poor: 'deficiente',
  };

  return {
    equipo_id: entity.equipment_id,
    total_combustible_consumido: entity.total_fuel_consumed,
    promedio_combustible_por_hora: entity.avg_fuel_per_hour,
    costo_total_combustible: entity.total_fuel_cost,
    costo_promedio_por_hora: entity.avg_cost_per_hour,
    eficiencia: eficienciaMap[entity.efficiency],
  };
}

export function toTendenciaCombustibleDto(entity: {
  date: string;
  fuel_consumed: number;
  fuel_cost: number;
  fuel_per_hour: number;
}): TendenciaCombustibleDto {
  return {
    fecha: entity.date,
    combustible_consumido: entity.fuel_consumed,
    costo_combustible: entity.fuel_cost,
    combustible_por_hora: entity.fuel_per_hour,
  };
}
