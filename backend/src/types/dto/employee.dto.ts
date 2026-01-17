/**
 * Employee (Trabajador) DTOs
 *
 * Spanish snake_case field naming (ARCHITECTURE.md 3.2)
 * Maps from Trabajador entity (Spanish camelCase) to API format (Spanish snake_case)
 *
 * Entity: backend/src/models/trabajador.model.ts
 * Service: backend/src/services/employee.service.ts
 * Controller: backend/src/api/hr/employee.controller.ts
 */

import {
  IsString,
  IsOptional,
  IsEmail,
  IsDateString,
  MaxLength,
  MinLength,
  IsNumber,
} from 'class-validator';

/**
 * EmployeeListDto - Minimal fields for grid views
 * Used by: GET /api/employees (list view)
 */
export interface EmployeeListDto {
  id_trabajador: number;
  codigo_trabajador: string | null; // legacyId
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  nombre_completo: string; // Computed: nombres + apellidos
  dni: string;
  cargo: string | null; // Position
  especialidad: string | null; // Department
  telefono: string | null;
  email: string | null;
  fecha_ingreso: string | null; // ISO date YYYY-MM-DD
  esta_activo: boolean;
}

/**
 * EmployeeDetailDto - Full fields for detail view
 * Used by: GET /api/employees/:dni (single view)
 */
export interface EmployeeDetailDto {
  id_trabajador: number;
  codigo_trabajador: string | null;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  nombre_completo: string;
  dni: string;
  fecha_nacimiento: string | null; // ISO date
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  fecha_ingreso: string | null; // ISO date
  fecha_cese: string | null; // ISO date - termination
  cargo: string | null;
  especialidad: string | null;
  tipo_contrato: string | null; // Contract type
  licencia_conducir: string | null; // Driver's license
  operating_unit_id: number | null; // Not translated (internal ID)
  esta_activo: boolean;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * EmployeeCreateDto - Input validation for creating employees
 * Used by: POST /api/employees
 */
export class EmployeeCreateDto {
  @IsOptional()
  @IsString({ message: 'codigo_trabajador debe ser un string' })
  @MaxLength(50, { message: 'codigo_trabajador no puede exceder 50 caracteres' })
  codigo_trabajador?: string;

  @IsString({ message: 'nombres es requerido' })
  @MaxLength(200, { message: 'nombres no puede exceder 200 caracteres' })
  nombres!: string;

  @IsString({ message: 'apellido_paterno es requerido' })
  @MaxLength(100, { message: 'apellido_paterno no puede exceder 100 caracteres' })
  apellido_paterno!: string;

  @IsOptional()
  @IsString({ message: 'apellido_materno debe ser un string' })
  @MaxLength(100, { message: 'apellido_materno no puede exceder 100 caracteres' })
  apellido_materno?: string;

  @IsString({ message: 'dni es requerido' })
  @MinLength(8, { message: 'dni debe tener al menos 8 caracteres' })
  @MaxLength(12, { message: 'dni no puede exceder 12 caracteres' })
  dni!: string;

  @IsOptional()
  @IsDateString({}, { message: 'fecha_nacimiento debe ser una fecha válida (ISO 8601)' })
  fecha_nacimiento?: string;

  @IsOptional()
  @IsString({ message: 'direccion debe ser un string' })
  @MaxLength(500, { message: 'direccion no puede exceder 500 caracteres' })
  direccion?: string;

  @IsOptional()
  @IsString({ message: 'telefono debe ser un string' })
  @MaxLength(20, { message: 'telefono no puede exceder 20 caracteres' })
  telefono?: string;

  @IsOptional()
  @IsEmail({}, { message: 'email debe ser un email válido' })
  email?: string;

  @IsOptional()
  @IsDateString({}, { message: 'fecha_ingreso debe ser una fecha válida (ISO 8601)' })
  fecha_ingreso?: string;

  @IsOptional()
  @IsString({ message: 'cargo debe ser un string' })
  @MaxLength(100, { message: 'cargo no puede exceder 100 caracteres' })
  cargo?: string;

  @IsOptional()
  @IsString({ message: 'especialidad debe ser un string' })
  @MaxLength(100, { message: 'especialidad no puede exceder 100 caracteres' })
  especialidad?: string;

  @IsOptional()
  @IsString({ message: 'tipo_contrato debe ser un string' })
  @MaxLength(50, { message: 'tipo_contrato no puede exceder 50 caracteres' })
  tipo_contrato?: string;

