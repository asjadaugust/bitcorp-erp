/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Checklist DTOs
 * Maps Spanish database columns to snake_case API contract
 * Following architecture guidelines in ARCHITECTURE.md section 3.2
 *
 * Checklist system has 4 main entities:
 * 1. ChecklistPlantilla (Template) - Checklist template definitions
 * 2. ChecklistItem - Items within a template
 * 3. ChecklistInspeccion (Inspection) - Actual inspections performed
 * 4. ChecklistResultado (Result) - Results for each item in an inspection
 */

import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsIn,
  IsDateString,
  MaxLength,
  Min,
} from 'class-validator';

// ===== TEMPLATE DTOs =====

/**
 * Checklist Template List DTO - for listing/grid views
 */
export interface ChecklistTemplateListDto {
  id: number;
  codigo: string;
  nombre: string;
  tipo_equipo: string | null;
  frecuencia: string | null;
  activo: boolean;
  total_items: number | null; // From count
  created_at: string;
}

/**
 * Checklist Template Detail DTO - for single template view with items
 */
export interface ChecklistTemplateDetailDto {
  id: number;
  codigo: string;
  nombre: string;
  tipo_equipo: string | null;
  descripcion: string | null;
  frecuencia: string | null;
  activo: boolean;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  items: ChecklistItemDto[]; // Related items
}

// ===== ITEM DTOs =====

/**
 * Checklist Item DTO
 */
export interface ChecklistItemDto {
  id: number;
  plantilla_id: number;
  orden: number;
  categoria: string | null;
  descripcion: string;
  tipo_verificacion: string; // VISUAL, MEDICION, FUNCIONAL, AUDITIVO
  valor_esperado: string | null;
  es_critico: boolean;
  requiere_foto: boolean;
  instrucciones: string | null;
  created_at: string;
}

// ===== INSPECTION DTOs =====

/**
 * Checklist Inspection List DTO - for listing inspections
 */
export interface ChecklistInspectionListDto {
  id: number;
  codigo: string;
  plantilla_id: number;
  plantilla_nombre: string | null; // From join
  equipo_id: number;
  equipo_codigo: string | null; // From join
  trabajador_id: number;
  trabajador_nombre: string | null; // From join
  fecha_inspeccion: string; // ISO date
  estado: string; // EN_PROGRESO, COMPLETADO, RECHAZADO, CANCELADO
  resultado_general: string | null; // APROBADO, APROBADO_CON_OBSERVACIONES, RECHAZADO
  items_conforme: number;
  items_no_conforme: number;
  items_total: number;
  requiere_mantenimiento: boolean;
  equipo_operativo: boolean;
  created_at: string;
}

/**
 * Checklist Inspection Detail DTO - full inspection with relations
 */
export interface ChecklistInspectionDetailDto {
  id: number;
  codigo: string;
  plantilla_id: number;
  plantilla_nombre: string | null; // From join
  plantilla_codigo: string | null; // From join
  equipo_id: number;
  equipo_codigo: string | null; // From join
  equipo_marca: string | null; // From join
  equipo_modelo: string | null; // From join
  trabajador_id: number;
  trabajador_nombre: string | null; // From join
  fecha_inspeccion: string; // ISO date
  hora_inicio: string | null;
  hora_fin: string | null;
  ubicacion: string | null;
  horometro_inicial: number | null;
  odometro_inicial: number | null;
  estado: string;
  resultado_general: string | null;
  items_conforme: number;
  items_no_conforme: number;
  items_total: number;
  observaciones_generales: string | null;
  requiere_mantenimiento: boolean;
  equipo_operativo: boolean;
  completado_en: string | null; // ISO timestamp
  created_at: string;
  updated_at: string;
}

/**
 * Checklist Inspection with Results DTO - inspection + all item results
 */
export interface ChecklistInspectionWithResultsDto extends ChecklistInspectionDetailDto {
  resultados: ChecklistResultDto[]; // All results for this inspection
}

// ===== RESULT DTOs =====

/**
 * Checklist Result DTO - result for a single item
 */
