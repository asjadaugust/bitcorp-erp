/**
 * Scheduled Task DTO
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
  IsDateString,
  IsBoolean,
  IsIn,
  Min,
  MaxLength,
} from 'class-validator';
import { ScheduledTask } from '../../models/scheduled-task.model';

/**
 * DTO for scheduled tasks with Spanish snake_case fields
 */
export interface ScheduledTaskDto {
  id: number;
  programa_mantenimiento_id: number | null;
  equipo_id: number;
  trabajador_id: number | null;
  task_type: string;
  title: string;
  description: string | null;
  start_date: string; // ISO date string (YYYY-MM-DD)
  end_date: string | null; // ISO date string (YYYY-MM-DD)
  start_time: string | null;
  end_time: string | null;
  all_day: boolean;
  recurrence: string | null;
  duration_minutes: number;
  priority: string;
  status: string;
  completion_date: string | null; // ISO datetime string
  completion_notes: string | null;
  maintenance_record_id: number | null;
  creado_por: number | null;
  asignado_por: number | null;
  proyecto_id: number | null;
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string

  // Computed relation fields
  equipo_codigo?: string | null;
  proyecto_nombre?: string | null;
}

/**
 * Dual input format DTO for create operations
 * Supports both English camelCase (frontend) and Spanish snake_case (API/tests)
 */
export interface CreateScheduledTaskDto {
  programa_mantenimiento_id?: number;
  equipo_id?: number;
  trabajador_id?: number;
  task_type?: string;
  title?: string;
  description?: string;
  start_date?: string | Date;
  end_date?: string | Date;
  start_time?: string;
  end_time?: string;
  all_day?: boolean;
  recurrence?: string;
  duration_minutes?: number;
  priority?: string;
  status?: string;
  completion_date?: string;
  completion_notes?: string;
  maintenance_record_id?: number;
  creado_por?: number;
  asignado_por?: number;
  proyecto_id?: number;
  schedule_id?: number;
  equipment_id?: number;
  operator_id?: number;
  created_by?: number;
  assigned_by?: number;
  project_id?: number;
}

/**
 * Update DTO - partial version of CreateScheduledTaskDto
 */
export interface UpdateScheduledTaskDto extends Partial<CreateScheduledTaskDto> {}

/**
 * Validation DTO for creating a scheduled task
 */
export class ScheduledTaskCreateDto {
  @IsOptional()
  @IsInt({ message: 'El ID del programa de mantenimiento debe ser un número entero' })
  schedule_id?: number;

  @IsNotEmpty({ message: 'El ID del equipo es requerido' })
  @IsInt({ message: 'El ID del equipo debe ser un número entero' })
  equipment_id!: number;

  @IsOptional()
  @IsInt({ message: 'El ID del trabajador debe ser un número entero' })
  operator_id?: number;

  @IsOptional()
  @IsInt({ message: 'El ID del proyecto debe ser un número entero' })
  project_id?: number;

  @IsNotEmpty({ message: 'El tipo de tarea es requerido' })
  @IsIn(['maintenance', 'inspection', 'repair', 'operation', 'other'], {
    message: 'El tipo de tarea debe ser: maintenance, inspection, repair, operation, other',
  })
  task_type!: string;

  @IsNotEmpty({ message: 'El título es requerido' })
  @IsString({ message: 'El título debe ser texto' })
  @MaxLength(200, { message: 'El título no puede exceder 200 caracteres' })
  title!: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  @MaxLength(1000, { message: 'La descripción no puede exceder 1000 caracteres' })
  description?: string;

  @IsNotEmpty({ message: 'La fecha de inicio es requerida' })
  @IsDateString({}, { message: 'La fecha de inicio debe ser una fecha válida (ISO 8601)' })
  scheduled_date!: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de fin debe ser una fecha válida (ISO 8601)' })
  end_date?: string;

  @IsOptional()
  @IsString({ message: 'La hora de inicio debe ser texto (HH:mm)' })
  scheduled_time?: string;

  @IsOptional()
  @IsString({ message: 'La hora de fin debe ser texto (HH:mm)' })
  end_time?: string;

  @IsOptional()
  @IsBoolean({ message: 'all_day debe ser verdadero o falso' })
  all_day?: boolean;

  @IsOptional()
  @IsString({ message: 'La recurrencia debe ser texto' })
  recurrence?: string;

  @IsOptional()
  @IsInt({ message: 'La duración debe ser un número entero' })
  @Min(1, { message: 'La duración debe ser al menos 1 minuto' })
  duration_minutes?: number;

  @IsOptional()
  @IsIn(['low', 'normal', 'high', 'urgent'], {
    message: 'La prioridad debe ser: low, normal, high, urgent',
  })
  priority?: string;

