/**
 * Maintenance Schedule Recurring DTO
 *
 * Following ARCHITECTURE.md guidelines:
 * - Uses Spanish snake_case field names matching API conventions
 * - DTO transformation happens in service layer
 * - Returns Spanish column names to API
 *
 * This DTO handles RECURRING maintenance schedules (e.g., "change oil every 250 hours").
 * For one-time maintenance work orders, use MaintenanceDto.
 */

import {
  MaintenanceScheduleRecurring,
  MaintenanceType,
  IntervalType,
  ScheduleStatus,
} from '../../models/maintenance-schedule-recurring.model';
import { IsInt, IsIn, IsOptional, IsString, IsBoolean, MaxLength, Min } from 'class-validator';

/**
 * DTO for recurring maintenance schedules with Spanish snake_case fields
 */
export interface MaintenanceScheduleRecurringDto {
  id: number;
  equipment_id: number;
  project_id?: number;
  maintenance_type: MaintenanceType;
  interval_type: IntervalType;
  interval_value: number;
  description?: string;
  notes?: string;
  status: ScheduleStatus;
  auto_generate_tasks: boolean;
  last_completed_date?: string; // ISO date string (YYYY-MM-DD)
  last_completed_hours?: number;
  next_due_date?: string; // ISO date string (YYYY-MM-DD)
  next_due_hours?: number;
  created_by_id?: number;
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string

  // Computed relation fields
  equipment_code?: string;
  equipment_name?: string;
  equipment_brand?: string;
  project_name?: string;
}

/**
 * Dual input format DTO for create operations
 * Supports both English camelCase (frontend/legacy) and Spanish snake_case (API/tests)
 */
export interface CreateMaintenanceScheduleRecurringDto {
  // Spanish snake_case (preferred)
  equipment_id?: number;
  project_id?: number;
  maintenance_type?: MaintenanceType;
  interval_type?: IntervalType;
  interval_value?: number;
  description?: string;
  notes?: string;
  auto_generate_tasks?: boolean;
  created_by_id?: number;

  // English camelCase (backward compatibility)
  equipmentId?: number;
  projectId?: number;
  maintenanceType?: MaintenanceType;
  intervalType?: IntervalType;
  intervalValue?: number;
  autoGenerateTasks?: boolean;
  createdById?: number;
}

/**
 * Update DTO - partial version of CreateMaintenanceScheduleRecurringDto
 */
export interface UpdateMaintenanceScheduleRecurringDto
  extends Partial<CreateMaintenanceScheduleRecurringDto> {
  // Additional update-only fields
  status?: ScheduleStatus;
  next_due_date?: string;
  next_due_hours?: number;
  last_completed_date?: string;
  last_completed_hours?: number;

  // English camelCase (backward compatibility)
  nextDueDate?: string;
  nextDueHours?: number;
  lastCompletedDate?: string;
  lastCompletedHours?: number;
}

/**
 * Filter DTO for list queries with snake_case fields
 */
export interface MaintenanceScheduleRecurringFilterDto {
  equipment_id?: number;
  project_id?: number;
  status?: ScheduleStatus;
  maintenance_type?: MaintenanceType;
  is_active?: boolean;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';

  // English camelCase (backward compatibility)
  equipmentId?: number;
  projectId?: number;
  maintenanceType?: MaintenanceType;
  isActive?: boolean;
}

/**
 * Convert entity to DTO
 * @param entity - MaintenanceScheduleRecurring entity from database
 * @returns MaintenanceScheduleRecurringDto with Spanish snake_case fields
 */
