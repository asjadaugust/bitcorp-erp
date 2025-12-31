export interface Contract {
  id: string;
  numero_contrato: string;
  equipment_id: string;
  provider_id: number;
  fecha_contrato: string;
  fecha_inicio: string;
  fecha_fin: string;
  duracion_dias?: number;
  moneda: 'PEN' | 'USD';
  tipo_tarifa: 'hourly' | 'daily' | 'monthly' | 'fixed';
  tarifa: number;
  incluye_motor: boolean;
  incluye_operador: boolean;
  costo_adicional_motor?: number;
  horas_incluidas?: number;
  penalidad_exceso?: number;
  condiciones_especiales?: string;
  documento_url?: string;
  estado: 'activo' | 'proximo_vencer' | 'vencido' | 'extendido';
  created_at?: string;
  updated_at?: string;
  // Frontend display fields
  code?: string;
  project_name?: string;
  client_name?: string;
}
