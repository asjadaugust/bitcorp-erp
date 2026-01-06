/**
 * Raw database row shape for DailyReport
 * Represents exactly what is returned by the raw SQL queries in DailyReportModel
 */
export interface DailyReportRawRow {
  // Primary fields
  id: number;
  fecha: string; // date string from DB

  // Foreign keys
  trabajador_id: number | null;
  equipo_id: number;
  proyecto_id: number | null;
  valorizacion_id: number | null;

  // Time tracking
  hora_inicio: string | null;
  hora_fin: string | null;
  horas_trabajadas: number | null;

  // Meter tracking
  horometro_inicial: number | null;
  horometro_final: number | null;
  odometro_inicial: number | null;
  odometro_final: number | null;
  km_recorridos: number | null;

  // Fuel tracking
  combustible_inicial: number | null;
  combustible_final: number | null;
  combustible_consumido: number | null;

  // Metadata
  observaciones: string | null;
  estado: string; // 'BORRADOR' | 'ENVIADO' | 'APROBADO' | 'RECHAZADO'
  lugar_salida: string | null;
  lugar_llegada: string | null;

  // Audit
  creado_por: number | null;
  aprobado_por: number | null;
  aprobado_en: string | null; // timestamp string
  created_at: string; // timestamp string
  updated_at: string; // timestamp string

  // Joined fields (from SQL joins)
  trabajador_nombre?: string;
  equipo_codigo?: string;
  equipo_nombre?: string;
  proyecto_nombre?: string; // Calculated field from join

  // New PDF fields (nullable)
  codigo?: string | null;
  empresa?: string | null;
  placa?: string | null;
  responsable_frente?: string | null;
  turno?: string | null;
  numero_parte?: number | null;
  petroleo_gln?: number | null;
  gasolina_gln?: number | null;
  hora_abastecimiento?: string | null;
  num_vale_combustible?: string | null;
  horometro_kilometraje?: string | null;
  observaciones_correcciones?: string | null;
  firma_operador?: string | null;
  firma_supervisor?: string | null;
  firma_jefe_equipos?: string | null;
  firma_residente?: string | null;
  firma_planeamiento_control?: string | null;
}
