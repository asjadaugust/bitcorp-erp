/**
 * Cost Center DTOs - Spanish snake_case API contract
 * Maps CentroCosto entity (mixed case) to API format (Spanish snake_case)
 *
 * Entity: CentroCosto (administracion.centro_costo)
 * - id, legacyId, codigo, nombre, descripcion
 * - projectId, presupuesto, isActive
 * - createdAt, updatedAt
 *
 * API: All fields in Spanish snake_case
 * - id, legacy_id, codigo, nombre, descripcion
 * - proyecto_id, presupuesto, is_active
 * - created_at, updated_at
 */

import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

// ============================================
// Output DTOs (API Responses)
// ============================================

/**
 * CostCenterListDto - Minimal fields for grid views
 * Used by: GET /api/admin/cost-centers (list view)
 */
export interface CostCenterListDto {
  id: number;
  legacy_id: string | null;
  codigo: string;
  nombre: string;
  proyecto_id: number | null;
  presupuesto: number | null;
  is_active: boolean;
}

/**
 * CostCenterDetailDto - Full fields for detail view
 * Used by: GET /api/admin/cost-centers/:id (detail view)
 */
export interface CostCenterDetailDto {
  id: number;
  legacy_id: string | null;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  proyecto_id: number | null;
  presupuesto: number | null;
  is_active: boolean;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

// ============================================
// Input DTOs (Validation)
// ============================================

/**
 * CostCenterCreateDto - Input validation for creation
 * Used by: POST /api/admin/cost-centers
 */
export class CostCenterCreateDto {
  @IsNotEmpty({ message: 'El código es requerido' })
  @IsString({ message: 'El código debe ser texto' })
  @MaxLength(50, { message: 'El código no puede exceder 50 caracteres' })
  codigo!: string;

  @IsNotEmpty({ message: 'El nombre es requerido' })
  @IsString({ message: 'El nombre debe ser texto' })
  @MaxLength(255, { message: 'El nombre no puede exceder 255 caracteres' })
  nombre!: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  descripcion?: string;

  @IsOptional()
  @IsNumber({}, { message: 'El proyecto_id debe ser numérico' })
  proyecto_id?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El presupuesto debe ser numérico' })
  @Min(0, { message: 'El presupuesto debe ser positivo' })
  presupuesto?: number;

  @IsOptional()
  @IsBoolean({ message: 'is_active debe ser booleano' })
  is_active?: boolean;
}

// Input DTO for updating cost center
export class CostCenterUpdateDto {
  @IsOptional()
  @IsString({ message: 'El código debe ser texto' })
  @MaxLength(50, { message: 'El código no puede exceder 50 caracteres' })
  codigo?: string;

  @IsOptional()
  @IsString({ message: 'El nombre debe ser texto' })
  @MaxLength(255, { message: 'El nombre no puede exceder 255 caracteres' })
  nombre?: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  descripcion?: string;

  @IsOptional()
  @IsNumber({}, { message: 'El proyecto_id debe ser numérico' })
  proyecto_id?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El presupuesto debe ser numérico' })
  @Min(0, { message: 'El presupuesto debe ser positivo' })
  presupuesto?: number;

  @IsOptional()
  @IsBoolean({ message: 'is_active debe ser booleano' })
  is_active?: boolean;
}

// ============================================
// Transformer Functions
// ============================================

/**
 * Transform CentroCosto entity to CostCenterListDto
 * Used by: GET /api/admin/cost-centers (list)
 */
export function toCostCenterListDto(entity: Record<string, unknown>): CostCenterListDto {
  return {
    id: entity.id as number,
    legacy_id: (entity.legacyId as string) || null,
    codigo: entity.codigo as string,
    nombre: entity.nombre as string,
    proyecto_id: entity.projectId ? Number(entity.projectId) : null,
    presupuesto: entity.presupuesto ? Number(entity.presupuesto) : null,
    is_active: entity.isActive as boolean,
  };
}

/**
 * Transform CentroCosto entity to CostCenterDetailDto
 * Used by: GET /api/admin/cost-centers/:id (detail)
 */
export function toCostCenterDetailDto(entity: Record<string, unknown>): CostCenterDetailDto {
  // Helper for safe date conversion
  const toDateString = (date: Date | string | null | undefined): string => {
    if (!date) return new Date().toISOString();
    if (typeof date === 'string') return date;
    if (date instanceof Date) return date.toISOString();
    return new Date().toISOString();
  };

  return {
    id: entity.id as number,
    legacy_id: (entity.legacyId as string) || null,
    codigo: entity.codigo as string,
    nombre: entity.nombre as string,
    descripcion: (entity.descripcion as string) || null,
    proyecto_id: entity.projectId ? Number(entity.projectId) : null,
    presupuesto: entity.presupuesto ? Number(entity.presupuesto) : null,
    is_active: entity.isActive as boolean,
    created_at: toDateString(entity.createdAt as Date | string | null | undefined),
    updated_at: toDateString(entity.updatedAt as Date | string | null | undefined),
  };
}

/**
 * Transform array of entities to List DTOs
 */
export function toCostCenterListDtoArray(entities: Record<string, unknown>[]): CostCenterListDto[] {
  return entities.map((e) => toCostCenterListDto(e as Record<string, unknown>));
}

/**
 * Transform CostCenterCreateDto to entity data
 * Maps snake_case input to camelCase entity properties
 */
export function fromCostCenterCreateDto(dto: CostCenterCreateDto): Record<string, unknown> {
  return {
    codigo: dto.codigo,
    nombre: dto.nombre,
    descripcion: dto.descripcion || null,
    projectId: dto.proyecto_id || null,
    presupuesto: dto.presupuesto || null,
    isActive: dto.is_active !== undefined ? dto.is_active : true,
  };
}

/**
 * Transform CostCenterUpdateDto to partial entity data
 */
export function fromCostCenterUpdateDto(dto: CostCenterUpdateDto): Record<string, unknown> {
  const updates: Record<string, unknown> = {};
  if (dto.codigo !== undefined) updates.codigo = dto.codigo;
  if (dto.nombre !== undefined) updates.nombre = dto.nombre;
  if (dto.descripcion !== undefined) updates.descripcion = dto.descripcion;
  if (dto.proyecto_id !== undefined) updates.projectId = dto.proyecto_id;
  if (dto.presupuesto !== undefined) updates.presupuesto = dto.presupuesto;
  if (dto.is_active !== undefined) updates.isActive = dto.is_active;
  return updates;
}
