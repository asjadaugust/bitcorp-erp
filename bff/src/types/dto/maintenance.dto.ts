/**
 * Maintenance Schedule DTO
 *
 * Following ARCHITECTURE.md guidelines:
 * - Uses Spanish snake_case field names matching database columns
 * - DTO transformation happens in service layer
 * - Returns Spanish column names to API
 */

import {
  MaintenanceSchedule,
  TipoMantenimiento,
  EstadoMantenimiento,
} from '../../models/maintenance-schedule.model';
import {
  IsInt,
  IsIn,
  IsOptional,
  IsString,
  IsDateString,
  IsNumber,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * DTO for maintenance schedules with Spanish snake_case fields
 */
export interface MaintenanceDto {
  id: number;
  equipo_id: number;
  tipo_mantenimiento: TipoMantenimiento;
  descripcion: string | null;
  fecha_programada: string | null; // ISO date string (YYYY-MM-DD)
  fecha_realizada: string | null; // ISO date string (YYYY-MM-DD)
  costo_estimado: number | null;
  costo_real: number | null;
  tecnico_responsable: string | null;
  estado: EstadoMantenimiento;
  observaciones: string | null;
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string

  // Computed relation fields
  equipo?: {
    id: number;
    codigo_equipo: string;
    marca: string;
    modelo: string;
  };
  equipo_codigo?: string | null;
  equipo_descripcion?: string | null;
}

/**
 * Dual input format DTO for create operations
 * Supports both English camelCase (frontend) and Spanish snake_case (API/tests)
 */
export interface CreateMaintenanceDto {
  // Spanish snake_case (preferred)
  equipo_id?: number;
  tipo_mantenimiento?: TipoMantenimiento;
  descripcion?: string;
  fecha_programada?: string;
  fecha_realizada?: string;
  costo_estimado?: number;
  costo_real?: number;
  tecnico_responsable?: string;
  estado?: EstadoMantenimiento;
  observaciones?: string;

  // Additional English fields (backward compatibility)
  equipment_id?: number;
  maintenance_type?: TipoMantenimiento;
  description?: string;
  start_date?: string;
  maintenance_date?: string;
  completion_date?: string;
  cost?: number;
  actual_cost?: number;
  technician?: string;
  status?: EstadoMantenimiento;
  notes?: string;
}

/**
 * Update DTO - partial version of CreateMaintenanceDto
 */
export interface UpdateMaintenanceDto extends Partial<CreateMaintenanceDto> {}

/**
 * Convert entity to DTO
 * @param entity - MaintenanceSchedule entity from database
 * @returns MaintenanceDto with Spanish snake_case fields
 */
export function toMaintenanceDto(entity: MaintenanceSchedule): MaintenanceDto {
  // Helper to convert Date to ISO date string (YYYY-MM-DD only)
  const toDateString = (date?: Date | string): string | null => {
    if (!date) return null;
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
    equipo_id: entity.equipoId,
    tipo_mantenimiento: entity.tipoMantenimiento,
    descripcion: entity.descripcion || null,
    fecha_programada: toDateString(entity.fechaProgramada),
    fecha_realizada: toDateString(entity.fechaRealizada),
    costo_estimado: entity.costoEstimado ? Number(entity.costoEstimado) : null,
    costo_real: entity.costoReal ? Number(entity.costoReal) : null,
    tecnico_responsable: entity.tecnicoResponsable || null,
    estado: entity.estado,
    observaciones: entity.observaciones || null,
    created_at: toDateTimeString(entity.createdAt),
    updated_at: toDateTimeString(entity.updatedAt),

    // Relation fields (if loaded)
    equipo: entity.equipo
      ? {
          id: entity.equipo.id,
          codigo_equipo: entity.equipo.codigoEquipo,
          marca: entity.equipo.marca || '',
          modelo: entity.equipo.modelo || '',
        }
      : undefined,
    equipo_codigo: entity.equipo?.codigoEquipo || null,
    equipo_descripcion:
      entity.equipo?.marca && entity.equipo?.modelo
        ? `${entity.equipo.marca} ${entity.equipo.modelo}`
        : null,
  };
}

/**
 * Convert DTO to entity (for create/update operations)
 * @param dto - Partial MaintenanceDto with Spanish snake_case fields
 * @returns Partial entity ready for TypeORM
 */
export function fromMaintenanceDto(dto: Partial<MaintenanceDto>): Partial<MaintenanceSchedule> {
  // Helper to parse date string to Date object
  const parseDate = (dateStr?: string): Date | undefined => {
    if (!dateStr) return undefined;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? undefined : date;
  };

  const entity: Partial<MaintenanceSchedule> = {};

  if (dto.id !== undefined) entity.id = dto.id;
  if (dto.equipo_id !== undefined) entity.equipoId = dto.equipo_id;
  if (dto.tipo_mantenimiento !== undefined) entity.tipoMantenimiento = dto.tipo_mantenimiento;
  if (dto.descripcion !== undefined) entity.descripcion = dto.descripcion || undefined;
  if (dto.fecha_programada !== undefined) entity.fechaProgramada = parseDate(dto.fecha_programada);
  if (dto.fecha_realizada !== undefined) entity.fechaRealizada = parseDate(dto.fecha_realizada);
  if (dto.costo_estimado !== undefined) entity.costoEstimado = dto.costo_estimado || undefined;
  if (dto.costo_real !== undefined) entity.costoReal = dto.costo_real || undefined;
  if (dto.tecnico_responsable !== undefined)
    entity.tecnicoResponsable = dto.tecnico_responsable || undefined;
  if (dto.estado !== undefined) entity.estado = dto.estado;
  if (dto.observaciones !== undefined) entity.observaciones = dto.observaciones || undefined;

  return entity;
}

/**
 * Map dual input format to standard DTO format
 * Handles both English camelCase and Spanish snake_case inputs
 */
export function mapCreateMaintenanceDto(input: CreateMaintenanceDto): Partial<MaintenanceDto> {
  return {
    equipo_id: input.equipo_id ?? input.equipment_id,
    tipo_mantenimiento: input.tipo_mantenimiento ?? input.maintenance_type,
    descripcion: input.descripcion ?? input.description,
    fecha_programada: input.fecha_programada ?? input.start_date ?? input.maintenance_date,
    fecha_realizada: input.fecha_realizada ?? input.completion_date,
    costo_estimado: input.costo_estimado ?? input.cost,
    costo_real: input.costo_real ?? input.actual_cost,
    tecnico_responsable: input.tecnico_responsable ?? input.technician,
    estado: input.estado ?? input.status,
    observaciones: input.observaciones ?? input.notes,
  };
}

/**
 * DTO for creating a new maintenance record with validation
 */
export class MaintenanceCreateDto {
  @IsInt({ message: 'ID de equipo debe ser un número entero' })
  equipo_id!: number;

  @IsIn(['PREVENTIVO', 'CORRECTIVO', 'PREDICTIVO'], {
    message: 'Tipo de mantenimiento debe ser PREVENTIVO, CORRECTIVO o PREDICTIVO',
  })
  tipo_mantenimiento!: TipoMantenimiento;

  @IsOptional()
  @IsString({ message: 'Descripción debe ser texto' })
  @MaxLength(500, { message: 'Descripción no puede exceder 500 caracteres' })
  descripcion?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Fecha programada debe ser una fecha válida (YYYY-MM-DD)' })
  fecha_programada?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Fecha realizada debe ser una fecha válida (YYYY-MM-DD)' })
  fecha_realizada?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Costo estimado debe ser un número' })
  @Min(0, { message: 'Costo estimado debe ser mayor o igual a 0' })
  costo_estimado?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Costo real debe ser un número' })
  @Min(0, { message: 'Costo real debe ser mayor o igual a 0' })
  costo_real?: number;

  @IsOptional()
  @IsString({ message: 'Técnico responsable debe ser texto' })
  @MaxLength(200, { message: 'Técnico responsable no puede exceder 200 caracteres' })
  tecnico_responsable?: string;

  @IsIn(['PROGRAMADO', 'EN_PROCESO', 'COMPLETADO', 'CANCELADO'], {
    message: 'Estado debe ser PROGRAMADO, EN_PROCESO, COMPLETADO o CANCELADO',
  })
  estado!: EstadoMantenimiento;

  @IsOptional()
  @IsString({ message: 'Observaciones debe ser texto' })
  observaciones?: string;
}

/**
 * DTO for updating a maintenance record (all fields optional)
 */
export class MaintenanceUpdateDto {
  @IsOptional()
  @IsInt({ message: 'ID de equipo debe ser un número entero' })
  equipo_id?: number;

  @IsOptional()
  @IsIn(['PREVENTIVO', 'CORRECTIVO', 'PREDICTIVO'], {
    message: 'Tipo de mantenimiento debe ser PREVENTIVO, CORRECTIVO o PREDICTIVO',
  })
  tipo_mantenimiento?: TipoMantenimiento;

  @IsOptional()
  @IsString({ message: 'Descripción debe ser texto' })
  @MaxLength(500, { message: 'Descripción no puede exceder 500 caracteres' })
  descripcion?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Fecha programada debe ser una fecha válida (YYYY-MM-DD)' })
  fecha_programada?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Fecha realizada debe ser una fecha válida (YYYY-MM-DD)' })
  fecha_realizada?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Costo estimado debe ser un número' })
  @Min(0, { message: 'Costo estimado debe ser mayor o igual a 0' })
  costo_estimado?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Costo real debe ser un número' })
  @Min(0, { message: 'Costo real debe ser mayor o igual a 0' })
  costo_real?: number;

  @IsOptional()
  @IsString({ message: 'Técnico responsable debe ser texto' })
  @MaxLength(200, { message: 'Técnico responsable no puede exceder 200 caracteres' })
  tecnico_responsable?: string;

  @IsOptional()
  @IsIn(['PROGRAMADO', 'EN_PROCESO', 'COMPLETADO', 'CANCELADO'], {
    message: 'Estado debe ser PROGRAMADO, EN_PROCESO, COMPLETADO o CANCELADO',
  })
  estado?: EstadoMantenimiento;

  @IsOptional()
  @IsString({ message: 'Observaciones debe ser texto' })
  observaciones?: string;
}
