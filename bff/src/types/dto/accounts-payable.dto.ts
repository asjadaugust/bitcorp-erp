/**
 * Accounts Payable DTO
 *
 * Following ARCHITECTURE.md guidelines:
 * - Uses Spanish snake_case field names matching database columns
 * - DTO transformation happens in service layer
 * - Returns Spanish column names to API
 */

import { AccountsPayable, AccountsPayableStatus } from '../../models/accounts-payable.model';
import {
  IsInt,
  IsIn,
  IsOptional,
  IsString,
  IsDateString,
  IsNumber,
  MaxLength,
  Min,
} from 'class-validator';

export interface AccountsPayableDto {
  id: number;
  legacy_id?: string | null;
  proveedor_id: number;
  provider?: {
    // Nested provider info (from eager relation)
    id: number;
    ruc: string;
    razon_social: string;
    nombre_comercial?: string | null;
  };
  numero_factura: string;
  fecha_emision: string; // ISO date string (YYYY-MM-DD)
  fecha_vencimiento: string; // ISO date string (YYYY-MM-DD)
  monto_total: number;
  monto_pagado: number;
  saldo: number;
  moneda: string;
  estado: AccountsPayableStatus;
  observaciones?: string | null;
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
}

/**
 * Transform TypeORM entity to DTO (Spanish snake_case)
 * @param entity - AccountsPayable entity from database
 * @returns AccountsPayableDto with Spanish field names
 */
export function toAccountsPayableDto(entity: AccountsPayable): AccountsPayableDto {
  // Helper to convert Date to ISO date string (YYYY-MM-DD only)
  const toDateString = (date?: Date | string): string => {
    if (!date) return new Date().toISOString().split('T')[0];
    if (typeof date === 'string') return date.split('T')[0];
    return date.toISOString().split('T')[0];
  };

  // Helper to convert Date to ISO datetime string
  const toDateTimeString = (date?: Date | string): string => {
    if (!date) return new Date().toISOString();
    if (typeof date === 'string') return date;
    return date.toISOString();
  };

  // Calculate balance
  const balance = Number(entity.amount) - Number(entity.amountPaid);

  return {
    id: entity.id,
    legacy_id: entity.legacyId || null,
    proveedor_id: entity.providerId,
    provider: entity.provider
      ? {
          id: entity.provider.id,
          ruc: entity.provider.ruc,
          razon_social: entity.provider.razonSocial,
          nombre_comercial: entity.provider.nombreComercial || null,
        }
      : undefined,
    numero_factura: entity.documentNumber,
    fecha_emision: toDateString(entity.issueDate),
    fecha_vencimiento: toDateString(entity.dueDate),
    monto_total: Number(entity.amount),
    monto_pagado: Number(entity.amountPaid),
    saldo: Number(entity.balance ?? balance),
    moneda: entity.currency,
    estado: entity.status,
    observaciones: entity.description || null,
    created_at: toDateTimeString(entity.createdAt),
    updated_at: toDateTimeString(entity.updatedAt),
  };
}

/**
 * Transform DTO to TypeORM entity for create/update (Spanish snake_case → entity)
 * @param dto - AccountsPayableDto from API request
 * @returns Partial<AccountsPayable> entity for database
 */
export function fromAccountsPayableDto(dto: Partial<AccountsPayableDto>): Partial<AccountsPayable> {
  // Helper to convert ISO date string to Date object
  const toDate = (dateStr?: string | null): Date | undefined => {
    if (!dateStr) return undefined;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? undefined : date;
  };

  const entity: Partial<AccountsPayable> = {};

  if (dto.id !== undefined) entity.id = dto.id;
  if (dto.legacy_id !== undefined) entity.legacyId = dto.legacy_id || undefined;
  if (dto.proveedor_id !== undefined) entity.providerId = dto.proveedor_id;
  if (dto.numero_factura !== undefined) entity.documentNumber = dto.numero_factura;
  if (dto.fecha_emision !== undefined) entity.issueDate = toDate(dto.fecha_emision)!;
  if (dto.fecha_vencimiento !== undefined) entity.dueDate = toDate(dto.fecha_vencimiento)!;
  if (dto.monto_total !== undefined) entity.amount = dto.monto_total;
  if (dto.monto_pagado !== undefined) entity.amountPaid = dto.monto_pagado;
  if (dto.saldo !== undefined) entity.balance = dto.saldo;
  if (dto.moneda !== undefined) entity.currency = dto.moneda;
  if (dto.estado !== undefined) entity.status = dto.estado;
  if (dto.observaciones !== undefined) entity.description = dto.observaciones || undefined;

  return entity;
}

