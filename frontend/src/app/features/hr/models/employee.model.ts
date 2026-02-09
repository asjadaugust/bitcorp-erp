export interface Employee {
  id_trabajador?: number;
  codigo_trabajador?: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno?: string;
  nombre_completo?: string;
  dni: string;
  fecha_nacimiento?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  fecha_ingreso?: string;
  fecha_cese?: string;
  cargo?: string;
  especialidad?: string;
  tipo_contrato?: string;
  licencia_conducir?: string;
  operating_unit_id?: number;
  esta_activo?: boolean;
  created_at?: string;
  updated_at?: string;
}
