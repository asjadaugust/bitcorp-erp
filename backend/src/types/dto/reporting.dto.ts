/* eslint-disable @typescript-eslint/no-explicit-any */
import { IsDateString, IsOptional, IsIn } from 'class-validator';

/**
 * DTO for report query parameters
 * Used across all reporting endpoints
 */
export class ReportQueryDto {
  @IsDateString({}, { message: 'La fecha de inicio debe ser una fecha válida (YYYY-MM-DD)' })
  startDate!: string;

  @IsDateString({}, { message: 'La fecha de fin debe ser una fecha válida (YYYY-MM-DD)' })
  endDate!: string;

  @IsOptional()
  @IsIn(['excel', 'json'], { message: 'El formato debe ser "excel" o "json"' })
  format?: string;
}
