/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Equipment DTO
 * Maps Spanish database columns to snake_case API contract
 * Following architecture guidelines in ARCHITECTURE.md section 3.2
 */

import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsIn,
  MaxLength,
  Min,
  Max,
  IsDateString,
} from 'class-validator';

/**
 * Equipment List DTO - for listing/grid views
 * Contains minimal fields for performance
 */
export interface EquipmentListDto {
  id: number;
  codigo_equipo: string;
  categoria: string | null;
  tipo_equipo_id: number | null;
  tipo_equipo_nombre: string | null;
  categoria_prd: string | null;
  marca: string | null;
  modelo: string | null;
  placa: string | null;
  estado: string;
  tipo_proveedor: string | null;
  es_propio: boolean; // true when tipo_proveedor === 'PROPIO'
  proveedor_id: number | null;
  proveedor_nombre: string | null; // From join
  is_active: boolean;
}

/**
 * Equipment Detail DTO - for single equipment view
 * Contains all fields including relations
 */
export interface EquipmentDetailDto {
  id: number;
  legacy_id: string | null;
  codigo_equipo: string;
  tipo_equipo_id: number | null;
  tipo_equipo_nombre: string | null;
  categoria_prd: string | null;
  proveedor_id: number | null;
  proveedor_nombre: string | null; // From join
  proveedor_ruc: string | null; // From join
  tipo_proveedor: string | null;
  es_propio: boolean; // true when tipo_proveedor === 'PROPIO'
  categoria: string | null;
  placa: string | null;
  marca: string | null;
  modelo: string | null;
  numero_serie_equipo: string | null;
  numero_chasis: string | null;
  numero_serie_motor: string | null;
  anio_fabricacion: number | null;
  potencia_neta: number | null;
  tipo_motor: string | null;
  medidor_uso: string | null;
  estado: string;

  // Document and Certification Fields
  documento_acreditacion: string | null;
  fecha_acreditacion: string | null; // ISO date string (YYYY-MM-DD)
  codigo_externo: string | null;
  fecha_venc_poliza: string | null; // ISO date string (YYYY-MM-DD)
  fecha_venc_soat: string | null; // ISO date string (YYYY-MM-DD)
  fecha_venc_citv: string | null; // ISO date string (YYYY-MM-DD)

