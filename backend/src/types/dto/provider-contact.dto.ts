import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsBoolean,
  IsOptional,
  IsIn,
  IsNumber,
  MaxLength,
} from 'class-validator';

/**
 * DTO for creating provider contact
 */
export class ProviderContactCreateDto {
  @IsOptional()
  @IsNumber({}, { message: 'El ID del proveedor debe ser un número' })
  id_proveedor?: number;

  @IsNotEmpty({ message: 'El nombre del contacto es requerido' })
  @IsString({ message: 'El nombre del contacto debe ser texto' })
  @MaxLength(200, { message: 'El nombre del contacto no debe exceder 200 caracteres' })
  nombre_contacto!: string;

  @IsOptional()
  @IsString({ message: 'El cargo debe ser texto' })
  @MaxLength(100, { message: 'El cargo no debe exceder 100 caracteres' })
  cargo?: string;

  @IsOptional()
  @IsString({ message: 'El teléfono principal debe ser texto' })
  @MaxLength(20, { message: 'El teléfono principal no debe exceder 20 caracteres' })
  telefono_principal?: string;

  @IsOptional()
  @IsString({ message: 'El teléfono secundario debe ser texto' })
  @MaxLength(20, { message: 'El teléfono secundario no debe exceder 20 caracteres' })
  telefono_secundario?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El correo debe ser válido' })
  @MaxLength(200, { message: 'El correo no debe exceder 200 caracteres' })
  correo?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El correo secundario debe ser válido' })
  @MaxLength(200, { message: 'El correo secundario no debe exceder 200 caracteres' })
  correo_secundario?: string;

  @IsOptional()
  @IsString({ message: 'El tipo de contacto debe ser texto' })
  @IsIn(['sales', 'billing', 'technical', 'general'], {
    message: 'El tipo de contacto debe ser: sales, billing, technical o general',
  })
  tipo_contacto?: string;

  @IsOptional()
  @IsBoolean({ message: 'El campo es_principal debe ser verdadero o falso' })
  es_principal?: boolean;

  @IsOptional()
  @IsString({ message: 'El estado debe ser texto' })
  @IsIn(['active', 'inactive'], { message: 'El estado debe ser: active o inactive' })
  estado?: string;

  @IsOptional()
  @IsString({ message: 'Las notas deben ser texto' })
  notas?: string;

  @IsOptional()
  @IsNumber({}, { message: 'El tenant_id debe ser un número' })
  tenant_id?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El created_by debe ser un número' })
  created_by?: number;
}

/**
 * DTO for updating provider contact
 */
export class ProviderContactUpdateDto {
  @IsOptional()
  @IsString({ message: 'El nombre del contacto debe ser texto' })
  @MaxLength(200, { message: 'El nombre del contacto no debe exceder 200 caracteres' })
  nombre_contacto?: string;

  @IsOptional()
  @IsString({ message: 'El cargo debe ser texto' })
  @MaxLength(100, { message: 'El cargo no debe exceder 100 caracteres' })
  cargo?: string;

  @IsOptional()
  @IsString({ message: 'El teléfono principal debe ser texto' })
  @MaxLength(20, { message: 'El teléfono principal no debe exceder 20 caracteres' })
  telefono_principal?: string;

  @IsOptional()
  @IsString({ message: 'El teléfono secundario debe ser texto' })
  @MaxLength(20, { message: 'El teléfono secundario no debe exceder 20 caracteres' })
  telefono_secundario?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El correo debe ser válido' })
  @MaxLength(200, { message: 'El correo no debe exceder 200 caracteres' })
  correo?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El correo secundario debe ser válido' })
  @MaxLength(200, { message: 'El correo secundario no debe exceder 200 caracteres' })
  correo_secundario?: string;

  @IsOptional()
  @IsString({ message: 'El tipo de contacto debe ser texto' })
  @IsIn(['sales', 'billing', 'technical', 'general'], {
    message: 'El tipo de contacto debe ser: sales, billing, technical o general',
  })
  tipo_contacto?: string;

  @IsOptional()
  @IsBoolean({ message: 'El campo es_principal debe ser verdadero o falso' })
  es_principal?: boolean;

  @IsOptional()
  @IsString({ message: 'El estado debe ser texto' })
  @IsIn(['active', 'inactive'], { message: 'El estado debe ser: active o inactive' })
  estado?: string;

  @IsOptional()
  @IsString({ message: 'Las notas deben ser texto' })
  notas?: string;

  @IsOptional()
  @IsNumber({}, { message: 'El updated_by debe ser un número' })
  updated_by?: number;
}

/**
 * DTO for provider contact response (snake_case for API)
 */
export interface ProviderContactDto {
  id: number;
  id_proveedor: number;
  nombre_contacto: string;
  cargo?: string;
  telefono_principal?: string;
  telefono_secundario?: string;
  correo?: string;
  correo_secundario?: string;
  tipo_contacto: string;
  es_principal: boolean;
  estado: string;
  notas?: string;
  tenant_id: number;
  created_by?: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
}