export interface ChecklistResultDto {
  id: number;
  inspeccion_id: number;
  item_id: number;
  item_orden: number | null; // From join
  item_categoria: string | null; // From join
  item_descripcion: string | null; // From join
  item_tipo_verificacion: string | null; // From join
  item_valor_esperado: string | null; // From join
  item_es_critico: boolean | null; // From join
  conforme: boolean | null;
  valor_medido: string | null;
  observaciones: string | null;
  accion_requerida: string | null; // NINGUNA, OBSERVAR, REPARAR, REEMPLAZAR
  foto_url: string | null;
  created_at: string;
  updated_at: string;
}

// ===== STATISTICS DTOs =====

/**
 * Checklist Inspection Statistics DTO
 */
export interface ChecklistInspectionStatsDto {
  total_inspecciones: number;
  en_progreso: number;
  completadas: number;
  rechazadas: number;
  canceladas: number;
  aprobadas: number;
  aprobadas_con_observaciones: number;
  rechazadas_por_resultado: number;
  tasa_conformidad: number; // Percentage
  equipos_requieren_mantenimiento: number;
  equipos_no_operativos: number;
}

// ===== CREATE DTOs (Input Validation) =====

/**
 * Checklist Template Create DTO
 */
export class ChecklistTemplateCreateDto {
  @IsString({ message: 'codigo debe ser un string' })
  @MaxLength(50, { message: 'codigo no puede exceder 50 caracteres' })
  codigo!: string;

  @IsString({ message: 'nombre debe ser un string' })
  @MaxLength(200, { message: 'nombre no puede exceder 200 caracteres' })
  nombre!: string;

  @IsOptional()
  @IsString({ message: 'tipo_equipo debe ser un string' })
  @MaxLength(100, { message: 'tipo_equipo no puede exceder 100 caracteres' })
  tipo_equipo?: string;

  @IsOptional()
  @IsString({ message: 'descripcion debe ser un string' })
  @MaxLength(1000, { message: 'descripcion no puede exceder 1000 caracteres' })
  descripcion?: string;

  @IsOptional()
  @IsString({ message: 'frecuencia debe ser un string' })
  @MaxLength(50, { message: 'frecuencia no puede exceder 50 caracteres' })
  frecuencia?: string;

  @IsOptional()
  @IsBoolean({ message: 'activo debe ser un booleano' })
  activo?: boolean;

  @IsOptional()
  @IsNumber({}, { message: 'created_by debe ser un número' })
  created_by?: number;
}

/**
 * Checklist Item Create DTO
 */
export class ChecklistItemCreateDto {
  @IsNumber({}, { message: 'plantilla_id debe ser un número' })
  plantilla_id!: number;

  @IsNumber({}, { message: 'orden debe ser un número' })
  @Min(1, { message: 'orden debe ser mayor o igual a 1' })
  orden!: number;

  @IsOptional()
  @IsString({ message: 'categoria debe ser un string' })
  @MaxLength(100, { message: 'categoria no puede exceder 100 caracteres' })
  categoria?: string;

  @IsString({ message: 'descripcion es requerida' })
  @MaxLength(500, { message: 'descripcion no puede exceder 500 caracteres' })
  descripcion!: string;

  @IsString({ message: 'tipo_verificacion es requerido' })
  @IsIn(['VISUAL', 'MEDICION', 'FUNCIONAL', 'AUDITIVO'], {
    message: 'tipo_verificacion debe ser: VISUAL, MEDICION, FUNCIONAL o AUDITIVO',
  })
  tipo_verificacion!: string;

  @IsOptional()
  @IsString({ message: 'valor_esperado debe ser un string' })
  @MaxLength(200, { message: 'valor_esperado no puede exceder 200 caracteres' })
  valor_esperado?: string;

  @IsOptional()
  @IsBoolean({ message: 'es_critico debe ser un booleano' })
  es_critico?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'requiere_foto debe ser un booleano' })
  requiere_foto?: boolean;

  @IsOptional()
  @IsString({ message: 'instrucciones debe ser un string' })
  @MaxLength(1000, { message: 'instrucciones no puede exceder 1000 caracteres' })
  instrucciones?: string;
}

/**
 * Checklist Inspection Create DTO
 */
export class ChecklistInspectionCreateDto {
  @IsString({ message: 'codigo debe ser un string' })
  @MaxLength(50, { message: 'codigo no puede exceder 50 caracteres' })
  codigo!: string;

