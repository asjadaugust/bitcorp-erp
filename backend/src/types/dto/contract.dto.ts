/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Contract DTO
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
  IsDateString,
  Min,
} from 'class-validator';

export interface ContractDto {
  id: number;
  legacy_id?: string | null;

  // Basic information
  equipo_id: number;
  equipo_codigo?: string; // From join
  equipo_marca?: string; // From join
  equipo_modelo?: string; // From join
  equipo_placa?: string; // From join
  proveedor_id?: number; // From equipo.provider_id
  proveedor_razon_social?: string; // From join

  numero_contrato: string;
  tipo: 'CONTRATO' | 'ADENDA';
  contrato_padre_id?: number | null;

  // Dates
  fecha_contrato: string; // ISO date string
  fecha_inicio: string; // ISO date string
  fecha_fin: string; // ISO date string

  // Financial terms
  moneda: string; // PEN, USD, etc.
  tipo_tarifa?: string | null;
  tarifa?: number | null;
  modalidad?: string | null;
  minimo_por?: string | null;

  // Included services
  incluye_motor: boolean;
  incluye_operador: boolean;
  costo_adicional_motor?: number | null;

  // Usage terms
  horas_incluidas?: number | null;
  penalidad_exceso?: number | null;

  // Ownership proof (Cláusula 2)
  documento_acredita?: string | null;
  fecha_acreditada?: string | null;

  // Jurisdiction & duration text (Cláusula 2, 4)
  jurisdiccion?: string | null;
  plazo_texto?: string | null;

  // Termination (Cláusula 12) — Resolution & Liquidation
  motivo_resolucion?: string | null;
  fecha_resolucion?: string | null;
  monto_liquidacion?: number | null;
  causal_resolucion?: string | null;
  resuelto_por?: number | null;
  fecha_liquidacion?: string | null;
  liquidado_por?: number | null;
  observaciones_liquidacion?: string | null;

  // Additional info
  condiciones_especiales?: string | null;
  documento_url?: string | null;

  // Status and metadata
  estado: 'ACTIVO' | 'VENCIDO' | 'CANCELADO' | 'BORRADOR' | 'RESUELTO' | 'LIQUIDADO';
  created_at: string;
  updated_at: string;
  creado_por?: number | null;

  // Addendums (for parent contracts)
  adendas?: ContractDto[];
}

/**
 * Transform TypeORM entity to DTO
 * Converts TypeORM entity with relations to Spanish snake_case DTO
 */
export function toContractDto(entity: any): ContractDto {
  return {
    id: entity.id,
    legacy_id: entity.legacyId || entity.legacy_id || null,
    equipo_id: entity.equipoId,
    equipo_codigo: entity.equipo?.codigoEquipo,
    equipo_marca: entity.equipo?.marca,
    equipo_modelo: entity.equipo?.modelo,
    equipo_placa: entity.equipo?.placa,
    proveedor_id: entity.proveedorId || entity.equipo?.proveedorId,
    proveedor_razon_social: entity.provider?.razonSocial || entity.equipo?.provider?.razonSocial,
    numero_contrato: entity.numeroContrato,
    tipo: entity.tipo,
    contrato_padre_id: entity.contratoPadreId,
    fecha_contrato: entity.fechaContrato
      ? new Date(entity.fechaContrato).toISOString().split('T')[0]
      : '',
    fecha_inicio: entity.fechaInicio
      ? new Date(entity.fechaInicio).toISOString().split('T')[0]
      : '',
    fecha_fin: entity.fechaFin ? new Date(entity.fechaFin).toISOString().split('T')[0] : '',
    moneda: entity.moneda,
    tipo_tarifa: entity.tipoTarifa,
    tarifa: entity.tarifa,
    modalidad: entity.modalidad,
    minimo_por: entity.minimoPor,
    incluye_motor: entity.incluyeMotor,
    incluye_operador: entity.incluyeOperador,
    costo_adicional_motor: entity.costoAdicionalMotor,
    horas_incluidas: entity.horasIncluidas,
    penalidad_exceso: entity.penalidadExceso,
    documento_acredita: entity.documentoAcredita || null,
    fecha_acreditada: entity.fechaAcreditada
      ? new Date(entity.fechaAcreditada).toISOString().split('T')[0]
      : null,
    jurisdiccion: entity.jurisdiccion || null,
    plazo_texto: entity.plazoTexto || null,
    motivo_resolucion: entity.motivoResolucion || null,
    fecha_resolucion: entity.fechaResolucion
      ? new Date(entity.fechaResolucion).toISOString().split('T')[0]
      : null,
    monto_liquidacion: entity.montoLiquidacion || null,
    causal_resolucion: entity.causalResolucion || null,
    resuelto_por: entity.resueltoPor || null,
    fecha_liquidacion: entity.fechaLiquidacion
      ? new Date(entity.fechaLiquidacion).toISOString().split('T')[0]
      : null,
    liquidado_por: entity.liquidadoPor || null,
    observaciones_liquidacion: entity.observacionesLiquidacion || null,
    condiciones_especiales: entity.condicionesEspeciales,
    documento_url: entity.documentoUrl,
    estado: entity.estado,
    created_at: entity.createdAt ? new Date(entity.createdAt).toISOString() : '',
    updated_at: entity.updatedAt ? new Date(entity.updatedAt).toISOString() : '',
    creado_por: entity.creadoPor,
    adendas: entity.adendas?.map(toContractDto),
  };
}

