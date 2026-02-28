/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IsString,
  IsEmail,
  IsOptional,
  IsNumber,
  IsBoolean,
  MinLength,
  MaxLength,
} from 'class-validator';

/**
 * DTO for creating a new user
 */
export class CreateUserDto {
  @IsString({ message: 'El nombre de usuario debe ser una cadena de texto' })
  @MinLength(3, { message: 'El nombre de usuario debe tener al menos 3 caracteres' })
  @MaxLength(50, { message: 'El nombre de usuario no debe exceder 50 caracteres' })
  username!: string;

  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password!: string;

  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email!: string;

  @IsOptional()
  @IsString({ message: 'Los nombres deben ser una cadena de texto' })
  first_name?: string;

  @IsOptional()
  @IsString({ message: 'Los apellidos deben ser una cadena de texto' })
  last_name?: string;

  @IsOptional()
  @IsString({ message: 'El DNI debe ser una cadena de texto' })
  dni?: string;

  @IsOptional()
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  phone?: string;

  @IsNumber({}, { message: 'El rol debe ser un número' })
  rol_id!: number;

  @IsOptional()
  @IsNumber({}, { message: 'La unidad operativa debe ser un número' })
  unidad_operativa_id?: number;

  @IsOptional()
  @IsBoolean({ message: 'El estado debe ser verdadero o falso' })
  is_active?: boolean;
}

/**
 * DTO for updating a user
 */
export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: 'El nombre de usuario debe ser una cadena de texto' })
  @MinLength(3, { message: 'El nombre de usuario debe tener al menos 3 caracteres' })
  @MaxLength(50, { message: 'El nombre de usuario no debe exceder 50 caracteres' })
  username?: string;

  @IsOptional()
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'Los nombres deben ser una cadena de texto' })
  first_name?: string;

  @IsOptional()
  @IsString({ message: 'Los apellidos deben ser una cadena de texto' })
  last_name?: string;

  @IsOptional()
  @IsString({ message: 'El DNI debe ser una cadena de texto' })
  dni?: string;

  @IsOptional()
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  phone?: string;

  @IsOptional()
  @IsNumber({}, { message: 'El rol debe ser un número' })
  rol_id?: number;

  @IsOptional()
  @IsNumber({}, { message: 'La unidad operativa debe ser un número' })
  unidad_operativa_id?: number;

  @IsOptional()
  @IsBoolean({ message: 'El estado debe ser verdadero o falso' })
  is_active?: boolean;
}

/**
 * DTO for changing a user's password (admin reset)
 */
export class ChangePasswordDto {
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  new_password!: string;
}
