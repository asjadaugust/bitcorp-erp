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
  equipmentId: number;
  equipmentCode: string;
  totalHours: number;
  workingHours: number;
  idleHours: number;
  utilizationRate: number;
  costPerHour: number;
  totalCost: number;
  periodStart: Date;
  periodEnd: Date;
}): UtilizacionEquipoDto {
  return {
    equipo_id: entity.equipmentId,
    codigo_equipo: entity.equipmentCode,
    horas_totales: entity.totalHours,
    horas_trabajadas: entity.workingHours,
    horas_inactivas: entity.idleHours,
    tasa_utilizacion: entity.utilizationRate,
    costo_por_hora: entity.costPerHour,
    costo_total: entity.totalCost,
    periodo_inicio:
      entity.periodStart instanceof Date
        ? entity.periodStart.toISOString()
        : String(entity.periodStart),
    periodo_fin:
      entity.periodEnd instanceof Date ? entity.periodEnd.toISOString() : String(entity.periodEnd),
  };
}

export function toTendenciaUtilizacionDto(entity: {
  date: string;
  utilizationRate: number;
  workingHours: number;
  cost: number;
}): TendenciaUtilizacionDto {
  return {
    fecha: entity.date,
    tasa_utilizacion: entity.utilizationRate,
    horas_trabajadas: entity.workingHours,
    costo: entity.cost,
  };
}

export function toFlotaUtilizacionDto(entity: {
  totalEquipment: number;
  activeEquipment: number;
  avgUtilizationRate: number;
  totalCost: number;
  topPerformers: Array<{ equipmentCode: string; utilizationRate: number }>;
  underutilized: Array<{ equipmentCode: string; utilizationRate: number }>;
}): FlotaUtilizacionDto {
  return {
    total_equipos: entity.totalEquipment,
    equipos_activos: entity.activeEquipment,
    tasa_utilizacion_promedio: entity.avgUtilizationRate,
    costo_total: entity.totalCost,
    mejores_equipos: entity.topPerformers.map((e) => ({
      codigo_equipo: e.equipmentCode,
      tasa_utilizacion: e.utilizationRate,
    })),
    equipos_sub_utilizados: entity.underutilized.map((e) => ({
      codigo_equipo: e.equipmentCode,
      tasa_utilizacion: e.utilizationRate,
    })),
  };
}

export function toCombustibleDto(entity: {
  equipmentId: number;
  totalFuelConsumed: number;
  avgFuelPerHour: number;
  totalFuelCost: number;
  avgCostPerHour: number;
  efficiency: 'good' | 'average' | 'poor';
}): CombustibleEquipoDto {
  const eficienciaMap: Record<'good' | 'average' | 'poor', 'buena' | 'promedio' | 'deficiente'> = {
    good: 'buena',
    average: 'promedio',
    poor: 'deficiente',
  };

  return {
    equipo_id: entity.equipmentId,
    total_combustible_consumido: entity.totalFuelConsumed,
    promedio_combustible_por_hora: entity.avgFuelPerHour,
    costo_total_combustible: entity.totalFuelCost,
    costo_promedio_por_hora: entity.avgCostPerHour,
    eficiencia: eficienciaMap[entity.efficiency],
  };
}

export function toTendenciaCombustibleDto(entity: {
  date: string;
  fuelConsumed: number;
  fuelCost: number;
  fuelPerHour: number;
}): TendenciaCombustibleDto {
  return {
    fecha: entity.date,
    combustible_consumido: entity.fuelConsumed,
    costo_combustible: entity.fuelCost,
    combustible_por_hora: entity.fuelPerHour,
  };
}
