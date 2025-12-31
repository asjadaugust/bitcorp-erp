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
}
