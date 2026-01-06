/**
 * Provider DTO
 *
 * Following ARCHITECTURE.md guidelines:
 * - Uses Spanish snake_case field names matching database columns
 * - DTO transformation happens in service layer
 * - Returns Spanish column names to API
 */

import { Provider, TipoProveedor } from '../../models/provider.model';

export interface ProviderDto {
  id: number;
  legacy_id?: string | null;
  ruc: string;
  razon_social: string;
  nombre_comercial?: string | null;
  tipo_proveedor?: TipoProveedor | null;
  direccion?: string | null;
  telefono?: string | null;
  email?: string | null;
  is_active: boolean;
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
}

/**
 * Transform TypeORM entity to DTO (Spanish snake_case)
 * @param entity - Provider entity from database
 * @returns ProviderDto with Spanish field names
 */
export function toProviderDto(entity: Provider): ProviderDto {
  // Helper to convert Date to ISO datetime string
  const toDateTimeString = (date?: Date | string): string => {
    if (!date) return new Date().toISOString();
    if (typeof date === 'string') return date;
    return date.toISOString();
  };

  return {
    id: entity.id,
    legacy_id: entity.legacy_id || null,
    ruc: entity.ruc,
    razon_social: entity.razon_social,
    nombre_comercial: entity.nombre_comercial || null,
    tipo_proveedor: entity.tipo_proveedor || null,
    direccion: entity.direccion || null,
    telefono: entity.telefono || null,
    email: entity.email || null,
    is_active: entity.is_active,
    created_at: toDateTimeString(entity.created_at),
    updated_at: toDateTimeString(entity.updated_at),
  };
}

/**
 * Transform DTO to TypeORM entity for create/update (Spanish snake_case → entity)
 * @param dto - ProviderDto from API request
 * @returns Partial<Provider> entity for database
 */
export function fromProviderDto(dto: Partial<ProviderDto>): Partial<Provider> {
  const entity: Partial<Provider> = {};

  if (dto.id !== undefined) entity.id = dto.id;
  if (dto.legacy_id !== undefined) entity.legacy_id = dto.legacy_id || undefined;
  if (dto.ruc !== undefined) entity.ruc = dto.ruc;
  if (dto.razon_social !== undefined) entity.razon_social = dto.razon_social;
  if (dto.nombre_comercial !== undefined)
    entity.nombre_comercial = dto.nombre_comercial || undefined;
  if (dto.tipo_proveedor !== undefined) entity.tipo_proveedor = dto.tipo_proveedor || undefined;
  if (dto.direccion !== undefined) entity.direccion = dto.direccion || undefined;
  if (dto.telefono !== undefined) entity.telefono = dto.telefono || undefined;
  if (dto.email !== undefined) entity.email = dto.email || undefined;
  if (dto.is_active !== undefined) entity.is_active = dto.is_active;

  return entity;
}
