/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Equipment DTO
 * Maps Spanish database columns to snake_case API contract
 * Following architecture guidelines in ARCHITECTURE.md section 3.2
 */

/**
 * Equipment List DTO - for listing/grid views
 * Contains minimal fields for performance
 */
export interface EquipmentListDto {
  id: number;
  codigo_equipo: string;
  categoria: string | null;
  marca: string | null;
  modelo: string | null;
  placa: string | null;
  estado: string;
  tipo_proveedor: string | null;
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
  proveedor_id: number | null;
  proveedor_nombre: string | null; // From join
  proveedor_ruc: string | null; // From join
  tipo_proveedor: string | null;
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
    codigo_equipo: entity.codigo_equipo,
    categoria: entity.categoria || null,
    marca: entity.marca || null,
    modelo: entity.modelo || null,
    placa: entity.placa || null,
    estado: entity.estado,
    tipo_proveedor: entity.tipo_proveedor || null,
    proveedor_id: entity.proveedorId || entity.proveedor_id || null,
    proveedor_nombre: entity.provider?.razon_social || null,
    is_active: entity.is_active,
  };
}

/**
 * Transform TypeORM Equipment entity to Detail DTO
 * Includes all fields and relations
 */
export function toEquipmentDetailDto(entity: any): EquipmentDetailDto {
  return {
    id: entity.id,
    legacy_id: entity.legacy_id || null,
    codigo_equipo: entity.codigo_equipo,
    tipo_equipo_id: entity.tipoEquipoId || entity.tipo_equipo_id || null,
    proveedor_id: entity.proveedorId || entity.proveedor_id || null,
    proveedor_nombre: entity.provider?.razon_social || null,
    proveedor_ruc: entity.provider?.ruc || null,
    tipo_proveedor: entity.tipo_proveedor || null,
    categoria: entity.categoria || null,
    placa: entity.placa || null,
    marca: entity.marca || null,
    modelo: entity.modelo || null,
    numero_serie_equipo: entity.numero_serie_equipo || null,
    numero_chasis: entity.numero_chasis || null,
    numero_serie_motor: entity.numero_serie_motor || null,
    anio_fabricacion: entity.anio_fabricacion || null,
    potencia_neta: entity.potencia_neta ? Number(entity.potencia_neta) : null,
    tipo_motor: entity.tipo_motor || null,
    medidor_uso: entity.medidor_uso || null,
    estado: entity.estado,
    is_active: entity.is_active,
    creado_por: entity.creadoPor || entity.creado_por || null,
    actualizado_por: entity.actualizadoPor || entity.actualizado_por || null,
    created_at: entity.created_at ? new Date(entity.created_at).toISOString() : '',
    updated_at: entity.updated_at ? new Date(entity.updated_at).toISOString() : '',
  };
}

/**
 * Transform DTO to TypeORM entity (for create/update operations)
 * Maps incoming API request with snake_case to entity properties
 */
export function fromEquipmentDto(dto: Partial<EquipmentDetailDto>): any {
  const entity: any = {};

  // Map all fields that might come from API
  if (dto.legacy_id !== undefined) entity.legacy_id = dto.legacy_id;
  if (dto.codigo_equipo !== undefined) entity.codigo_equipo = dto.codigo_equipo;
  if (dto.tipo_equipo_id !== undefined) entity.tipoEquipoId = dto.tipo_equipo_id;
  if (dto.proveedor_id !== undefined) entity.proveedorId = dto.proveedor_id;
  if (dto.tipo_proveedor !== undefined) entity.tipo_proveedor = dto.tipo_proveedor;
  if (dto.categoria !== undefined) entity.categoria = dto.categoria;
  if (dto.placa !== undefined) entity.placa = dto.placa;
  if (dto.marca !== undefined) entity.marca = dto.marca;
  if (dto.modelo !== undefined) entity.modelo = dto.modelo;
  if (dto.numero_serie_equipo !== undefined) entity.numero_serie_equipo = dto.numero_serie_equipo;
  if (dto.numero_chasis !== undefined) entity.numero_chasis = dto.numero_chasis;
  if (dto.numero_serie_motor !== undefined) entity.numero_serie_motor = dto.numero_serie_motor;
  if (dto.anio_fabricacion !== undefined) entity.anio_fabricacion = dto.anio_fabricacion;
  if (dto.potencia_neta !== undefined) entity.potencia_neta = dto.potencia_neta;
  if (dto.tipo_motor !== undefined) entity.tipo_motor = dto.tipo_motor;
  if (dto.medidor_uso !== undefined) entity.medidor_uso = dto.medidor_uso;
  if (dto.estado !== undefined) entity.estado = dto.estado;
  if (dto.is_active !== undefined) entity.is_active = dto.is_active;
  if (dto.creado_por !== undefined) entity.creadoPor = dto.creado_por;
  if (dto.actualizado_por !== undefined) entity.actualizadoPor = dto.actualizado_por;

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
