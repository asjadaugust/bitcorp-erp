/**
 * Provider DTO
 *
 * Following ARCHITECTURE.md guidelines:
 * - Uses Spanish snake_case field names matching database columns
 * - DTO transformation happens in service layer
 * - Returns Spanish column names to API
 */

import { Provider, TipoProveedor } from '../../models/provider.model';
import {
  IsString,
  IsEmail,
  IsBoolean,
  IsOptional,
  IsIn,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';

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

/**
 * Provider Create DTO - for creating new providers
 * Validation with class-validator decorators
 */
export class ProviderCreateDto {
  @IsOptional()
  @IsString({ message: 'legacy_id debe ser un string' })
  @MaxLength(50, { message: 'legacy_id no puede exceder 50 caracteres' })
  legacy_id?: string;

  @IsString({ message: 'ruc es requerido' })
  @MinLength(11, { message: 'ruc debe tener exactamente 11 dígitos' })
  @MaxLength(11, { message: 'ruc debe tener exactamente 11 dígitos' })
  @Matches(/^\d{11}$/, { message: 'ruc debe contener solo dígitos (11 caracteres)' })
  ruc!: string;

  @IsString({ message: 'razon_social es requerido' })
  @MaxLength(200, { message: 'razon_social no puede exceder 200 caracteres' })
  razon_social!: string;

  @IsOptional()
  @IsString({ message: 'nombre_comercial debe ser un string' })
  @MaxLength(200, { message: 'nombre_comercial no puede exceder 200 caracteres' })
  nombre_comercial?: string;

  @IsOptional()
  @IsString({ message: 'tipo_proveedor debe ser un string' })
  @IsIn(['EQUIPOS', 'MATERIALES', 'SERVICIOS', 'MIXTO'], {
    message: 'tipo_proveedor debe ser EQUIPOS, MATERIALES, SERVICIOS o MIXTO',
  })
  tipo_proveedor?: TipoProveedor;

  @IsOptional()
  @IsString({ message: 'direccion debe ser un string' })
  @MaxLength(500, { message: 'direccion no puede exceder 500 caracteres' })
  direccion?: string;

  @IsOptional()
  @IsString({ message: 'telefono debe ser un string' })
  @MaxLength(20, { message: 'telefono no puede exceder 20 caracteres' })
  telefono?: string;

  @IsOptional()
  @IsEmail({}, { message: 'email debe ser un correo electrónico válido' })
  @MaxLength(100, { message: 'email no puede exceder 100 caracteres' })
  email?: string;

  @IsOptional()
  @IsBoolean({ message: 'is_active debe ser un booleano' })
  is_active?: boolean;
}

/**
 * Provider Update DTO - for updating existing providers
 * All fields optional
 */
export class ProviderUpdateDto {
  @IsOptional()
  @IsString({ message: 'legacy_id debe ser un string' })
  @MaxLength(50, { message: 'legacy_id no puede exceder 50 caracteres' })
  legacy_id?: string;

  @IsOptional()
  @IsString({ message: 'ruc debe ser un string' })
  @MinLength(11, { message: 'ruc debe tener exactamente 11 dígitos' })
  @MaxLength(11, { message: 'ruc debe tener exactamente 11 dígitos' })
  @Matches(/^\d{11}$/, { message: 'ruc debe contener solo dígitos (11 caracteres)' })
  ruc?: string;

  @IsOptional()
  @IsString({ message: 'razon_social debe ser un string' })
  @MaxLength(200, { message: 'razon_social no puede exceder 200 caracteres' })
  razon_social?: string;

  @IsOptional()
  @IsString({ message: 'nombre_comercial debe ser un string' })
  @MaxLength(200, { message: 'nombre_comercial no puede exceder 200 caracteres' })
  nombre_comercial?: string;

  @IsOptional()
  @IsString({ message: 'tipo_proveedor debe ser un string' })
  @IsIn(['EQUIPOS', 'MATERIALES', 'SERVICIOS', 'MIXTO'], {
    message: 'tipo_proveedor debe ser EQUIPOS, MATERIALES, SERVICIOS o MIXTO',
  })
  tipo_proveedor?: TipoProveedor;

  @IsOptional()
  @IsString({ message: 'direccion debe ser un string' })
  @MaxLength(500, { message: 'direccion no puede exceder 500 caracteres' })
  direccion?: string;

  @IsOptional()
  @IsString({ message: 'telefono debe ser un string' })
  @MaxLength(20, { message: 'telefono no puede exceder 20 caracteres' })
  telefono?: string;

  @IsOptional()
  @IsEmail({}, { message: 'email debe ser un correo electrónico válido' })
  @MaxLength(100, { message: 'email no puede exceder 100 caracteres' })
  email?: string;

  @IsOptional()
  @IsBoolean({ message: 'is_active debe ser un booleano' })
  is_active?: boolean;
}