  @IsNumber({}, { message: 'plantilla_id debe ser un número' })
  plantilla_id!: number;

  @IsNumber({}, { message: 'equipo_id debe ser un número' })
  equipo_id!: number;

  @IsNumber({}, { message: 'trabajador_id debe ser un número' })
  trabajador_id!: number;

  @IsDateString({}, { message: 'fecha_inspeccion debe ser una fecha válida (ISO 8601)' })
  fecha_inspeccion!: string;

  @IsOptional()
  @IsString({ message: 'hora_inicio debe ser un string' })
  hora_inicio?: string;

  @IsOptional()
  @IsString({ message: 'ubicacion debe ser un string' })
  @MaxLength(200, { message: 'ubicacion no puede exceder 200 caracteres' })
  ubicacion?: string;

  @IsOptional()
  @IsNumber({}, { message: 'horometro_inicial debe ser un número' })
  @Min(0, { message: 'horometro_inicial no puede ser negativo' })
  horometro_inicial?: number;

  @IsOptional()
  @IsNumber({}, { message: 'odometro_inicial debe ser un número' })
  @Min(0, { message: 'odometro_inicial no puede ser negativo' })
  odometro_inicial?: number;
}

// ===== TRANSFORMATION FUNCTIONS =====

/**
 * Transform ChecklistPlantilla entity to List DTO
 */
export function toChecklistTemplateListDto(entity: any): ChecklistTemplateListDto {
  return {
    id: entity.id,
    codigo: entity.codigo,
    nombre: entity.nombre,
    tipo_equipo: entity.tipoEquipo || null,
    frecuencia: entity.frecuencia || null,
    activo: entity.activo,
    total_items: entity.items?.length || entity.total_items || null,
    created_at: entity.createdAt ? new Date(entity.createdAt).toISOString() : '',
  };
}

/**
 * Transform ChecklistPlantilla entity to Detail DTO (with items)
 */
export function toChecklistTemplateDetailDto(entity: any): ChecklistTemplateDetailDto {
  return {
    id: entity.id,
    codigo: entity.codigo,
    nombre: entity.nombre,
    tipo_equipo: entity.tipoEquipo || null,
    descripcion: entity.descripcion || null,
    frecuencia: entity.frecuencia || null,
    activo: entity.activo,
    created_by: entity.createdBy || null,
    created_at: entity.createdAt ? new Date(entity.createdAt).toISOString() : '',
    updated_at: entity.updatedAt ? new Date(entity.updatedAt).toISOString() : '',
    items: entity.items ? entity.items.map(toChecklistItemDto) : [],
  };
}

/**
 * Transform ChecklistItem entity to DTO
 */
export function toChecklistItemDto(entity: any): ChecklistItemDto {
  return {
    id: entity.id,
    plantilla_id: entity.plantillaId,
    orden: entity.orden,
    categoria: entity.categoria || null,
    descripcion: entity.descripcion,
    tipo_verificacion: entity.tipoVerificacion,
    valor_esperado: entity.valorEsperado || null,
    es_critico: entity.esCritico,
    requiere_foto: entity.requiereFoto,
    instrucciones: entity.instrucciones || null,
    created_at: entity.createdAt ? new Date(entity.createdAt).toISOString() : '',
  };
}

/**
 * Transform ChecklistInspeccion entity to List DTO
 */
export function toChecklistInspectionListDto(entity: any): ChecklistInspectionListDto {
  return {
    id: entity.id,
    codigo: entity.codigo,
    plantilla_id: entity.plantillaId,
    plantilla_nombre: entity.plantilla?.nombre || null,
    equipo_id: entity.equipoId,
    equipo_codigo: entity.equipo?.codigo_equipo || null,
    trabajador_id: entity.trabajadorId,
    trabajador_nombre: entity.trabajador?.nombre_completo || null,
    fecha_inspeccion: entity.fechaInspeccion
      ? new Date(entity.fechaInspeccion).toISOString().split('T')[0]
      : '',
    estado: entity.estado,
    resultado_general: entity.resultadoGeneral || null,
    items_conforme: entity.itemsConforme,
    items_no_conforme: entity.itemsNoConforme,
    items_total: entity.itemsTotal,
    requiere_mantenimiento: entity.requiereMantenimiento,
    equipo_operativo: entity.equipoOperativo,
    created_at: entity.createdAt ? new Date(entity.createdAt).toISOString() : '',
  };
}

