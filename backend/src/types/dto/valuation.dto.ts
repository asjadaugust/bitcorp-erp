/**
 * Valuation DTO
 *
 * Following ARCHITECTURE.md guidelines:
 * - Uses Spanish snake_case field names matching database columns
 * - DTO transformation happens in service layer
 * - Returns Spanish column names to API
 */

import { Valorizacion, EstadoValorizacion } from '../../models/valuation.model';

export interface ValuationDto {
  id: number;
  legacy_id?: string | null;
  equipo_id: number;
  contrato_id?: number | null;
  proyecto_id?: number | null;
  periodo: string;
  fecha_inicio: string; // ISO date string
  fecha_fin: string; // ISO date string
  dias_trabajados?: number | null;
  horas_trabajadas?: number | null;
  combustible_consumido?: number | null;
  costo_base?: number | null;
  costo_combustible?: number | null;
  cargos_adicionales?: number | null;
  total_valorizado?: number | null;
  numero_valorizacion?: string | null;
  tipo_cambio?: number | null;
  descuento_porcentaje?: number | null;
  descuento_monto?: number | null;
  igv_porcentaje?: number | null;
  igv_monto?: number | null;
  total_con_igv?: number | null;
  estado: string; // PENDIENTE, APROBADO, RECHAZADO, PAGADO
  observaciones?: string | null;
  creado_por?: number | null;
  aprobado_por?: number | null;
  aprobado_en?: string | null; // ISO datetime string
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string

  // Optional joined data
  creator?: {
    id: number;
    username: string;
    full_name: string;
  };
  approver?: {
    id: number;
    username: string;
    full_name: string;
  };
}

/**
 * Transform TypeORM entity to DTO (Spanish snake_case)
 * @param entity - Valorizacion entity from database
 * @returns ValuationDto with Spanish field names
 */
export function toValuationDto(entity: Valorizacion): ValuationDto {
  // Helper to convert Date or string to ISO date string (YYYY-MM-DD)
  const toDateString = (date: Date | string): string => {
    if (!date) return '';
    if (typeof date === 'string') {
      // Already a string, extract YYYY-MM-DD
      return date.split('T')[0];
    }
    // It's a Date object
    return date.toISOString().split('T')[0];
  };

  // Helper to convert Date or string to ISO datetime string
  const toDateTimeString = (date: Date | string | null | undefined): string | null => {
    if (!date) return null;
    if (typeof date === 'string') return date;
    return date.toISOString();
  };

  return {
    id: entity.id,
    legacy_id: entity.legacyId || null,
    equipo_id: entity.equipmentId,
    contrato_id: entity.contractId || null,
    proyecto_id: entity.projectId || null,
    periodo: entity.periodo,
    fecha_inicio: toDateString(entity.fechaInicio),
    fecha_fin: toDateString(entity.fechaFin),
    dias_trabajados: entity.diasTrabajados || null,
    horas_trabajadas: entity.horasTrabajadas ? parseFloat(entity.horasTrabajadas.toString()) : null,
    combustible_consumido: entity.combustibleConsumido
      ? parseFloat(entity.combustibleConsumido.toString())
      : null,
    costo_base: entity.costoBase ? parseFloat(entity.costoBase.toString()) : null,
    costo_combustible: entity.costoCombustible
      ? parseFloat(entity.costoCombustible.toString())
      : null,
    cargos_adicionales: entity.cargosAdicionales
      ? parseFloat(entity.cargosAdicionales.toString())
      : null,
    total_valorizado: entity.totalValorizado ? parseFloat(entity.totalValorizado.toString()) : null,
    numero_valorizacion: entity.numeroValorizacion || null,
    tipo_cambio: entity.tipoCambio ? parseFloat(entity.tipoCambio.toString()) : null,
    descuento_porcentaje: entity.descuentoPorcentaje
      ? parseFloat(entity.descuentoPorcentaje.toString())
      : null,
    descuento_monto: entity.descuentoMonto ? parseFloat(entity.descuentoMonto.toString()) : null,
    igv_porcentaje: entity.igvPorcentaje ? parseFloat(entity.igvPorcentaje.toString()) : null,
    igv_monto: entity.igvMonto ? parseFloat(entity.igvMonto.toString()) : null,
    total_con_igv: entity.totalConIgv ? parseFloat(entity.totalConIgv.toString()) : null,
    estado: entity.estado,
    observaciones: entity.observaciones || null,
    creado_por: entity.createdBy || null,
    aprobado_por: entity.approvedBy || null,
    aprobado_en: toDateTimeString(entity.approvedAt),
    created_at: toDateTimeString(entity.createdAt) || '',
    updated_at: toDateTimeString(entity.updatedAt) || '',

    // Include relations if loaded
    creator: entity.creator,
    approver: entity.approver,
  };
}

