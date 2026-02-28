/**
 * Movement (Movimiento) DTOs
 *
 * Spanish snake_case field naming (ARCHITECTURE.md 3.2)
 * Maps from Movement entity (Spanish camelCase) to API format (Spanish snake_case)
 *
 * Entity: backend/src/models/movement.model.ts
 * Controller: backend/src/api/logistics/movement.controller.ts
 */

import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  IsIn,
  IsDateString,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * MovementListDto - Minimal fields for grid views
 * Used by: GET /api/movements (list view)
 */
export interface MovementListDto {
  id: number;
  proyecto_id: number | null;
  fecha: string; // ISO date YYYY-MM-DD
  tipo_movimiento: string; // entrada, salida, transferencia, ajuste
  numero_documento: string | null;
  observaciones: string | null;
  estado: string; // pendiente, aprobado, rechazado, completado
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  // Computed/joined fields
  proyecto_nombre: string | null; // From project relation
  creado_por_nombre: string | null; // From creator relation
  items_count: number; // Count of details
  monto_total: number; // Sum of detail amounts
}

/**
 * MovementDetailDto - Full fields for detail view
 * Used by: GET /api/movements/:id (single view)
 */
export interface MovementDetailDto {
  id: number;
  proyecto_id: number | null;
  fecha: string; // ISO date
  tipo_movimiento: string;
  numero_documento: string | null;
  observaciones: string | null;
  estado: string;
  creado_por: number | null;
  aprobado_por: number | null;
  aprobado_en: string | null; // ISO timestamp
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  // Relations
  proyecto_nombre: string | null;
  creado_por_nombre: string | null;
  aprobado_por_nombre: string | null;
  // Details array
  detalles: MovementDetailEntryDto[];
}

/**
 * MovementDetailEntryDto - Movement detail line item
 * Used within MovementDetailDto
 */
export interface MovementDetailEntryDto {
  id: number;
  movimiento_id: number;
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
  monto_total: number;
  observaciones: string | null;
  // Product info
  producto_codigo: string | null;
  producto_nombre: string | null;
  unidad_medida: string | null;
}

/**
 * MovementItemCreateDto - Detail line item for creation
 */
export class MovementItemCreateDto {
  @IsNumber({}, { message: 'producto_id debe ser un número' })
  producto_id!: number;

  @IsNumber({}, { message: 'cantidad debe ser un número' })
  @Min(0.01, { message: 'cantidad debe ser mayor a 0' })
  cantidad!: number;

  @IsNumber({}, { message: 'precio_unitario debe ser un número' })
  @Min(0, { message: 'precio_unitario no puede ser negativo' })
  precio_unitario!: number;

  @IsOptional()
  @IsString({ message: 'observaciones debe ser un string' })
  observaciones?: string;
}

/**
 * MovementCreateDto - Input validation for creating movements
 * Used by: POST /api/movements
 */
export class MovementCreateDto {
  @IsOptional()
  @IsNumber({}, { message: 'proyecto_id debe ser un número' })
  proyecto_id?: number;

  @IsDateString({}, { message: 'fecha debe ser una fecha válida (ISO 8601)' })
  fecha!: string; // ISO date

  @IsString({ message: 'tipo_movimiento debe ser un string' })
  @IsIn(['entrada', 'salida', 'transferencia', 'ajuste'], {
    message: 'tipo_movimiento debe ser: entrada, salida, transferencia o ajuste',
  })
  tipo_movimiento!: string;

  @IsOptional()
  @IsString({ message: 'numero_documento debe ser un string' })
  numero_documento?: string;

  @IsOptional()
  @IsString({ message: 'observaciones debe ser un string' })
  observaciones?: string;

  @IsArray({ message: 'items debe ser un array' })
  @ArrayMinSize(1, { message: 'items debe contener al menos 1 elemento' })
  @ValidateNested({ each: true })
  @Type(() => MovementItemCreateDto)
  items!: MovementItemCreateDto[]; // Details
}

// ============================================
// Transformer Functions
// ============================================

/**
 * Transform Movement entity to MovementListDto
 */
