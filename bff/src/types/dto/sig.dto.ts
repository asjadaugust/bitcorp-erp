/**
 * SIG (Sistema Integrado de Gestión) DTOs
 *
 * Following ARCHITECTURE.md guidelines:
 * - Uses Spanish snake_case field names matching database columns
 * - Validation with class-validator for input DTOs
 * - Returns Spanish column names to API
 */

import { IsNotEmpty, IsString, IsOptional, MaxLength, IsEnum, IsDateString } from 'class-validator';

export type EstadoDocumento = 'VIGENTE' | 'OBSOLETO' | 'EN_REVISION' | 'ANULADO';

/**
 * DTO for creating a new SIG document
 */
export class SigDocumentCreateDto {
  @IsNotEmpty({ message: 'El código es requerido' })
  @IsString({ message: 'El código debe ser texto' })
  @MaxLength(50, { message: 'El código no puede exceder 50 caracteres' })
  codigo!: string;

  @IsNotEmpty({ message: 'El título es requerido' })
  @IsString({ message: 'El título debe ser texto' })
  @MaxLength(255, { message: 'El título no puede exceder 255 caracteres' })
  titulo!: string;

  @IsOptional()
  @IsString({ message: 'El tipo de documento debe ser texto' })
  @MaxLength(100, { message: 'El tipo de documento no puede exceder 100 caracteres' })
  tipo_documento?: string;

  @IsOptional()
  @IsString({ message: 'El estándar ISO debe ser texto' })
  @MaxLength(50, { message: 'El estándar ISO no puede exceder 50 caracteres' })
  iso_standard?: string;

  @IsOptional()
  @IsString({ message: 'La versión debe ser texto' })
  @MaxLength(20, { message: 'La versión no puede exceder 20 caracteres' })
  version?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de emisión debe ser una fecha válida (YYYY-MM-DD)' })
  fecha_emision?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de revisión debe ser una fecha válida (YYYY-MM-DD)' })
  fecha_revision?: string;

  @IsOptional()
  @IsString({ message: 'La URL del archivo debe ser texto' })
  archivo_url?: string;

  @IsOptional()
  @IsEnum(['VIGENTE', 'OBSOLETO', 'EN_REVISION', 'ANULADO'], {
    message: 'El estado debe ser VIGENTE, OBSOLETO, EN_REVISION o ANULADO',
  })
  estado?: EstadoDocumento;
}

/**
 * DTO for updating an existing SIG document
 * All fields optional for partial updates
 */
export class SigDocumentUpdateDto {
  @IsOptional()
  @IsString({ message: 'El código debe ser texto' })
  @MaxLength(50, { message: 'El código no puede exceder 50 caracteres' })
  codigo?: string;

  @IsOptional()
  @IsString({ message: 'El título debe ser texto' })
  @MaxLength(255, { message: 'El título no puede exceder 255 caracteres' })
  titulo?: string;

  @IsOptional()
  @IsString({ message: 'El tipo de documento debe ser texto' })
  @MaxLength(100, { message: 'El tipo de documento no puede exceder 100 caracteres' })
  tipo_documento?: string;

  @IsOptional()
  @IsString({ message: 'El estándar ISO debe ser texto' })
  @MaxLength(50, { message: 'El estándar ISO no puede exceder 50 caracteres' })
  iso_standard?: string;

  @IsOptional()
  @IsString({ message: 'La versión debe ser texto' })
  @MaxLength(20, { message: 'La versión no puede exceder 20 caracteres' })
  version?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de emisión debe ser una fecha válida (YYYY-MM-DD)' })
  fecha_emision?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de revisión debe ser una fecha válida (YYYY-MM-DD)' })
  fecha_revision?: string;

  @IsOptional()
  @IsString({ message: 'La URL del archivo debe ser texto' })
  archivo_url?: string;

  @IsOptional()
  @IsEnum(['VIGENTE', 'OBSOLETO', 'EN_REVISION', 'ANULADO'], {
    message: 'El estado debe ser VIGENTE, OBSOLETO, EN_REVISION o ANULADO',
  })
  estado?: EstadoDocumento;
}
