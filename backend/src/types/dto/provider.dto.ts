/**
 * Provider DTO
 *
 * Following ARCHITECTURE.md guidelines:
 * - Uses Spanish snake_case field names matching database columns
 * - DTO transformation happens in service layer
 * - Returns Spanish column names to API
 */

import { Provider } from '../../models/provider.model';
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
  tipo_proveedor?: string | null; // Spanish uppercase: EQUIPOS, MATERIALES, SERVICIOS, MIXTO
  direccion?: string | null;
  telefono?: string | null;
  correo_electronico?: string | null; // ✅ Spanish naming (was: email)
  estado_contribuyente?: string | null;
  condicion_contribuyente?: string | null;
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

  // Map database/model values to Spanish uppercase for API
  const normalizeTipoProveedor = (tipo?: string | null): string | null => {
    if (!tipo) return null;

    const mapping: Record<string, string> = {
      // English lowercase → Spanish uppercase
      equipment: 'EQUIPOS',
      services: 'SERVICIOS',
      supplies: 'MATERIALES',
      materials: 'MATERIALES',
      fuel: 'MATERIALES',
      other: 'MIXTO',
      // Spanish with underscore → Spanish uppercase
      EQUIPO_PESADO: 'EQUIPOS',
      EQUIPO: 'EQUIPOS',
      OPERADOR: 'SERVICIOS',
      SERVICIO: 'SERVICIOS',
      MATERIAL: 'MATERIALES',
      // Already correct (passthrough)
      EQUIPOS: 'EQUIPOS',
      MATERIALES: 'MATERIALES',
      SERVICIOS: 'SERVICIOS',
      MIXTO: 'MIXTO',
    };

    const normalized = mapping[tipo] || mapping[tipo.toUpperCase()];
    return normalized || 'MIXTO'; // Default to MIXTO if unknown
  };

  return {
    id: entity.id,
    legacy_id: entity.legacyId || null,
    ruc: entity.ruc,
    razon_social: entity.razonSocial,
    nombre_comercial: entity.nombreComercial || null,
    tipo_proveedor: normalizeTipoProveedor(entity.tipoProveedor),
    direccion: entity.direccion || null,
    telefono: entity.telefono || null,
    correo_electronico: entity.email || null, // ✅ Map entity.email → DTO.correo_electronico
    estado_contribuyente: entity.estadoContribuyente || null,
    condicion_contribuyente: entity.condicionContribuyente || null,
    is_active: entity.isActive,
    created_at: toDateTimeString(entity.createdAt),
    updated_at: toDateTimeString(entity.updatedAt),
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
  if (dto.legacy_id !== undefined) entity.legacyId = dto.legacy_id || undefined;
  if (dto.ruc !== undefined) entity.ruc = dto.ruc;
  if (dto.razon_social !== undefined) entity.razonSocial = dto.razon_social;
  if (dto.nombre_comercial !== undefined)
    entity.nombreComercial = dto.nombre_comercial || undefined;

  // Map Spanish uppercase to database format (database column accepts varchar, no enum constraint)
  if (dto.tipo_proveedor !== undefined) {
    entity.tipoProveedor = dto.tipo_proveedor as unknown as typeof entity.tipoProveedor;
  }

  if (dto.direccion !== undefined) entity.direccion = dto.direccion || undefined;
  if (dto.telefono !== undefined) entity.telefono = dto.telefono || undefined;
  if (dto.correo_electronico !== undefined) entity.email = dto.correo_electronico || undefined; // ✅ Map DTO.correo_electronico → entity.email
  if (dto.estado_contribuyente !== undefined)
    entity.estadoContribuyente = dto.estado_contribuyente || undefined;
  if (dto.condicion_contribuyente !== undefined)
    entity.condicionContribuyente = dto.condicion_contribuyente || undefined;
  if (dto.is_active !== undefined) entity.isActive = dto.is_active;

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
  tipo_proveedor?: string;

  @IsOptional()
  @IsString({ message: 'direccion debe ser un string' })
  @MaxLength(500, { message: 'direccion no puede exceder 500 caracteres' })
  direccion?: string;

  @IsOptional()
  @IsString({ message: 'telefono debe ser un string' })
  @MaxLength(20, { message: 'telefono no puede exceder 20 caracteres' })
  telefono?: string;

  @IsOptional()
  @IsEmail({}, { message: 'correo_electronico debe ser un correo electrónico válido' })
  @MaxLength(100, { message: 'correo_electronico no puede exceder 100 caracteres' })
  correo_electronico?: string; // ✅ Spanish naming (was: email)

  @IsOptional()
  @IsString({ message: 'estado_contribuyente debe ser un string' })
  @MaxLength(100, { message: 'estado_contribuyente no puede exceder 100 caracteres' })
  estado_contribuyente?: string;

  @IsOptional()
  @IsString({ message: 'condicion_contribuyente debe ser un string' })
  @MaxLength(100, { message: 'condicion_contribuyente no puede exceder 100 caracteres' })
  condicion_contribuyente?: string;

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
  tipo_proveedor?: string;

  @IsOptional()
  @IsString({ message: 'direccion debe ser un string' })
  @MaxLength(500, { message: 'direccion no puede exceder 500 caracteres' })
  direccion?: string;

  @IsOptional()
  @IsString({ message: 'telefono debe ser un string' })
  @MaxLength(20, { message: 'telefono no puede exceder 20 caracteres' })
  telefono?: string;

  @IsOptional()
  @IsEmail({}, { message: 'correo_electronico debe ser un correo electrónico válido' })
  @MaxLength(100, { message: 'correo_electronico no puede exceder 100 caracteres' })
  correo_electronico?: string; // ✅ Spanish naming (was: email)

  @IsOptional()
  @IsString({ message: 'estado_contribuyente debe ser un string' })
  @MaxLength(100, { message: 'estado_contribuyente no puede exceder 100 caracteres' })
  estado_contribuyente?: string;

  @IsOptional()
  @IsString({ message: 'condicion_contribuyente debe ser un string' })
  @MaxLength(100, { message: 'condicion_contribuyente no puede exceder 100 caracteres' })
  condicion_contribuyente?: string;

  @IsOptional()
  @IsBoolean({ message: 'is_active debe ser un booleano' })
  is_active?: boolean;
}