  @IsOptional()
  @IsString({ message: 'licencia_conducir debe ser un string' })
  @MaxLength(20, { message: 'licencia_conducir no puede exceder 20 caracteres' })
  licencia_conducir?: string;

  @IsOptional()
  @IsNumber({}, { message: 'operating_unit_id debe ser un número' })
  operating_unit_id?: number;
}

/**
 * EmployeeFiltersDto - Filters for employee list/search
 * Used by: GET /api/employees (query parameters)
 */
export interface EmployeeFiltersDto {
  search?: string; // Search by name or DNI
  cargo?: string; // Filter by position
  especialidad?: string; // Filter by specialty/department
  fecha_ingreso_desde?: string; // Filter by hire date (from)
  fecha_ingreso_hasta?: string; // Filter by hire date (to)
}

/**
 * EmployeeUpdateDto - Input validation for updating employees
 * Used by: PUT /api/employees/:dni
 */
export class EmployeeUpdateDto {
  @IsOptional()
  @IsString({ message: 'nombres debe ser un string' })
  @MaxLength(200, { message: 'nombres no puede exceder 200 caracteres' })
  nombres?: string;

  @IsOptional()
  @IsString({ message: 'apellido_paterno debe ser un string' })
  @MaxLength(100, { message: 'apellido_paterno no puede exceder 100 caracteres' })
  apellido_paterno?: string;

  @IsOptional()
  @IsString({ message: 'apellido_materno debe ser un string' })
  @MaxLength(100, { message: 'apellido_materno no puede exceder 100 caracteres' })
  apellido_materno?: string;

  @IsOptional()
  @IsDateString({}, { message: 'fecha_nacimiento debe ser una fecha válida (ISO 8601)' })
  fecha_nacimiento?: string;

  @IsOptional()
  @IsString({ message: 'direccion debe ser un string' })
  @MaxLength(500, { message: 'direccion no puede exceder 500 caracteres' })
  direccion?: string;

  @IsOptional()
  @IsString({ message: 'telefono debe ser un string' })
  @MaxLength(20, { message: 'telefono no puede exceder 20 caracteres' })
  telefono?: string;

  @IsOptional()
  @IsEmail({}, { message: 'email debe ser un email válido' })
  email?: string;

  @IsOptional()
  @IsDateString({}, { message: 'fecha_cese debe ser una fecha válida (ISO 8601)' })
  fecha_cese?: string;

  @IsOptional()
  @IsString({ message: 'cargo debe ser un string' })
  @MaxLength(100, { message: 'cargo no puede exceder 100 caracteres' })
  cargo?: string;

  @IsOptional()
  @IsString({ message: 'especialidad debe ser un string' })
  @MaxLength(100, { message: 'especialidad no puede exceder 100 caracteres' })
  especialidad?: string;

  @IsOptional()
  @IsString({ message: 'tipo_contrato debe ser un string' })
  @MaxLength(50, { message: 'tipo_contrato no puede exceder 50 caracteres' })
  tipo_contrato?: string;

  @IsOptional()
  @IsString({ message: 'licencia_conducir debe ser un string' })
  @MaxLength(20, { message: 'licencia_conducir no puede exceder 20 caracteres' })
  licencia_conducir?: string;

