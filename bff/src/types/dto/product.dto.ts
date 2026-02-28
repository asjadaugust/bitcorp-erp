/**
 * Product DTOs - Spanish snake_case API contract
 * Maps Producto entity (Spanish camelCase) to API format (Spanish snake_case)
 *
 * Entity: Producto (logistica.producto)
 * - id, codigo, nombre, descripcion, categoria
 * - unidadMedida, stockActual, stockMinimo, precioUnitario
 * - isActive, createdAt, updatedAt
 *
 * API: All fields in Spanish snake_case
 * - id, codigo, nombre, descripcion, categoria
 * - unidad_medida, stock_actual, stock_minimo, precio_unitario
 * - esta_activo, created_at, updated_at
 */

import { IsString, IsOptional, IsNumber, Min, MaxLength } from 'class-validator';

/**
 * ProductListDto - Minimal fields for grid views
 * Used by: GET /api/products (list view)
 */
export interface ProductListDto {
  id: number;
  legacy_id: string | null;
  codigo: string;
  nombre: string;
  categoria: string | null;
  unidad_medida: string | null;
  stock_actual: number;
  stock_minimo: number | null;
  precio_unitario: number | null;
  esta_activo: boolean;
  // Computed fields
  valor_total: number; // stock_actual * precio_unitario
}

/**
 * ProductDetailDto - Full fields for detail view
 * Used by: GET /api/products/:id (detail view)
 */
export interface ProductDetailDto {
  id: number;
  legacy_id: string | null;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  categoria: string | null;
  unidad_medida: string | null;
  stock_actual: number;
  stock_minimo: number | null;
  precio_unitario: number | null;
  esta_activo: boolean;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  // Computed fields
  valor_total: number; // stock_actual * precio_unitario
}

/**
 * ProductCreateDto - Input validation for creation
 * Used by: POST /api/products
 */
export class ProductCreateDto {
  @IsString({ message: 'codigo debe ser un string' })
  @MaxLength(50, { message: 'codigo no puede exceder 50 caracteres' })
  codigo!: string;

  @IsString({ message: 'nombre debe ser un string' })
  @MaxLength(255, { message: 'nombre no puede exceder 255 caracteres' })
  nombre!: string;

  @IsOptional()
  @IsString({ message: 'descripcion debe ser un string' })
  @MaxLength(1000, { message: 'descripcion no puede exceder 1000 caracteres' })
  descripcion?: string;

  @IsOptional()
  @IsString({ message: 'categoria debe ser un string' })
  @MaxLength(100, { message: 'categoria no puede exceder 100 caracteres' })
  categoria?: string;

  @IsOptional()
  @IsString({ message: 'unidad_medida debe ser un string' })
  @MaxLength(50, { message: 'unidad_medida no puede exceder 50 caracteres' })
  unidad_medida?: string;

  @IsOptional()
  @IsNumber({}, { message: 'stock_actual debe ser un número' })
  @Min(0, { message: 'stock_actual no puede ser negativo' })
  stock_actual?: number;

  @IsOptional()
  @IsNumber({}, { message: 'stock_minimo debe ser un número' })
  @Min(0, { message: 'stock_minimo no puede ser negativo' })
  stock_minimo?: number;

  @IsOptional()
  @IsNumber({}, { message: 'precio_unitario debe ser un número' })
  @Min(0, { message: 'precio_unitario no puede ser negativo' })
  precio_unitario?: number;
}

/**
 * ProductUpdateDto - Partial update fields
 * Used by: PUT /api/products/:id
 */
export class ProductUpdateDto {
  @IsOptional()
  @IsString({ message: 'nombre debe ser un string' })
  @MaxLength(255, { message: 'nombre no puede exceder 255 caracteres' })
  nombre?: string;

  @IsOptional()
  @IsString({ message: 'descripcion debe ser un string' })
  @MaxLength(1000, { message: 'descripcion no puede exceder 1000 caracteres' })
  descripcion?: string;

  @IsOptional()
  @IsString({ message: 'categoria debe ser un string' })
  @MaxLength(100, { message: 'categoria no puede exceder 100 caracteres' })
  categoria?: string;

  @IsOptional()
  @IsString({ message: 'unidad_medida debe ser un string' })
  @MaxLength(50, { message: 'unidad_medida no puede exceder 50 caracteres' })
  unidad_medida?: string;