export function toMovementListDto(
  movement: Record<string, unknown>,
  itemsCount: number = 0,
  montoTotal: number = 0
): MovementListDto {
  return {
    id: movement.id as number,
    proyecto_id: (movement.projectId as number) || null,
    fecha: movement.fecha ? new Date(movement.fecha as Date).toISOString().split('T')[0] : '',
    tipo_movimiento: (movement.tipoMovimiento as string) || '',
    numero_documento: (movement.numeroDocumento as string) || null,
    observaciones: (movement.observaciones as string) || null,
    estado: (movement.estado as string) || 'pendiente',
    created_at: movement.createdAt ? new Date(movement.createdAt as Date).toISOString() : '',
    updated_at: movement.updatedAt ? new Date(movement.updatedAt as Date).toISOString() : '',
    // Joined fields
    proyecto_nombre:
      ((movement.project as Record<string, unknown>)?.nombre as string | null) || null,
    creado_por_nombre:
      ((movement.creator as Record<string, unknown>)?.username as string | null) || null,
    items_count: itemsCount,
    monto_total: montoTotal,
  };
}

/**
 * Transform Movement entity to MovementDetailDto
 */
export function toMovementDetailDto(movement: Record<string, unknown>): MovementDetailDto {
  const details = movement.details as Record<string, unknown>[] | undefined;

  return {
    id: movement.id as number,
    proyecto_id: (movement.projectId as number) || null,
    fecha: movement.fecha ? new Date(movement.fecha as Date).toISOString().split('T')[0] : '',
    tipo_movimiento: (movement.tipoMovimiento as string) || '',
    numero_documento: (movement.numeroDocumento as string) || null,
    observaciones: (movement.observaciones as string) || null,
    estado: (movement.estado as string) || 'pendiente',
    creado_por: (movement.createdBy as number) || null,
    aprobado_por: (movement.approvedBy as number) || null,
    aprobado_en: movement.approvedAt ? new Date(movement.approvedAt as Date).toISOString() : null,
    created_at: movement.createdAt ? new Date(movement.createdAt as Date).toISOString() : '',
    updated_at: movement.updatedAt ? new Date(movement.updatedAt as Date).toISOString() : '',
    // Relations
    proyecto_nombre:
      ((movement.project as Record<string, unknown>)?.nombre as string | null) || null,
    creado_por_nombre:
      ((movement.creator as Record<string, unknown>)?.username as string | null) || null,
    aprobado_por_nombre:
      ((movement.approver as Record<string, unknown>)?.username as string | null) || null,
    // Details
    detalles: details ? toMovementDetailEntryDtoArray(details) : [],
  };
}

/**
 * Transform MovementDetail entity to MovementDetailEntryDto
 */
export function toMovementDetailEntryDto(detail: Record<string, unknown>): MovementDetailEntryDto {
  const product = detail.product as Record<string, unknown> | undefined;

  return {
    id: detail.id as number,
    movimiento_id: detail.movementId as number,
    producto_id: detail.productId as number,
    cantidad: detail.cantidad as number,
    precio_unitario: detail.precioUnitario as number,
    monto_total: detail.montoTotal
      ? (detail.montoTotal as number)
      : (detail.cantidad as number) * (detail.precioUnitario as number),
    observaciones: (detail.observaciones as string) || null,
    // Product info
    producto_codigo: (product?.codigo as string | null) || null,
    producto_nombre: (product?.nombre as string | null) || null,
    unidad_medida: (product?.unidadMedida as string | null) || null,
  };
}

/**
 * Transform array of MovementDetail entities to MovementDetailEntryDto[]
 */
export function toMovementDetailEntryDtoArray(
  details: Record<string, unknown>[]
): MovementDetailEntryDto[] {
  return details.map((d) => toMovementDetailEntryDto(d));
}

/**
 * Transform MovementCreateDto to Movement entity fields
 */
export function fromMovementCreateDto(
  dto: MovementCreateDto,
  createdBy?: number
): Record<string, unknown> {
  return {
    projectId: dto.proyecto_id,
    fecha: new Date(dto.fecha),
    tipoMovimiento: dto.tipo_movimiento,
    numeroDocumento: dto.numero_documento,
    observaciones: dto.observaciones,
    estado: 'pendiente',
    createdBy,
  };
}

/**
 * Transform MovementItemCreateDto to MovementDetail entity fields
 */
export function fromMovementItemCreateDto(
  dto: MovementItemCreateDto,
  movementId: number
): Record<string, unknown> {
  return {
    movementId,
    productId: dto.producto_id,
    cantidad: dto.cantidad,
    precioUnitario: dto.precio_unitario,
    montoTotal: dto.cantidad * dto.precio_unitario,
    observaciones: dto.observaciones,
  };
}
