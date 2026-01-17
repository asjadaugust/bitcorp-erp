/**
 * Project DTO
 *
 * Following ARCHITECTURE.md guidelines:
 * - Uses Spanish snake_case field names matching database columns
 * - DTO transformation happens in service layer
 * - Returns Spanish column names to API
 */

import { Proyecto, EstadoProyecto } from '../../models/project.model';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsIn,
  MaxLength,
  IsDateString,
  Min,
} from 'class-validator';

export interface ProjectDto {
  id: number;
  legacy_id?: string | null;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  ubicacion?: string | null;
  fecha_inicio?: string | null; // ISO date string
  fecha_fin?: string | null; // ISO date string
  presupuesto?: number | null;
  estado: string; // PLANIFICACION, ACTIVO, PAUSADO, COMPLETADO, CANCELADO
  empresa_id?: number | null;
  unidad_operativa_id?: number | null;
  cliente?: string | null;
  is_active: boolean;
  creado_por?: number | null;
  actualizado_por?: number | null;
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string

  // Optional joined data
  creator?: {
    id: number;
    username: string;
    full_name: string;
  };
  updater?: {
    id: number;
    username: string;
    full_name: string;
  };
}

/**
 * Transform TypeORM entity to DTO (Spanish snake_case)
 * @param entity - Proyecto entity from database
 * @returns ProjectDto with Spanish field names
 */
export function toProjectDto(entity: Proyecto): ProjectDto {
  // Helper to convert Date or string to ISO date string (YYYY-MM-DD)
  const toDateString = (date?: Date | string | null): string | null => {
    if (!date) return null;
    if (typeof date === 'string') {
      // Already a string, extract YYYY-MM-DD
      return date.split('T')[0];
    }
    // It's a Date object
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
    legacy_id: entity.legacyId || null,
    codigo: entity.codigo,
    nombre: entity.nombre,
    descripcion: entity.descripcion || null,
    ubicacion: entity.ubicacion || null,
    fecha_inicio: toDateString(entity.fechaInicio),
    fecha_fin: toDateString(entity.fechaFin),
    presupuesto: entity.presupuesto || null,
    estado: entity.estado,
    empresa_id: entity.companyId || null,
    unidad_operativa_id: entity.operatingUnitId || null,
    cliente: entity.cliente || null,
    is_active: entity.isActive,
    creado_por: entity.createdBy || null,
    actualizado_por: entity.updatedBy || null,
    created_at: toDateTimeString(entity.createdAt),
    updated_at: toDateTimeString(entity.updatedAt),
    // Include joined relations if loaded
    creator: entity.creator
      ? {
          id: entity.creator.id,
          username: entity.creator.username,
          full_name: entity.creator.full_name || entity.creator.username,
        }
      : undefined,
    updater: entity.updater
      ? {
          id: entity.updater.id,
          username: entity.updater.username,
          full_name: entity.updater.full_name || entity.updater.username,
        }
      : undefined,
  };
}

/**
 * Transform DTO to TypeORM entity for create/update (Spanish snake_case → camelCase)
 * @param dto - ProjectDto from API request
 * @returns Partial<Proyecto> entity for database
 */
export function fromProjectDto(dto: Partial<ProjectDto>): Partial<Proyecto> {
  const entity: Partial<Proyecto> = {};

  if (dto.id !== undefined) entity.id = dto.id;
  if (dto.legacy_id !== undefined) entity.legacyId = dto.legacy_id || undefined;
  if (dto.codigo !== undefined) entity.codigo = dto.codigo;
  if (dto.nombre !== undefined) entity.nombre = dto.nombre;
  if (dto.descripcion !== undefined) entity.descripcion = dto.descripcion || undefined;
  if (dto.ubicacion !== undefined) entity.ubicacion = dto.ubicacion || undefined;
  if (dto.fecha_inicio !== undefined)
    entity.fechaInicio = dto.fecha_inicio ? new Date(dto.fecha_inicio) : undefined;
  if (dto.fecha_fin !== undefined)
    entity.fechaFin = dto.fecha_fin ? new Date(dto.fecha_fin) : undefined;
  if (dto.presupuesto !== undefined) entity.presupuesto = dto.presupuesto || undefined;
  if (dto.estado !== undefined) entity.estado = dto.estado as EstadoProyecto;
  if (dto.empresa_id !== undefined) entity.companyId = dto.empresa_id || undefined;
  if (dto.unidad_operativa_id !== undefined)
    entity.operatingUnitId = dto.unidad_operativa_id || undefined;
  if (dto.cliente !== undefined) entity.cliente = dto.cliente || undefined;
  if (dto.is_active !== undefined) entity.isActive = dto.is_active;
  if (dto.creado_por !== undefined) entity.createdBy = dto.creado_por || undefined;
  if (dto.actualizado_por !== undefined) entity.updatedBy = dto.actualizado_por || undefined;

  return entity;
}

/**
 * DTO for creating a new project
 * Validates required fields and business rules
 */
