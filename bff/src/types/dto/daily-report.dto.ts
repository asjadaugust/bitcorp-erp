/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Daily Report DTO
 * Maps Spanish database columns to snake_case API contract
 * Following architecture guidelines in ARCHITECTURE.md section 3.2
 */

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

export interface DailyReportDto {
  id: number;

  // Basic information
  fecha: string; // date
  trabajador_id: number;
  trabajador_nombre?: string; // Calculated field from join
  equipo_id: number;
  equipo_codigo?: string; // Calculated field from join
  equipo_nombre?: string; // Calculated field from join
  proyecto_id?: number | null;
  proyecto_nombre?: string; // Calculated field from join

  // Time and hours
  hora_inicio: string; // time
  hora_fin: string; // time
  horometro_inicial: number;
  horometro_final: number;
  horas_trabajadas?: number; // Calculated field

  // Odometer (optional)
  odometro_inicial?: number | null;
  odometro_final?: number | null;
  km_recorridos?: number | null; // Calculated field

  // Fuel (optional)
  combustible_inicial?: number | null;
  combustible_consumido?: number | null;
  numero_vale_combustible?: string | null;

  // Location and work description
  lugar_salida: string;
  observaciones: string; // Work description/activities
  observaciones_correcciones?: string | null; // Additional notes

  // Status and metadata
  estado:
    | 'BORRADOR'
    | 'PENDIENTE'
    | 'ENVIADO'
    | 'APROBADO_SUPERVISOR'
    | 'REVISADO_COSTOS'
    | 'APROBADO'
    | 'RECHAZADO';
  created_at: string;
  updated_at: string;
  creado_por?: number | null;
  aprobado_por?: number | null;
  aprobado_en?: string | null;

  // Signatures
  firma_operador?: string;
  firma_supervisor?: string;
  firma_jefe_equipos?: string;
  firma_residente?: string;
  firma_planeamiento_control?: string;

  // Additional information (from PWA/frontend)
  gps_latitude?: number | null;
  gps_longitude?: number | null;
  weather_conditions?: string | null;

  // Pre-warming hours (auto-populated from precalentamiento_config)
  horas_precalentamiento?: number | null;

  // Approval link
  solicitud_aprobacion_id?: number | null;
}

import { DailyReportRawRow } from '../daily-report-raw.interface';

/**
 * Transform database entity to DTO
 * Keeps Spanish column names as-is (no aliasing)
 */
export function toDailyReportDto(entity: DailyReportRawRow): DailyReportDto {
  return {
    id: entity.id,
    fecha: entity.fecha,
    trabajador_id: entity.trabajador_id ?? 0,
    trabajador_nombre: entity.trabajador_nombre,
    equipo_id: entity.equipo_id,
    equipo_codigo: entity.equipo_codigo,
    equipo_nombre: entity.equipo_nombre,
    proyecto_id: entity.proyecto_id,
    proyecto_nombre: entity.proyecto_nombre,
    hora_inicio: entity.hora_inicio ?? '',
    hora_fin: entity.hora_fin ?? '',
    horometro_inicial: entity.horometro_inicial ?? 0,
    horometro_final: entity.horometro_final ?? 0,
    horas_trabajadas: entity.horas_trabajadas ?? undefined,
    odometro_inicial: entity.odometro_inicial ?? undefined,
    odometro_final: entity.odometro_final ?? undefined,
    km_recorridos: entity.km_recorridos ?? undefined,
    combustible_inicial: entity.combustible_inicial ?? undefined,
    combustible_consumido: entity.combustible_consumido ?? undefined,
    numero_vale_combustible: entity.num_vale_combustible,
    lugar_salida: entity.lugar_salida ?? '',
    observaciones: entity.observaciones ?? '',
    observaciones_correcciones: entity.observaciones_correcciones,
    estado: (entity.estado as DailyReportDto['estado']) || 'BORRADOR',
    created_at: entity.created_at,
    updated_at: entity.updated_at,
    creado_por: entity.creado_por,
    aprobado_por: entity.aprobado_por,
    aprobado_en: entity.aprobado_en,
    firma_operador: entity.firma_operador || entity.firmaOperador,
    firma_supervisor: entity.firma_supervisor || entity.firmaSupervisor,
    firma_jefe_equipos: entity.firma_jefe_equipos || entity.firmaJefeEquipos,
    firma_residente: entity.firma_residente || entity.firmaResidente,
    firma_planeamiento_control:
      entity.firma_planeamiento_control || entity.firmaPlaneamientoControl,
    horas_precalentamiento: entity.horas_precalentamiento ?? 0,
    solicitud_aprobacion_id: entity.solicitud_aprobacion_id ?? null,
  };
}

/**
 * Transform DTO to database entity (for create/update operations)
 * Maps incoming API request with snake_case to database columns
 */
