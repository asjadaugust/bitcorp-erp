/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Timesheet DTOs
 * Maps Spanish database columns to snake_case API contract
 * Following architecture guidelines in ARCHITECTURE.md section 3.2
 *
 * Timesheet (Tareo) system manages employee work hours:
 * - Tareo: Monthly timesheet for a trabajador
 * - Detalle Tareo: Daily entries within a timesheet
 */

import { IsNumber, IsString, IsOptional, Min, Matches, MaxLength } from 'class-validator';

// ===== TIMESHEET DTOs =====

/**
 * Timesheet List DTO - for listing/grid views
 */
export interface TimesheetListDto {
  id: number;
  trabajador_id: number;
  trabajador_nombre: string | null; // From join
  periodo: string; // Format: YYYY-MM
  total_dias_trabajados: number;
  total_horas: number;
  estado: string; // BORRADOR, ENVIADO, APROBADO, RECHAZADO
  creado_por: number | null;
  aprobado_por: number | null;
  created_at: string;
}

/**
 * Timesheet Detail DTO - full timesheet with relations
 */
export interface TimesheetDetailDto {
  id: number;
  trabajador_id: number;
  trabajador_nombre: string | null; // From join
  periodo: string;
  total_dias_trabajados: number;
  total_horas: number;
  estado: string;
  observaciones: string | null;
  creado_por: number | null;
  creador_nombre: string | null; // From join
  aprobado_por: number | null;
  aprobador_nombre: string | null; // From join
  aprobado_en: string | null; // ISO datetime
  created_at: string;
  updated_at: string;
}

/**
 * Timesheet With Details DTO - includes daily entries
 */
export interface TimesheetWithDetailsDto extends TimesheetDetailDto {
  detalles: TimesheetDetailEntryDto[];
}

/**
 * Timesheet Detail Entry DTO - single day entry
 */
export interface TimesheetDetailEntryDto {
  id: number;
  tareo_id: number;
  fecha: string; // ISO date
  proyecto_id: number | null;
  proyecto_nombre: string | null; // From join
  horas_trabajadas: number;
  horas_extras: number;
  tipo_jornada: string | null; // COMPLETA, MEDIA, OTRO
  observaciones: string | null;
  created_at: string;
}

/**
 * Timesheet Create DTO - for generating new timesheet
 */
export class TimesheetCreateDto {
  @IsNumber({}, { message: 'trabajador_id debe ser un número' })
  trabajador_id!: number;

  @IsString({ message: 'periodo debe ser un string' })
  @Matches(/^\d{4}-\d{2}$/, { message: 'periodo debe tener formato YYYY-MM (ej: 2026-01)' })
  periodo!: string; // Format: YYYY-MM

  @IsOptional()
  @IsNumber({}, { message: 'total_dias_trabajados debe ser un número' })
  @Min(0, { message: 'total_dias_trabajados no puede ser negativo' })
  total_dias_trabajados?: number;

  @IsOptional()
  @IsNumber({}, { message: 'total_horas debe ser un número' })
  @Min(0, { message: 'total_horas no puede ser negativo' })
  total_horas?: number;

  @IsOptional()
  @IsString({ message: 'observaciones debe ser un string' })
  @MaxLength(1000, { message: 'observaciones no puede exceder 1000 caracteres' })
  observaciones?: string;

  @IsOptional()
  @IsNumber({}, { message: 'creado_por debe ser un número' })
  creado_por?: number;
}

/**
 * Timesheet Update DTO - for updating draft timesheets
 * All fields optional for partial updates
 */
export class TimesheetUpdateDto {
  @IsOptional()
  @IsNumber({}, { message: 'total_dias_trabajados debe ser un número' })
  @Min(0, { message: 'total_dias_trabajados no puede ser negativo' })
  total_dias_trabajados?: number;

  @IsOptional()
  @IsNumber({}, { message: 'total_horas debe ser un número' })
  @Min(0, { message: 'total_horas no puede ser negativo' })
  total_horas?: number;

  @IsOptional()
  @IsString({ message: 'observaciones debe ser un string' })
  @MaxLength(1000, { message: 'observaciones no puede exceder 1000 caracteres' })
  observaciones?: string;
}

/**
 * Timesheet Reject DTO - for rejecting a timesheet with reason
 */
export class TimesheetRejectDto {
  @IsString({ message: 'reason debe ser un string' })
  @MaxLength(500, { message: 'reason no puede exceder 500 caracteres' })
  reason!: string;
}