  is_active: boolean;
  creado_por: number | null;
  actualizado_por: number | null;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

/**
 * Equipment Statistics DTO
 */
export interface EquipmentStatsDto {
  total: number;
  disponible: number;
  en_uso: number;
  mantenimiento: number;
  retirado: number;
  por_categoria: Record<string, number>;
}

/**
 * Equipment Type DTO - for type listings
 */
export interface EquipmentTypeDto {
  categoria: string;
  count: number;
}

/**
 * Equipment Assignment DTO - for project/site assignments
 */
export interface EquipmentAssignmentDto {
  id: number;
  equipo_id: number;
  equipo_codigo: string;
  proyecto_id: number;
  proyecto_nombre: string | null;
  sitio_id: number | null;
  sitio_nombre: string | null;
  fecha_asignacion: string; // ISO date string
  asignado_por: number | null;
  notas: string | null;
  estado: string;
  created_at: string;
}

/**
 * Equipment Transfer DTO - for equipment transfers
 */
export interface EquipmentTransferDto {
  id: number;
  equipo_id: number;
  equipo_codigo: string;
  proyecto_origen_id: number | null;
  proyecto_destino_id: number;
  sitio_destino_id: number | null;
  fecha_transferencia: string; // ISO date string
  transferido_por: number | null;
  razon: string | null;
  notas: string | null;
  estado: string;
  created_at: string;
}

/**
 * Equipment Availability DTO - for availability checks
 */
export interface EquipmentAvailabilityDto {
  equipo_id: number;
  equipo_codigo: string;
  categoria: string | null;
  disponible: boolean;
  fecha_inicio_disponibilidad: string | null;
  fecha_fin_disponibilidad: string | null;
  proyecto_actual_id: number | null;
  proyecto_actual_nombre: string | null;
}

/**
 * Transform TypeORM Equipment entity to List DTO
 */
export function toEquipmentListDto(entity: any): EquipmentListDto {
  return {
    id: entity.id,
    codigo_equipo: entity.codigoEquipo || entity.codigo_equipo,
    categoria: entity.categoria || null,
    tipo_equipo_id: entity.tipoEquipoId || entity.tipo_equipo_id || null,
    tipo_equipo_nombre: entity.tipoEquipo?.nombre || entity.tipo_equipo_nombre || null,
    categoria_prd: entity.tipoEquipo?.categoriaPrd || entity.categoria_prd || null,
    marca: entity.marca || null,
    modelo: entity.modelo || null,
    placa: entity.placa || null,
    estado: entity.estado?.toUpperCase() || 'DISPONIBLE',
    tipo_proveedor: entity.tipoProveedor || entity.tipo_proveedor || null,
    es_propio: (entity.tipoProveedor || entity.tipo_proveedor) === 'PROPIO',
    proveedor_id: entity.proveedorId || entity.proveedor_id || null,
    proveedor_nombre: entity.provider?.razonSocial || null,
    is_active: entity.isActive !== undefined ? entity.isActive : entity.is_active,
  };
}

/**
 * Helper function to convert Date to YYYY-MM-DD string
 */
function toDateString(date?: Date | string | null): string | null {
  if (!date) return null;
  if (typeof date === 'string') {
    // If already a string, extract YYYY-MM-DD
    return date.split('T')[0];
  }
  // Convert Date object to YYYY-MM-DD
  return date.toISOString().split('T')[0];
}

/**
 * Transform TypeORM Equipment entity to Detail DTO
 * Includes all fields and relations
 */
export function toEquipmentDetailDto(entity: any): EquipmentDetailDto {
  return {
    id: entity.id,
    legacy_id: entity.legacyId || entity.legacy_id || null,
    codigo_equipo: entity.codigoEquipo || entity.codigo_equipo,
    tipo_equipo_id: entity.tipoEquipoId || entity.tipo_equipo_id || null,
    tipo_equipo_nombre: entity.tipoEquipo?.nombre || entity.tipo_equipo_nombre || null,
    categoria_prd: entity.tipoEquipo?.categoriaPrd || entity.categoria_prd || null,
    proveedor_id: entity.proveedorId || entity.proveedor_id || null,
    proveedor_nombre: entity.provider?.razonSocial || null,
    proveedor_ruc: entity.provider?.ruc || null,
    tipo_proveedor: entity.tipoProveedor || entity.tipo_proveedor || null,
    es_propio: (entity.tipoProveedor || entity.tipo_proveedor) === 'PROPIO',
    categoria: entity.categoria || null,
    placa: entity.placa || null,
    marca: entity.marca || null,
    modelo: entity.modelo || null,
    numero_serie_equipo: entity.numeroSerieEquipo || entity.numero_serie_equipo || null,
    numero_chasis: entity.numeroChasis || entity.numero_chasis || null,
    numero_serie_motor: entity.numeroSerieMotor || entity.numero_serie_motor || null,
    anio_fabricacion: entity.anioFabricacion || entity.anio_fabricacion || null,
    potencia_neta:
      entity.potenciaNeta !== undefined
        ? Number(entity.potenciaNeta)
        : entity.potencia_neta !== undefined
          ? Number(entity.potencia_neta)
          : null,
    tipo_motor: entity.tipoMotor || entity.tipo_motor || null,
    medidor_uso: entity.medidorUso || entity.medidor_use || null,
    estado: entity.estado?.toUpperCase() || 'DISPONIBLE',

    // Document and Certification Fields
    documento_acreditacion: entity.documentoAcreditacion || entity.documento_acreditacion || null,
    fecha_acreditacion: toDateString(entity.fechaAcreditacion || entity.fecha_acreditacion),
    codigo_externo: entity.codigoExterno || entity.codigo_externo || null,
    fecha_venc_poliza: toDateString(entity.fechaVencPoliza || entity.fecha_venc_poliza),
    fecha_venc_soat: toDateString(entity.fechaVencSoat || entity.fecha_venc_soat),
    fecha_venc_citv: toDateString(entity.fechaVencCitv || entity.fecha_venc_citv),

    is_active: entity.isActive !== undefined ? entity.isActive : entity.is_active,
    creado_por: entity.creadoPor || entity.creado_por || null,
    actualizado_por: entity.actualizadoPor || entity.actualizado_por || null,
    created_at: entity.createdAt
      ? new Date(entity.createdAt).toISOString()
      : entity.created_at
        ? new Date(entity.created_at).toISOString()
        : '',
    updated_at: entity.updatedAt
      ? new Date(entity.updatedAt).toISOString()
      : entity.updated_at
        ? new Date(entity.updated_at).toISOString()
        : '',
  };
}

/**
 * Transform DTO to TypeORM entity (for create/update operations)
 * Maps incoming API request with snake_case to entity properties
 */
export function fromEquipmentDto(dto: Partial<EquipmentDetailDto>): any {
  const entity: any = {};

  // Map all fields from snake_case API to camelCase entity properties
  if (dto.legacy_id !== undefined) entity.legacyId = dto.legacy_id;
  if (dto.codigo_equipo !== undefined) entity.codigoEquipo = dto.codigo_equipo;
  if (dto.tipo_equipo_id !== undefined) entity.tipoEquipoId = dto.tipo_equipo_id;
  if (dto.proveedor_id !== undefined) entity.proveedorId = dto.proveedor_id;
  if (dto.tipo_proveedor !== undefined) entity.tipoProveedor = dto.tipo_proveedor;
  if (dto.categoria !== undefined) entity.categoria = dto.categoria;
  if (dto.placa !== undefined) entity.placa = dto.placa;
  if (dto.marca !== undefined) entity.marca = dto.marca;
  if (dto.modelo !== undefined) entity.modelo = dto.modelo;
  if (dto.numero_serie_equipo !== undefined) entity.numeroSerieEquipo = dto.numero_serie_equipo;
  if (dto.numero_chasis !== undefined) entity.numeroChasis = dto.numero_chasis;
  if (dto.numero_serie_motor !== undefined) entity.numeroSerieMotor = dto.numero_serie_motor;
  if (dto.anio_fabricacion !== undefined) entity.anioFabricacion = dto.anio_fabricacion;
  if (dto.potencia_neta !== undefined) entity.potenciaNeta = dto.potencia_neta;
  if (dto.tipo_motor !== undefined) entity.tipoMotor = dto.tipo_motor;
  if (dto.medidor_uso !== undefined) entity.medidorUso = dto.medidor_uso;
  if (dto.estado !== undefined) entity.estado = dto.estado;

  // Document and Certification Fields
  if (dto.documento_acreditacion !== undefined)
    entity.documentoAcreditacion = dto.documento_acreditacion;
  if (dto.fecha_acreditacion !== undefined) entity.fechaAcreditacion = dto.fecha_acreditacion;
  if (dto.codigo_externo !== undefined) entity.codigoExterno = dto.codigo_externo;
  if (dto.fecha_venc_poliza !== undefined) entity.fechaVencPoliza = dto.fecha_venc_poliza;
  if (dto.fecha_venc_soat !== undefined) entity.fechaVencSoat = dto.fecha_venc_soat;
  if (dto.fecha_venc_citv !== undefined) entity.fechaVencCitv = dto.fecha_venc_citv;

  if (dto.is_active !== undefined) entity.isActive = dto.is_active;

  return entity;
}

/**
 * Transform multiple entities to list DTOs
 */
export function toEquipmentListDtoArray(entities: any[]): EquipmentListDto[] {
  return entities.map((entity) => toEquipmentListDto(entity));
}

/**
 * Transform statistics to DTO
 */
export function toEquipmentStatsDto(stats: {
  total: number;
  disponible: number;
  enUso: number;
  mantenimiento: number;
  retirado: number;
}): EquipmentStatsDto {
  return {
    total: stats.total,
    disponible: stats.disponible,
    en_uso: stats.enUso,
    mantenimiento: stats.mantenimiento,
    retirado: stats.retirado,
    por_categoria: {},
  };
}

/**
 * Equipment Create DTO - for creating new equipment
 * Validation with class-validator decorators
 */
export class EquipmentCreateDto {
  @IsOptional()
  @IsString({ message: 'legacy_id debe ser un string' })
  @MaxLength(50, { message: 'legacy_id no puede exceder 50 caracteres' })
  legacy_id?: string;

