/**
 * Payment Schedule DTOs
 *
 * Following ARCHITECTURE.md guidelines:
 * - Uses Spanish snake_case field names matching database columns
 * - Validation with class-validator for input DTOs
 * - Returns Spanish column names to API
 */

import { IsDate, IsNotEmpty, IsNumber, IsOptional, IsString, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

// Input DTO for creating payment schedule
export class PaymentScheduleCreateDto {
  @IsNotEmpty({ message: 'La fecha de programación es requerida' })
  @IsDate({ message: 'Debe ser una fecha válida' })
  @Type(() => Date)
  schedule_date!: Date;

  @IsNotEmpty({ message: 'La fecha de pago es requerida' })
  @IsDate({ message: 'Debe ser una fecha válida' })
  @Type(() => Date)
  payment_date!: Date;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'La moneda debe ser texto' })
  @IsEnum(['PEN', 'USD'], { message: 'Moneda debe ser PEN o USD' })
  currency?: string;
}

// Input DTO for updating payment schedule
export class PaymentScheduleUpdateDto {
  @IsOptional()
  @IsDate({ message: 'Debe ser una fecha válida' })
  @Type(() => Date)
  schedule_date?: Date;

  @IsOptional()
  @IsDate({ message: 'Debe ser una fecha válida' })
  @Type(() => Date)
  payment_date?: Date;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'La moneda debe ser texto' })
  @IsEnum(['PEN', 'USD'], { message: 'Moneda debe ser PEN o USD' })
  currency?: string;
}

// Input DTO for adding schedule detail
export class PaymentScheduleDetailCreateDto {
  @IsNotEmpty({ message: 'El monto a pagar es requerido' })
  @IsNumber({}, { message: 'El monto debe ser numérico' })
  @Min(0, { message: 'El monto debe ser positivo' })
  amount_to_pay!: number;

  @IsOptional()
  @IsNumber()
  valuation_id?: number;

  @IsOptional()
  @IsNumber()
  accounts_payable_id?: number;

  @IsOptional()
  @IsString()
  description?: string;
}
