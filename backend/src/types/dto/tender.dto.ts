/**
 * Tender (Licitaciones) DTOs
 *
 * Following ARCHITECTURE.md guidelines:
 * - Uses Spanish snake_case field names matching database columns
 * - Validation with class-validator for input DTOs
 * - Returns Spanish column names to API
 */

import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  MaxLength,
  Min,
} from 'class-validator';

export type EstadoLicitacion = 'PUBLICADO' | 'EVALUACION' | 'ADJUDICADO' | 'DESIERTO' | 'CANCELADO';

/**
 * DTO for creating a new tender (licitación)
 */
export class LicitacionCreateDto {
  @IsNotEmpty({ message: 'El código es requerido' })
  @IsString({ message: 'El código debe ser texto' })
  @MaxLength(50, { message: 'El código no puede exceder 50 caracteres' })
  codigo!: string;

  @IsNotEmpty({ message: 'El nombre es requerido' })
  @IsString({ message: 'El nombre debe ser texto' })
  @MaxLength(255, { message: 'El nombre no puede exceder 255 caracteres' })
  nombre!: string;

  @IsOptional()
  @IsString({ message: 'La entidad convocante debe ser texto' })
  @MaxLength(255, { message: 'La entidad convocante no puede exceder 255 caracteres' })
  entidad_convocante?: string;

  @IsOptional()
  @IsNumber({}, { message: 'El monto referencial debe ser numérico' })
  @Min(0, { message: 'El monto referencial debe ser mayor o igual a 0' })
  monto_referencial?: number;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de convocatoria debe ser una fecha válida (YYYY-MM-DD)' })
  fecha_convocatoria?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de presentación debe ser una fecha válida (YYYY-MM-DD)' })
  fecha_presentacion?: string;

  @IsOptional()
  @IsEnum(['PUBLICADO', 'EVALUACION', 'ADJUDICADO', 'DESIERTO', 'CANCELADO'], {
    message: 'El estado debe ser PUBLICADO, EVALUACION, ADJUDICADO, DESIERTO o CANCELADO',
  })
  estado?: EstadoLicitacion;

  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser texto' })
  observaciones?: string;
}

/**
 * DTO for updating an existing tender
 * All fields optional for partial updates
 */
export class LicitacionUpdateDto {
  @IsOptional()
  @IsString({ message: 'El código debe ser texto' })
  @MaxLength(50, { message: 'El código no puede exceder 50 caracteres' })
  codigo?: string;

  @IsOptional()
  @IsString({ message: 'El nombre debe ser texto' })
  @MaxLength(255, { message: 'El nombre no puede exceder 255 caracteres' })
  nombre?: string;

  @IsOptional()
  @IsString({ message: 'La entidad convocante debe ser texto' })
  @MaxLength(255, { message: 'La entidad convocante no puede exceder 255 caracteres' })
  entidad_convocante?: string;

  @IsOptional()
  @IsNumber({}, { message: 'El monto referencial debe ser numérico' })
  @Min(0, { message: 'El monto referencial debe ser mayor o igual a 0' })
  monto_referencial?: number;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de convocatoria debe ser una fecha válida (YYYY-MM-DD)' })
  fecha_convocatoria?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de presentación debe ser una fecha válida (YYYY-MM-DD)' })
  fecha_presentacion?: string;

  @IsOptional()
  @IsEnum(['PUBLICADO', 'EVALUACION', 'ADJUDICADO', 'DESIERTO', 'CANCELADO'], {
    message: 'El estado debe ser PUBLICADO, EVALUACION, ADJUDICADO, DESIERTO o CANCELADO',
  })
  estado?: EstadoLicitacion;

  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser texto' })
  observaciones?: string;
}