export function fromDailyReportDto(dto: Partial<DailyReportDto>): any {
  const entity: any = {};

  // Map all fields that might come from API
  if (dto.fecha !== undefined) entity.fecha = dto.fecha;
  if (dto.trabajador_id !== undefined) entity.trabajador_id = dto.trabajador_id || null;
  if (dto.equipo_id !== undefined) entity.equipo_id = dto.equipo_id || null;
  if (dto.proyecto_id !== undefined) entity.proyecto_id = dto.proyecto_id || null;
  if (dto.hora_inicio !== undefined) entity.hora_inicio = dto.hora_inicio;
  if (dto.hora_fin !== undefined) entity.hora_fin = dto.hora_fin;
  if (dto.horometro_inicial !== undefined) entity.horometro_inicial = dto.horometro_inicial;
  if (dto.horometro_final !== undefined) entity.horometro_final = dto.horometro_final;
  if (dto.odometro_inicial !== undefined) entity.odometro_inicial = dto.odometro_inicial || null;
  if (dto.odometro_final !== undefined) entity.odometro_final = dto.odometro_final || null;
  if (dto.combustible_inicial !== undefined)
    entity.combustible_inicial = dto.combustible_inicial || null;
  if (dto.combustible_consumido !== undefined)
    entity.combustible_consumido = dto.combustible_consumido || null;
  if (dto.numero_vale_combustible !== undefined)
    entity.num_vale_combustible = dto.numero_vale_combustible;
  if (dto.lugar_salida !== undefined) entity.lugar_salida = dto.lugar_salida;
  if (dto.observaciones !== undefined) entity.observaciones = dto.observaciones;
  if (dto.observaciones_correcciones !== undefined)
    entity.observaciones_correcciones = dto.observaciones_correcciones;
  if (dto.estado !== undefined) entity.estado = dto.estado;
  if (dto.gps_latitude !== undefined) entity.gps_latitude = dto.gps_latitude;
  if (dto.gps_longitude !== undefined) entity.gps_longitude = dto.gps_longitude;
  if (dto.weather_conditions !== undefined) entity.clima = dto.weather_conditions;
  if (dto.horas_precalentamiento !== undefined)
    entity.horas_precalentamiento = dto.horas_precalentamiento;

  return entity;
}

/**
 * DTO for creating a new daily report with validation
 * Used by validation middleware for POST requests
 */
export class DailyReportCreateDto {
  @IsDateString({}, { message: 'Fecha debe ser una fecha válida (YYYY-MM-DD)' })
  fecha!: string;

  @IsInt({ message: 'ID de trabajador debe ser un número entero' })
  trabajador_id!: number;

  @IsInt({ message: 'ID de equipo debe ser un número entero' })
  equipo_id!: number;

  @IsOptional()
  @IsInt({ message: 'ID de proyecto debe ser un número entero' })
  proyecto_id?: number;

  @IsString({ message: 'Hora de inicio debe ser texto (HH:MM)' })
  @MaxLength(5, { message: 'Hora de inicio debe tener formato HH:MM' })
  hora_inicio!: string;

  @IsString({ message: 'Hora de fin debe ser texto (HH:MM)' })
  @MaxLength(5, { message: 'Hora de fin debe tener formato HH:MM' })
  hora_fin!: string;

  @IsNumber({}, { message: 'Horómetro inicial debe ser un número' })
  @Min(0, { message: 'Horómetro inicial debe ser mayor o igual a 0' })
  horometro_inicial!: number;

  @IsNumber({}, { message: 'Horómetro final debe ser un número' })
  @Min(0, { message: 'Horómetro final debe ser mayor o igual a 0' })
  horometro_final!: number;

  @IsOptional()
  @IsNumber({}, { message: 'Odómetro inicial debe ser un número' })
  @Min(0, { message: 'Odómetro inicial debe ser mayor o igual a 0' })
  odometro_inicial?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Odómetro final debe ser un número' })
  @Min(0, { message: 'Odómetro final debe ser mayor o igual a 0' })
  odometro_final?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Combustible inicial debe ser un número' })
  @Min(0, { message: 'Combustible inicial debe ser mayor o igual a 0' })
  combustible_inicial?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Combustible consumido debe ser un número' })
  @Min(0, { message: 'Combustible consumido debe ser mayor o igual a 0' })
  combustible_consumido?: number;

  @IsOptional()
  @IsString({ message: 'Número de vale de combustible debe ser texto' })
  @MaxLength(50, { message: 'Número de vale de combustible no puede exceder 50 caracteres' })
  numero_vale_combustible?: string;

  @IsString({ message: 'Lugar de salida debe ser texto' })
  @MaxLength(200, { message: 'Lugar de salida no puede exceder 200 caracteres' })
  lugar_salida!: string;

  @IsString({ message: 'Observaciones debe ser texto' })
  observaciones!: string;