/**
 * DTO for creating a new accounts payable record with validation
 * Used by validation middleware for POST requests
 */
export class AccountsPayableCreateDto {
  @IsOptional()
  @IsString({ message: 'ID legacy debe ser texto' })
  @MaxLength(50, { message: 'ID legacy no puede exceder 50 caracteres' })
  legacy_id?: string;

  @IsInt({ message: 'ID de proveedor debe ser un número entero' })
  proveedor_id!: number;

  @IsString({ message: 'Número de factura debe ser texto' })
  @MaxLength(100, { message: 'Número de factura no puede exceder 100 caracteres' })
  numero_factura!: string;

  @IsDateString({}, { message: 'Fecha de emisión debe ser una fecha válida (YYYY-MM-DD)' })
  fecha_emision!: string;

  @IsDateString({}, { message: 'Fecha de vencimiento debe ser una fecha válida (YYYY-MM-DD)' })
  fecha_vencimiento!: string;

  @IsNumber({}, { message: 'Monto total debe ser un número' })
  @Min(0, { message: 'Monto total debe ser mayor o igual a 0' })
  monto_total!: number;

  @IsOptional()
  @IsNumber({}, { message: 'Monto pagado debe ser un número' })
  @Min(0, { message: 'Monto pagado debe ser mayor o igual a 0' })
  monto_pagado?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Saldo debe ser un número' })
  @Min(0, { message: 'Saldo debe ser mayor o igual a 0' })
  saldo?: number;

  @IsString({ message: 'Moneda debe ser texto' })
  @MaxLength(3, { message: 'Moneda debe ser de 3 caracteres (PEN, USD, EUR)' })
  moneda!: string;

  @IsOptional()
  @IsIn(['PENDIENTE', 'PAGADO_PARCIAL', 'PAGADO', 'ANULADO'], {
    message: 'Estado debe ser PENDIENTE, PAGADO_PARCIAL, PAGADO o ANULADO',
  })
  estado?: AccountsPayableStatus;

  @IsOptional()
  @IsString({ message: 'Observaciones debe ser texto' })
  observaciones?: string;
}

/**
 * DTO for updating an accounts payable record (all fields optional)
 * Used by validation middleware for PUT requests
 */
export class AccountsPayableUpdateDto {
  @IsOptional()
  @IsString({ message: 'ID legacy debe ser texto' })
  @MaxLength(50, { message: 'ID legacy no puede exceder 50 caracteres' })
  legacy_id?: string;

  @IsOptional()
  @IsInt({ message: 'ID de proveedor debe ser un número entero' })
  proveedor_id?: number;

  @IsOptional()
  @IsString({ message: 'Número de factura debe ser texto' })
  @MaxLength(100, { message: 'Número de factura no puede exceder 100 caracteres' })
  numero_factura?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Fecha de emisión debe ser una fecha válida (YYYY-MM-DD)' })
  fecha_emision?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Fecha de vencimiento debe ser una fecha válida (YYYY-MM-DD)' })
  fecha_vencimiento?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Monto total debe ser un número' })
  @Min(0, { message: 'Monto total debe ser mayor o igual a 0' })
  monto_total?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Monto pagado debe ser un número' })
  @Min(0, { message: 'Monto pagado debe ser mayor o igual a 0' })
  monto_pagado?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Saldo debe ser un número' })
  @Min(0, { message: 'Saldo debe ser mayor o igual a 0' })
  saldo?: number;

  @IsOptional()
  @IsString({ message: 'Moneda debe ser texto' })
  @MaxLength(3, { message: 'Moneda debe ser de 3 caracteres (PEN, USD, EUR)' })
  moneda?: string;

  @IsOptional()
  @IsIn(['PENDIENTE', 'PAGADO_PARCIAL', 'PAGADO', 'ANULADO'], {
    message: 'Estado debe ser PENDIENTE, PAGADO_PARCIAL, PAGADO o ANULADO',
  })
  estado?: AccountsPayableStatus;

  @IsOptional()
  @IsString({ message: 'Observaciones debe ser texto' })
  observaciones?: string;
}