  @IsString({ message: 'codigo_equipo es requerido' })
  @MaxLength(100, { message: 'codigo_equipo no puede exceder 100 caracteres' })
  codigo_equipo!: string;

  @IsOptional()
  @IsNumber({}, { message: 'tipo_equipo_id debe ser un número' })
  tipo_equipo_id?: number;

  @IsOptional()
  @IsNumber({}, { message: 'proveedor_id debe ser un número' })
  proveedor_id?: number;

  @IsOptional()
  @IsString({ message: 'tipo_proveedor debe ser un string' })
  @IsIn(['PROPIO', 'TERCERO'], { message: 'tipo_proveedor debe ser PROPIO o TERCERO' })
  tipo_proveedor?: string;

  @IsOptional()
  @IsString({ message: 'categoria debe ser un string' })
  @MaxLength(100, { message: 'categoria no puede exceder 100 caracteres' })
  categoria?: string;

  @IsOptional()
  @IsString({ message: 'placa debe ser un string' })
  @MaxLength(20, { message: 'placa no puede exceder 20 caracteres' })
  placa?: string;

  @IsOptional()
  @IsString({ message: 'marca debe ser un string' })
  @MaxLength(100, { message: 'marca no puede exceder 100 caracteres' })
  marca?: string;

  @IsOptional()
  @IsString({ message: 'modelo debe ser un string' })
  @MaxLength(100, { message: 'modelo no puede exceder 100 caracteres' })
  modelo?: string;

