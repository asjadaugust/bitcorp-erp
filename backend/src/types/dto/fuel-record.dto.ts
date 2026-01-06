/**
 * Fuel Record DTO
 *
 * Following ARCHITECTURE.md guidelines:
 * - Uses Spanish snake_case field names matching database columns
 * - DTO transformation happens in service layer
 * - Returns Spanish column names to API
 */

import { RegistroCombustible, TipoCombustible } from '../../models/fuel-record.model';

/**
 * DTO for fuel records with Spanish snake_case fields
 * Follows ARCHITECTURE.md DTO pattern
 */
export interface FuelRecordDto {
  id: number;
  valorizacion_id: number;
  fecha: string; // ISO date string (YYYY-MM-DD)
  cantidad: number | null;
  precio_unitario: number | null;
  monto_total: number | null;
  tipo_combustible: TipoCombustible | null;
  proveedor: string | null;
  numero_documento: string | null;
  observaciones: string | null;
  created_at: string; // ISO datetime string

  // Computed relation fields
  valorizacion_periodo?: string | null;
  valorizacion_equipment_id?: number | null;
}

/**
 * Dual input format DTO for create operations
 * Supports both English camelCase (frontend) and Spanish snake_case (API/tests)
 */
export interface CreateFuelRecordDto {
  // Spanish snake_case (preferred)
  valorizacion_id?: number;
  fecha?: string;
  cantidad?: number;
  precio_unitario?: number;
  monto_total?: number;
  tipo_combustible?: TipoCombustible;
  proveedor?: string;
  numero_documento?: string;
  observaciones?: string;

  // English camelCase (backward compatibility)
  valorizacionId?: number;
  date?: string;
  amount?: number;
  unitPrice?: number;
  totalAmount?: number;
  fuelType?: TipoCombustible;
  provider?: string;
  documentNumber?: string;
  notes?: string;
}

/**
 * Update DTO - partial version of CreateFuelRecordDto
 */
export interface UpdateFuelRecordDto extends Partial<CreateFuelRecordDto> {}

/**
 * Convert entity to DTO
 * @param entity - RegistroCombustible entity from database
 * @returns FuelRecordDto with Spanish snake_case fields
 */
export function toFuelRecordDto(entity: RegistroCombustible): FuelRecordDto {
  // Helper to convert Date to ISO date string (YYYY-MM-DD only)
  const toDateString = (date?: Date | string): string | null => {
    if (!date) return null;
    if (typeof date === 'string') return date.split('T')[0];
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
    valorizacion_id: entity.valorizacionId,
    fecha: toDateString(entity.fecha) || '',
    cantidad: entity.cantidad ? Number(entity.cantidad) : null,
    precio_unitario: entity.precioUnitario ? Number(entity.precioUnitario) : null,
    monto_total: entity.montoTotal ? Number(entity.montoTotal) : null,
    tipo_combustible: entity.tipoCombustible || null,
    proveedor: entity.proveedor || null,
    numero_documento: entity.numeroDocumento || null,
    observaciones: entity.observaciones || null,
    created_at: toDateTimeString(entity.createdAt),

    // Relation fields (if loaded)
    valorizacion_periodo: entity.valorizacion?.periodo || null,
    valorizacion_equipment_id: entity.valorizacion?.equipmentId || null,
  };
}

/**
 * Convert DTO to entity (for create/update operations)
 * @param dto - Partial FuelRecordDto with Spanish snake_case fields
 * @returns Partial entity ready for TypeORM
 */
export function fromFuelRecordDto(dto: Partial<FuelRecordDto>): Partial<RegistroCombustible> {
  // Helper to parse date string to Date object
  const parseDate = (dateStr?: string): Date | undefined => {
    if (!dateStr) return undefined;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? undefined : date;
  };

  const entity: Partial<RegistroCombustible> = {};

  if (dto.id !== undefined) entity.id = dto.id;
  if (dto.valorizacion_id !== undefined) entity.valorizacionId = dto.valorizacion_id;
  if (dto.fecha !== undefined) entity.fecha = parseDate(dto.fecha);
  if (dto.cantidad !== undefined) entity.cantidad = dto.cantidad || undefined;
  if (dto.precio_unitario !== undefined) entity.precioUnitario = dto.precio_unitario || undefined;
  if (dto.monto_total !== undefined) entity.montoTotal = dto.monto_total || undefined;
  if (dto.tipo_combustible !== undefined)
    entity.tipoCombustible = dto.tipo_combustible || undefined;
  if (dto.proveedor !== undefined) entity.proveedor = dto.proveedor || undefined;
  if (dto.numero_documento !== undefined)
    entity.numeroDocumento = dto.numero_documento || undefined;
  if (dto.observaciones !== undefined) entity.observaciones = dto.observaciones || undefined;

  return entity;
}

/**
 * Map dual input format to standard DTO format
 * Handles both English camelCase and Spanish snake_case inputs
 */
export function mapCreateFuelRecordDto(input: CreateFuelRecordDto): Partial<FuelRecordDto> {
  return {
    valorizacion_id: input.valorizacion_id ?? input.valorizacionId,
    fecha: input.fecha ?? input.date,
    cantidad: input.cantidad ?? input.amount,
    precio_unitario: input.precio_unitario ?? input.unitPrice,
    monto_total: input.monto_total ?? input.totalAmount,
    tipo_combustible: input.tipo_combustible ?? input.fuelType,
    proveedor: input.proveedor ?? input.provider,
    numero_documento: input.numero_documento ?? input.documentNumber,
    observaciones: input.observaciones ?? input.notes,
  };
}
