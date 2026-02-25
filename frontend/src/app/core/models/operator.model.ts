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
  trabajadorId?: number;
  tipoDocumento: string; // 'DNI', 'LICENCIA', 'CERTIFICADO', etc.
  numeroDocumento?: string;
  fechaEmision?: string;
  fechaVencimiento?: string;
  archivoUrl?: string;
  observaciones?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Snake_case fields matching the backend DTO (api response contract)
export interface OperatorCertification {
  id: number;
  trabajador_id: number;
  nombre_certificacion: string;
  numero_certificacion?: string;
  fecha_emision?: string;
  fecha_vencimiento?: string;
  entidad_emisora?: string;
  estado: 'VIGENTE' | 'VENCIDO' | 'POR_VENCER';
}

// Snake_case fields matching the backend DTO (api response contract)
export interface OperatorSkill {
  id: number;
  trabajador_id: number;
  tipo_equipo: string;
  nivel_habilidad: 'PRINCIPIANTE' | 'INTERMEDIO' | 'AVANZADO' | 'EXPERTO';
  anios_experiencia: number;
  ultima_verificacion?: string;
}

export interface OperatorDisponibilidad {
  operador_id: number;
  estado: 'DISPONIBLE' | 'ASIGNADO';
  parte_diario_hoy: { id: number; fecha_parte: string; equipo_id: number } | null;
}

export interface OperatorRendimiento {
  operador_id: number;
  periodo_dias: number;
  total_partes: number;
  horas_totales: number;
  partes_aprobados: number;
  partes_rechazados: number;
  partes_pendientes: number;
  eficiencia: number; // 0-100 percentage
}

export interface DisponibilidadProgramada {
  id: number;
  trabajador_id: number;
  fecha: string; // YYYY-MM-DD
  disponible: boolean;
  observacion?: string;
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