/**
 * Transform DTO to TypeORM entity (for create/update operations)
 * Maps incoming API request with snake_case to entity properties
 */
export function fromContractDto(dto: Partial<ContractDto>): any {
  const entity: any = {};

  // Map all fields that might come from API
  if (dto.legacy_id !== undefined) entity.legacyId = dto.legacy_id;
  if (dto.equipo_id !== undefined) entity.equipoId = dto.equipo_id;
  if (dto.numero_contrato !== undefined) entity.numeroContrato = dto.numero_contrato;
  if (dto.tipo !== undefined) entity.tipo = dto.tipo;
  if (dto.contrato_padre_id !== undefined) entity.contratoPadreId = dto.contrato_padre_id;
  if (dto.fecha_contrato !== undefined) entity.fechaContrato = new Date(dto.fecha_contrato);
  if (dto.fecha_inicio !== undefined) entity.fechaInicio = new Date(dto.fecha_inicio);
  if (dto.fecha_fin !== undefined) entity.fechaFin = new Date(dto.fecha_fin);
  if (dto.moneda !== undefined) entity.moneda = dto.moneda;
  if (dto.tipo_tarifa !== undefined) entity.tipoTarifa = dto.tipo_tarifa;
  if (dto.tarifa !== undefined) entity.tarifa = dto.tarifa;
  if (dto.modalidad !== undefined) entity.modalidad = dto.modalidad;
  if (dto.minimo_por !== undefined) entity.minimoPor = dto.minimo_por;
  if (dto.incluye_motor !== undefined) entity.incluyeMotor = dto.incluye_motor;
  if (dto.incluye_operador !== undefined) entity.incluyeOperador = dto.incluye_operador;
  if (dto.costo_adicional_motor !== undefined)
    entity.costoAdicionalMotor = dto.costo_adicional_motor;
  if (dto.horas_incluidas !== undefined) entity.horasIncluidas = dto.horas_incluidas;
  if (dto.penalidad_exceso !== undefined) entity.penalidadExceso = dto.penalidad_exceso;
  if (dto.documento_acredita !== undefined) entity.documentoAcredita = dto.documento_acredita;
  if (dto.fecha_acreditada !== undefined)
    entity.fechaAcreditada = dto.fecha_acreditada ? new Date(dto.fecha_acreditada) : null;
  if (dto.jurisdiccion !== undefined) entity.jurisdiccion = dto.jurisdiccion;
  if (dto.plazo_texto !== undefined) entity.plazoTexto = dto.plazo_texto;
  if (dto.motivo_resolucion !== undefined) entity.motivoResolucion = dto.motivo_resolucion;
  if (dto.fecha_resolucion !== undefined)
    entity.fechaResolucion = dto.fecha_resolucion ? new Date(dto.fecha_resolucion) : null;
  if (dto.monto_liquidacion !== undefined) entity.montoLiquidacion = dto.monto_liquidacion;
  if (dto.condiciones_especiales !== undefined)
    entity.condicionesEspeciales = dto.condiciones_especiales;
  if (dto.documento_url !== undefined) entity.documentoUrl = dto.documento_url;
  if (dto.proveedor_id !== undefined) entity.proveedorId = dto.proveedor_id;
  if (dto.estado !== undefined) entity.estado = dto.estado;
  if (dto.creado_por !== undefined) entity.creadoPor = dto.creado_por;

  return entity;
}