  @IsOptional()
  @IsNumber({}, { message: 'operating_unit_id debe ser un número' })
  operating_unit_id?: number;
}

// ============================================
// Transformer Functions
// ============================================

/**
 * Transform Trabajador entity to EmployeeListDto
 */
export function toEmployeeListDto(trabajador: Record<string, unknown>): EmployeeListDto {
  return {
    id_trabajador: trabajador.id as number,
    codigo_trabajador: (trabajador.legacyId as string) || null,
    nombres: trabajador.nombres as string,
    apellido_paterno: trabajador.apellidoPaterno as string,
    apellido_materno: (trabajador.apellidoMaterno as string) || null,
    nombre_completo:
      (trabajador.nombreCompleto as string) ||
      `${trabajador.nombres} ${trabajador.apellidoPaterno}`,
    dni: trabajador.dni as string,
    cargo: (trabajador.cargo as string) || null,
    especialidad: (trabajador.especialidad as string) || null,
    telefono: (trabajador.telefono as string) || null,
    email: (trabajador.email as string) || null,
    fecha_ingreso: trabajador.fechaIngreso
      ? new Date(trabajador.fechaIngreso as Date).toISOString().split('T')[0]
      : null,
    esta_activo: trabajador.isActive as boolean,
  };
}

/**
 * Transform Trabajador entity to EmployeeDetailDto
 */
export function toEmployeeDetailDto(trabajador: Record<string, unknown>): EmployeeDetailDto {
  return {
    id_trabajador: trabajador.id as number,
    codigo_trabajador: (trabajador.legacyId as string) || null,
    nombres: trabajador.nombres as string,
    apellido_paterno: trabajador.apellidoPaterno as string,
    apellido_materno: (trabajador.apellidoMaterno as string) || null,
    nombre_completo:
      (trabajador.nombreCompleto as string) ||
      `${trabajador.nombres} ${trabajador.apellidoPaterno}`,
    dni: trabajador.dni as string,
    fecha_nacimiento: trabajador.fechaNacimiento
      ? new Date(trabajador.fechaNacimiento as Date).toISOString().split('T')[0]
      : null,
    direccion: (trabajador.direccion as string) || null,
    telefono: (trabajador.telefono as string) || null,
    email: (trabajador.email as string) || null,
    fecha_ingreso: trabajador.fechaIngreso
      ? new Date(trabajador.fechaIngreso as Date).toISOString().split('T')[0]
      : null,
    fecha_cese: trabajador.fechaCese
      ? new Date(trabajador.fechaCese as Date).toISOString().split('T')[0]
      : null,
    cargo: (trabajador.cargo as string) || null,
    especialidad: (trabajador.especialidad as string) || null,
    tipo_contrato: (trabajador.tipoContrato as string) || null,
    licencia_conducir: (trabajador.licenciaConducir as string) || null,
    operating_unit_id: (trabajador.operatingUnitId as number) || null,
    esta_activo: trabajador.isActive as boolean,
    created_at: trabajador.createdAt ? new Date(trabajador.createdAt as Date).toISOString() : '',
    updated_at: trabajador.updatedAt ? new Date(trabajador.updatedAt as Date).toISOString() : '',
  };
}

/**
 * Transform array of Trabajador entities to EmployeeListDto[]
 */
export function toEmployeeListDtoArray(trabajadores: Record<string, unknown>[]): EmployeeListDto[] {
  return trabajadores.map((t) => toEmployeeListDto(t));
}

/**
 * Transform EmployeeCreateDto to Trabajador entity fields
 */
export function fromEmployeeCreateDto(dto: EmployeeCreateDto): Record<string, unknown> {
  return {
    legacyId: dto.codigo_trabajador,
    nombres: dto.nombres,
    apellidoPaterno: dto.apellido_paterno,
    apellidoMaterno: dto.apellido_materno,
    dni: dto.dni,
    fechaNacimiento: dto.fecha_nacimiento ? new Date(dto.fecha_nacimiento) : undefined,
    direccion: dto.direccion,
    telefono: dto.telefono,
    email: dto.email,
    fechaIngreso: dto.fecha_ingreso ? new Date(dto.fecha_ingreso) : undefined,
    cargo: dto.cargo,
    especialidad: dto.especialidad,
    tipoContrato: dto.tipo_contrato,
    licenciaConducir: dto.licencia_conducir,
    operatingUnitId: dto.operating_unit_id,
    isActive: true,
  };
}

/**
 * Transform EmployeeUpdateDto to Trabajador entity fields (partial)
 */
export function fromEmployeeUpdateDto(dto: EmployeeUpdateDto): Record<string, unknown> {
  const updates: Record<string, unknown> = {};

  if (dto.nombres !== undefined) updates.nombres = dto.nombres;
  if (dto.apellido_paterno !== undefined) updates.apellidoPaterno = dto.apellido_paterno;
  if (dto.apellido_materno !== undefined) updates.apellidoMaterno = dto.apellido_materno;
  if (dto.fecha_nacimiento !== undefined) updates.fechaNacimiento = new Date(dto.fecha_nacimiento);
  if (dto.direccion !== undefined) updates.direccion = dto.direccion;
  if (dto.telefono !== undefined) updates.telefono = dto.telefono;
  if (dto.email !== undefined) updates.email = dto.email;
  if (dto.fecha_cese !== undefined) updates.fechaCese = new Date(dto.fecha_cese);
  if (dto.cargo !== undefined) updates.cargo = dto.cargo;
  if (dto.especialidad !== undefined) updates.especialidad = dto.especialidad;
  if (dto.tipo_contrato !== undefined) updates.tipoContrato = dto.tipo_contrato;
  if (dto.licencia_conducir !== undefined) updates.licenciaConducir = dto.licencia_conducir;
  if (dto.operating_unit_id !== undefined) updates.operatingUnitId = dto.operating_unit_id;

  return updates;
}
