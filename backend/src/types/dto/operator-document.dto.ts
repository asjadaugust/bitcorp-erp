import {
  IsNotEmpty,
  IsInt,
  IsString,
  IsDateString,
  IsOptional,
  IsUrl,
  MaxLength,
} from 'class-validator';

/**
 * DTO for creating operator document
 */
export class OperatorDocumentCreateDto {
  @IsNotEmpty({ message: 'El ID del trabajador es requerido' })
  @IsInt({ message: 'El ID del trabajador debe ser un número entero' })
  trabajador_id!: number;

  @IsNotEmpty({ message: 'El tipo de documento es requerido' })
  @IsString({ message: 'El tipo de documento debe ser texto' })
  @MaxLength(50, { message: 'El tipo de documento no debe exceder 50 caracteres' })
  tipo_documento!: string;

  @IsOptional()
  @IsString({ message: 'El número de documento debe ser texto' })
  @MaxLength(100, { message: 'El número de documento no debe exceder 100 caracteres' })
  numero_documento?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de emisión debe ser una fecha válida (YYYY-MM-DD)' })
  fecha_emision?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de vencimiento debe ser una fecha válida (YYYY-MM-DD)' })
  fecha_vencimiento?: string;

  @IsOptional()
  @IsUrl({}, { message: 'La URL del archivo debe ser válida' })
  archivo_url?: string;

  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser texto' })
  observaciones?: string;
}

/**
 * DTO for updating operator document
 */
export class OperatorDocumentUpdateDto {
  @IsOptional()
  @IsInt({ message: 'El ID del trabajador debe ser un número entero' })
  trabajador_id?: number;

  @IsOptional()
  @IsString({ message: 'El tipo de documento debe ser texto' })
  @MaxLength(50, { message: 'El tipo de documento no debe exceder 50 caracteres' })
  tipo_documento?: string;

  @IsOptional()
  @IsString({ message: 'El número de documento debe ser texto' })
  @MaxLength(100, { message: 'El número de documento no debe exceder 100 caracteres' })
  numero_documento?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de emisión debe ser una fecha válida (YYYY-MM-DD)' })
  fecha_emision?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de vencimiento debe ser una fecha válida (YYYY-MM-DD)' })
  fecha_vencimiento?: string;

  @IsOptional()
  @IsUrl({}, { message: 'La URL del archivo debe ser válida' })
  archivo_url?: string;

  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser texto' })
  observaciones?: string;
}