/**
 * DTO for creating a new contract
 * Validates required fields and business rules
 */
export class ContractCreateDto {
  @IsOptional()
  @IsString({ message: 'legacy_id debe ser texto' })
  @MaxLength(50, { message: 'legacy_id no puede exceder 50 caracteres' })
  legacy_id?: string | null;

  @IsNumber({}, { message: 'equipo_id debe ser un número' })
  equipo_id!: number;

  @IsOptional()
  @IsNumber({}, { message: 'proveedor_id debe ser un número' })
  proveedor_id?: number | null;

  @IsString({ message: 'numero_contrato debe ser texto' })
  @MaxLength(50, { message: 'numero_contrato no puede exceder 50 caracteres' })
  numero_contrato!: string;

  @IsIn(['CONTRATO', 'ADENDA'], { message: 'tipo debe ser CONTRATO o ADENDA' })
  tipo!: 'CONTRATO' | 'ADENDA';

  @IsOptional()
  @IsNumber({}, { message: 'contrato_padre_id debe ser un número' })
  contrato_padre_id?: number | null;

  @IsDateString({}, { message: 'fecha_contrato debe ser una fecha válida (YYYY-MM-DD)' })
  fecha_contrato!: string;

  @IsDateString({}, { message: 'fecha_inicio debe ser una fecha válida (YYYY-MM-DD)' })
  fecha_inicio!: string;

  @IsDateString({}, { message: 'fecha_fin debe ser una fecha válida (YYYY-MM-DD)' })
  fecha_fin!: string;

  @IsString({ message: 'moneda debe ser texto' })
  @MaxLength(3, { message: 'moneda no puede exceder 3 caracteres' })
  moneda!: string;

  @IsOptional()
  @IsString({ message: 'tipo_tarifa debe ser texto' })
  @MaxLength(100, { message: 'tipo_tarifa no puede exceder 100 caracteres' })
  tipo_tarifa?: string | null;

  @IsOptional()
  @IsNumber({}, { message: 'tarifa debe ser un número' })
  @Min(0, { message: 'tarifa debe ser mayor o igual a 0' })
  tarifa?: number | null;

  @IsOptional()
  @IsString({ message: 'modalidad debe ser texto' })
  @MaxLength(100, { message: 'modalidad no puede exceder 100 caracteres' })
  modalidad?: string | null;

  @IsOptional()
  @IsString({ message: 'minimo_por debe ser texto' })
  @MaxLength(50, { message: 'minimo_por no puede exceder 50 caracteres' })
  minimo_por?: string | null;

  @IsBoolean({ message: 'incluye_motor debe ser true o false' })
  incluye_motor!: boolean;

  @IsBoolean({ message: 'incluye_operador debe ser true o false' })
  incluye_operador!: boolean;

  @IsOptional()
  @IsNumber({}, { message: 'costo_adicional_motor debe ser un número' })
  @Min(0, { message: 'costo_adicional_motor debe ser mayor o igual a 0' })
  costo_adicional_motor?: number | null;

  @IsOptional()
  @IsNumber({}, { message: 'horas_incluidas debe ser un número' })
  @Min(0, { message: 'horas_incluidas debe ser mayor o igual a 0' })
  horas_incluidas?: number | null;

  @IsOptional()
  @IsNumber({}, { message: 'penalidad_exceso debe ser un número' })
  @Min(0, { message: 'penalidad_exceso debe ser mayor o igual a 0' })
  penalidad_exceso?: number | null;

  @IsOptional()
  @IsString({ message: 'documento_acredita debe ser texto' })
  @MaxLength(200, { message: 'documento_acredita no puede exceder 200 caracteres' })
  documento_acredita?: string | null;

  @IsOptional()
  @IsDateString({}, { message: 'fecha_acreditada debe ser una fecha válida (YYYY-MM-DD)' })
  fecha_acreditada?: string | null;

