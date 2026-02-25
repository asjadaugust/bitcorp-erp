/* eslint-disable @typescript-eslint/no-explicit-any */
import { IsDateString, IsOptional, IsIn } from 'class-validator';

/**
 * DTO for report query parameters
 * Used across all reporting endpoints
 */
export class ReportQueryDto {
  @IsDateString({}, { message: 'La fecha de inicio debe ser una fecha válida (YYYY-MM-DD)' })
  start_date!: string;

  @IsDateString({}, { message: 'La fecha de fin debe ser una fecha válida (YYYY-MM-DD)' })
  end_date!: string;

  @IsOptional()
  @IsIn(['excel', 'json'], { message: 'El formato debe ser "excel" o "json"' })
  format?: string;
}

/**
 * Equipment Utilization Report Response DTO
 *
 * Contains equipment usage metrics including hours worked, days active, and fuel consumption.
 *
 * @note Currently returns mock/zero data for hours and days because the parte_diario table
 *       doesn't exist in the current schema. Real data will be available when daily reports
 *       are implemented.
 */
export interface EquipmentUtilizationReport {
  /** Equipment code (unique identifier) */
  code: string;

  /** Equipment description (brand + model or code) */
  equipment: string;

  /** Equipment category/type */
  equipment_type: string;

  /** Number of days equipment was active (currently 0 - mock data) */
  days_worked: number;

  /** Total hours worked (currently 0 - mock data) */
  total_hours: number;

  /** Average hours per day (currently 0 - mock data) */
  avg_daily_hours: number;

  /** Total fuel consumed in gallons (currently 0 - mock data) */
  total_fuel: number;
}

/**
 * Maintenance History Report Response DTO
 *
 * Contains maintenance records with costs, status, and provider information.
 */
export interface MaintenanceHistoryReport {
  /** Maintenance schedule ID */
  id: number;

  /** Scheduled maintenance date */
  start_date: Date;

  /** Actual completion date (null if not completed) */
  end_date: Date;

  /** Type of maintenance (PREVENTIVO, CORRECTIVO, etc.) */
  maintenance_type: string;

  /** Maintenance status (PROGRAMADO, EN_PROGRESO, COMPLETADO, etc.) */
  status: string;

  /** Estimated or actual cost */
  cost: number;

  /** Maintenance description/notes */
  description: string;

  /** Equipment code */
  equipment_code: string;

  /** Equipment name (brand + model) */
  equipment_name: string;

  /** Service provider name */
  provider_name: string;
}

/**
 * Inventory Movement Report Response DTO
 *
 * Contains inventory movement records with item counts and monetary totals.
 */
export interface InventoryMovementReport {
  /** Movement ID */
  id: number;

  /** Movement date */
  fecha: Date;

  /** Movement type (ENTRADA, SALIDA, TRASLADO, etc.) */
  tipo_movimiento: string;

  /** Document number (invoice, guide, etc.) */
  numero_documento: string;

  /** Project name (destination or source) */
  project_name: string;

  /** Number of items in movement */
  items_count: number;

  /** Total monetary value of movement */
  total_amount: number;
}

/**
 * Operator Timesheet Report Response DTO
 *
 * Contains operator work hours including regular and overtime.
 *
 * @note Currently returns mock/zero data for hours and days because the parte_diario table
 *       doesn't exist in the current schema. Real data will be available when daily reports
 *       are implemented.
 */
export interface OperatorTimesheetReport {
  /** Operator full name */
  operator_name: string;

  /** Project name where operator worked (currently 'N/A' - mock data) */
  project_name: string;

  /** Number of days worked (currently 0 - mock data) */
  days_worked: number;

  /** Total regular hours worked (currently 0 - mock data) */
  total_hours: number;

  /** Total overtime hours (currently 0 - mock data) */
  overtime_hours: number;
}
