/**
 * Operator/Trabajador DTO
 *
 * Following ARCHITECTURE.md guidelines:
 * - Uses Spanish snake_case field names matching database columns
 * - DTO transformation happens in service layer
 * - Returns Spanish column names to API
 */

import { Trabajador } from '../../models/trabajador.model';
import { IsString, IsOptional, IsEmail, IsDateString, MaxLength } from 'class-validator';

export interface OperatorDto {
  id: number;
  legacy_id?: string | null;
  dni: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno?: string | null;
  nombre_completo: string; // Computed field
  fecha_nacimiento?: string | null; // ISO date string (YYYY-MM-DD)
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  tipo_contrato?: string | null;
  fecha_ingreso?: string | null; // ISO date string (YYYY-MM-DD)
  fecha_cese?: string | null; // ISO date string (YYYY-MM-DD)
  cargo?: string | null;
  especialidad?: string | null;
  licencia_conducir?: string | null;
  operating_unit_id?: number | null;
  is_active: boolean;
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
}

/**
 * Transform TypeORM entity to DTO (Spanish snake_case)
 * @param entity - Trabajador entity from database
 * @returns OperatorDto with Spanish field names
 */
export function toOperatorDto(entity: Trabajador): OperatorDto {
  // Helper to convert Date to ISO date string (YYYY-MM-DD only)
  const toDateString = (date?: Date | string): string | null => {
    if (!date) return null;
    if (typeof date === 'string') return date.split('T')[0]; // Extract date part
    return date.toISOString().split('T')[0]; // Extract date part
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
    dni: entity.dni,
    nombres: entity.nombres,
    apellido_paterno: entity.apellidoPaterno,
    apellido_materno: entity.apellidoMaterno || null,
    nombre_completo: entity.nombreCompleto, // Computed from entity
    fecha_nacimiento: toDateString(entity.fechaNacimiento),
    telefono: entity.telefono || null,
    email: entity.email || null,
    direccion: entity.direccion || null,
    tipo_contrato: entity.tipoContrato || null,
    fecha_ingreso: toDateString(entity.fechaIngreso),
    fecha_cese: toDateString(entity.fechaCese),
    cargo: entity.cargo || null,
    especialidad: entity.especialidad || null,
    licencia_conducir: entity.licenciaConducir || null,
    operating_unit_id: entity.operatingUnitId || null,
    is_active: entity.isActive,
    created_at: toDateTimeString(entity.createdAt),
    updated_at: toDateTimeString(entity.updatedAt),
  };
}

/**
 * Transform DTO to TypeORM entity for create/update (Spanish snake_case → entity)
 * @param dto - OperatorDto from API request
 * @returns Partial<Trabajador> entity for database
 */
export function fromOperatorDto(dto: Partial<OperatorDto>): Partial<Trabajador> {
  // Helper to convert ISO date string to Date object
  const toDate = (dateStr?: string | null): Date | undefined => {
    if (!dateStr) return undefined;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? undefined : date;
  };

  const entity: Partial<Trabajador> = {};

  if (dto.id !== undefined) entity.id = dto.id;
  if (dto.legacy_id !== undefined) entity.legacyId = dto.legacy_id || undefined;
  if (dto.dni !== undefined) entity.dni = dto.dni;
  if (dto.nombres !== undefined) entity.nombres = dto.nombres;
  if (dto.apellido_paterno !== undefined) entity.apellidoPaterno = dto.apellido_paterno;
  if (dto.apellido_materno !== undefined)
    entity.apellidoMaterno = dto.apellido_materno || undefined;
  if (dto.fecha_nacimiento !== undefined) entity.fechaNacimiento = toDate(dto.fecha_nacimiento);
  if (dto.telefono !== undefined) entity.telefono = dto.telefono || undefined;
  if (dto.email !== undefined) entity.email = dto.email || undefined;
  if (dto.direccion !== undefined) entity.direccion = dto.direccion || undefined;
  if (dto.tipo_contrato !== undefined) entity.tipoContrato = dto.tipo_contrato || undefined;
  if (dto.fecha_ingreso !== undefined) entity.fechaIngreso = toDate(dto.fecha_ingreso);
  if (dto.fecha_cese !== undefined) entity.fechaCese = toDate(dto.fecha_cese);
  if (dto.cargo !== undefined) entity.cargo = dto.cargo || undefined;
  if (dto.especialidad !== undefined) entity.especialidad = dto.especialidad || undefined;
  if (dto.licencia_conducir !== undefined)
    entity.licenciaConducir = dto.licencia_conducir || undefined;
  if (dto.operating_unit_id !== undefined)
    entity.operatingUnitId = dto.operating_unit_id || undefined;
  if (dto.is_active !== undefined) entity.isActive = dto.is_active;

  return entity;
}

/**
 * DTO for creating a new operator with validation
 */
