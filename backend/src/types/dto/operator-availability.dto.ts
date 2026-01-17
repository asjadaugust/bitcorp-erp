import {
  IsNotEmpty,
  IsInt,
  IsBoolean,
  IsDateString,
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for creating operator availability
 */
export class OperatorAvailabilityCreateDto {
  @IsNotEmpty({ message: 'El ID del trabajador es requerido' })
  @IsInt({ message: 'El ID del trabajador debe ser un número entero' })
  trabajador_id!: number;

  @IsNotEmpty({ message: 'La fecha de inicio es requerida' })
  @IsDateString({}, { message: 'La fecha de inicio debe ser una fecha válida (YYYY-MM-DD)' })
  fecha_inicio!: string;

  @IsNotEmpty({ message: 'La fecha de fin es requerida' })
  @IsDateString({}, { message: 'La fecha de fin debe ser una fecha válida (YYYY-MM-DD)' })
  fecha_fin!: string;

  @IsNotEmpty({ message: 'El estado de disponibilidad es requerido' })
  @IsBoolean({ message: 'El estado de disponibilidad debe ser verdadero o falso' })
  disponible!: boolean;

  @IsOptional()
  @IsString({ message: 'El motivo debe ser texto' })
  motivo?: string;
}

/**
 * DTO for updating operator availability
 */
export class OperatorAvailabilityUpdateDto {
  @IsOptional()
  @IsInt({ message: 'El ID del trabajador debe ser un número entero' })
  trabajador_id?: number;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de inicio debe ser una fecha válida (YYYY-MM-DD)' })
  fecha_inicio?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de fin debe ser una fecha válida (YYYY-MM-DD)' })
  fecha_fin?: string;

  @IsOptional()
  @IsBoolean({ message: 'El estado de disponibilidad debe ser verdadero o falso' })
  disponible?: boolean;

  @IsOptional()
  @IsString({ message: 'El motivo debe ser texto' })
  motivo?: string;
}

/**
 * DTO for bulk creating operator availabilities
 */
export class OperatorAvailabilityBulkCreateDto {
  @IsNotEmpty({ message: 'La lista de disponibilidades es requerida' })
  @IsArray({ message: 'Las disponibilidades deben ser un arreglo' })
  @ValidateNested({ each: true })
  @Type(() => OperatorAvailabilityCreateDto)
  availabilities!: OperatorAvailabilityCreateDto[];
}
