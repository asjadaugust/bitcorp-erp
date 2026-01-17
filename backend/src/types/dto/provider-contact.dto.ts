import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsBoolean,
  IsOptional,
  IsIn,
  MaxLength,
} from 'class-validator';

/**
 * DTO for creating provider contact
 */
export class ProviderContactCreateDto {
  @IsNotEmpty({ message: 'El nombre del contacto es requerido' })
  @IsString({ message: 'El nombre del contacto debe ser texto' })
  @MaxLength(200, { message: 'El nombre del contacto no debe exceder 200 caracteres' })
  contact_name!: string;

  @IsOptional()
  @IsString({ message: 'El cargo debe ser texto' })
  @MaxLength(100, { message: 'El cargo no debe exceder 100 caracteres' })
  position?: string;

  @IsOptional()
  @IsString({ message: 'El teléfono principal debe ser texto' })
  @MaxLength(20, { message: 'El teléfono principal no debe exceder 20 caracteres' })
  primary_phone?: string;

  @IsOptional()
  @IsString({ message: 'El teléfono secundario debe ser texto' })
  @MaxLength(20, { message: 'El teléfono secundario no debe exceder 20 caracteres' })
  secondary_phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El email debe ser válido' })
  @MaxLength(200, { message: 'El email no debe exceder 200 caracteres' })
  email?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El email secundario debe ser válido' })
  @MaxLength(200, { message: 'El email secundario no debe exceder 200 caracteres' })
  secondary_email?: string;

  @IsOptional()
  @IsString({ message: 'El tipo de contacto debe ser texto' })
  @IsIn(['sales', 'billing', 'technical', 'general'], {
    message: 'El tipo de contacto debe ser: sales, billing, technical o general',
  })
  contact_type?: string;

  @IsOptional()
  @IsBoolean({ message: 'El campo is_primary debe ser verdadero o falso' })
  is_primary?: boolean;

  @IsOptional()
  @IsString({ message: 'El estado debe ser texto' })
  @IsIn(['active', 'inactive'], { message: 'El estado debe ser: active o inactive' })
  status?: string;

  @IsOptional()
  @IsString({ message: 'Las notas deben ser texto' })
  notes?: string;
}

/**
 * DTO for updating provider contact
 */
export class ProviderContactUpdateDto {
  @IsOptional()
  @IsString({ message: 'El nombre del contacto debe ser texto' })
  @MaxLength(200, { message: 'El nombre del contacto no debe exceder 200 caracteres' })
  contact_name?: string;

  @IsOptional()
  @IsString({ message: 'El cargo debe ser texto' })
  @MaxLength(100, { message: 'El cargo no debe exceder 100 caracteres' })
  position?: string;

  @IsOptional()
  @IsString({ message: 'El teléfono principal debe ser texto' })
  @MaxLength(20, { message: 'El teléfono principal no debe exceder 20 caracteres' })
  primary_phone?: string;

  @IsOptional()
  @IsString({ message: 'El teléfono secundario debe ser texto' })
  @MaxLength(20, { message: 'El teléfono secundario no debe exceder 20 caracteres' })
  secondary_phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El email debe ser válido' })
  @MaxLength(200, { message: 'El email no debe exceder 200 caracteres' })
  email?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El email secundario debe ser válido' })
  @MaxLength(200, { message: 'El email secundario no debe exceder 200 caracteres' })
  secondary_email?: string;

  @IsOptional()
  @IsString({ message: 'El tipo de contacto debe ser texto' })
  @IsIn(['sales', 'billing', 'technical', 'general'], {
    message: 'El tipo de contacto debe ser: sales, billing, technical o general',
  })
  contact_type?: string;

  @IsOptional()
  @IsBoolean({ message: 'El campo is_primary debe ser verdadero o falso' })
  is_primary?: boolean;

  @IsOptional()
  @IsString({ message: 'El estado debe ser texto' })
  @IsIn(['active', 'inactive'], { message: 'El estado debe ser: active o inactive' })
  status?: string;

  @IsOptional()
  @IsString({ message: 'Las notas deben ser texto' })
  notes?: string;
}