/**
 * Transform ChecklistInspeccion entity to Detail DTO
 */
export function toChecklistInspectionDetailDto(entity: any): ChecklistInspectionDetailDto {
  return {
    id: entity.id,
    codigo: entity.codigo,
    plantilla_id: entity.plantillaId,
    plantilla_nombre: entity.plantilla?.nombre || null,
    plantilla_codigo: entity.plantilla?.codigo || null,
    equipo_id: entity.equipoId,
    equipo_codigo: entity.equipo?.codigo_equipo || null,
    equipo_marca: entity.equipo?.marca || null,
    equipo_modelo: entity.equipo?.modelo || null,
    trabajador_id: entity.trabajadorId,
    trabajador_nombre: entity.trabajador?.nombre_completo || null,
    fecha_inspeccion: entity.fechaInspeccion
      ? new Date(entity.fechaInspeccion).toISOString().split('T')[0]
      : '',
    hora_inicio: entity.horaInicio || null,
    hora_fin: entity.horaFin || null,
    ubicacion: entity.ubicacion || null,
    horometro_inicial: entity.horometroInicial ? Number(entity.horometroInicial) : null,
    odometro_inicial: entity.odometroInicial ? Number(entity.odometroInicial) : null,
    estado: entity.estado,
    resultado_general: entity.resultadoGeneral || null,
    items_conforme: entity.itemsConforme,
    items_no_conforme: entity.itemsNoConforme,
    items_total: entity.itemsTotal,
    observaciones_generales: entity.observacionesGenerales || null,
    requiere_mantenimiento: entity.requiereMantenimiento,
    equipo_operativo: entity.equipoOperativo,
    completado_en: entity.completadoEn ? new Date(entity.completadoEn).toISOString() : null,
    created_at: entity.createdAt ? new Date(entity.createdAt).toISOString() : '',
    updated_at: entity.updatedAt ? new Date(entity.updatedAt).toISOString() : '',
  };
}

/**
 * Transform ChecklistInspeccion with results to full DTO
 */
export function toChecklistInspectionWithResultsDto(
  entity: any,
  resultados: any[]
): ChecklistInspectionWithResultsDto {
  return {
    ...toChecklistInspectionDetailDto(entity),
    resultados: resultados.map(toChecklistResultDto),
  };
}

/**
 * Transform ChecklistResultado entity to DTO
 */
export function toChecklistResultDto(entity: any): ChecklistResultDto {
  return {
    id: entity.id,
    inspeccion_id: entity.inspeccionId,
    item_id: entity.itemId,
    item_orden: entity.item?.orden || null,
    item_categoria: entity.item?.categoria || null,
    item_descripcion: entity.item?.descripcion || null,
    item_tipo_verificacion: entity.item?.tipoVerificacion || null,
    item_valor_esperado: entity.item?.valorEsperado || null,
    item_es_critico: entity.item?.esCritico ?? null,
    conforme: entity.conforme ?? null,
    valor_medido: entity.valorMedido || null,
    observaciones: entity.observaciones || null,
    accion_requerida: entity.accionRequerida || null,
    foto_url: entity.fotoUrl || null,
    created_at: entity.createdAt ? new Date(entity.createdAt).toISOString() : '',
    updated_at: entity.updatedAt ? new Date(entity.updatedAt).toISOString() : '',
  };
}

/**
 * Transform multiple entities to list DTOs
 */
export function toChecklistTemplateListDtoArray(entities: any[]): ChecklistTemplateListDto[] {
  return entities.map(toChecklistTemplateListDto);
}

export function toChecklistInspectionListDtoArray(entities: any[]): ChecklistInspectionListDto[] {
  return entities.map(toChecklistInspectionListDto);
}

export function toChecklistResultDtoArray(entities: any[]): ChecklistResultDto[] {
  return entities.map(toChecklistResultDto);
}

/**
 * Transform DTO to entity (for create/update operations)
 */
