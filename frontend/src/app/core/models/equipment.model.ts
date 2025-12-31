export interface Equipment {
  id: string; // UUID in database
  code: string;
  name?: string;
  description?: string; // Primary display field in database
  brand: string;
  model: string;
  equipment_type: string;
  status: string;

  // New categorization fields
  categoria_equipo?: string;
  tipo_proveedor?: string;
  placa?: string; // License plate
  serial_number?: string;
  tipo_combustible?: string;

  // Provider information (from JOIN)
  provider_id?: number;
  provider?: {
    id: number;
    ruc: string;
    razon_social: string;
    tipo_proveedor?: string;
  };

  // Technical specifications
  numero_chasis?: string;
  numero_serie_motor?: string;
  potencia_neta?: number; // HP
  año_fabricacion?: number;
  codigo_externo?: string;

  // Operational
  medidor_uso?: string; // horometro | odometro
  hourmeter_reading?: number;
  odometer_reading?: number;
  fuel_type?: 'diesel' | 'gasoline' | 'electric' | 'hybrid';
  hourly_rate?: number;
  hourlyrate?: number; // Legacy field name

  // Expiration tracking
  fecha_venc_poliza?: string | Date;
  fecha_venc_soat?: string | Date;
  fecha_venc_citv?: string | Date;

  // Accreditation
  documento_acreditacion?: string;
  fecha_acreditacion?: string | Date;

  // Dates & Documentation
  purchase_date?: string;
  warranty_expiration?: string;
  vencimiento_seguro?: string;
  vencimiento_revision_tecnica?: string;

  // Metadata
  project_id?: string;
  current_location?: string;
  is_active: boolean;

  // Audit
  created_at?: string;
  updated_at?: string;
  created_by?: number;
  updated_by?: number;
  registrado_por?: string;
  actualizado_por?: string;
}