/**
 * Transform DTO (Spanish snake_case) to TypeORM entity for create/update
 * @param dto - ValuationDto from API request
 * @returns Partial Valorizacion entity
 */
export function fromValuationDto(dto: Partial<ValuationDto>): Partial<Valorizacion> {
  const entity: Partial<Valorizacion> = {};

  if (dto.legacy_id !== undefined) entity.legacyId = dto.legacy_id || undefined;
  if (dto.equipo_id !== undefined) entity.equipmentId = dto.equipo_id;
  if (dto.contrato_id !== undefined) entity.contractId = dto.contrato_id || undefined;
  if (dto.proyecto_id !== undefined) entity.projectId = dto.proyecto_id || undefined;
  if (dto.periodo !== undefined) entity.periodo = dto.periodo;
  if (dto.fecha_inicio !== undefined) entity.fechaInicio = new Date(dto.fecha_inicio);
  if (dto.fecha_fin !== undefined) entity.fechaFin = new Date(dto.fecha_fin);
  if (dto.dias_trabajados !== undefined) entity.diasTrabajados = dto.dias_trabajados || undefined;
  if (dto.horas_trabajadas !== undefined)
    entity.horasTrabajadas = dto.horas_trabajadas || undefined;
  if (dto.combustible_consumido !== undefined)
    entity.combustibleConsumido = dto.combustible_consumido || undefined;
  if (dto.costo_base !== undefined) entity.costoBase = dto.costo_base || undefined;
  if (dto.costo_combustible !== undefined)
    entity.costoCombustible = dto.costo_combustible || undefined;
  if (dto.cargos_adicionales !== undefined)
    entity.cargosAdicionales = dto.cargos_adicionales || undefined;
  if (dto.total_valorizado !== undefined)
    entity.totalValorizado = dto.total_valorizado || undefined;
  if (dto.numero_valorizacion !== undefined)
    entity.numeroValorizacion = dto.numero_valorizacion || undefined;
  if (dto.tipo_cambio !== undefined) entity.tipoCambio = dto.tipo_cambio || undefined;
  if (dto.descuento_porcentaje !== undefined)
    entity.descuentoPorcentaje = dto.descuento_porcentaje || undefined;
  if (dto.descuento_monto !== undefined) entity.descuentoMonto = dto.descuento_monto || undefined;
  if (dto.igv_porcentaje !== undefined) entity.igvPorcentaje = dto.igv_porcentaje || undefined;
  if (dto.igv_monto !== undefined) entity.igvMonto = dto.igv_monto || undefined;
  if (dto.total_con_igv !== undefined) entity.totalConIgv = dto.total_con_igv || undefined;
  if (dto.estado !== undefined) entity.estado = dto.estado as EstadoValorizacion;
  if (dto.observaciones !== undefined) entity.observaciones = dto.observaciones || undefined;
  if (dto.creado_por !== undefined) entity.createdBy = dto.creado_por || undefined;
  if (dto.aprobado_por !== undefined) entity.approvedBy = dto.aprobado_por || undefined;
  if (dto.aprobado_en !== undefined)
    entity.approvedAt = dto.aprobado_en ? new Date(dto.aprobado_en) : undefined;

  return entity;
}
