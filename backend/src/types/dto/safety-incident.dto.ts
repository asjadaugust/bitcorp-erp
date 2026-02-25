import { IsString, IsOptional, IsEnum, IsInt, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoIncidente, SeveridadIncidente, Incidente } from '../../models/safety-incident.model';

/**
 * Response DTO for safety incident (snake_case for API responses)
 */
export interface SafetyIncidentDto {
  id: number;
  legacy_id?: string;
  fecha_incidente: Date;
  tipo_incidente?: string;
  severidad?: SeveridadIncidente;
  ubicacion?: string;
  descripcion?: string;
  acciones_tomadas?: string;
  proyecto_id?: number;
  reportado_por?: number;
  estado: EstadoIncidente;
  created_at: Date;
  updated_at: Date;
  reportador_nombre?: string; // From relation
}

/**
 * Create DTO with validation for safety incident
 */
export class SafetyIncidentCreateDto {
  @IsDateString()
  @Type(() => Date)
  fecha_incidente!: Date;

  @IsOptional()
  @IsString()
  tipo_incidente?: string;

  @IsOptional()
  @IsEnum(['LEVE', 'MODERADO', 'GRAVE', 'MUY_GRAVE'], {
    message: 'Severidad must be one of: LEVE, MODERADO, GRAVE, MUY_GRAVE',
  })
  severidad?: SeveridadIncidente;

  @IsOptional()
  @IsString()
  ubicacion?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  acciones_tomadas?: string;

  @IsOptional()
  @IsInt()
  proyecto_id?: number;

  @IsOptional()
  @IsInt()
  reportado_por?: number;

  @IsOptional()
  @IsEnum(['ABIERTO', 'EN_INVESTIGACION', 'CERRADO'], {
    message: 'Estado must be one of: ABIERTO, EN_INVESTIGACION, CERRADO',
  })
  estado?: EstadoIncidente;
}

/**
 * Update DTO (all fields optional)
 */
export class SafetyIncidentUpdateDto {
  @IsOptional()
  @IsString()
  tipo_incidente?: string;

  @IsOptional()
  @IsEnum(['LEVE', 'MODERADO', 'GRAVE', 'MUY_GRAVE'], {
    message: 'Severidad must be one of: LEVE, MODERADO, GRAVE, MUY_GRAVE',
  })
  severidad?: SeveridadIncidente;

  @IsOptional()
  @IsString()
  ubicacion?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  acciones_tomadas?: string;

  @IsOptional()
  @IsEnum(['ABIERTO', 'EN_INVESTIGACION', 'CERRADO'], {
    message: 'Estado must be one of: ABIERTO, EN_INVESTIGACION, CERRADO',
  })
  estado?: EstadoIncidente;
}

/**
 * Transform Incidente entity to SafetyIncidentDto (snake_case)
 */
export function toSafetyIncidentDto(entity: Incidente): SafetyIncidentDto {
  return {
    id: entity.id,
    legacy_id: entity.legacyId || undefined,
    fecha_incidente: entity.fechaIncidente,
    tipo_incidente: entity.tipoIncidente || undefined,
    severidad: entity.severidad || undefined,
    ubicacion: entity.ubicacion || undefined,
    descripcion: entity.descripcion || undefined,
    acciones_tomadas: entity.accionesTomadas || undefined,
    proyecto_id: entity.proyectoId || undefined,
    reportado_por: entity.reportadoPor || undefined,
    estado: entity.estado,
    created_at: entity.createdAt,
    updated_at: entity.updatedAt,
    reportador_nombre: entity.reportador
      ? `${entity.reportador.firstName || ''} ${entity.reportador.lastName || ''}`.trim()
      : undefined,
  };
}

/**
 * Transform array of Incidente entities to SafetyIncidentDto array
 */
export function toSafetyIncidentDtoArray(entities: Incidente[]): SafetyIncidentDto[] {
  return entities.map(toSafetyIncidentDto);
}