  @IsOptional()
  @IsString({ message: 'jurisdiccion debe ser texto' })
  @MaxLength(200, { message: 'jurisdiccion no puede exceder 200 caracteres' })
  jurisdiccion?: string | null;

  @IsOptional()
  @IsString({ message: 'plazo_texto debe ser texto' })
  @MaxLength(200, { message: 'plazo_texto no puede exceder 200 caracteres' })
  plazo_texto?: string | null;

  @IsOptional()
  @IsString({ message: 'motivo_resolucion debe ser texto' })
  motivo_resolucion?: string | null;

  @IsOptional()
  @IsDateString({}, { message: 'fecha_resolucion debe ser una fecha válida (YYYY-MM-DD)' })
  fecha_resolucion?: string | null;

  @IsOptional()
  @IsNumber({}, { message: 'monto_liquidacion debe ser un número' })
  @Min(0, { message: 'monto_liquidacion debe ser mayor o igual a 0' })
  monto_liquidacion?: number | null;

  @IsOptional()
  @IsString({ message: 'condiciones_especiales debe ser texto' })
  condiciones_especiales?: string | null;

  @IsOptional()
  @IsString({ message: 'documento_url debe ser texto' })
  @MaxLength(500, { message: 'documento_url no puede exceder 500 caracteres' })
  documento_url?: string | null;

  @IsOptional()
  @IsIn(['ACTIVO', 'VENCIDO', 'CANCELADO', 'BORRADOR'], {
    message: 'estado debe ser ACTIVO, VENCIDO, CANCELADO o BORRADOR',
  })
  estado?: 'ACTIVO' | 'VENCIDO' | 'CANCELADO' | 'BORRADOR';

  @IsOptional()
  @IsNumber({}, { message: 'creado_por debe ser un número' })
  creado_por?: number | null;
}

/**
 * DTO for updating a contract
 * All fields are optional for partial updates
 */
export class ContractUpdateDto {
  @IsOptional()
  @IsString({ message: 'legacy_id debe ser texto' })
  @MaxLength(50, { message: 'legacy_id no puede exceder 50 caracteres' })
  legacy_id?: string | null;

  @IsOptional()
  @IsNumber({}, { message: 'equipo_id debe ser un número' })
  equipo_id?: number;

  @IsOptional()
  @IsNumber({}, { message: 'proveedor_id debe ser un número' })
  proveedor_id?: number | null;

  @IsOptional()
  @IsString({ message: 'numero_contrato debe ser texto' })
  @MaxLength(50, { message: 'numero_contrato no puede exceder 50 caracteres' })
  numero_contrato?: string;

  @IsOptional()
  @IsIn(['CONTRATO', 'ADENDA'], { message: 'tipo debe ser CONTRATO o ADENDA' })
  tipo?: 'CONTRATO' | 'ADENDA';

  @IsOptional()
  @IsNumber({}, { message: 'contrato_padre_id debe ser un número' })
  contrato_padre_id?: number | null;

  @IsOptional()
  @IsDateString({}, { message: 'fecha_contrato debe ser una fecha válida (YYYY-MM-DD)' })
  fecha_contrato?: string;

  @IsOptional()
  @IsDateString({}, { message: 'fecha_inicio debe ser una fecha válida (YYYY-MM-DD)' })
  fecha_inicio?: string;

  @IsOptional()
  @IsDateString({}, { message: 'fecha_fin debe ser una fecha válida (YYYY-MM-DD)' })
  fecha_fin?: string;

  @IsOptional()
  @IsString({ message: 'moneda debe ser texto' })
  @MaxLength(3, { message: 'moneda no puede exceder 3 caracteres' })
  moneda?: string;

  @IsOptional()
  @IsString({ message: 'tipo_tarifa debe ser texto' })
  @MaxLength(100, { message: 'tipo_tarifa no puede exceder 100 caracteres' })
  tipo_tarifa?: string | null;

  @IsOptional()
  @IsNumber({}, { message: 'tarifa debe ser un número' })
  @Min(0, { message: 'tarifa debe ser mayor o igual a 0' })
  tarifa?: number | null;

  @IsOptional()
  @IsString({ message: 'modalidad debe ser texto' })
  @MaxLength(100, { message: 'modalidad no puede exceder 100 caracteres' })
  modalidad?: string | null;

