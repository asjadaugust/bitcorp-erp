export interface Operator {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  full_name?: string;
  email: string;
  phone: string;
  document_type?: 'DNI' | 'CE';
  document_number?: string;
  license_number?: string;
  license_expiry?: string;
  certifications?: OperatorCertification[];
  skills?: OperatorSkill[];
  personal_documents?: PersonalDocument[];
  status: 'active' | 'inactive' | 'on_leave';
  is_active?: boolean;
  employment_start_date: string;
  employment_end_date?: string;
  hourly_rate: number;
  performance_rating?: number;
  notes?: string;
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
  operator_id: number;
  certification_name: string;
  certification_number: string;
  issue_date: string;
  expiry_date: string;
  issuing_authority: string;
  status: 'valid' | 'expired' | 'expiring_soon';
}

export interface OperatorSkill {
  id: number;
  operator_id: number;
  equipment_type: string;
  skill_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  years_experience: number;
  last_verified: string;
}

export interface CreateOperatorDto {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  license_number?: string;
  license_expiry?: string;
  employment_start_date: string;
  hourly_rate: number;
  notes?: string;
}