  @IsOptional()
  @IsString({ message: 'numero_serie_equipo debe ser un string' })
  @MaxLength(100, { message: 'numero_serie_equipo no puede exceder 100 caracteres' })
  numero_serie_equipo?: string;

  @IsOptional()
  @IsString({ message: 'numero_chasis debe ser un string' })
  @MaxLength(100, { message: 'numero_chasis no puede exceder 100 caracteres' })
  numero_chasis?: string;

  @IsOptional()
  @IsString({ message: 'numero_serie_motor debe ser un string' })
  @MaxLength(100, { message: 'numero_serie_motor no puede exceder 100 caracteres' })
  numero_serie_motor?: string;

  @IsOptional()
  @IsNumber({}, { message: 'anio_fabricacion debe ser un número' })
  @Min(1900, { message: 'anio_fabricacion debe ser mayor o igual a 1900' })
  @Max(2100, { message: 'anio_fabricacion debe ser menor o igual a 2100' })
  anio_fabricacion?: number;

  @IsOptional()
  @IsNumber({}, { message: 'potencia_neta debe ser un número' })
  @Min(0, { message: 'potencia_neta no puede ser negativa' })
  potencia_neta?: number;

  @IsOptional()
  @IsString({ message: 'tipo_motor debe ser un string' })
  @MaxLength(100, { message: 'tipo_motor no puede exceder 100 caracteres' })
  tipo_motor?: string;

  @IsOptional()
  @IsString({ message: 'medidor_uso debe ser un string' })
  @IsIn(['HOROMETRO', 'KILOMETRAJE', 'NINGUNO'], {
    message: 'medidor_uso debe ser HOROMETRO, KILOMETRAJE o NINGUNO',
  })
  medidor_uso?: string;

  @IsOptional()
  @IsString({ message: 'estado debe ser un string' })
  @IsIn(['DISPONIBLE', 'EN_USO', 'MANTENIMIENTO', 'RETIRADO'], {
    message: 'estado debe ser DISPONIBLE, EN_USO, MANTENIMIENTO o RETIRADO',
  })
  estado?: string;

  @IsOptional()
  @IsBoolean({ message: 'is_active debe ser un booleano' })
  is_active?: boolean;

  @IsOptional()
  @IsNumber({}, { message: 'creado_por debe ser un número' })
  creado_por?: number;
}

/**
 * Equipment Update DTO - for updating existing equipment
 * All fields optional
 */
export class EquipmentUpdateDto {
  @IsOptional()
  @IsString({ message: 'legacy_id debe ser un string' })
  @MaxLength(50, { message: 'legacy_id no puede exceder 50 caracteres' })
  legacy_id?: string;

  @IsOptional()
  @IsString({ message: 'codigo_equipo debe ser un string' })
  @MaxLength(100, { message: 'codigo_equipo no puede exceder 100 caracteres' })
  codigo_equipo?: string;

  @IsOptional()
  @IsNumber({}, { message: 'tipo_equipo_id debe ser un número' })
  tipo_equipo_id?: number;

  @IsOptional()
  @IsNumber({}, { message: 'proveedor_id debe ser un número' })
  proveedor_id?: number;

  @IsOptional()
  @IsString({ message: 'tipo_proveedor debe ser un string' })
  @IsIn(['PROPIO', 'TERCERO'], { message: 'tipo_proveedor debe ser PROPIO o TERCERO' })
  tipo_proveedor?: string;

  @IsOptional()
  @IsString({ message: 'categoria debe ser un string' })
  @MaxLength(100, { message: 'categoria no puede exceder 100 caracteres' })
  categoria?: string;

  @IsOptional()
  @IsString({ message: 'placa debe ser un string' })
  @MaxLength(20, { message: 'placa no puede exceder 20 caracteres' })
  placa?: string;

  @IsOptional()
  @IsString({ message: 'marca debe ser un string' })
  @MaxLength(100, { message: 'marca no puede exceder 100 caracteres' })
  marca?: string;

  @IsOptional()
  @IsString({ message: 'modelo debe ser un string' })
  @MaxLength(100, { message: 'modelo no puede exceder 100 caracteres' })
  modelo?: string;

  @IsOptional()
  @IsString({ message: 'numero_serie_equipo debe ser un string' })
  @MaxLength(100, { message: 'numero_serie_equipo no puede exceder 100 caracteres' })
  numero_serie_equipo?: string;

