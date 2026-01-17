import { IsNotEmpty, IsString, IsBoolean, IsOptional, IsIn, MaxLength } from 'class-validator';

/**
 * DTO for creating provider financial info
 */
export class ProviderFinancialInfoCreateDto {
  @IsNotEmpty({ message: 'El nombre del banco es requerido' })
  @IsString({ message: 'El nombre del banco debe ser texto' })
  @MaxLength(200, { message: 'El nombre del banco no debe exceder 200 caracteres' })
  bank_name!: string;

  @IsNotEmpty({ message: 'El número de cuenta es requerido' })
  @IsString({ message: 'El número de cuenta debe ser texto' })
  @MaxLength(50, { message: 'El número de cuenta no debe exceder 50 caracteres' })
  account_number!: string;

  @IsOptional()
  @IsString({ message: 'El CCI debe ser texto' })
  @MaxLength(50, { message: 'El CCI no debe exceder 50 caracteres' })
  cci?: string;

  @IsOptional()
  @IsString({ message: 'El nombre del titular debe ser texto' })
  @MaxLength(200, { message: 'El nombre del titular no debe exceder 200 caracteres' })
  account_holder_name?: string;

  @IsOptional()
  @IsString({ message: 'El tipo de cuenta debe ser texto' })
  @IsIn(['savings', 'checking', 'cci'], {
    message: 'El tipo de cuenta debe ser: savings, checking o cci',
  })
  account_type?: string;

  @IsOptional()
  @IsString({ message: 'La moneda debe ser texto' })
  @IsIn(['PEN', 'USD', 'EUR'], { message: 'La moneda debe ser: PEN, USD o EUR' })
  currency?: string;

  @IsOptional()
  @IsBoolean({ message: 'El campo is_primary debe ser verdadero o falso' })
  is_primary?: boolean;

  @IsOptional()
  @IsString({ message: 'El estado debe ser texto' })
  @IsIn(['active', 'inactive'], { message: 'El estado debe ser: active o inactive' })
  status?: string;
}

/**
 * DTO for updating provider financial info
 */
export class ProviderFinancialInfoUpdateDto {
  @IsOptional()
  @IsString({ message: 'El nombre del banco debe ser texto' })
  @MaxLength(200, { message: 'El nombre del banco no debe exceder 200 caracteres' })
  bank_name?: string;

  @IsOptional()
  @IsString({ message: 'El número de cuenta debe ser texto' })
  @MaxLength(50, { message: 'El número de cuenta no debe exceder 50 caracteres' })
  account_number?: string;

  @IsOptional()
  @IsString({ message: 'El CCI debe ser texto' })
  @MaxLength(50, { message: 'El CCI no debe exceder 50 caracteres' })
  cci?: string;

  @IsOptional()
  @IsString({ message: 'El nombre del titular debe ser texto' })
  @MaxLength(200, { message: 'El nombre del titular no debe exceder 200 caracteres' })
  account_holder_name?: string;

  @IsOptional()
  @IsString({ message: 'El tipo de cuenta debe ser texto' })
  @IsIn(['savings', 'checking', 'cci'], {
    message: 'El tipo de cuenta debe ser: savings, checking o cci',
  })
  account_type?: string;

  @IsOptional()
  @IsString({ message: 'La moneda debe ser texto' })
  @IsIn(['PEN', 'USD', 'EUR'], { message: 'La moneda debe ser: PEN, USD o EUR' })
  currency?: string;

  @IsOptional()
  @IsBoolean({ message: 'El campo is_primary debe ser verdadero o falso' })
  is_primary?: boolean;

  @IsOptional()
  @IsString({ message: 'El estado debe ser texto' })
  @IsIn(['active', 'inactive'], { message: 'El estado debe ser: active o inactive' })
  status?: string;
}
