/**
 * Dashboard DTOs
 *
 * Following ARCHITECTURE.md guidelines:
 * - Uses Spanish snake_case field names matching API contract
 * - Validation with class-validator for input DTOs
 */

import { IsNotEmpty, IsNumber } from 'class-validator';

/**
 * DTO for switching active project
 */
export class SwitchProjectDto {
  @IsNotEmpty({ message: 'El ID del proyecto es requerido' })
  @IsNumber({}, { message: 'El ID del proyecto debe ser numérico' })
  project_id!: number;
}
