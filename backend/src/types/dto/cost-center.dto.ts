/**
 * Cost Center DTOs
 *
 * Following ARCHITECTURE.md guidelines:
 * - Uses Spanish snake_case field names matching database columns
 * - Validation with class-validator for input DTOs
 * - Returns Spanish column names to API
 */

import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

// Input DTO for creating cost center
export class CostCenterCreateDto {
  @IsNotEmpty({ message: 'El código es requerido' })
  @IsString({ message: 'El código debe ser texto' })
  @MaxLength(50, { message: 'El código no puede exceder 50 caracteres' })
  codigo!: string;

  @IsNotEmpty({ message: 'El nombre es requerido' })
  @IsString({ message: 'El nombre debe ser texto' })
  @MaxLength(255, { message: 'El nombre no puede exceder 255 caracteres' })
  nombre!: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  descripcion?: string;

  @IsOptional()
  @IsNumber({}, { message: 'El proyecto_id debe ser numérico' })
  proyecto_id?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El presupuesto debe ser numérico' })
  @Min(0, { message: 'El presupuesto debe ser positivo' })
  presupuesto?: number;

  @IsOptional()
  @IsBoolean({ message: 'is_active debe ser booleano' })
  is_active?: boolean;
}

// Input DTO for updating cost center
export class CostCenterUpdateDto {
  @IsOptional()
  @IsString({ message: 'El código debe ser texto' })
  @MaxLength(50, { message: 'El código no puede exceder 50 caracteres' })
  codigo?: string;

  @IsOptional()
  @IsString({ message: 'El nombre debe ser texto' })
  @MaxLength(255, { message: 'El nombre no puede exceder 255 caracteres' })
  nombre?: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  descripcion?: string;

  @IsOptional()
  @IsNumber({}, { message: 'El proyecto_id debe ser numérico' })
  proyecto_id?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El presupuesto debe ser numérico' })
  @Min(0, { message: 'El presupuesto debe ser positivo' })
  presupuesto?: number;

  @IsOptional()
  @IsBoolean({ message: 'is_active debe ser booleano' })
  is_active?: boolean;
}