  @IsOptional()
  @IsString({ message: 'minimo_por debe ser texto' })
  @MaxLength(50, { message: 'minimo_por no puede exceder 50 caracteres' })
  minimo_por?: string | null;

  @IsOptional()
  @IsBoolean({ message: 'incluye_motor debe ser true o false' })
  incluye_motor?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'incluye_operador debe ser true o false' })
  incluye_operador?: boolean;

  @IsOptional()
  @IsNumber({}, { message: 'costo_adicional_motor debe ser un número' })
  @Min(0, { message: 'costo_adicional_motor debe ser mayor o igual a 0' })
  costo_adicional_motor?: number | null;

  @IsOptional()
  @IsNumber({}, { message: 'horas_incluidas debe ser un número' })
  @Min(0, { message: 'horas_incluidas debe ser mayor o igual a 0' })
  horas_incluidas?: number | null;

  @IsOptional()
  @IsNumber({}, { message: 'penalidad_exceso debe ser un número' })
  @Min(0, { message: 'penalidad_exceso debe ser mayor o igual a 0' })
  penalidad_exceso?: number | null;

  @IsOptional()
  @IsString({ message: 'documento_acredita debe ser texto' })
  @MaxLength(200, { message: 'documento_acredita no puede exceder 200 caracteres' })
  documento_acredita?: string | null;

  @IsOptional()
  @IsDateString({}, { message: 'fecha_acreditada debe ser una fecha válida (YYYY-MM-DD)' })
  fecha_acreditada?: string | null;

  @IsOptional()
  @IsString({ message: 'jurisdiccion debe ser texto' })
  @MaxLength(200, { message: 'jurisdiccion no puede exceder 200 caracteres' })
  jurisdiccion?: string | null;

  @IsOptional()
  @IsString({ message: 'plazo_texto debe ser texto' })
  @MaxLength(200, { message: 'plazo_texto no puede exceder 200 caracteres' })
  plazo_texto?: string | null;

  @IsOptional()
  @IsString({ message: 'motivo_resolucion debe ser texto' })
  motivo_resolucion?: string | null;

  @IsOptional()
  @IsDateString({}, { message: 'fecha_resolucion debe ser una fecha válida (YYYY-MM-DD)' })
  fecha_resolucion?: string | null;

  @IsOptional()
  @IsNumber({}, { message: 'monto_liquidacion debe ser un número' })
  @Min(0, { message: 'monto_liquidacion debe ser mayor o igual a 0' })
  monto_liquidacion?: number | null;

  @IsOptional()
  @IsString({ message: 'condiciones_especiales debe ser texto' })
  condiciones_especiales?: string | null;

  @IsOptional()
  @IsString({ message: 'documento_url debe ser texto' })
  @MaxLength(500, { message: 'documento_url no puede exceder 500 caracteres' })
  documento_url?: string | null;

  @IsOptional()
  @IsIn(['ACTIVO', 'VENCIDO', 'CANCELADO', 'BORRADOR'], {
    message: 'estado debe ser ACTIVO, VENCIDO, CANCELADO o BORRADOR',
  })
  estado?: 'ACTIVO' | 'VENCIDO' | 'CANCELADO' | 'BORRADOR';
}

// ─── Obligaciones del Arrendador DTOs (WS-21) ───────────────────────────────

export interface ContractObligacionDto {
  id: number;
  contrato_id: number;
  tipo_obligacion: string;
  estado: 'PENDIENTE' | 'CUMPLIDA' | 'INCUMPLIDA';
  fecha_compromiso?: string | null;
  observaciones?: string | null;
  created_at: string;
  updated_at: string;
}

export function toContractObligacionDto(entity: any): ContractObligacionDto {
  return {
    id: entity.id,
    contrato_id: entity.contratoId,
    tipo_obligacion: entity.tipoObligacion,
    estado: entity.estado,
    fecha_compromiso: entity.fechaCompromiso
      ? new Date(entity.fechaCompromiso).toISOString().split('T')[0]
      : null,
    observaciones: entity.observaciones ?? null,
    created_at: entity.createdAt ? new Date(entity.createdAt).toISOString() : '',
    updated_at: entity.updatedAt ? new Date(entity.updatedAt).toISOString() : '',
  };
}