// ===== TRANSFORMATION FUNCTIONS =====

/**
 * Transform Timesheet entity to List DTO
 */
export function toTimesheetListDto(entity: any): TimesheetListDto {
  return {
    id: entity.id,
    trabajador_id: entity.trabajadorId,
    trabajador_nombre: entity.trabajadorNombre || entity.trabajador?.nombreCompleto || null,
    periodo: entity.periodo,
    total_dias_trabajados: entity.totalDiasTrabajados || 0,
    total_horas: entity.totalHoras || 0,
    estado: entity.estado,
    creado_por: entity.creadoPor || null,
    aprobado_por: entity.aprobadoPor || null,
    created_at: entity.createdAt
      ? new Date(entity.createdAt).toISOString()
      : new Date().toISOString(),
  };
}

/**
 * Transform Timesheet entity to Detail DTO
 */
export function toTimesheetDetailDto(entity: any): TimesheetDetailDto {
  return {
    id: entity.id,
    trabajador_id: entity.trabajadorId,
    trabajador_nombre:
      entity.trabajadorNombre ||
      (entity.trabajador
        ? `${entity.trabajador.nombres || ''} ${entity.trabajador.apellidoPaterno || ''}`.trim()
        : null),
    periodo: entity.periodo,
    total_dias_trabajados: entity.totalDiasTrabajados || 0,
    total_horas: entity.totalHoras || 0,
    estado: entity.estado,
    observaciones: entity.observaciones || null,
    creado_por: entity.creadoPor || null,
    creador_nombre: entity.creador?.nombreCompleto || null,
    aprobado_por: entity.aprobadoPor || null,
    aprobador_nombre: entity.aprobador?.nombreCompleto || null,
    aprobado_en: entity.aprobadoEn ? new Date(entity.aprobadoEn).toISOString() : null,
    created_at: entity.createdAt
      ? new Date(entity.createdAt).toISOString()
      : new Date().toISOString(),
    updated_at: entity.updatedAt
      ? new Date(entity.updatedAt).toISOString()
      : new Date().toISOString(),
  };
}

/**
 * Transform Timesheet with details to WithDetails DTO
 */
export function toTimesheetWithDetailsDto(entity: any): TimesheetWithDetailsDto {
  const baseDto = toTimesheetDetailDto(entity);
  const detalles = entity.detalles || [];

  return {
    ...baseDto,
    detalles: detalles.map(toTimesheetDetailEntryDto),
  };
}

/**
 * Transform TimesheetDetail entity to Entry DTO
 */
export function toTimesheetDetailEntryDto(entity: any): TimesheetDetailEntryDto {
  return {
    id: entity.id,
    tareo_id: entity.tareoId,
    fecha: entity.fecha ? new Date(entity.fecha).toISOString().split('T')[0] : '',
    proyecto_id: entity.proyectoId || null,
    proyecto_nombre: entity.proyecto?.nombre || null,
    horas_trabajadas: entity.horasTrabajadas || 0,
    horas_extras: entity.horasExtras || 0,
    tipo_jornada: entity.tipoJornada || null,
    observaciones: entity.observaciones || null,
    created_at: entity.createdAt
      ? new Date(entity.createdAt).toISOString()
      : new Date().toISOString(),
  };
}

/**
 * Transform array of Timesheet entities to List DTOs
 */
export function toTimesheetListDtoArray(entities: any[]): TimesheetListDto[] {
  return entities.map(toTimesheetListDto);
}

/**
 * Transform array of TimesheetDetail entities to Entry DTOs
 */
export function toTimesheetDetailEntryDtoArray(entities: any[]): TimesheetDetailEntryDto[] {
  return entities.map(toTimesheetDetailEntryDto);
}

// ===== REVERSE TRANSFORMATIONS (for input DTOs) =====

/**
 * Transform Create DTO to entity data
 */
export function fromTimesheetCreateDto(dto: TimesheetCreateDto): any {
  return {
    trabajadorId: dto.trabajador_id,
    periodo: dto.periodo,
    totalDiasTrabajados: dto.total_dias_trabajados || 0,
    totalHoras: dto.total_horas || 0,
    observaciones: dto.observaciones || null,
    creadoPor: dto.creado_por || null,
    estado: 'BORRADOR', // Always start as draft
  };
}
