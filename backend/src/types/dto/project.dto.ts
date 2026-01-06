/**
 * Project DTO
 *
 * Following ARCHITECTURE.md guidelines:
 * - Uses Spanish snake_case field names matching database columns
 * - DTO transformation happens in service layer
 * - Returns Spanish column names to API
 */

import { Proyecto, EstadoProyecto } from '../../models/project.model';

export interface ProjectDto {
  id: number;
  legacy_id?: string | null;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  ubicacion?: string | null;
  fecha_inicio?: string | null; // ISO date string
  fecha_fin?: string | null; // ISO date string
  presupuesto?: number | null;
  estado: string; // PLANIFICACION, ACTIVO, PAUSADO, COMPLETADO, CANCELADO
  empresa_id?: number | null;
  unidad_operativa_id?: number | null;
  cliente?: string | null;
  is_active: boolean;
  creado_por?: number | null;
  actualizado_por?: number | null;
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string

  // Optional joined data
  creator?: {
    id: number;
    username: string;
    full_name: string;
  };
  updater?: {
    id: number;
    username: string;
    full_name: string;
  };
}

/**
 * Transform TypeORM entity to DTO (Spanish snake_case)
 * @param entity - Proyecto entity from database
 * @returns ProjectDto with Spanish field names
 */
export function toProjectDto(entity: Proyecto): ProjectDto {
  // Helper to convert Date or string to ISO date string (YYYY-MM-DD)
  const toDateString = (date?: Date | string | null): string | null => {
    if (!date) return null;
    if (typeof date === 'string') {
      // Already a string, extract YYYY-MM-DD
      return date.split('T')[0];
    }
    // It's a Date object
    return date.toISOString().split('T')[0];
  };

  // Helper to convert Date to ISO datetime string
  const toDateTimeString = (date?: Date | string): string => {
    if (!date) return new Date().toISOString();
    if (typeof date === 'string') return date;
    return date.toISOString();
  };

  return {
    id: entity.id,
    legacy_id: entity.legacyId || null,
    codigo: entity.codigo,
    nombre: entity.nombre,
    descripcion: entity.descripcion || null,
    ubicacion: entity.ubicacion || null,
    fecha_inicio: toDateString(entity.fechaInicio),
    fecha_fin: toDateString(entity.fechaFin),
    presupuesto: entity.presupuesto || null,
    estado: entity.estado,
    empresa_id: entity.companyId || null,
    unidad_operativa_id: entity.operatingUnitId || null,
    cliente: entity.cliente || null,
    is_active: entity.isActive,
    creado_por: entity.createdBy || null,
    actualizado_por: entity.updatedBy || null,
    created_at: toDateTimeString(entity.createdAt),
    updated_at: toDateTimeString(entity.updatedAt),
    // Include joined relations if loaded
    creator: entity.creator
      ? {
          id: entity.creator.id,
          username: entity.creator.username,
          full_name: entity.creator.full_name || entity.creator.username,
        }
      : undefined,
    updater: entity.updater
      ? {
          id: entity.updater.id,
          username: entity.updater.username,
          full_name: entity.updater.full_name || entity.updater.username,
        }
      : undefined,
  };
}

/**
 * Transform DTO to TypeORM entity for create/update (Spanish snake_case → camelCase)
 * @param dto - ProjectDto from API request
 * @returns Partial<Proyecto> entity for database
 */
export function fromProjectDto(dto: Partial<ProjectDto>): Partial<Proyecto> {
  const entity: Partial<Proyecto> = {};

  if (dto.id !== undefined) entity.id = dto.id;
  if (dto.legacy_id !== undefined) entity.legacyId = dto.legacy_id || undefined;
  if (dto.codigo !== undefined) entity.codigo = dto.codigo;
  if (dto.nombre !== undefined) entity.nombre = dto.nombre;
  if (dto.descripcion !== undefined) entity.descripcion = dto.descripcion || undefined;
  if (dto.ubicacion !== undefined) entity.ubicacion = dto.ubicacion || undefined;
  if (dto.fecha_inicio !== undefined)
    entity.fechaInicio = dto.fecha_inicio ? new Date(dto.fecha_inicio) : undefined;
  if (dto.fecha_fin !== undefined)
    entity.fechaFin = dto.fecha_fin ? new Date(dto.fecha_fin) : undefined;
  if (dto.presupuesto !== undefined) entity.presupuesto = dto.presupuesto || undefined;
  if (dto.estado !== undefined) entity.estado = dto.estado as EstadoProyecto;
  if (dto.empresa_id !== undefined) entity.companyId = dto.empresa_id || undefined;
  if (dto.unidad_operativa_id !== undefined)
    entity.operatingUnitId = dto.unidad_operativa_id || undefined;
  if (dto.cliente !== undefined) entity.cliente = dto.cliente || undefined;
  if (dto.is_active !== undefined) entity.isActive = dto.is_active;
  if (dto.creado_por !== undefined) entity.createdBy = dto.creado_por || undefined;
  if (dto.actualizado_por !== undefined) entity.updatedBy = dto.actualizado_por || undefined;

  return entity;
}