export class OperatorCreateDto {
  @IsString({ message: 'DNI debe ser texto' })
  @MaxLength(20, { message: 'DNI no puede exceder 20 caracteres' })
  dni!: string;

  @IsString({ message: 'Nombres debe ser texto' })
  @MaxLength(100, { message: 'Nombres no puede exceder 100 caracteres' })
  nombres!: string;

  @IsString({ message: 'Apellido paterno debe ser texto' })
  @MaxLength(100, { message: 'Apellido paterno no puede exceder 100 caracteres' })
  apellido_paterno!: string;

  @IsOptional()
  @IsString({ message: 'Apellido materno debe ser texto' })
  @MaxLength(100, { message: 'Apellido materno no puede exceder 100 caracteres' })
  apellido_materno?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Fecha de nacimiento debe ser una fecha válida (YYYY-MM-DD)' })
  fecha_nacimiento?: string;

  @IsOptional()
  @IsString({ message: 'Teléfono debe ser texto' })
  @MaxLength(20, { message: 'Teléfono no puede exceder 20 caracteres' })
  telefono?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email debe ser válido' })
  @MaxLength(100, { message: 'Email no puede exceder 100 caracteres' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'Dirección debe ser texto' })
  @MaxLength(200, { message: 'Dirección no puede exceder 200 caracteres' })
  direccion?: string;

  @IsOptional()
  @IsString({ message: 'Tipo de contrato debe ser texto' })
  @MaxLength(50, { message: 'Tipo de contrato no puede exceder 50 caracteres' })
  tipo_contrato?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Fecha de ingreso debe ser una fecha válida (YYYY-MM-DD)' })
  fecha_ingreso?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Fecha de cese debe ser una fecha válida (YYYY-MM-DD)' })
  fecha_cese?: string;

  @IsOptional()
  @IsString({ message: 'Cargo debe ser texto' })
  @MaxLength(100, { message: 'Cargo no puede exceder 100 caracteres' })
  cargo?: string;

  @IsOptional()
  @IsString({ message: 'Especialidad debe ser texto' })
  @MaxLength(100, { message: 'Especialidad no puede exceder 100 caracteres' })
  especialidad?: string;

  @IsOptional()
  @IsString({ message: 'Licencia de conducir debe ser texto' })
  @MaxLength(50, { message: 'Licencia de conducir no puede exceder 50 caracteres' })
  licencia_conducir?: string;
}

/**
 * DTO for updating an operator (all fields optional)
 */
export class OperatorUpdateDto {
  @IsOptional()
  @IsString({ message: 'DNI debe ser texto' })
  @MaxLength(20, { message: 'DNI no puede exceder 20 caracteres' })
  dni?: string;

  @IsOptional()
  @IsString({ message: 'Nombres debe ser texto' })
  @MaxLength(100, { message: 'Nombres no puede exceder 100 caracteres' })
  nombres?: string;

  @IsOptional()
  @IsString({ message: 'Apellido paterno debe ser texto' })
  @MaxLength(100, { message: 'Apellido paterno no puede exceder 100 caracteres' })
  apellido_paterno?: string;

  @IsOptional()
  @IsString({ message: 'Apellido materno debe ser texto' })
  @MaxLength(100, { message: 'Apellido materno no puede exceder 100 caracteres' })
  apellido_materno?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Fecha de nacimiento debe ser una fecha válida (YYYY-MM-DD)' })
  fecha_nacimiento?: string;

  @IsOptional()
  @IsString({ message: 'Teléfono debe ser texto' })
  @MaxLength(20, { message: 'Teléfono no puede exceder 20 caracteres' })
  telefono?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email debe ser válido' })
  @MaxLength(100, { message: 'Email no puede exceder 100 caracteres' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'Dirección debe ser texto' })
  @MaxLength(200, { message: 'Dirección no puede exceder 200 caracteres' })
  direccion?: string;

  @IsOptional()
  @IsString({ message: 'Tipo de contrato debe ser texto' })
  @MaxLength(50, { message: 'Tipo de contrato no puede exceder 50 caracteres' })
  tipo_contrato?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Fecha de ingreso debe ser una fecha válida (YYYY-MM-DD)' })
  fecha_ingreso?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Fecha de cese debe ser una fecha válida (YYYY-MM-DD)' })
  fecha_cese?: string;

  @IsOptional()
  @IsString({ message: 'Cargo debe ser texto' })
  @MaxLength(100, { message: 'Cargo no puede exceder 100 caracteres' })
  cargo?: string;

  @IsOptional()
  @IsString({ message: 'Especialidad debe ser texto' })
  @MaxLength(100, { message: 'Especialidad no puede exceder 100 caracteres' })
  especialidad?: string;

  @IsOptional()
  @IsString({ message: 'Licencia de conducir debe ser texto' })
  @MaxLength(50, { message: 'Licencia de conducir no puede exceder 50 caracteres' })
  licencia_conducir?: string;
}
