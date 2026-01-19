import {
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsOptional,
  IsIn,
  IsNumber,
  MaxLength,
} from 'class-validator';

/**
 * DTO for creating provider financial info
 */
export class ProviderFinancialInfoCreateDto {
  @IsOptional()
  @IsNumber({}, { message: 'El ID del proveedor debe ser un número' })
  provider_id?: number;

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

  @IsOptional()
  @IsNumber({}, { message: 'El tenant_id debe ser un número' })
  tenant_id?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El created_by debe ser un número' })
  created_by?: number;
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

  @IsOptional()
  @IsNumber({}, { message: 'El updated_by debe ser un número' })
  updated_by?: number;
}

/**
 * DTO for provider financial info response (snake_case for API)
 */
export interface ProviderFinancialInfoDto {
  id: number;
  provider_id: number;
  bank_name: string;
  account_number: string;
  cci?: string;
  account_holder_name?: string;
  account_type?: string;
  currency: string;
  is_primary: boolean;
  status: string;
  tenant_id: number;
  created_by?: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
}
