export interface DailyReport {
  id: string;
  report_number?: string;
  report_date: string;
  operator_id: string;
  operator_name?: string;
  operator_dni?: string;
  operator_license?: string;
  equipment_id: string;
  equipment_code?: string;
  equipment_name?: string;
  equipment_brand?: string;
  equipment_model?: string;
  equipment_plate?: string;
  project_id?: string;
  project_name?: string;
  project_code?: string;
  contract_id?: string;
  shift?: 'day' | 'night';
  start_time: string;
  end_time: string;
  break_minutes?: number;
  worked_hours?: string | number;
  hourmeter_start: string | number;
  hourmeter_end: string | number;
  hourmeter_difference?: string | number;
  odometer_start?: string | number;
  odometer_end?: string | number;
  odometer_difference?: string | number;
  diesel_gallons?: string | number;
  gasoline_gallons?: string | number;
  fuel_time?: string;
  fuel_voucher_number?: string;
  fuel_hourmeter?: string | number;
  departure_location?: string;
  arrival_location?: string;
  site_supervisor?: string;
  observations?: string;
  photos?: string[];
  status: 'draft' | 'submitted' | 'supervisor_approved' | 'cost_reviewed' | 'approved' | 'rejected';
  submitted_at?: string;
  supervisor_approved_at?: string;
  cost_reviewed_at?: string;
  approved_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;

  // GPS fields
  gps_latitude?: number;
  gps_longitude?: number;
  gps_accuracy?: number;
  gps_captured_at?: string;

  // Backward compatibility fields (used by legacy form components)
  location?: string; // Maps to departure_location
  work_description?: string; // Maps to observations
  fuel_start?: number; // Legacy fuel tracking
  fuel_end?: number; // Legacy fuel tracking
  notes?: string;
  weather_conditions?: string;
  fuel_consumed?: number; // Legacy field

  // New fields for complete PDF report
  codigo?: string;
  empresa?: string;
  placa?: string;
  responsable_frente?: string;
  turno?: string;
  numero_parte?: string;
  petroleo_gln?: number;
  gasolina_gln?: number;
  hora_abastecimiento?: string;
  num_vale_combustible?: string;
  horometro_kilometraje?: string;
  lugar_salida?: string;
  lugar_llegada?: string;
  observaciones_correcciones?: string;
  firma_operador?: string;
  firma_supervisor?: string;
  firma_jefe_equipos?: string;
  firma_residente?: string;
  firma_planeamiento_control?: string;

  // Relations for detailed data
  produccionRows?: ProductionRow[];
  actividadesProduccion?: ActivityCheckbox[];
  demorasOperativas?: DelayCheckbox[];
  otrosEventos?: EventCheckbox[];
  demorasMecanicas?: DelayCheckbox[];
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
  report_date: string;
  operator_id: string;
  equipment_id: string;
  project_id?: string;
  contract_id?: string;
  shift?: 'day' | 'night';
  start_time: string;
  end_time: string;
  break_minutes?: number;
  hourmeter_start: number;
  hourmeter_end: number;
  odometer_start?: number;
  odometer_end?: number;
  diesel_gallons?: number;
  gasoline_gallons?: number;
  fuel_time?: string;
  fuel_voucher_number?: string;
  fuel_hourmeter?: number;
  departure_location?: string;
  arrival_location?: string;
  site_supervisor?: string;
  observations?: string;
  status?: 'draft' | 'submitted';

  // GPS fields
  gps_latitude?: number;
  gps_longitude?: number;
  gps_accuracy?: number;
  gps_captured_at?: string;

  // Backward compatibility fields
  location?: string;
  work_description?: string;
  fuel_start?: number;
  fuel_end?: number;
  notes?: string;
  weather_conditions?: string;

  // New fields for complete PDF report
  codigo?: string;
  empresa?: string;
  placa?: string;
  responsable_frente?: string;
  turno?: string;
  numero_parte?: string;
  petroleo_gln?: number;
  gasolina_gln?: number;
  hora_abastecimiento?: string;
  num_vale_combustible?: string;
  horometro_kilometraje?: string;
  lugar_salida?: string;
  lugar_llegada?: string;
  observaciones_correcciones?: string;
  firma_operador?: string;
  firma_supervisor?: string;
  firma_jefe_equipos?: string;
  firma_residente?: string;
  firma_planeamiento_control?: string;

  // Relations
  produccionRows?: ProductionRow[];
  actividadesProduccion?: ActivityCheckbox[];
  demorasOperativas?: DelayCheckbox[];
  otrosEventos?: EventCheckbox[];
  demorasMecanicas?: DelayCheckbox[];
}
