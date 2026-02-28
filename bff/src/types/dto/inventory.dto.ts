import {
  TipoMovimiento,
  StatusMovimiento,
  Movement,
  MovementDetail,
} from '../../models/movement.model';

/**
 * Movement List DTO - Minimal fields for list views
 */
export interface MovementListDto {
  id: number;
  tipo_movimiento: TipoMovimiento;
  numero_documento: string | null;
  fecha: string; // ISO date string
  estado: StatusMovimiento;
  proyecto_nombre: string | null;
  created_at: string;
}

/**
 * Movement Detail DTO - Full fields for detail view
 */
export interface MovementDetailDto {
  id: number;
  legacy_id: string | null;
  tipo_movimiento: TipoMovimiento;
  numero_documento: string | null;
  fecha: string; // ISO date string
  project_id: number | null;
  observaciones: string | null;
  estado: StatusMovimiento;
  created_by: number | null;
  approved_by: number | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  details?: MovementDetailItemDto[];
}

/**
 * Movement Detail Item DTO - Line items of a movement
 */
export interface MovementDetailItemDto {
  id: number;
  product_id: number;
  producto_codigo: string;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: number;
  monto_total: number;
  observaciones: string | null;
  created_at: string;
}

/**
 * Movement Create DTO - Input for creating movements
 */
export interface MovementCreateDto {
  tipo_movimiento: TipoMovimiento;
  fecha: Date;
  numero_documento?: string;
  project_id?: number;
  observaciones?: string;
  estado?: StatusMovimiento;
  created_by?: number;
}

/**
 * Movement Detail Create DTO - Input for movement line items
 */
export interface MovementDetailCreateDto {
  product_id: number;
  cantidad: number;
  precio_unitario: number;
  observaciones?: string;
}

/**
 * Product Stock DTO - Current stock information
 */
export interface ProductStockDto {
  product_id: number;
  codigo: string;
  nombre: string;
  stock_actual: number;
  stock_minimo: number | null;
  unidad_medida: string | null;
  precio_unitario: number | null;
}

/**
 * Transform Movement entity to MovementListDto
 */
export function toMovementListDto(movement: Movement): MovementListDto {
  return {
    id: movement.id,
    tipo_movimiento: movement.tipoMovimiento,
    numero_documento: movement.numeroDocumento || null,
    fecha:
      movement.fecha instanceof Date ? movement.fecha.toISOString().split('T')[0] : movement.fecha,
    estado: movement.estado,
    proyecto_nombre: movement.project?.nombre || null,
    created_at:
      movement.createdAt instanceof Date ? movement.createdAt.toISOString() : movement.createdAt,
  };
}

/**
 * Transform Movement entity to MovementDetailDto
 */
export function toMovementDetailDto(movement: Movement): MovementDetailDto {
  return {
    id: movement.id,
    legacy_id: movement.legacyId || null,
    tipo_movimiento: movement.tipoMovimiento,
    numero_documento: movement.numeroDocumento || null,
    fecha:
      movement.fecha instanceof Date ? movement.fecha.toISOString().split('T')[0] : movement.fecha,
    project_id: movement.projectId || null,
    observaciones: movement.observaciones || null,
    estado: movement.estado,
    created_by: movement.createdBy || null,
    approved_by: movement.approvedBy || null,
    approved_at: movement.approvedAt
      ? movement.approvedAt instanceof Date
        ? movement.approvedAt.toISOString()
        : movement.approvedAt
      : null,
    created_at:
      movement.createdAt instanceof Date ? movement.createdAt.toISOString() : movement.createdAt,
    updated_at:
      movement.updatedAt instanceof Date ? movement.updatedAt.toISOString() : movement.updatedAt,
    details: movement.details ? movement.details.map(toMovementDetailItemDto) : undefined,
  };
}

/**
 * Transform MovementDetail entity to MovementDetailItemDto
 */
export function toMovementDetailItemDto(detail: MovementDetail): MovementDetailItemDto {
  return {
    id: detail.id,
    product_id: detail.productId,
    producto_codigo: detail.product?.codigo || 'N/A',
    producto_nombre: detail.product?.nombre || 'Unknown',
    cantidad: Number(detail.cantidad),
    precio_unitario: Number(detail.precioUnitario),
    monto_total: detail.montoTotal
      ? Number(detail.montoTotal)
      : Number(detail.cantidad) * Number(detail.precioUnitario),
    observaciones: detail.observaciones || null,
    created_at:
      detail.createdAt instanceof Date ? detail.createdAt.toISOString() : detail.createdAt,
  };
}

/**
 * Transform Movement array to MovementListDto array
 */
export function toMovementListDtoArray(movements: Movement[]): MovementListDto[] {
  return movements.map(toMovementListDto);
}