export function fromChecklistTemplateDto(dto: Partial<ChecklistTemplateDetailDto>): any {
  const entity: any = {};

  if (dto.codigo !== undefined) entity.codigo = dto.codigo;
  if (dto.nombre !== undefined) entity.nombre = dto.nombre;
  if (dto.tipo_equipo !== undefined) entity.tipoEquipo = dto.tipo_equipo;
  if (dto.descripcion !== undefined) entity.descripcion = dto.descripcion;
  if (dto.frecuencia !== undefined) entity.frecuencia = dto.frecuencia;
  if (dto.activo !== undefined) entity.activo = dto.activo;
  if (dto.created_by !== undefined) entity.createdBy = dto.created_by;

  return entity;
}

export function fromChecklistItemDto(dto: Partial<ChecklistItemDto>): any {
  const entity: any = {};

  if (dto.plantilla_id !== undefined) entity.plantillaId = dto.plantilla_id;
  if (dto.orden !== undefined) entity.orden = dto.orden;
  if (dto.categoria !== undefined) entity.categoria = dto.categoria;
  if (dto.descripcion !== undefined) entity.descripcion = dto.descripcion;
  if (dto.tipo_verificacion !== undefined) entity.tipoVerificacion = dto.tipo_verificacion;
  if (dto.valor_esperado !== undefined) entity.valorEsperado = dto.valor_esperado;
  if (dto.es_critico !== undefined) entity.esCritico = dto.es_critico;
  if (dto.requiere_foto !== undefined) entity.requiereFoto = dto.requiere_foto;
  if (dto.instrucciones !== undefined) entity.instrucciones = dto.instrucciones;

  return entity;
}

export function fromChecklistInspectionDto(dto: Partial<ChecklistInspectionDetailDto>): any {
  const entity: any = {};

  if (dto.codigo !== undefined) entity.codigo = dto.codigo;
  if (dto.plantilla_id !== undefined) entity.plantillaId = dto.plantilla_id;
  if (dto.equipo_id !== undefined) entity.equipoId = dto.equipo_id;
  if (dto.trabajador_id !== undefined) entity.trabajadorId = dto.trabajador_id;
  if (dto.fecha_inspeccion !== undefined) entity.fechaInspeccion = new Date(dto.fecha_inspeccion);
  if (dto.hora_inicio !== undefined) entity.horaInicio = dto.hora_inicio;
  if (dto.hora_fin !== undefined) entity.horaFin = dto.hora_fin;
  if (dto.ubicacion !== undefined) entity.ubicacion = dto.ubicacion;
  if (dto.horometro_inicial !== undefined) entity.horometroInicial = dto.horometro_inicial;
  if (dto.odometro_inicial !== undefined) entity.odometroInicial = dto.odometro_inicial;
  if (dto.estado !== undefined) entity.estado = dto.estado;
  if (dto.resultado_general !== undefined) entity.resultadoGeneral = dto.resultado_general;
  if (dto.items_conforme !== undefined) entity.itemsConforme = dto.items_conforme;
  if (dto.items_no_conforme !== undefined) entity.itemsNoConforme = dto.items_no_conforme;
  if (dto.items_total !== undefined) entity.itemsTotal = dto.items_total;
  if (dto.observaciones_generales !== undefined)
    entity.observacionesGenerales = dto.observaciones_generales;
  if (dto.requiere_mantenimiento !== undefined)
    entity.requiereMantenimiento = dto.requiere_mantenimiento;
  if (dto.equipo_operativo !== undefined) entity.equipoOperativo = dto.equipo_operativo;

  return entity;
}

export function fromChecklistResultDto(dto: Partial<ChecklistResultDto>): any {
  const entity: any = {};

  if (dto.inspeccion_id !== undefined) entity.inspeccionId = dto.inspeccion_id;
  if (dto.item_id !== undefined) entity.itemId = dto.item_id;
  if (dto.conforme !== undefined) entity.conforme = dto.conforme;
  if (dto.valor_medido !== undefined) entity.valorMedido = dto.valor_medido;
  if (dto.observaciones !== undefined) entity.observaciones = dto.observaciones;
  if (dto.accion_requerida !== undefined) entity.accionRequerida = dto.accion_requerida;
  if (dto.foto_url !== undefined) entity.fotoUrl = dto.foto_url;

  return entity;
}