export function toMaintenanceScheduleRecurringDto(
  entity: MaintenanceScheduleRecurring
): MaintenanceScheduleRecurringDto {
  // Helper to convert Date to ISO date string (YYYY-MM-DD only)
  const toDateString = (date?: Date | string): string | undefined => {
    if (!date) return undefined;
    if (typeof date === 'string') return date.split('T')[0];
    return date.toISOString().split('T')[0];
  };

  // Helper to convert Date to ISO datetime string
  const toDateTimeString = (date?: Date | string): string => {
    if (!date) return new Date().toISOString();
    if (typeof date === 'string') return date;
    return date.toISOString();
  };

  return {
    id: entity.id,
    equipment_id: entity.equipmentId,
    project_id: entity.projectId,
    maintenance_type: entity.maintenanceType,
    interval_type: entity.intervalType,
    interval_value: entity.intervalValue,
    description: entity.description,
    notes: entity.notes,
    status: entity.status,
    auto_generate_tasks: entity.autoGenerateTasks,
    last_completed_date: toDateString(entity.lastCompletedDate),
    last_completed_hours: entity.lastCompletedHours,
    next_due_date: toDateString(entity.nextDueDate),
    next_due_hours: entity.nextDueHours,
    created_by_id: entity.createdById,
    created_at: toDateTimeString(entity.createdAt),
    updated_at: toDateTimeString(entity.updatedAt),

    // Relation fields (if loaded)
    equipment_code: entity.equipment?.codigo_equipo,
    equipment_name:
      entity.equipment?.marca && entity.equipment?.modelo
        ? `${entity.equipment.marca} ${entity.equipment.modelo}`
        : undefined,
    equipment_brand: entity.equipment?.marca,
    project_name: entity.project?.nombre,
  };
}

/**
 * Convert DTO to entity (for create/update operations)
 * @param dto - Partial MaintenanceScheduleRecurringDto with Spanish snake_case fields
 * @returns Partial entity ready for TypeORM
 */
export function fromMaintenanceScheduleRecurringDto(
  dto: Partial<MaintenanceScheduleRecurringDto>
): Partial<MaintenanceScheduleRecurring> {
  // Helper to parse date string to Date object
  const parseDate = (dateStr?: string): Date | undefined => {
    if (!dateStr) return undefined;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? undefined : date;
  };

  const entity: Partial<MaintenanceScheduleRecurring> = {};

  if (dto.id !== undefined) entity.id = dto.id;
  if (dto.equipment_id !== undefined) entity.equipmentId = dto.equipment_id;
  if (dto.project_id !== undefined) entity.projectId = dto.project_id;
  if (dto.maintenance_type !== undefined) entity.maintenanceType = dto.maintenance_type;
  if (dto.interval_type !== undefined) entity.intervalType = dto.interval_type;
  if (dto.interval_value !== undefined) entity.intervalValue = dto.interval_value;
  if (dto.description !== undefined) entity.description = dto.description;
  if (dto.notes !== undefined) entity.notes = dto.notes;
  if (dto.status !== undefined) entity.status = dto.status;
  if (dto.auto_generate_tasks !== undefined) entity.autoGenerateTasks = dto.auto_generate_tasks;
  if (dto.last_completed_date !== undefined)
    entity.lastCompletedDate = parseDate(dto.last_completed_date);
  if (dto.last_completed_hours !== undefined) entity.lastCompletedHours = dto.last_completed_hours;
  if (dto.next_due_date !== undefined) entity.nextDueDate = parseDate(dto.next_due_date);
  if (dto.next_due_hours !== undefined) entity.nextDueHours = dto.next_due_hours;
  if (dto.created_by_id !== undefined) entity.createdById = dto.created_by_id;

  return entity;
}

/**
 * Map dual input format to standard DTO format
 * Handles both English camelCase and Spanish snake_case inputs
 */
export function mapCreateMaintenanceScheduleRecurringDto(
  input: CreateMaintenanceScheduleRecurringDto
): Partial<MaintenanceScheduleRecurringDto> {
  return {
    equipment_id: input.equipment_id ?? input.equipmentId,
    project_id: input.project_id ?? input.projectId,
    maintenance_type: input.maintenance_type ?? input.maintenanceType,
    interval_type: input.interval_type ?? input.intervalType,
    interval_value: input.interval_value ?? input.intervalValue,
    description: input.description,
    notes: input.notes,
    auto_generate_tasks: input.auto_generate_tasks ?? input.autoGenerateTasks,
    created_by_id: input.created_by_id ?? input.createdById,
  };
}

/**
 * Map dual update format to standard DTO format
 * Handles both English camelCase and Spanish snake_case inputs
 */
export function mapUpdateMaintenanceScheduleRecurringDto(
  input: UpdateMaintenanceScheduleRecurringDto
): Partial<MaintenanceScheduleRecurringDto> {
  return {
    equipment_id: input.equipment_id ?? input.equipmentId,
    project_id: input.project_id ?? input.projectId,
    maintenance_type: input.maintenance_type ?? input.maintenanceType,
    interval_type: input.interval_type ?? input.intervalType,
    interval_value: input.interval_value ?? input.intervalValue,
    description: input.description,
    notes: input.notes,
    status: input.status,
    auto_generate_tasks: input.auto_generate_tasks ?? input.autoGenerateTasks,
    created_by_id: input.created_by_id ?? input.createdById,
    next_due_date: input.next_due_date ?? input.nextDueDate,
    next_due_hours: input.next_due_hours ?? input.nextDueHours,
    last_completed_date: input.last_completed_date ?? input.lastCompletedDate,
    last_completed_hours: input.last_completed_hours ?? input.lastCompletedHours,
  };
}

