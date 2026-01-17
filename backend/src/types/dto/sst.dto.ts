/**
 * SST (Salud y Seguridad en el Trabajo) DTOs
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
} from 'class-validator';

export type EstadoIncidente = 'ABIERTO' | 'EN_INVESTIGACION' | 'CERRADO';
export type SeveridadIncidente = 'LEVE' | 'MODERADO' | 'GRAVE' | 'MUY_GRAVE';

/**
 * DTO for creating a new safety incident
 */
export class IncidenteCreateDto {
  @IsNotEmpty({ message: 'La fecha del incidente es requerida' })
  @IsDateString(
    {},
    { message: 'La fecha del incidente debe ser una fecha válida (YYYY-MM-DD o ISO 8601)' }
  )
  fecha_incidente!: string;

  @IsOptional()
  @IsString({ message: 'El tipo de incidente debe ser texto' })
  @MaxLength(100, { message: 'El tipo de incidente no puede exceder 100 caracteres' })
  tipo_incidente?: string;

  @IsOptional()
  @IsEnum(['LEVE', 'MODERADO', 'GRAVE', 'MUY_GRAVE'], {
    message: 'La severidad debe ser LEVE, MODERADO, GRAVE o MUY_GRAVE',
  })
  severidad?: SeveridadIncidente;

  @IsOptional()
  @IsString({ message: 'La ubicación debe ser texto' })
  ubicacion?: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  descripcion?: string;

  @IsOptional()
  @IsString({ message: 'Las acciones tomadas deben ser texto' })
  acciones_tomadas?: string;

  @IsOptional()
  @IsNumber({}, { message: 'El ID del proyecto debe ser numérico' })
  proyecto_id?: number;

  @IsOptional()
  @IsEnum(['ABIERTO', 'EN_INVESTIGACION', 'CERRADO'], {
    message: 'El estado debe ser ABIERTO, EN_INVESTIGACION o CERRADO',
  })
  estado?: EstadoIncidente;
}

/**
 * DTO for updating an existing safety incident
 * All fields optional for partial updates
 */
export class IncidenteUpdateDto {
  @IsOptional()
  @IsDateString(
    {},
    { message: 'La fecha del incidente debe ser una fecha válida (YYYY-MM-DD o ISO 8601)' }
  )
  fecha_incidente?: string;

  @IsOptional()
  @IsString({ message: 'El tipo de incidente debe ser texto' })
  @MaxLength(100, { message: 'El tipo de incidente no puede exceder 100 caracteres' })
  tipo_incidente?: string;

  @IsOptional()
  @IsEnum(['LEVE', 'MODERADO', 'GRAVE', 'MUY_GRAVE'], {
    message: 'La severidad debe ser LEVE, MODERADO, GRAVE o MUY_GRAVE',
  })
  severidad?: SeveridadIncidente;

  @IsOptional()
  @IsString({ message: 'La ubicación debe ser texto' })
  ubicacion?: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  descripcion?: string;

  @IsOptional()
  @IsString({ message: 'Las acciones tomadas deben ser texto' })
  acciones_tomadas?: string;

  @IsOptional()
  @IsNumber({}, { message: 'El ID del proyecto debe ser numérico' })
  proyecto_id?: number;

  @IsOptional()
  @IsEnum(['ABIERTO', 'EN_INVESTIGACION', 'CERRADO'], {
    message: 'El estado debe ser ABIERTO, EN_INVESTIGACION o CERRADO',
  })
  estado?: EstadoIncidente;
}