  @IsOptional()
  @IsIn(['pending', 'assigned', 'in_progress', 'completed', 'cancelled'], {
    message: 'El estado debe ser: pending, assigned, in_progress, completed, cancelled',
  })
  status?: string;
}

/**
 * Validation DTO for updating a scheduled task
 */
export class ScheduledTaskUpdateDto {
  @IsOptional()
  @IsInt({ message: 'El ID del programa de mantenimiento debe ser un número entero' })
  schedule_id?: number;

  @IsOptional()
  @IsInt({ message: 'El ID del equipo debe ser un número entero' })
  equipment_id?: number;

  @IsOptional()
  @IsInt({ message: 'El ID del trabajador debe ser un número entero' })
  operator_id?: number;

  @IsOptional()
  @IsInt({ message: 'El ID del proyecto debe ser un número entero' })
  project_id?: number;

  @IsOptional()
  @IsIn(['maintenance', 'inspection', 'repair', 'operation', 'other'], {
    message: 'El tipo de tarea debe ser: maintenance, inspection, repair, operation, other',
  })
  task_type?: string;

  @IsOptional()
  @IsString({ message: 'El título debe ser texto' })
  @MaxLength(200, { message: 'El título no puede exceder 200 caracteres' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  @MaxLength(1000, { message: 'La descripción no puede exceder 1000 caracteres' })
  description?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de inicio debe ser una fecha válida (ISO 8601)' })
  scheduled_date?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de fin debe ser una fecha válida (ISO 8601)' })
  end_date?: string;

  @IsOptional()
  @IsString({ message: 'La hora de inicio debe ser texto (HH:mm)' })
  scheduled_time?: string;

  @IsOptional()
  @IsString({ message: 'La hora de fin debe ser texto (HH:mm)' })
  end_time?: string;

  @IsOptional()
  @IsBoolean({ message: 'all_day debe ser verdadero o falso' })
  all_day?: boolean;

  @IsOptional()
  @IsString({ message: 'La recurrencia debe ser texto' })
  recurrence?: string;

  @IsOptional()
  @IsInt({ message: 'La duración debe ser un número entero' })
  @Min(1, { message: 'La duración debe ser al menos 1 minuto' })
  duration_minutes?: number;

  @IsOptional()
  @IsIn(['low', 'normal', 'high', 'urgent'], {
    message: 'La prioridad debe ser: low, normal, high, urgent',
  })
  priority?: string;

  @IsOptional()
  @IsIn(['pending', 'assigned', 'in_progress', 'completed', 'cancelled'], {
    message: 'El estado debe ser: pending, assigned, in_progress, completed, cancelled',
  })
  status?: string;

  @IsOptional()
  @IsString({ message: 'Las notas de completación deben ser texto' })
  @MaxLength(1000, { message: 'Las notas de completación no pueden exceder 1000 caracteres' })
  completion_notes?: string;

  @IsOptional()
  @IsInt({ message: 'El ID del registro de mantenimiento debe ser un número entero' })
  maintenance_record_id?: number;
}

/**
 * Convert entity to DTO
 * @param entity - ScheduledTask entity from database
 * @returns ScheduledTaskDto with Spanish snake_case fields
 */
export function toScheduledTaskDto(entity: ScheduledTask): ScheduledTaskDto {
  // Helper to convert Date to ISO date string (YYYY-MM-DD only)
  const toDateString = (date?: Date | string): string | null => {
    if (!date) return null;
    if (typeof date === 'string') return date.split('T')[0];
    return date.toISOString().split('T')[0];
  };

  // Helper to convert Date to ISO datetime string
  const toDateTimeString = (date?: Date | string): string | null => {
    if (!date) return null;
    if (typeof date === 'string') return date;
    return date.toISOString();
  };

  return {
    id: entity.id,
    programa_mantenimiento_id: entity.scheduleId || null,
    equipo_id: entity.equipmentId,
    trabajador_id: entity.operatorId || null,
    task_type: entity.taskType,
    title: entity.title,
    description: entity.description || null,
    start_date: toDateString(entity.startDate) || '',
    end_date: toDateString(entity.endDate),
    start_time: entity.startTime || null,
    end_time: entity.endTime || null,
    all_day: entity.allDay || false,
    recurrence: entity.recurrence || null,
    duration_minutes: entity.durationMinutes,
    priority: entity.priority,
    status: entity.status,
    completion_date: toDateTimeString(entity.completionDate),
    completion_notes: entity.completionNotes || null,
    maintenance_record_id: entity.maintenanceRecordId || null,
    creado_por: entity.createdBy || null,
    asignado_por: entity.assignedBy || null,
    proyecto_id: entity.projectId || null,
    created_at: entity.createdAt.toISOString(),
    updated_at: entity.updatedAt.toISOString(),

    // Relation fields (if loaded)
    equipo_codigo: entity.equipment?.codigoEquipo || null,
    proyecto_nombre: entity.project?.nombre || null,
  };
}

/**
 * Convert DTO to entity (for create/update operations)
 * @param dto - Partial ScheduledTaskDto with Spanish snake_case fields
 * @returns Partial entity ready for TypeORM
 */
export function fromScheduledTaskDto(dto: Partial<ScheduledTaskDto>): Partial<ScheduledTask> {
  // Helper to parse date string to Date object
  const parseDate = (dateStr?: string): Date | undefined => {
    if (!dateStr) return undefined;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? undefined : date;
  };

  const entity: Partial<ScheduledTask> = {};

  if (dto.id !== undefined) entity.id = dto.id;
  if (dto.programa_mantenimiento_id !== undefined)
    entity.scheduleId = dto.programa_mantenimiento_id || undefined;
  if (dto.equipo_id !== undefined) entity.equipmentId = dto.equipo_id;
  if (dto.trabajador_id !== undefined) entity.operatorId = dto.trabajador_id || undefined;
  if (dto.task_type !== undefined) entity.taskType = dto.task_type;
  if (dto.title !== undefined) entity.title = dto.title;
  if (dto.description !== undefined) entity.description = dto.description || undefined;
  if (dto.start_date !== undefined) entity.startDate = parseDate(dto.start_date);
  if (dto.end_date !== undefined) entity.endDate = parseDate(dto.end_date);
  if (dto.start_time !== undefined) entity.startTime = dto.start_time || undefined;
  if (dto.end_time !== undefined) entity.endTime = dto.end_time || undefined;
  if (dto.all_day !== undefined) entity.allDay = dto.all_day;
  if (dto.recurrence !== undefined) entity.recurrence = dto.recurrence || undefined;
  if (dto.duration_minutes !== undefined) entity.durationMinutes = dto.duration_minutes;
  if (dto.priority !== undefined) entity.priority = dto.priority;
  if (dto.status !== undefined) entity.status = dto.status;
  if (dto.completion_date !== undefined) entity.completionDate = parseDate(dto.completion_date);
  if (dto.completion_notes !== undefined)
    entity.completionNotes = dto.completion_notes || undefined;
  if (dto.maintenance_record_id !== undefined)
    entity.maintenanceRecordId = dto.maintenance_record_id || undefined;
  if (dto.creado_por !== undefined) entity.createdBy = dto.creado_por || undefined;
  if (dto.asignado_por !== undefined) entity.assignedBy = dto.asignado_por || undefined;
  if (dto.proyecto_id !== undefined) entity.projectId = dto.proyecto_id || undefined;

  return entity;
}

/**
 * Map dual input format to standard DTO format
 * Handles both English camelCase and Spanish snake_case inputs
 */
export function mapCreateScheduledTaskDto(
  input: CreateScheduledTaskDto
): Partial<ScheduledTaskDto> {
  // Handle date conversion if Date object is provided
  const convertDate = (date?: string | Date): string | undefined => {
    if (!date) return undefined;
    if (typeof date === 'string') return date;
    return date.toISOString().split('T')[0];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const i = input as any;
  return {
    programa_mantenimiento_id: input.programa_mantenimiento_id ?? i.scheduleId,
    equipo_id: input.equipo_id ?? i.equipmentId,
    trabajador_id: input.trabajador_id ?? i.operatorId,
    task_type: input.task_type ?? i.taskType,
    title: input.title,
    description: input.description,
    start_date: convertDate(input.start_date) ?? convertDate(i.startDate),
    end_date: convertDate(input.end_date) ?? convertDate(i.endDate),
    start_time: input.start_time ?? i.startTime,
    end_time: input.end_time ?? i.endTime,
    all_day: input.all_day ?? i.allDay,
    recurrence: input.recurrence,
    duration_minutes: input.duration_minutes ?? i.durationMinutes,
    priority: input.priority,
    status: input.status,
    completion_date: input.completion_date ?? i.completionDate,
    completion_notes: input.completion_notes ?? i.completionNotes,
    maintenance_record_id: input.maintenance_record_id ?? i.maintenanceRecordId,
    creado_por: input.creado_por ?? i.createdBy,
    asignado_por: input.asignado_por ?? i.assignedBy,
    proyecto_id: input.proyecto_id ?? i.projectId,
  };
}

/**
 * DTO for assigning an operator to a scheduled task
 */
export class AssignOperatorDto {
  @IsNotEmpty({ message: 'El ID del operador es requerido' })
  @IsInt({ message: 'El ID del operador debe ser numérico' })
  operator_id!: number;
}