  @IsOptional()
  @IsString({ message: 'numero_chasis debe ser un string' })
  @MaxLength(100, { message: 'numero_chasis no puede exceder 100 caracteres' })
  numero_chasis?: string;

  @IsOptional()
  @IsString({ message: 'numero_serie_motor debe ser un string' })
  @MaxLength(100, { message: 'numero_serie_motor no puede exceder 100 caracteres' })
  numero_serie_motor?: string;

  @IsOptional()
  @IsNumber({}, { message: 'anio_fabricacion debe ser un número' })
  @Min(1900, { message: 'anio_fabricacion debe ser mayor o igual a 1900' })
  @Max(2100, { message: 'anio_fabricacion debe ser menor o igual a 2100' })
  anio_fabricacion?: number;

  @IsOptional()
  @IsNumber({}, { message: 'potencia_neta debe ser un número' })
  @Min(0, { message: 'potencia_neta no puede ser negativa' })
  potencia_neta?: number;

  @IsOptional()
  @IsString({ message: 'tipo_motor debe ser un string' })
  @MaxLength(100, { message: 'tipo_motor no puede exceder 100 caracteres' })
  tipo_motor?: string;

  @IsOptional()
  @IsString({ message: 'medidor_uso debe ser un string' })
  @IsIn(['HOROMETRO', 'KILOMETRAJE', 'NINGUNO'], {
    message: 'medidor_uso debe ser HOROMETRO, KILOMETRAJE o NINGUNO',
  })
  medidor_uso?: string;

  @IsOptional()
  @IsString({ message: 'estado debe ser un string' })
  @IsIn(['DISPONIBLE', 'EN_USO', 'MANTENIMIENTO', 'RETIRADO'], {
    message: 'estado debe ser DISPONIBLE, EN_USO, MANTENIMIENTO o RETIRADO',
  })
  estado?: string;

  @IsOptional()
  @IsBoolean({ message: 'is_active debe ser un booleano' })
  is_active?: boolean;

  @IsOptional()
  @IsNumber({}, { message: 'actualizado_por debe ser un número' })
  actualizado_por?: number;
}

/**
 * Equipment Status Update DTO - for updating equipment status
 */
export class EquipmentStatusUpdateDto {
  @IsString({ message: 'estado es requerido' })
  @IsIn(['DISPONIBLE', 'EN_USO', 'MANTENIMIENTO', 'RETIRADO'], {
    message: 'estado debe ser DISPONIBLE, EN_USO, MANTENIMIENTO o RETIRADO',
  })
  estado!: string;

  @IsOptional()
  @IsNumber({}, { message: 'actualizado_por debe ser un número' })
  actualizado_por?: number;
}

/**
 * Equipment Assignment DTO - for assigning equipment to projects
 */
export class EquipmentAssignmentCreateDto {
  @IsNumber({}, { message: 'equipo_id es requerido' })
  equipo_id!: number;

  @IsNumber({}, { message: 'proyecto_id es requerido' })
  proyecto_id!: number;

  @IsOptional()
  @IsNumber({}, { message: 'sitio_id debe ser un número' })
  sitio_id?: number;

  @IsDateString({}, { message: 'fecha_asignacion debe ser una fecha válida (ISO 8601)' })
  fecha_asignacion!: string;

  @IsOptional()
  @IsNumber({}, { message: 'asignado_por debe ser un número' })
  asignado_por?: number;

  @IsOptional()
  @IsString({ message: 'notas debe ser un string' })
  notas?: string;
}

/**
 * Equipment Transfer DTO - for transferring equipment between projects
 */
export class EquipmentTransferCreateDto {
  @IsNumber({}, { message: 'equipo_id es requerido' })
  equipo_id!: number;

  @IsOptional()
  @IsNumber({}, { message: 'proyecto_origen_id debe ser un número' })
  proyecto_origen_id?: number;

  @IsNumber({}, { message: 'proyecto_destino_id es requerido' })
  proyecto_destino_id!: number;

  @IsOptional()
  @IsNumber({}, { message: 'sitio_destino_id debe ser un número' })
  sitio_destino_id?: number;

  @IsDateString({}, { message: 'fecha_transferencia debe ser una fecha válida (ISO 8601)' })
  fecha_transferencia!: string;

  @IsOptional()
  @IsNumber({}, { message: 'transferido_por debe ser un número' })
  transferido_por?: number;

  @IsOptional()
  @IsString({ message: 'razon debe ser un string' })
  razon?: string;

  @IsOptional()
  @IsString({ message: 'notas debe ser un string' })
  notas?: string;
}