  @IsOptional()
  @IsString({ message: 'Observaciones correcciones debe ser texto' })
  observaciones_correcciones?: string;

  @IsOptional()
  @IsIn(
    [
      'BORRADOR',
      'PENDIENTE',
      'ENVIADO',
      'APROBADO_SUPERVISOR',
      'REVISADO_COSTOS',
      'APROBADO',
      'RECHAZADO',
    ],
    {
      message:
        'Estado debe ser BORRADOR, PENDIENTE, ENVIADO, APROBADO_SUPERVISOR, REVISADO_COSTOS, APROBADO o RECHAZADO',
    }
  )
  estado?: 'BORRADOR' | 'PENDIENTE' | 'ENVIADO' | 'APROBADO' | 'RECHAZADO';

  @IsOptional()
  @IsNumber({}, { message: 'Latitud GPS debe ser un número' })
  gps_latitude?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Longitud GPS debe ser un número' })
  gps_longitude?: number;

  @IsOptional()
  @IsString({ message: 'Condiciones climáticas debe ser texto' })
  weather_conditions?: string;
}

/**
 * DTO for updating a daily report (all fields optional)
 * Used by validation middleware for PUT requests
 */
export class DailyReportUpdateDto {
  @IsOptional()
  @IsDateString({}, { message: 'Fecha debe ser una fecha válida (YYYY-MM-DD)' })
  fecha?: string;

  @IsOptional()
  @IsInt({ message: 'ID de trabajador debe ser un número entero' })
  trabajador_id?: number;

  @IsOptional()
  @IsInt({ message: 'ID de equipo debe ser un número entero' })
  equipo_id?: number;

  @IsOptional()
  @IsInt({ message: 'ID de proyecto debe ser un número entero' })
  proyecto_id?: number;

  @IsOptional()
  @IsString({ message: 'Hora de inicio debe ser texto (HH:MM)' })
  @MaxLength(5, { message: 'Hora de inicio debe tener formato HH:MM' })
  hora_inicio?: string;

  @IsOptional()
  @IsString({ message: 'Hora de fin debe ser texto (HH:MM)' })
  @MaxLength(5, { message: 'Hora de fin debe tener formato HH:MM' })
  hora_fin?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Horómetro inicial debe ser un número' })
  @Min(0, { message: 'Horómetro inicial debe ser mayor o igual a 0' })
  horometro_inicial?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Horómetro final debe ser un número' })
  @Min(0, { message: 'Horómetro final debe ser mayor o igual a 0' })
  horometro_final?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Odómetro inicial debe ser un número' })
  @Min(0, { message: 'Odómetro inicial debe ser mayor o igual a 0' })
  odometro_inicial?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Odómetro final debe ser un número' })
  @Min(0, { message: 'Odómetro final debe ser mayor o igual a 0' })
  odometro_final?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Combustible inicial debe ser un número' })
  @Min(0, { message: 'Combustible inicial debe ser mayor o igual a 0' })
  combustible_inicial?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Combustible consumido debe ser un número' })
  @Min(0, { message: 'Combustible consumido debe ser mayor o igual a 0' })
  combustible_consumido?: number;

  @IsOptional()
  @IsString({ message: 'Número de vale de combustible debe ser texto' })
  @MaxLength(50, { message: 'Número de vale de combustible no puede exceder 50 caracteres' })
  numero_vale_combustible?: string;

  @IsOptional()
  @IsString({ message: 'Lugar de salida debe ser texto' })
  @MaxLength(200, { message: 'Lugar de salida no puede exceder 200 caracteres' })
  lugar_salida?: string;

  @IsOptional()
  @IsString({ message: 'Observaciones debe ser texto' })
  observaciones?: string;

  @IsOptional()
  @IsString({ message: 'Observaciones correcciones debe ser texto' })
  observaciones_correcciones?: string;

  @IsOptional()
  @IsIn(
    [
      'BORRADOR',
      'PENDIENTE',
      'ENVIADO',
      'APROBADO_SUPERVISOR',
      'REVISADO_COSTOS',
      'APROBADO',
      'RECHAZADO',
    ],
    {
      message:
        'Estado debe ser BORRADOR, PENDIENTE, ENVIADO, APROBADO_SUPERVISOR, REVISADO_COSTOS, APROBADO o RECHAZADO',
    }
  )
  estado?: 'BORRADOR' | 'PENDIENTE' | 'ENVIADO' | 'APROBADO' | 'RECHAZADO';

  @IsOptional()
  @IsNumber({}, { message: 'Latitud GPS debe ser un número' })
  gps_latitude?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Longitud GPS debe ser un número' })
  gps_longitude?: number;

  @IsOptional()
  @IsString({ message: 'Condiciones climáticas debe ser texto' })
  weather_conditions?: string;
}
