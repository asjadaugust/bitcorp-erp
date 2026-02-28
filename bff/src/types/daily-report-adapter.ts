import { DailyReportDto } from './dto/daily-report.dto';

/**
 * Interface for the English/camelCase frontend model
 * Derived from the observed usage in the frontend application
 */
export interface DailyReportFrontendModel {
  id?: number;
  reportDate?: string;
  operatorId?: number;
  equipmentId?: number;
  projectId?: number;
  startTime?: string;
  endTime?: string;
  startHourmeter?: number;
  endHourmeter?: number;
  startOdometer?: number;
  endOdometer?: number;
  startFuel?: number;
  departureLocation?: string;
  workDescription?: string;
  notes?: string;
  status?: string;

  // Also support legacy keys observed in some components
  report_date?: string;
  operator_id?: number;
  equipment_id?: number;
  project_id?: number;
  start_time?: string;
  end_time?: string;
  hourmeter_start?: number;
  hourmeter_end?: number;
  odometer_start?: number;
  odometer_end?: number;
  fuel_start?: number;
  departure_location?: string;
  work_description?: string;
  observations?: string;
}

/**
 * Adapter to translate between Frontend English models and Backend Spanish DTOs
 */
export class DailyReportAdapter {
  /**
   * Converts frontend input (English/camelCase or mixed) to Backend DTO (Spanish snake_case)
   * This ensures the backend service always receives the structure it expects
   */
  static toBackendDto(input: DailyReportFrontendModel): Partial<DailyReportDto> {
    return {
      // Basic Info
      fecha: input.reportDate || input.report_date,
      trabajador_id: input.operatorId || input.operator_id,
      equipo_id: input.equipmentId || input.equipment_id,
      proyecto_id: input.projectId || input.project_id,

      // Time
      hora_inicio: input.startTime || input.start_time,
      hora_fin: input.endTime || input.end_time,

      // Metering
      horometro_inicial: input.startHourmeter || input.hourmeter_start,
      horometro_final: input.endHourmeter || input.hourmeter_end,
      odometro_inicial: input.startOdometer || input.odometer_start,
      odometro_final: input.endOdometer || input.odometer_end,

      // Fuel
      combustible_inicial: input.startFuel || input.fuel_start,

      // Location & Description
      lugar_salida: input.departureLocation || input.departure_location,
      observaciones: input.workDescription || input.work_description || input.observations,
      observaciones_correcciones: input.notes, // often mapped to notes/comments

      // Status
      estado: (input.status as DailyReportDto['estado']) || undefined,
    };
  }

  /**
   * Converts Backend DTO (Spanish snake_case) to Frontend model (English/camelCase)
   * Useful if we need to return data in the format the legacy frontend expects
   * (Though ideally, frontend should migrate to consume DTOs directly)
   */
  static toFrontendModel(dto: DailyReportDto): DailyReportFrontendModel {
    return {
      id: dto.id,
      reportDate: dto.fecha,
      operatorId: dto.trabajador_id,
      equipmentId: dto.equipo_id,
      projectId: dto.proyecto_id || undefined,
      startTime: dto.hora_inicio,
      endTime: dto.hora_fin,
      startHourmeter: dto.horometro_inicial,
      endHourmeter: dto.horometro_final,
      startOdometer: dto.odometro_inicial || undefined,
      endOdometer: dto.odometro_final || undefined,
      startFuel: dto.combustible_inicial || undefined,
      departureLocation: dto.lugar_salida,
      workDescription: dto.observaciones,
      notes: dto.observaciones_correcciones || undefined,
      status: dto.estado,
    };
  }
}
