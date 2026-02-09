export interface Operator {
  id: number;
  legacy_id?: string | null;
  dni: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno?: string | null;
  nombre_completo?: string; // Computed field from backend
  fecha_nacimiento?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  correo_electronico?: string | null;
  fecha_ingreso?: string | null;
  fecha_cese?: string | null;
  tipo_contrato?: string | null;
  cargo?: string | null;
  especialidad?: string | null;
  licencia_conducir?: string | null;
  vencimiento_licencia?: string | null;
  operating_unit_id?: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PersonalDocument {
  id?: number;
  registration_date: string;
  document_type: string;
  description?: string;
  file_name?: string;
  file_url?: string;
}

export interface OperatorCertification {
  id: number;
  trabajador_id: number;
  certification_name: string;
  certification_number: string;
  issue_date: string;
  expiry_date: string;
  issuing_authority: string;
  status: 'valid' | 'expired' | 'expiring_soon';
}

export interface OperatorSkill {
  id: number;
  trabajador_id: number;
  equipment_type: string;
  skill_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  years_experience: number;
  last_verified: string;
}

export interface CreateOperatorDto {
  dni: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno?: string;
  correo_electronico?: string;
  telefono?: string;
  fecha_ingreso?: string;
  tipo_contrato?: string;
  cargo?: string;
  especialidad?: string;
  licencia_conducir?: string;
}