  @IsOptional()
  @IsNumber({}, { message: 'stock_minimo debe ser un número' })
  @Min(0, { message: 'stock_minimo no puede ser negativo' })
  stock_minimo?: number;

  @IsOptional()
  @IsNumber({}, { message: 'precio_unitario debe ser un número' })
  @Min(0, { message: 'precio_unitario no puede ser negativo' })
  precio_unitario?: number;
}

// ============================================
// Transformer Functions
// ============================================

/**
 * Transform Producto entity to ProductListDto
 * @param product - Producto entity (Record to avoid 'any' linting)
 * @returns ProductListDto with Spanish snake_case fields
 */
export function toProductListDto(product: Record<string, unknown>): ProductListDto {
  const stockActual = Number(product.stockActual) || 0;
  const precioUnitario = Number(product.precioUnitario) || 0;

  return {
    id: product.id as number,
    legacy_id: (product.legacyId as string) || null,
    codigo: product.codigo as string,
    nombre: product.nombre as string,
    categoria: (product.categoria as string) || null,
    unidad_medida: (product.unidadMedida as string) || null,
    stock_actual: stockActual,
    stock_minimo: product.stockMinimo ? Number(product.stockMinimo) : null,
    precio_unitario: product.precioUnitario ? Number(product.precioUnitario) : null,
    esta_activo: product.isActive as boolean,
    valor_total: stockActual * precioUnitario,
  };
}

/**
 * Transform Producto entity to ProductDetailDto
 * @param product - Producto entity (Record to avoid 'any' linting)
 * @returns ProductDetailDto with Spanish snake_case fields and timestamps
 */
export function toProductDetailDto(product: Record<string, unknown>): ProductDetailDto {
  const stockActual = Number(product.stockActual) || 0;
  const precioUnitario = Number(product.precioUnitario) || 0;

  return {
    id: product.id as number,
    legacy_id: (product.legacyId as string) || null,
    codigo: product.codigo as string,
    nombre: product.nombre as string,
    descripcion: (product.descripcion as string) || null,
    categoria: (product.categoria as string) || null,
    unidad_medida: (product.unidadMedida as string) || null,
    stock_actual: stockActual,
    stock_minimo: product.stockMinimo ? Number(product.stockMinimo) : null,
    precio_unitario: product.precioUnitario ? Number(product.precioUnitario) : null,
    esta_activo: product.isActive as boolean,
    created_at: product.createdAt
      ? new Date(product.createdAt as Date).toISOString()
      : new Date().toISOString(),
    updated_at: product.updatedAt
      ? new Date(product.updatedAt as Date).toISOString()
      : new Date().toISOString(),
    valor_total: stockActual * precioUnitario,
  };
}

/**
 * Transform array of Producto entities to ProductListDto array
 * @param products - Array of Producto entities
 * @returns Array of ProductListDto
 */
export function toProductListDtoArray(products: Record<string, unknown>[]): ProductListDto[] {
  return products.map(toProductListDto);
}

/**
 * Transform ProductCreateDto (snake_case) to entity format (camelCase)
 * @param dto - ProductCreateDto from API request
 * @returns Record with camelCase fields for entity creation
 */
export function fromProductCreateDto(dto: ProductCreateDto): Record<string, unknown> {
  return {
    codigo: dto.codigo,
    nombre: dto.nombre,
    descripcion: dto.descripcion || null,
    categoria: dto.categoria || null,
    unidadMedida: dto.unidad_medida || null,
    stockActual: dto.stock_actual || 0,
    stockMinimo: dto.stock_minimo || null,
    precioUnitario: dto.precio_unitario || null,
    isActive: true,
  };
}

/**
 * Transform ProductUpdateDto (snake_case) to entity format (camelCase)
 * @param dto - ProductUpdateDto from API request
 * @returns Record with camelCase fields for entity update
 */
export function fromProductUpdateDto(dto: ProductUpdateDto): Record<string, unknown> {
  const updates: Record<string, unknown> = {};

  if (dto.nombre !== undefined) updates.nombre = dto.nombre;
  if (dto.descripcion !== undefined) updates.descripcion = dto.descripcion;
  if (dto.categoria !== undefined) updates.categoria = dto.categoria;
  if (dto.unidad_medida !== undefined) updates.unidadMedida = dto.unidad_medida;
  if (dto.stock_minimo !== undefined) updates.stockMinimo = dto.stock_minimo;
  if (dto.precio_unitario !== undefined) updates.precioUnitario = dto.precio_unitario;

  return updates;
}
