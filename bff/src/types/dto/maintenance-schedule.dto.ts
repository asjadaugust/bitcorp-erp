/**
 * Maintenance Schedule DTO
 *
 * Following ARCHITECTURE.MD guidelines:
 * - Uses Spanish snake_case field names matching database columns
 * - DTO transformation happens in service layer
 * - Returns Spanish column names to API
 */

import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  IsBoolean,
  IsIn,
  Min,
  MaxLength,
} from 'class-validator';

/**
 * Validation DTO for creating a maintenance schedule
 */
export class MaintenanceScheduleCreateDto {
  @IsNotEmpty({ message: 'El ID del equipo es requerido' })
  @IsInt({ message: 'El ID del equipo debe ser un número entero' })
  equipment_id!: number;

  @IsOptional()
  @IsInt({ message: 'El ID del proyecto debe ser un número entero' })
  project_id?: number;

  @IsOptional()
  @IsIn(['preventive', 'corrective', 'predictive', 'calibration', 'inspection'], {
    message:
      'El tipo de mantenimiento debe ser: preventive, corrective, predictive, calibration, inspection',
  })
  maintenance_type?: string;

  @IsOptional()
  @IsIn(['hours', 'days', 'weeks', 'months', 'kilometers'], {
    message: 'El tipo de intervalo debe ser: hours, days, weeks, months, kilometers',
  })
  interval_type?: string;

  @IsNotEmpty({ message: 'El valor del intervalo es requerido' })
  @IsInt({ message: 'El valor del intervalo debe ser un número entero' })
  @Min(1, { message: 'El valor del intervalo debe ser al menos 1' })
  interval_value!: number;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  @MaxLength(500, { message: 'La descripción no puede exceder 500 caracteres' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'Las notas deben ser texto' })
  @MaxLength(1000, { message: 'Las notas no pueden exceder 1000 caracteres' })
  notes?: string;

  @IsOptional()
  @IsBoolean({ message: 'auto_generate_tasks debe ser verdadero o falso' })
  auto_generate_tasks?: boolean;
}

/**
 * Validation DTO for updating a maintenance schedule
 */
export class MaintenanceScheduleUpdateDto {
  @IsOptional()
  @IsInt({ message: 'El ID del equipo debe ser un número entero' })
  equipment_id?: number;

  @IsOptional()
  @IsInt({ message: 'El ID del proyecto debe ser un número entero' })
  project_id?: number;

  @IsOptional()
  @IsIn(['preventive', 'corrective', 'predictive', 'calibration', 'inspection'], {
    message:
      'El tipo de mantenimiento debe ser: preventive, corrective, predictive, calibration, inspection',
  })
  maintenance_type?: string;

  @IsOptional()
  @IsIn(['hours', 'days', 'weeks', 'months', 'kilometers'], {
    message: 'El tipo de intervalo debe ser: hours, days, weeks, months, kilometers',
  })
  interval_type?: string;

  @IsOptional()
  @IsInt({ message: 'El valor del intervalo debe ser un número entero' })
  @Min(1, { message: 'El valor del intervalo debe ser al menos 1' })
  interval_value?: number;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  @MaxLength(500, { message: 'La descripción no puede exceder 500 caracteres' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'Las notas deben ser texto' })
  @MaxLength(1000, { message: 'Las notas no pueden exceder 1000 caracteres' })
  notes?: string;

  @IsOptional()
  @IsIn(['active', 'inactive', 'suspended', 'completed'], {
    message: 'El estado debe ser: active, inactive, suspended, completed',
  })
  status?: string;

  @IsOptional()
  @IsBoolean({ message: 'auto_generate_tasks debe ser verdadero o falso' })
  auto_generate_tasks?: boolean;

  @IsOptional()
  @IsInt({ message: 'next_due_hours debe ser un número entero' })
  next_due_hours?: number;

  @IsOptional()
  @IsInt({ message: 'last_completed_hours debe ser un número entero' })
  last_completed_hours?: number;
}

/**
 * DTO for generating tasks from schedules
 */
export class GenerateTasksDto {
  @IsOptional()
  @IsInt({ message: 'days_ahead debe ser un número entero' })
  @Min(1, { message: 'days_ahead debe ser al menos 1' })
  days_ahead?: number;
}

/**
 * DTO for completing a maintenance schedule
 */
export class CompleteScheduleDto {
  @IsOptional()
  @IsInt({ message: 'completion_hours debe ser un número entero' })
  @Min(0, { message: 'completion_hours no puede ser negativo' })
  completion_hours?: number;
}