export class ProjectCreateDto {
  @IsOptional()
  @IsString({ message: 'legacy_id debe ser texto' })
  @MaxLength(50, { message: 'legacy_id no puede exceder 50 caracteres' })
  legacy_id?: string | null;

  @IsString({ message: 'codigo debe ser texto' })
  @MaxLength(50, { message: 'codigo no puede exceder 50 caracteres' })
  codigo!: string;

  @IsString({ message: 'nombre debe ser texto' })
  @MaxLength(200, { message: 'nombre no puede exceder 200 caracteres' })
  nombre!: string;

  @IsOptional()
  @IsString({ message: 'descripcion debe ser texto' })
  descripcion?: string | null;

  @IsOptional()
  @IsString({ message: 'ubicacion debe ser texto' })
  @MaxLength(200, { message: 'ubicacion no puede exceder 200 caracteres' })
  ubicacion?: string | null;

  @IsOptional()
  @IsDateString({}, { message: 'fecha_inicio debe ser una fecha válida (YYYY-MM-DD)' })
  fecha_inicio?: string | null;

  @IsOptional()
  @IsDateString({}, { message: 'fecha_fin debe ser una fecha válida (YYYY-MM-DD)' })
  fecha_fin?: string | null;

  @IsOptional()
  @IsNumber({}, { message: 'presupuesto debe ser un número' })
  @Min(0, { message: 'presupuesto debe ser mayor o igual a 0' })
  presupuesto?: number | null;

  @IsIn(['PLANIFICACION', 'ACTIVO', 'PAUSADO', 'COMPLETADO', 'CANCELADO'], {
    message: 'estado debe ser PLANIFICACION, ACTIVO, PAUSADO, COMPLETADO o CANCELADO',
  })
  estado!: string;

  @IsOptional()
  @IsNumber({}, { message: 'empresa_id debe ser un número' })
  empresa_id?: number | null;

  @IsOptional()
  @IsNumber({}, { message: 'unidad_operativa_id debe ser un número' })
  unidad_operativa_id?: number | null;

  @IsOptional()
  @IsString({ message: 'cliente debe ser texto' })
  @MaxLength(200, { message: 'cliente no puede exceder 200 caracteres' })
  cliente?: string | null;

  @IsOptional()
  @IsBoolean({ message: 'is_active debe ser true o false' })
  is_active?: boolean;

  @IsOptional()
  @IsNumber({}, { message: 'creado_por debe ser un número' })
  creado_por?: number | null;
}

/**
 * DTO for updating a project
 * All fields are optional for partial updates
 */
export class ProjectUpdateDto {
  @IsOptional()
  @IsString({ message: 'legacy_id debe ser texto' })
  @MaxLength(50, { message: 'legacy_id no puede exceder 50 caracteres' })
  legacy_id?: string | null;

  @IsOptional()
  @IsString({ message: 'codigo debe ser texto' })
  @MaxLength(50, { message: 'codigo no puede exceder 50 caracteres' })
  codigo?: string;

  @IsOptional()
  @IsString({ message: 'nombre debe ser texto' })
  @MaxLength(200, { message: 'nombre no puede exceder 200 caracteres' })
  nombre?: string;

  @IsOptional()
  @IsString({ message: 'descripcion debe ser texto' })
  descripcion?: string | null;

  @IsOptional()
  @IsString({ message: 'ubicacion debe ser texto' })
  @MaxLength(200, { message: 'ubicacion no puede exceder 200 caracteres' })
  ubicacion?: string | null;

  @IsOptional()
  @IsDateString({}, { message: 'fecha_inicio debe ser una fecha válida (YYYY-MM-DD)' })
  fecha_inicio?: string | null;

  @IsOptional()
  @IsDateString({}, { message: 'fecha_fin debe ser una fecha válida (YYYY-MM-DD)' })
  fecha_fin?: string | null;

  @IsOptional()
  @IsNumber({}, { message: 'presupuesto debe ser un número' })
  @Min(0, { message: 'presupuesto debe ser mayor o igual a 0' })
  presupuesto?: number | null;

  @IsOptional()
  @IsIn(['PLANIFICACION', 'ACTIVO', 'PAUSADO', 'COMPLETADO', 'CANCELADO'], {
    message: 'estado debe ser PLANIFICACION, ACTIVO, PAUSADO, COMPLETADO o CANCELADO',
  })
  estado?: string;

  @IsOptional()
  @IsNumber({}, { message: 'empresa_id debe ser un número' })
  empresa_id?: number | null;

  @IsOptional()
  @IsNumber({}, { message: 'unidad_operativa_id debe ser un número' })
  unidad_operativa_id?: number | null;

  @IsOptional()
  @IsString({ message: 'cliente debe ser texto' })
  @MaxLength(200, { message: 'cliente no puede exceder 200 caracteres' })
  cliente?: string | null;

  @IsOptional()
  @IsBoolean({ message: 'is_active debe ser true o false' })
  is_active?: boolean;

  @IsOptional()
  @IsNumber({}, { message: 'actualizado_por debe ser un número' })
  actualizado_por?: number | null;
}