/**
 * Map dual filter format to standard filter format
 */
export function mapMaintenanceScheduleRecurringFilterDto(
  input: MaintenanceScheduleRecurringFilterDto
): MaintenanceScheduleRecurringFilterDto {
  return {
    equipment_id: input.equipment_id ?? input.equipmentId,
    project_id: input.project_id ?? input.projectId,
    status: input.status,
    maintenance_type: input.maintenance_type ?? input.maintenanceType,
    is_active: input.is_active ?? input.isActive,
    page: input.page,
    limit: input.limit,
    sort_by: input.sort_by,
    sort_order: input.sort_order,
  };
}

/**
 * DTO for creating a new recurring maintenance schedule with validation
 */
export class MaintenanceScheduleRecurringCreateDto {
  @IsInt({ message: 'ID de equipo debe ser un número entero' })
  equipment_id!: number;

  @IsOptional()
  @IsInt({ message: 'ID de proyecto debe ser un número entero' })
  project_id?: number;

  @IsIn(['preventive', 'corrective', 'predictive', 'calibration', 'inspection'], {
    message:
      'Tipo de mantenimiento debe ser preventive, corrective, predictive, calibration o inspection',
  })
  maintenance_type!: MaintenanceType;

  @IsIn(['hours', 'days', 'weeks', 'months', 'kilometers'], {
    message: 'Tipo de intervalo debe ser hours, days, weeks, months o kilometers',
  })
  interval_type!: IntervalType;

  @IsInt({ message: 'Valor de intervalo debe ser un número entero' })
  @Min(1, { message: 'Valor de intervalo debe ser mayor a 0' })
  interval_value!: number;

  @IsOptional()
  @IsString({ message: 'Descripción debe ser texto' })
  @MaxLength(500, { message: 'Descripción no puede exceder 500 caracteres' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'Notas debe ser texto' })
  notes?: string;

  @IsOptional()
  @IsBoolean({ message: 'Auto generar tareas debe ser verdadero o falso' })
  auto_generate_tasks?: boolean;

  @IsOptional()
  @IsInt({ message: 'ID de creador debe ser un número entero' })
  created_by_id?: number;
}

/**
 * DTO for updating a recurring maintenance schedule (all fields optional)
 */
export class MaintenanceScheduleRecurringUpdateDto {
  @IsOptional()
  @IsInt({ message: 'ID de equipo debe ser un número entero' })
  equipment_id?: number;

  @IsOptional()
  @IsInt({ message: 'ID de proyecto debe ser un número entero' })
  project_id?: number;

  @IsOptional()
  @IsIn(['preventive', 'corrective', 'predictive', 'calibration', 'inspection'], {
    message:
      'Tipo de mantenimiento debe ser preventive, corrective, predictive, calibration o inspection',
  })
  maintenance_type?: MaintenanceType;

  @IsOptional()
  @IsIn(['hours', 'days', 'weeks', 'months', 'kilometers'], {
    message: 'Tipo de intervalo debe ser hours, days, weeks, months o kilometers',
  })
  interval_type?: IntervalType;

  @IsOptional()
  @IsInt({ message: 'Valor de intervalo debe ser un número entero' })
  @Min(1, { message: 'Valor de intervalo debe ser mayor a 0' })
  interval_value?: number;

  @IsOptional()
  @IsString({ message: 'Descripción debe ser texto' })
  @MaxLength(500, { message: 'Descripción no puede exceder 500 caracteres' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'Notas debe ser texto' })
  notes?: string;

  @IsOptional()
  @IsIn(['active', 'inactive', 'suspended', 'completed'], {
    message: 'Estado debe ser active, inactive, suspended o completed',
  })
  status?: ScheduleStatus;

  @IsOptional()
  @IsBoolean({ message: 'Auto generar tareas debe ser verdadero o falso' })
  auto_generate_tasks?: boolean;
}
