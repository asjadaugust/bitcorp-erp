export interface Operator {
  id: number;
  // user_id: number; // Not present in backend entity explicitly, maybe logic handles it? keeping for safety if used elsewhere or optional
  legacyId?: string;
  codigoTrabajador: string;
  dni: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  fechaIngreso?: string;
  tipoContrato?: string;
  cargo?: string;
  especialidad?: string;
  licenciaConducir?: string;
  categoriaLicencia?: string;
  vencimientoLicencia?: string;
  estado: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Computed or joined fields that might be coming from backend if transformed, 
  // but looking at entity, these are the core fields.
  // Keeping some old ones as optional if needed for transition or if I missed a transformation layer.
  // But purely based on "backend sends spanish names":
  
  // Helpers for frontend display if needed, but better to use the spanish ones directly.
  full_name?: string; // Backend entity has get fullName, maybe it IS serialized? 
                      // If user says "api sends spanish names", I'll trust the entity property names.
  skills?: any[]; // The entity doesn't show skills relation explicitly in the snippet I saw, 
                 // but the frontend code uses it. 
                 // I will keep `skills` as it was likely a joined relation.
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
  // mapped from user_id if needed, or remove if unused in backend
  // user_id: number; 
  CodigoTrabajador: string; // Convention? Or lowercase? Usually camelCase in JSON: codigoTrabajador
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  email: string;
  telefono: string;
  licenciaConducir?: string;
  vencimientoLicencia?: string;
  fechaIngreso: string;
  // hourly_rate: number; // Removed as it's not in backend
  cargo?: string; // Replacement for role/hourly_rate context
  // notes?: string; // Not in backend entity
}
