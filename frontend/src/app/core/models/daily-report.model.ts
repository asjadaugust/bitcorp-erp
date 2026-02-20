export interface DailyReport {
  id: number;
  numero_parte?: string;
  fecha_parte: string;
  trabajador_id: number;
  trabajador_nombre?: string;
  trabajador_dni?: string;
  trabajador_licencia?: string;
  equipo_id: number;
  codigo_equipo?: string;
  equipo_nombre?: string;
  equipo_marca?: string;
  equipo_modelo?: string;
  equipo_placa?: string;
  proyecto_id?: number;
  proyecto_nombre?: string;
  proyecto_codigo?: string;
  contrato_id?: string;
  turno?: 'DIA' | 'NOCHE';
  hora_inicio: string;
  hora_fin: string;
  horas_trabajadas?: string | number;
  horometro_inicial: string | number;
  horometro_final: string | number;
  horometro_diferencia?: string | number;
  odometro_inicial?: string | number;
  odometro_final: string | number;
  odometro_diferencia?: string | number;
  diesel_gln?: string | number;
  gasolina_gln?: string | number;
  hora_abastecimiento?: string;
  num_vale_combustible?: string;
  horometro_kilometraje?: string | number;
  lugar_salida?: string;
  lugar_llegada?: string;
  responsable_frente?: string;
  observaciones?: string;
  photos?: string[];
  estado:
    | 'BORRADOR'
    | 'PENDIENTE'
    | 'ENVIADO'
    | 'APROBADO_SUPERVISOR'
    | 'REVISADO_COSTOS'
    | 'APROBADO'
    | 'RECHAZADO';
  enviado_en?: string;
  aprobado_supervisor_en?: string;
  revisado_costos_en?: string;
  aprobado_en?: string;
  rechazado_en?: string;
  motivo_rechazo?: string;
  created_at: string;
  updated_at: string;

  // Signature fields
  firma_operador?: string;
  firma_supervisor?: string;
  firma_jefe_equipos?: string;
  firma_residente?: string;
  firma_planeamiento_control?: string;

  // GPS fields
  gps_latitude?: number;
  gps_longitude?: number;
  gps_accuracy?: number;
  gps_captured_at?: string;
  weather_conditions?: string;
}

export interface ProductionRow {
  id?: number;
  parte_diario_id?: number;
  ubicacion_prog_ini?: string;
  ubicacion_prog_fin?: string;
  hora_ini?: string;
  hora_fin?: string;
  material_descripcion?: string;
  metrado?: number;
  edt_id?: number;
  edt_codigo?: string;
}

export interface ActivityCheckbox {
  id?: number;
  parte_diario_id?: number;
  codigo: string;
  descripcion?: string;
  checked: boolean;
}

export interface DelayCheckbox {
  id?: number;
  parte_diario_id?: number;
  codigo: string;
  descripcion?: string;
  checked: boolean;
}

export interface EventCheckbox {
  id?: number;
  parte_diario_id?: number;
  codigo: string;
  descripcion?: string;
  checked: boolean;
}

export interface CreateDailyReportDto {
  fecha_parte: string;
  trabajador_id: number;
  equipo_id: number;
  proyecto_id?: number;
  contrato_id?: string;
  turno?: 'DIA' | 'NOCHE';
  hora_inicio: string;
  hora_fin: string;
  horometro_inicial: number;
  horometro_final: number;
  odometro_inicial?: number;
  odometro_final?: number;
  diesel_gln?: number;
  gasolina_gln?: number;
  hora_abastecimiento?: string;
  num_vale_combustible?: string;
  horometro_kilometraje?: number;
  lugar_salida?: string;
  lugar_llegada?: string;
  responsable_frente?: string;
  observaciones?: string;
  estado?: 'BORRADOR' | 'PENDIENTE';

  // GPS fields
  gps_latitude?: number;
  gps_longitude?: number;
  gps_accuracy?: number;
  gps_captured_at?: string;
  weather_conditions?: string;
}
